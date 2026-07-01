"use client";

import { useMemo, useState } from "react";

const STEPS = ["Bundle", "Recipient", "Address", "Delivery", "Message", "Review"];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function fmtPrice(p, cur = "LKR") {
  if (p == null) return "—";
  return `${cur} ${Number(p).toLocaleString("en-LK")}`;
}

export function CheckoutWizard({ open, onClose, cart, onUpdateQty, onRemove, onCheckout, checkingOut }) {
  const [step, setStep] = useState(0);
  const [bundleName, setBundleName] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(defaultDate());
  const [giftMessage, setGiftMessage] = useState("");

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0),
    [cart]
  );

  if (!open) return null;

  const isBundle = cart.length > 1;
  const canGoNext = {
    0: cart.length > 0,
    1: name.trim().length > 0,
    2: city.trim().length > 0,
    3: !!date,
    4: true,
    5: false,
  };

  function next() {
    if (step < STEPS.length - 1 && canGoNext[step]) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function handleSubmit() {
    if (checkingOut) return;
    onCheckout({
      cart: cart.map((c) => ({ product_id: c.productId, quantity: c.qty })),
      recipient: { name: name.trim(), city: city.trim(), address: address.trim() || undefined },
      delivery: { city: city.trim(), date },
      gift_message: giftMessage.trim() || undefined,
      bundle_name: isBundle ? bundleName.trim() || undefined : undefined,
    });
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="cart-drawer" role="dialog" aria-label="Checkout">
        <div className="drawer-header">
          <h2>{isBundle ? "Bundle & Checkout" : "Checkout"}</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step progress */}
        <div className="wizard-progress">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`wizard-dot${i === step ? " active" : ""}${i < step ? " done" : ""}`}
              title={s}
            />
          ))}
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              Nothing here yet — ask Kapu to find a gift, then tap &quot;Add to cart&quot;.
            </div>
          ) : (
            <>
              {/* Step 0: Bundle review */}
              {step === 0 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">Your items</p>
                  {cart.map((item) => (
                    <div className="cart-item" key={item.productId}>
                      <div className="cart-item-thumb">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} />
                        )}
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <div className="qty-row">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => onUpdateQty(item.productId, Math.max(1, item.qty - 1))}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.qty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => onUpdateQty(item.productId, item.qty + 1)}
                          >
                            +
                          </button>
                          <span className="cart-item-price">
                            {fmtPrice(item.price, item.currency)} each
                          </span>
                        </div>
                        <button className="cart-item-remove" onClick={() => onRemove(item.productId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {isBundle && (
                    <div className="field-group">
                      <label className="field-label" htmlFor="bundle-name">
                        Name this gift bundle (optional)
                      </label>
                      <input
                        id="bundle-name"
                        className="field-input"
                        value={bundleName}
                        onChange={(e) => setBundleName(e.target.value)}
                        placeholder="e.g. Amma's Birthday Bundle"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Recipient */}
              {step === 1 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">Who is this for?</p>
                  <div className="field-group">
                    <label className="field-label" htmlFor="recipient-name">Recipient name</label>
                    <input
                      id="recipient-name"
                      className="field-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Amaya Fernando"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">Where should it go?</p>
                  <div className="field-group">
                    <label className="field-label" htmlFor="recipient-city">City</label>
                    <input
                      id="recipient-city"
                      className="field-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kandy"
                      autoFocus
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="recipient-address">
                      Street address (optional)
                    </label>
                    <input
                      id="recipient-address"
                      className="field-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House no, street, area"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Delivery date */}
              {step === 3 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">When should it arrive?</p>
                  <div className="field-group">
                    <label className="field-label" htmlFor="delivery-date">Delivery date</label>
                    <input
                      id="delivery-date"
                      type="date"
                      className="field-input"
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Gift message */}
              {step === 4 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">Add a gift message?</p>
                  <div className="field-group">
                    <label className="field-label" htmlFor="gift-message">
                      Gift message (optional)
                    </label>
                    <textarea
                      id="gift-message"
                      className="field-textarea"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="With love, from..."
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div className="wizard-step">
                  <p className="wizard-step-title">Review your order</p>
                  <div className="review-block">
                    {isBundle && bundleName && (
                      <div className="review-row"><span>Bundle</span><strong>{bundleName}</strong></div>
                    )}
                    <div className="review-row"><span>Items</span><strong>{cart.length}</strong></div>
                    <div className="review-row"><span>Recipient</span><strong>{name || "—"}</strong></div>
                    <div className="review-row">
                      <span>Delivering to</span>
                      <strong>{city || "—"}{address ? `, ${address}` : ""}</strong>
                    </div>
                    <div className="review-row"><span>Date</span><strong>{date}</strong></div>
                    {giftMessage && (
                      <div className="review-row"><span>Message</span><strong>&quot;{giftMessage}&quot;</strong></div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="cart-total">
              <span className="label">Estimated total</span>
              <span className="value">LKR {total.toLocaleString("en-LK")}</span>
            </div>

            <div className="wizard-nav">
              {step > 0 && (
                <button type="button" className="wizard-back" onClick={back}>
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="checkout-btn"
                  disabled={!canGoNext[step]}
                  onClick={next}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="checkout-btn"
                  disabled={checkingOut}
                  onClick={handleSubmit}
                >
                  {checkingOut ? "Placing order…" : "Get payment link 🎁"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
