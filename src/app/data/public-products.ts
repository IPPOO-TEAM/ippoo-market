/* ═══════════════════════════════════════════
   IPPOO — Annuaire public des produits vendeurs
   Permet au comparateur de prix de capter tous les produits
   publiés par les vendeurs (cross-utilisateurs). Mirroir du
   pattern `public-vendors.ts`.
   ═══════════════════════════════════════════ */

import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getAccessToken } from "../auth/supabase";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { logger } from "../lib/logger";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cc347259`;
const CACHE_KEY = "ippoo:public-products:v1";
const REFRESH_MS = 60_000;

export type PublicProduct = {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  unit?: string;
  moq?: number;
  category?: string;
  image?: string;
  brand?: string;
  description?: string;
  stockQty?: number;
  shopSlug?: string;
  updatedAt?: number;
};

let cache: PublicProduct[] = [];
let lastFetch = 0;
let inflight: Promise<PublicProduct[]> | null = null;
const listeners = new Set<() => void>();

function hydrateFromLocal() {
  if (typeof window === "undefined") return;
  try {
    const raw = safeGetItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cache = parsed;
    }
  } catch { /* quota / parse */ }
}
hydrateFromLocal();

function persist() { safeSetItem(CACHE_KEY, JSON.stringify(cache)); }
function emit() { persist(); listeners.forEach((l) => l()); }

export function subscribePublicProducts(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getPublicProducts(): PublicProduct[] { return cache; }

export async function refreshPublicProducts(force = false): Promise<PublicProduct[]> {
  if (!force && Date.now() - lastFetch < REFRESH_MS && cache.length) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${BASE}/products/public`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) { logger.warn(`products/public GET failed: HTTP ${res.status}`); return cache; }
      const j = await res.json();
      const items: PublicProduct[] = Array.isArray(j?.items) ? j.items : [];
      cache = items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      lastFetch = Date.now();
      emit();
      return cache;
    } catch (e) {
      logger.warn(`products/public GET error: ${e}`);
      return cache;
    } finally { inflight = null; }
  })();
  return inflight;
}

function upsertLocal(p: PublicProduct) {
  const next = cache.filter((x) => x.id !== p.id);
  next.unshift(p);
  cache = next;
  emit();
}

function removeLocal(productId: string) {
  cache = cache.filter((p) => p.id !== productId);
  emit();
}

export async function publishMyProduct(product: Omit<PublicProduct, "ownerId" | "updatedAt">): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${BASE}/products/public/me/${encodeURIComponent(product.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: product }),
    });
    if (!res.ok) { logger.warn(`products/public PUT failed: HTTP ${res.status}`); return; }
    const j = await res.json().catch(() => ({}));
    if (j?.product) upsertLocal(j.product as PublicProduct);
  } catch (e) {
    logger.warn(`products/public PUT error: ${e}`);
  }
}

export async function unpublishMyProduct(productId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${BASE}/products/public/me/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) removeLocal(productId);
  } catch (e) {
    logger.warn(`products/public DELETE error: ${e}`);
  }
}

/** Hash stable d'un id produit string → entier ≥ 1_000_000 (évite les collisions
 *  avec les ids numériques du catalogue qui sont petits). Utilisé pour donner
 *  un `productId: number` au comparateur tout en gardant la source string. */
export function hashProductIdToNumber(id: string): number {
  let h = 5381 >>> 0;
  for (let i = 0; i < id.length; i++) h = (((h << 5) + h) ^ id.charCodeAt(i)) >>> 0;
  return 1_000_000 + (h % 2_000_000_000);
}
