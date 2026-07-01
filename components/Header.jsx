"use client";

const LANGUAGES = [
  { code: "si",       label: "සි" },
  { code: "en",       label: "EN" },
  { code: "ta",       label: "த" },
  { code: "tanglish", label: "TG" },
];

export function Header({ language, onLanguageChange, theme, onThemeToggle, onOpenSidebar }) {
  return (
    <header className="kapu-header">
      <button type="button" className="sidebar-toggle" onClick={onOpenSidebar} aria-label="Open menu">
        ☰
      </button>

      <div className="kapu-brand">
        <div className="kapu-name">Kapu</div>
        <div className="kapu-tag">
          <span className="status-dot" /> by Kapruka
        </div>
      </div>

      <div className="header-actions">
        <div className="lang-toggle" role="group" aria-label="Reply language">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className="lang-btn"
              data-active={language === l.code}
              onClick={() => onLanguageChange(l.code)}
              title={l.code === "tanglish" ? "Tanglish" : l.code.toUpperCase()}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button type="button" className="theme-toggle" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}
