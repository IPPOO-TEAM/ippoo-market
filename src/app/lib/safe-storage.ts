/* ═══════════════════════════════════════════
   IPPOO - Wrapper localStorage tolérant aux pannes
   Encapsule les accès à localStorage pour éviter les crashes
   en mode privé (Safari iOS), quota dépassé, désactivation
   par l'utilisateur ou environnement SSR.
   En cas d'indisponibilité, retombe sur un Map en mémoire
   pour préserver l'expérience utilisateur sur la session.
   ═══════════════════════════════════════════ */

const memory = new Map<string, string>();

function hasLS(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const k = "__ippoo_ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

let available: boolean | null = null;
function ls(): boolean {
  if (available == null) available = hasLS();
  return available;
}

export function safeGetItem(key: string): string | null {
  if (ls()) {
    try { return window.localStorage.getItem(key); } catch { /* fall through */ }
  }
  return memory.has(key) ? memory.get(key)! : null;
}

export function safeSetItem(key: string, value: string): boolean {
  if (ls()) {
    try { window.localStorage.setItem(key, value); return true; } catch { /* quota ou autre */ }
  }
  memory.set(key, value);
  return false;
}

export function safeRemoveItem(key: string): void {
  if (ls()) {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  }
  memory.delete(key);
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function isStorageAvailable(): boolean {
  return ls();
}
