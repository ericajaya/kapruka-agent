"use client";

const STARTER_PROMPTS = [
  { label: "Gift for amma 🎂", text: "I need a gift for my mother", icon: "🎂" },
  { label: "Flowers delivery", text: "Can you deliver flowers today?", icon: "💐" },
  { label: "அம்மாவுக்கு gift", text: "அம்மாவுக்கு ஒரு gift வேணும்", icon: "🎁" },
  { label: "Romantic gift 💝", text: "Find a romantic gift for my partner", icon: "💝" },
  { label: "Birthday hamper", text: "Show me birthday gift hampers", icon: "🎈" },
  { label: "Track my order", text: "Track order KAP123456", icon: "📦" },
];

export function Sidebar({ onNewConversation, onSelectPrompt, onShowHistory, open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-badge">
            <span className="logo-text">kapu</span>
            <span className="logo-smile">◡</span>
          </div>
          <div className="logo-caption">Kapruka chat shopping</div>
        </div>

        <button type="button" className="new-convo-btn" onClick={onNewConversation}>
          + New Conversation
        </button>

        <button type="button" className="history-btn" onClick={onShowHistory}>
          View chat history
        </button>

        <div className="starter-section">
          <div className="starter-heading">Starter Prompts</div>
          <div className="starter-list">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="starter-item"
                onClick={() => onSelectPrompt(p.text)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
