// localStorage-backed session memory.
// Stores the last known recipient name, city, and occasion so the hero screen
// can show a "Welcome back — shopping for Amaya in Kandy again?" prompt.
// All reads/writes are guarded against SSR and incognito-mode quota errors.

const KEY = "kapu_session";

export function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSession() || {};
    localStorage.setItem(KEY, JSON.stringify({ ...existing, ...data, savedAt: Date.now() }));
  } catch {
    // Incognito or quota exceeded — silently ignore
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
