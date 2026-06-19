/* ═══════════════════════════════════════════
   IPPOO — Clés localStorage scopées par compte
   Évite que les données d'un utilisateur (wallet, notifs, boutiques,
   abonnement…) fuitent vers un nouveau compte créé sur le même
   navigateur. Chaque clé est namespacée par l'ID de compte courant ;
   au premier accès, les données éventuellement présentes sous l'ancienne
   clé globale sont rattachées au compte puis la clé legacy est purgée.
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem, safeRemoveItem } from "./safe-storage";
import { ensureAccountId } from "../auth/account-id";

export function scopedKey(legacyKey: string): string {
  if (typeof window === "undefined") return legacyKey;
  try {
    return `${legacyKey}::${ensureAccountId().id}`;
  } catch {
    return legacyKey;
  }
}

/** Lit la valeur courante ; migre l'ancienne clé globale si nécessaire. */
export function scopedGetItem(legacyKey: string): string | null {
  const key = scopedKey(legacyKey);
  let raw = safeGetItem(key);
  if (!raw && key !== legacyKey) {
    const legacy = safeGetItem(legacyKey);
    if (legacy) {
      safeSetItem(key, legacy);
      raw = legacy;
    }
    safeRemoveItem(legacyKey);
  }
  return raw;
}

export function scopedSetItem(legacyKey: string, value: string): boolean {
  return safeSetItem(scopedKey(legacyKey), value);
}

export function scopedRemoveItem(legacyKey: string): void {
  safeRemoveItem(scopedKey(legacyKey));
}

export function scopedGetJSON<T>(legacyKey: string, fallback: T): T {
  const raw = scopedGetItem(legacyKey);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function scopedSetJSON(legacyKey: string, value: unknown): boolean {
  try {
    return scopedSetItem(legacyKey, JSON.stringify(value));
  } catch {
    return false;
  }
}
