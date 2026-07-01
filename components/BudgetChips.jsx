"use client";

const CHIPS = [
  { label: "Under LKR 1k",  text: "Show me options under LKR 1,000" },
  { label: "LKR 1k – 5k",   text: "Show me options between LKR 1,000 and LKR 5,000" },
  { label: "LKR 5k – 10k",  text: "Show me options between LKR 5,000 and LKR 10,000" },
  { label: "LKR 10k+",      text: "Show me premium options above LKR 10,000" },
];

export function BudgetChips({ onRefine }) {
  return (
    <div className="budget-chips">
      <span className="budget-label">Filter by budget:</span>
      {CHIPS.map((c) => (
        <button
          key={c.label}
          type="button"
          className="budget-chip"
          onClick={() => onRefine(c.text)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
