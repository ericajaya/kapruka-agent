// ╔══════════════════════════════════════════════════════════════╗
// ║  /api/chat — Streaming SSE route                             ║
// ║  Connects Claude to the Kapruka MCP server via Anthropic's   ║
// ║  beta MCP connector. Text tokens stream in real-time;        ║
// ║  tool data (products, orders, tracking) arrives at the end.  ║
// ╚══════════════════════════════════════════════════════════════╝
import { extractToolData } from "../../../lib/parseMcp";
import { buildSystemPrompt } from "../../../lib/persona";

export const runtime = "nodejs";
export const maxDuration = 60;

const MCP_BETA        = "mcp-client-2025-11-20";
const MCP_SERVER_NAME = "kapruka";

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return errorResponse("Invalid JSON body.", 400); }

  const { messages = [], language = "en", cart = [], knownProducts = [] } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse("`messages` must be a non-empty array.", 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (local) or Vercel env vars (production).",
      500
    );
  }

  const mcpUrl  = process.env.KAPRUKA_MCP_URL   || "https://mcp.kapruka.com/mcp";
  const model   = process.env.ANTHROPIC_MODEL   || "claude-sonnet-4-6";
  const system  = buildSystemPrompt({ language, cart, knownProducts });
  const apiMsgs = messages.map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key":    apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta":    MCP_BETA,
          },
          body: JSON.stringify({
            model,
            max_tokens: 1200,
            system,
            messages: apiMsgs,
            stream: true,
            mcp_servers: [{ type: "url", url: mcpUrl, name: MCP_SERVER_NAME }],
            tools: [{ type: "mcp_toolset", mcp_server_name: MCP_SERVER_NAME }],
          }),
        });

        if (!res.ok) {
          let msg = `Anthropic API error ${res.status}`;
          try { const e = await res.json(); msg = e.error?.message || msg; } catch {}
          send({ type: "error", message: msg });
          controller.close();
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        // blocks[index] accumulates each content block as it streams in
        const blocks         = {};
        const announcedTools = new Set();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop(); // keep the incomplete trailing line

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;

            let ev;
            try { ev = JSON.parse(raw); } catch { continue; }

            switch (ev.type) {
              case "content_block_start": {
                const blk = ev.content_block || {};
                // Deep-clone block; preserve inline content array if present
                // (mcp_tool_result blocks sometimes include full content here)
                blocks[ev.index] = {
                  ...blk,
                  content: blk.content ? [...blk.content] : undefined,
                  _inputJson:  "",
                  _resultText: "",
                };
                // Announce MCP tool calls to the client as they start
                if (blk.type === "mcp_tool_use" && !announcedTools.has(blk.name)) {
                  announcedTools.add(blk.name);
                  send({ type: "tool", name: blk.name });
                }
                break;
              }

              case "content_block_delta": {
                if (!blocks[ev.index]) blocks[ev.index] = {};
                const d = ev.delta || {};
                if (d.type === "text_delta") {
                  blocks[ev.index].text = (blocks[ev.index].text || "") + d.text;
                  // Stream text to the client immediately
                  send({ type: "chunk", text: d.text });
                } else if (d.type === "input_json_delta") {
                  // Accumulate tool input JSON
                  blocks[ev.index]._inputJson += d.partial_json || "";
                } else if (d.type === "content_block_delta") {
                  // May carry tool-result content in some edge cases
                  blocks[ev.index]._resultText += d.partial_json || d.text || "";
                }
                break;
              }

              case "content_block_stop": {
                const blk = blocks[ev.index];
                if (!blk) break;
                // Finalise accumulated JSON input (tool inputs)
                if (blk._inputJson) {
                  try { blk.input = JSON.parse(blk._inputJson); } catch {}
                }
                // Synthesise content array from streamed text if the block
                // arrived without inline content (some MCP result shapes)
                if (blk.type === "mcp_tool_result" && !blk.content && blk._resultText) {
                  blk.content = [{ type: "text", text: blk._resultText }];
                }
                break;
              }

              case "message_stop": {
                // Build final ordered content array for the parser
                const contentBlocks = Object.keys(blocks)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((k) => blocks[k]);
                const toolData = extractToolData(contentBlocks);
                send({ type: "done", ...toolData });
                controller.close();
                return;
              }

              case "error":
                send({ type: "error", message: ev.error?.message || "Stream error" });
                controller.close();
                return;
            }
          }
        }

        // Fallback: stream ended without message_stop
        const contentBlocks = Object.keys(blocks)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => blocks[k]);
        send({ type: "done", ...extractToolData(contentBlocks) });
        controller.close();

      } catch (err) {
        try { send({ type: "error", message: err.message || "Server error" }); } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":    "text/event-stream",
      "Cache-Control":   "no-cache",
      "Connection":      "keep-alive",
      "X-Accel-Buffering": "no",   // disable nginx buffering in prod
    },
  });
}

function errorResponse(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
