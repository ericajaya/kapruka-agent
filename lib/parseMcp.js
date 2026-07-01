// Normalises raw text returned inside `mcp_tool_result` content blocks into
// plain JS objects the UI can render as cards. The Kapruka MCP server can
// answer in JSON or markdown — both are handled. If you connect live and a
// shape here doesn't match reality, this is the one file to adjust: log a
// raw block (see the `debug` export) and tighten the relevant regex.

function tryJson(text) {
  const cleaned = text.trim().replace(/^```json/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function blockText(toolResultBlock) {
  return (toolResultBlock?.content || [])
    .map((b) => (b && b.type === "text" ? b.text : ""))
    .filter(Boolean)
    .join("\n");
}

export function parseProducts(text) {
  const data = tryJson(text);
  if (data) {
    if (Array.isArray(data)) return data.map(normaliseProduct);
    if (data.products) return data.products.map(normaliseProduct);
    if (data.product) return [normaliseProduct(data.product)];
    if (data.id || data.name) return [normaliseProduct(data)];
  }

  // Markdown fallback — best-effort, one product per detected block.
  const products = [];
  const blocks = text.split(/\n(?=\d+[.)]\s|-\s|\*\s|###?\s)/);
  for (const block of blocks) {
    const nameMatch = block.match(/\*\*(.+?)\*\*/) || block.match(/^#+\s*(.+)/m);
    if (!nameMatch) continue;
    const priceMatch = block.match(/(?:LKR|Rs\.?)\s?([\d,]+)/i);
    const idMatch = block.match(/(?:Product\s*ID|ID)[:\s]+`?([A-Za-z0-9_-]+)`?/i);
    const urlMatch = block.match(/(https?:\/\/\S+)/);
    const stockMatch = block.match(/(In Stock|Out of Stock)/i);
    const imgMatch = block.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
    products.push(
      normaliseProduct({
        id: idMatch ? idMatch[1] : null,
        name: nameMatch[1].trim(),
        price: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null,
        currency: "LKR",
        availability: stockMatch ? stockMatch[1] : "Unknown",
        url: urlMatch ? urlMatch[1] : null,
        image: imgMatch ? imgMatch[1] : null,
        description: block.trim().slice(0, 300),
      })
    );
  }
  return products;
}

function normaliseProduct(p) {
  return {
    id: p.id || p.product_id || p.sku || null,
    name: p.name || p.title || "Untitled product",
    price: p.price ?? p.amount ?? null,
    currency: p.currency || "LKR",
    availability: p.availability || p.stock_status || (p.in_stock ? "In Stock" : "Unknown"),
    url: p.url || p.product_url || null,
    image: p.image || p.image_url || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : null),
    description: p.description || p.summary || "",
    category: p.category || null,
  };
}

export function parseDelivery(text) {
  const data = tryJson(text);
  if (data) return { raw: text, structured: data };
  return { raw: text, structured: null };
}

export function parseOrder(text) {
  const data = tryJson(text);
  if (data) {
    return {
      raw: text,
      orderNumber: data.order_number || data.orderNumber || data.id || null,
      payUrl: data.pay_url || data.payment_url || data.checkout_url || data.url || null,
      total: data.total ?? data.amount ?? null,
      currency: data.currency || "LKR",
      expiresInMinutes: data.expires_in_minutes || data.price_lock_minutes || 60,
      structured: data,
    };
  }
  const urlMatch = text.match(/(https?:\/\/\S+)/);
  const orderMatch = text.match(/(?:order\s*(?:#|number|no\.?)\s*[:#]?\s*)([A-Za-z0-9-]{4,})/i);
  return {
    raw: text,
    orderNumber: orderMatch ? orderMatch[1] : null,
    payUrl: urlMatch ? urlMatch[1] : null,
    total: null,
    currency: "LKR",
    expiresInMinutes: 60,
    structured: null,
  };
}

export function parseTracking(text) {
  const data = tryJson(text);
  if (data) return { raw: text, structured: data };
  return { raw: text, structured: null };
}

// Walks every mcp_tool_use / mcp_tool_result pair in a Messages API response
// and returns categorised, render-ready data alongside which tools fired.
export function extractToolData(contentBlocks) {
  const uses = {};
  for (const block of contentBlocks) {
    if (block.type === "mcp_tool_use") uses[block.id] = block;
  }

  const result = {
    toolsCalled: [],
    products: [],
    delivery: [],
    orders: [],
    tracking: [],
    categories: [],
    errors: [],
  };

  for (const block of contentBlocks) {
    if (block.type !== "mcp_tool_result") continue;
    const use = uses[block.tool_use_id];
    const toolName = use?.name || "unknown_tool";
    result.toolsCalled.push(toolName);
    const text = blockText(block);

    if (block.is_error) {
      result.errors.push({ tool: toolName, message: text });
      continue;
    }

    if (toolName === "kapruka_search_products" || toolName === "kapruka_get_product") {
      result.products.push(...parseProducts(text));
    } else if (toolName === "kapruka_list_categories") {
      result.categories.push(text);
    } else if (toolName === "kapruka_list_delivery_cities" || toolName === "kapruka_check_delivery") {
      result.delivery.push(parseDelivery(text));
    } else if (toolName === "kapruka_create_order") {
      result.orders.push(parseOrder(text));
    } else if (toolName === "kapruka_track_order") {
      result.tracking.push(parseTracking(text));
    }
  }

  return result;
}
