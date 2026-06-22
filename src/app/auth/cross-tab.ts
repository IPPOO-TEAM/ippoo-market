/* ═══════════════════════════════════════════
   IPPOO - Synchronisation cross-tab
   Propage logout/login entre les onglets via BroadcastChannel
   (+ fallback storage event). Utilisé pour invalider les états
   locaux quand l'utilisateur se déconnecte ailleurs.
   ═══════════════════════════════════════════ */

import { safeSetItem } from "../lib/safe-storage";

const CHANNEL = "ippoo:auth";
const STORAGE_PING = "ippoo:auth:ping";

type AuthEvent = { type: "logout" | "login"; at: number };

let bc: BroadcastChannel | null = null;
function channel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (bc) return bc;
  try {
    bc = new BroadcastChannel(CHANNEL);
  } catch {
    bc = null;
  }
  return bc;
}

export function broadcastAuth(type: AuthEvent["type"]) {
  const ev: AuthEvent = { type, at: Date.now() };
  const ch = channel();
  if (ch) {
    try { ch.postMessage(ev); } catch { /* ignore */ }
  }
  safeSetItem(STORAGE_PING, JSON.stringify(ev));
}

export function subscribeAuth(fn: (ev: AuthEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const ch = channel();
  const onMsg = (e: MessageEvent) => { if (e?.data?.type) fn(e.data as AuthEvent); };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_PING || !e.newValue) return;
    try { fn(JSON.parse(e.newValue) as AuthEvent); } catch { /* ignore */ }
  };
  ch?.addEventListener("message", onMsg);
  window.addEventListener("storage", onStorage);
  return () => {
    ch?.removeEventListener("message", onMsg);
    window.removeEventListener("storage", onStorage);
  };
}
