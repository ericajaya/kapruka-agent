"use client";

import { useState } from "react";

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

export function DatePickerWidget({ onSelect }) {
  const [date, setDate] = useState(defaultDate());
  const [sent, setSent] = useState(false);

  function handleConfirm() {
    if (!date || sent) return;
    setSent(true);
    onSelect(date);
  }

  if (sent) {
    return (
      <div className="datepicker-widget sent">
        📅 Delivery date set: <strong>{date}</strong>
      </div>
    );
  }

  return (
    <div className="datepicker-widget">
      <span className="datepicker-label">Pick a delivery date:</span>
      <input
        type="date"
        className="datepicker-input"
        value={date}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setDate(e.target.value)}
      />
      <button
        type="button"
        className="datepicker-confirm"
        onClick={handleConfirm}
        disabled={!date}
      >
        Confirm date
      </button>
    </div>
  );
}
