"use client";

export function OrderCard({ order }) {
  return (
    <div className="order-card">
      <strong>🎉 Order created</strong>
      {order.orderNumber && <div className="order-num">Order #{order.orderNumber}</div>}
      {order.total != null && (
        <div>
          Total: {order.currency} {Number(order.total).toLocaleString("en-LK")}
        </div>
      )}
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        Price locked for {order.expiresInMinutes || 60} minutes.
      </div>
      {order.payUrl && (
        <a className="pay-link" href={order.payUrl} target="_blank" rel="noreferrer">
          Pay now →
        </a>
      )}
    </div>
  );
}
