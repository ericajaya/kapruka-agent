 ## How it works

- **Frontend:** Next.js (App Router), redesigned to match a sidebar + centered-hero chat layout
  (logo badge, "New Conversation", starter prompts in the sidebar; a centered "How can I help
  you shop today?" greeting with quick-prompt cards when the chat is empty). Light theme by
  default with a dark-mode toggle in the header. Product results still render as die-cut
  "gift tag" cards (see `components/ProductTag.jsx`), with a slide-in cart drawer (now a
  floating action button, bottom-right) for recipient details, delivery date, gift message,
  and checkout.
- **Backend:** Unchanged — one API route (`app/api/chat/route.js`) that calls the Claude
  Messages API with Anthropic's **MCP connector** attached directly to `https://mcp.kapruka.com/mcp`.
  Anthropic's infrastructure handles the tool-calling loop server-side.
- **No database.** Conversation history and cart state live in the browser; everything else
  (products, delivery, orders, tracking) is fetched live from Kapruka on every turn.

```
Browser (React state: messages, cart, language)
   │  POST /api/chat  { messages, cart, knownProducts, language }
   ▼
Next.js API route ── Claude Messages API (mcp_servers → mcp.kapruka.com/mcp)
   │
   ▼
mcp_tool_use / mcp_tool_result blocks in the response
   │  parsed by lib/parseMcp.js into { products, delivery, orders, tracking }
   ▼
JSON back to the browser → rendered as gift-tag cards / order card / chat bubble
```

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | From https://console.anthropic.com/settings/keys |
| `KAPRUKA_MCP_URL` | No | `https://mcp.kapruka.com/mcp` | Only change if Kapruka gives you a different endpoint |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-6` | Any current Claude model that supports the MCP connector beta |

## Deploying to a public URL (Vercel — recommended, free tier works)

1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. In **Environment Variables**, add `ANTHROPIC_API_KEY` (and optionally `KAPRUKA_MCP_URL`,
   `ANTHROPIC_MODEL`).
4. Deploy. Vercel auto-detects Next.js — no build config needed.
5. Your live URL is `https://<project>.vercel.app` (or attach a custom domain under
   **Settings → Domains**). That's the link to submit for the challenge.

Other hosts (Netlify, Render, Railway, your own VPS via `npm run build && npm run start`) work
too — the only requirement is a Node 18+ runtime with the one environment variable set.

## Why this satisfies the brief

| Rubric item | How it's covered |
|---|---|
| Full-screen chat UI | `app/page.js` — no widget, the whole viewport is the conversation |
| Visual richness | Gift-tag product cards with images, price, stock; order confirmation card |
| Personality | Kapu's voice is defined in `lib/persona.js` — warm, witty, opinionated |
| Usefulness | Curated 2–4 picks per query, not a raw list; delivery + tracking built in |
| End-to-end completeness | Search → cart → recipient/delivery form → real `kapruka_create_order` call → pay link |
| Creativity | Die-cut gift-tag cards as the signature visual motif, tied to the gifting theme |
| Bonus: multi-item carts | `CartDrawer` supports any number of line items |
| Bonus: delivery-date constraints | Date picker in the cart drawer, passed to the order tool |
| Bonus: gift messaging | Optional gift-message field, passed through to `kapruka_create_order` |
| Bonus: Tanglish / Sinhala | Language toggle in the header steers Kapu's reply language |

## Notes on the MCP response parser

`lib/parseMcp.js` normalises whatever the Kapruka MCP server returns (JSON or markdown) into
plain product/order/delivery objects for the UI. It handles both shapes defensively, but it was
written without live access to the server from the build environment. **Before submitting, send
a real search ("show me birthday cakes") and check the gift-tag cards render correctly** — if a
field looks off (missing image, wrong price), the fix is almost always a one-line regex/key
adjustment in that file.

## Project structure

```
app/
  api/chat/route.js   API route — Claude + MCP connector, streams SSE
  layout.js           Fonts, metadata
  page.js             Main chat state + streaming consumer + all UI wiring
  globals.css          Design tokens (light + dark), full layout + component styling
components/
  Sidebar.jsx           Logo, new conversation, view history, starter prompts list
  Hero.jsx               "How can I help you shop today?" / welcome-back + occasion tags
  Header.jsx              Brand, EN/Sinhala/Tamil/Tanglish toggle, theme toggle, mobile menu
  Composer.jsx             Message input — image icon (placeholder), voice mic, send
  MessageBubble.jsx        Chat turn renderer — streaming text, badges, chips, cards, widgets
  ProductTag.jsx            Gift-tag product card + carousel (click thumbnail → lightbox)
  Lightbox.jsx               Full-screen product detail overlay
  BudgetChips.jsx             Price-range quick filters shown under product results
  DatePickerWidget.jsx         Inline delivery-date picker shown in chat
  Toast.jsx                     Bottom-center "added to cart" confirmation
  OrderCard.jsx                 Order confirmation card
  CheckoutWizard.jsx              6-step bundle + checkout flow (replaces the old cart drawer)
lib/
  persona.js            Kapu's system prompt + language directives (EN/SI/TA/Tanglish) + gift-message rule
  parseMcp.js            mcp_tool_result → UI data parser (also used to reconstruct data from the SSE stream)
  sessionMemory.js        localStorage helpers for the welcome-back feature
```

## Notes on this redesign

The sidebar + centered-hero layout was modeled on a reference screenshot of another Kapruka
MCP entry. On top of that, eight targeted improvements were added:

1. **Streaming responses** — `/api/chat` now proxies the Anthropic Messages API's SSE stream
   directly (raw `fetch` + manual event parsing, not the SDK's `.stream()` helper, so it works
   uniformly across Node runtimes). Text appears token-by-token; tool calls are announced live
   as they fire.
2. **Tanglish toggle** — added back to the header alongside EN / Sinhala / Tamil (4 options total).
3. **Occasion tags** — Avurudu, Vesak, Valentine's, Christmas, Mother's Day, Graduation — shown
   as quick-tap pills under the hero prompt grid.
4. **Budget filter chips** — appear under any product carousel once results are shown, each one
   re-queries Kapu with a price-range-scoped follow-up.
5. **Session memory** — `lib/sessionMemory.js` stores the last recipient name/city in
   `localStorage`. Returning visitors see a "Welcome back — shopping for X again?" hero instead
   of the generic greeting.
6. **Inline delivery date picker** — appears in-chat automatically whenever Kapu calls a delivery
   tool and hasn't placed an order yet; picking a date feeds it straight back into the conversation.
7. **Product image lightbox** — tapping a gift-tag's thumbnail opens a full-screen product view
   (`components/Lightbox.jsx`) with description and an "Add to cart" action, instead of only the
   small carousel card.
8. **Gift message persona instruction** — Kapu now proactively offers to add a gift message when
   a customer is buying for someone else (`lib/persona.js`).

**Plus, replacing the flat cart drawer:** a 6-step **Checkout Wizard**
(`components/CheckoutWizard.jsx`) — Bundle review (with quantity steppers and an optional bundle
name when 2+ items are in cart) → Recipient → Address → Delivery Date → Gift Message → Review —
each step gated so you can't continue without the required field, ending in the same
`kapruka_create_order` call as before.

A few honest caveats:

- The **image-upload button in the composer is intentionally disabled** — there's no backend
  support for image-based search wired up, so it's left visibly inert rather than faking
  functionality.
- The **voice mic button is functional** via the browser's Web Speech API
  (`SpeechRecognition`). It works in Chrome/Edge; it degrades to inert (no-op) in browsers
  without support, rather than erroring.
- The **dark mode toggle** is real (full token set in `globals.css` under `[data-theme="dark"]`),
  defaulting to light to match the reference design.
- The **inline delivery date picker's visibility rule is a heuristic** (shows after any delivery
  tool call, hides once an order exists) — reasonable for a demo, but worth watching in a longer
  real conversation with multiple delivery checks.
