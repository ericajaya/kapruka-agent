"use client";

const HERO_PROMPTS = [
  { label: "Gift for amma 🎂",    text: "I need a gift for my mother" },
  { label: "Flowers delivery 💐", text: "Can you deliver flowers today?" },
  { label: "அம்மாவுக்கு gift",   text: "அம்மாவுக்கு ஒரு gift வேணும்" },
  { label: "Romantic gift 💝",    text: "Find a romantic gift for my partner" },
];

const OCCASIONS = [
  { label: "🌸 Avurudu",        text: "I need a Sinhala New Year Avurudu gift" },
  { label: "🪔 Vesak",          text: "Help me find a Vesak gift or donation" },
  { label: "💝 Valentine's",     text: "Find a romantic Valentine's Day gift" },
  { label: "🎄 Christmas",       text: "I need a Christmas gift" },
  { label: "👩 Mother's Day",    text: "Help me find a Mother's Day gift" },
  { label: "🎓 Graduation",      text: "I need a graduation gift" },
];

export function Hero({ onSelectPrompt, previousSession }) {
  return (
    <div className="hero-panel">
      <div className="hero-badge">
        <span className="hero-badge-text">kapu</span>
        <span className="hero-badge-smile">◡</span>
      </div>

      {previousSession ? (
        <div className="welcome-back">
          <h1 className="hero-title">Welcome back! 👋</h1>
          <p className="hero-subtitle">
            Last time you were shopping for{" "}
            <strong>{previousSession.recipientName || "a loved one"}</strong>
            {previousSession.city ? ` in ${previousSession.city}` : ""}.
            {" "}Shopping for them again?
          </p>
          <div className="welcome-back-actions">
            <button
              className="hero-card welcome-yes"
              onClick={() =>
                onSelectPrompt(
                  `Yes, I need another gift for ${previousSession.recipientName || "them"}${
                    previousSession.city ? ` in ${previousSession.city}` : ""
                  }`
                )
              }
            >
              Yes, find something for them 🎁
            </button>
            <button
              className="hero-card"
              onClick={() => onSelectPrompt("I'm shopping for someone new today")}
            >
              Shopping for someone new
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="hero-title">How can I help you shop today?</h1>
          <p className="hero-subtitle">
            I'm Kapu, your personal Kapruka shopping assistant. Ask me to find gifts,
            check prices, or browse categories.
          </p>
        </>
      )}

      <div className="hero-grid">
        {HERO_PROMPTS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="hero-card"
            onClick={() => onSelectPrompt(p.text)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Occasion tags row — change 3 */}
      <div className="occasion-row">
        <span className="occasion-label">Occasions:</span>
        {OCCASIONS.map((o) => (
          <button
            key={o.label}
            type="button"
            className="occasion-tag"
            onClick={() => onSelectPrompt(o.text)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
