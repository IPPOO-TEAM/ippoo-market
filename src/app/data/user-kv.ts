import { logger } from "../lib/logger";
import { FUNCTIONS_BASE } from "../lib/runtime-config";
/* ═══════════════════════════════════════════
   IPPOO - User KV : collections JSON owner-based
   (adresses, équipe, préférences) synchronisées multi-appareils.
   ═══════════════════════════════════════════ */

import { getAccessToken } from "../auth/supabase";

const BASE = FUNCTIONS_BASE;

export type UserKvKey = "addresses" | "team" | "preferences" | "security" | "follows" | "my-shops" | "my-promos";

export async function getUserKv<T>(key: UserKvKey): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/user-kv/${key}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      logger.warn(`getUserKv(${key}) failed: HTTP ${res.status}`);
      return null;
    }
    const j = await res.json();
    return (j?.value as T) ?? null;
  } catch (e) {
    logger.warn(`getUserKv(${key}) error: ${e}`);
    return null;
  }
}

export async function setUserKv<T>(key: UserKvKey, value: T): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Connectez-vous pour synchroniser vos données");
  const res = await fetch(`${BASE}/user-kv/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    logger.warn(`setUserKv(${key}) failed: ${msg}`);
    throw new Error(msg);
  }
}
