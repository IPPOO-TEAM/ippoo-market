import { logger } from "../lib/logger";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";
/* ═══════════════════════════════════════════
   IPPOO - Annuaire public des vendeurs
   Store léger (cache localStorage + abonnés) qui interroge
   l'endpoint serveur `vendors/public`. Chaque vendeur publie
   son propre enregistrement à la fin du signup et peut le
   mettre à jour depuis n'importe quel appareil.
   ═══════════════════════════════════════════ */

import { getAccessToken } from "../auth/supabase";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";

const BASE = FUNCTIONS_BASE;
const CACHE_KEY = "ippoo:public-vendors:v1";
const REFRESH_MS = 60_000;

export type PublicVendor = {
  ownerId?: string;
  name: string;
  city?: string;
  niche?: string;
  description?: string;
  logo?: string;
  shopPhoto?: string;
  avatar?: string;
  accountType?: string;
  whatsapp?: string;
  phone?: string;
  shopStatus?: "open" | "vacation" | "closed";
  createdAt: number;
  updatedAt?: number;
};

let cache: PublicVendor[] = [];
let lastFetch = 0;
let inflight: Promise<PublicVendor[]> | null = null;
const listeners = new Set<() => void>();

function hydrateFromLocal() {
  if (typeof window === "undefined") return;
  try {
    const raw = safeGetItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cache = parsed;
    }
  } catch {
    /* quota / parse */
  }
}
hydrateFromLocal();

function persist() {
  safeSetItem(CACHE_KEY, JSON.stringify(cache));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribePublicVendors(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getPublicVendors(): PublicVendor[] {
  return cache;
}

export const SERVER_SNAPSHOT: PublicVendor[] = [];

/** Récupère la liste (réseau) et met à jour le cache. Idempotent. */
export async function refreshPublicVendors(force = false): Promise<PublicVendor[]> {
  if (isBackendOffline()) return cache;
  if (!force && Date.now() - lastFetch < REFRESH_MS && cache.length) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${BASE}/vendors/public`, {
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) {
        logger.warn(`vendors/public GET failed: HTTP ${res.status}`);
        return cache;
      }
      const j = await res.json();
      const items: PublicVendor[] = Array.isArray(j?.items) ? j.items : [];
      cache = items.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
      lastFetch = Date.now();
      emit();
      return cache;
    } catch (e) {
      if (isNetworkError(e)) markBackendOffline("vendors/public", e);
      else logger.warn(`vendors/public GET error: ${e}`);
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Publie le profil vendeur de l'utilisateur courant (clé serveur = userId). */
export async function publishMyVendor(vendor: Omit<PublicVendor, "ownerId" | "updatedAt">): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    // Pas connecté : on tolère, on garde au moins en cache local pour cet appareil
    upsertLocal({ ...vendor });
    return;
  }
  const res = await fetch(`${BASE}/vendors/public/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: vendor }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    logger.warn(`vendors/public PUT failed: ${msg}`);
    // Fallback : on garde en local pour ne pas perdre la donnée.
    upsertLocal({ ...vendor });
    return;
  }
  const j = await res.json().catch(() => ({}));
  upsertLocal({ ...vendor, ownerId: j?.ownerId, updatedAt: Date.now() });
  // Force un refresh asynchrone pour récupérer la version normalisée du serveur.
  refreshPublicVendors(true).catch(() => undefined);
}

function upsertLocal(v: PublicVendor) {
  const key = v.ownerId || v.name;
  const next = cache.filter((x) => (x.ownerId || x.name) !== key);
  next.unshift({ ...v, updatedAt: v.updatedAt ?? Date.now() });
  cache = next;
  emit();
}

/** Retrouve un vendeur publié par son ownerId. */
export function findPublishedVendor(ownerId: string | undefined): PublicVendor | undefined {
  if (!ownerId) return undefined;
  return cache.find((v) => v.ownerId === ownerId);
}
