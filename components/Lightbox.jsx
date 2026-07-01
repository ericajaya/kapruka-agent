"use client";

import { useEffect } from "react";

export function Lightbox({ product, onClose, onAddToCart, inCart }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!product) return null;

  const outOfStock = /out of stock/i.test(product.availability || "");

  function fmtPrice(p, cur = "LKR") {
    if (p == null) return "Price on request";
    return `${cur} ${Number(p).toLocaleString("en-LK")}`;
  }

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="lightbox-image">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="lightbox-no-image">🎁</div>
          )}
        </div>

        <div className="lightbox-info">
          <h2 className="lightbox-name">{product.name}</h2>
          <div className="lightbox-price">{fmtPrice(product.price, product.currency)}</div>
          <div className={`lightbox-stock${outOfStock ? " out" : ""}`}>
            {product.availability || "Check availability"}
          </div>
          {product.description && (
            <p className="lightbox-desc">{product.description}</p>
          )}
          <div className="lightbox-actions">
            <button
              className="lightbox-add"
              disabled={!product.id || outOfStock}
              onClick={() => { onAddToCart(product); onClose(); }}
            >
              {inCart ? "✓ Added to cart" : "Add to cart"}
            </button>
            {product.url && (
              <a
                className="lightbox-link"
                href={product.url}
                target="_blank"
                rel="noreferrer"
              >
                View on Kapruka ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
