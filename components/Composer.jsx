"use client";

import { useEffect, useRef, useState } from "react";

const LANG_PLACEHOLDER = {
  en: "Message Kapu… (English, සිංහල, Tamil, Tanglish)",
  si: "Kapu වෙත පණිවිඩයක්… (English, සිංහල, Tamil, Tanglish)",
  ta: "Kapu-விற்கு செய்தி… (English, සිංහල, Tamil, Tanglish)",
};

export function Composer({ value, onChange, onSend, disabled, language = "en" }) {
  const ref = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onChange(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    const recognition = recognitionRef.current;
    if (!recognition) return; // browser doesn't support it — button stays inert
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch {
        // already running — ignore
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleInput(e) {
    onChange(e.target.value);
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        <button type="button" className="icon-btn image-btn" disabled aria-label="Attach image (coming soon)" title="Image search coming soon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>

        <textarea
          ref={ref}
          className="composer-input"
          rows={1}
          placeholder={LANG_PLACEHOLDER[language] || LANG_PLACEHOLDER.en}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <button
          type="button"
          className={`icon-btn mic-btn${listening ? " listening" : ""}`}
          onClick={toggleMic}
          aria-label="Voice input"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>

        <button
          type="button"
          className="send-btn"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
