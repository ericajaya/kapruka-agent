"use client";

function formatPrice(price, currency = "LKR") {
  if (price == null) return "Price on request";
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  return `${currency} ${num.toLocaleString("en-LK")}`;
}

export function ProductTag({ product, onAdd, onOpenLightbox, inCart }) {
  const outOfStock = /out of stock/i.test(product.availability || "");
  return (
    <div className="gift-tag">
      <button
        type="button"
        className="tag-thumb tag-thumb-btn"
        onClick={() => onOpenLightbox(product)}
        aria-label={`View ${product.name}`}
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <span className="placeholder">🎁</span>
        )}
      </button>
      <div className="tag-name">{product.name}</div>
      <div className="tag-price">{formatPrice(product.price, product.currency)}</div>
      <div className={`tag-stock${outOfStock ? " out" : ""}`}>
        {product.availability || "Check availability"}
      </div>
      <div className="tag-actions">
        <button
          type="button"
          className="tag-add"
          disabled={!product.id || outOfStock}
          onClick={() => onAdd(product)}
        >
          {inCart ? "Added ✓" : "Add to cart"}
        </button>
        {product.url && (
          <a className="tag-link" href={product.url} target="_blank" rel="noreferrer">
            View
          </a>
        )}
      </div>
    </div>
  );
}

export function TagCarousel({ products, onAdd, onOpenLightbox, cartIds }) {
  if (!products || products.length === 0) return null;
  return (
    <div className="tag-carousel">
      {products.map((p, i) => (
        <ProductTag
          key={p.id || `${p.name}-${i}`}
          product={p}
          onAdd={onAdd}
          onOpenLightbox={onOpenLightbox}
          inCart={p.id && cartIds.has(p.id)}
        />
      ))}
    </div>
  );
}
