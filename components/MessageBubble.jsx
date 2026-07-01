"use client";

import { TagCarousel } from "./ProductTag";
import { OrderCard } from "./OrderCard";
import { BudgetChips } from "./BudgetChips";
import { DatePickerWidget } from "./DatePickerWidget";

const TOOL_LABELS = {
  kapruka_search_products: "🔍 Searched catalog",
  kapruka_get_product: "📦 Looked up product",
  kapruka_list_categories: "🗂 Browsed categories",
  kapruka_list_delivery_cities: "📍 Checked delivery network",
  kapruka_check_delivery: "🚚 Checked delivery",
  kapruka_create_order: "🛒 Placed order",
  kapruka_track_order: "📦 Tracked order",
};

const DELIVERY_TOOLS = new Set(["kapruka_list_delivery_cities", "kapruka_check_delivery"]);

export function MessageBubble({
  message,
  onAddToCart,
  onOpenLightbox,
  onRefineBudget,
  onDeliveryDateChosen,
  cartIds,
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="msg-row user">
        <div className="bubble">{message.displayText || message.content}</div>
      </div>
    );
  }

  const tools = message.toolsCalled || [];
  const uniqueTools = [...new Set(tools)];
  const calledDeliveryTool = tools.some((t) => DELIVERY_TOOLS.has(t));
  const calledOrderTool = tools.includes("kapruka_create_order");

  return (
    <div className="msg-row agent">
      <div className="agent-label">Kapu</div>
      <div className="bubble">
        {message.content}
        {message.streaming && <span className="stream-cursor">▍</span>}
      </div>

      {uniqueTools.length > 0 && (
        <div className="tool-badges">
          {uniqueTools.map((t) => (
            <span key={t} className={`tool-badge${t === "kapruka_create_order" ? " order" : ""}`}>
              {TOOL_LABELS[t] || t}
            </span>
          ))}
        </div>
      )}

      {message.errors?.length > 0 && (
        <div className="error-note">
          ⚠️ {message.errors.map((e) => e.message).join(" · ")}
        </div>
      )}

      {message.products?.length > 0 && (
        <>
          <TagCarousel
            products={message.products}
            onAdd={onAddToCart}
            onOpenLightbox={onOpenLightbox}
            cartIds={cartIds}
          />
          {!message.streaming && (
            <BudgetChips onRefine={onRefineBudget} />
          )}
        </>
      )}

      {!message.streaming && calledDeliveryTool && !calledOrderTool && (
        <DatePickerWidget onSelect={onDeliveryDateChosen} />
      )}

      {message.orders?.map((o, i) => (
        <OrderCard key={i} order={o} />
      ))}
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="msg-row agent">
      <div className="agent-label">Kapu</div>
      <div className="thinking">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
