/* ═══════════════════════════════════════════
   IPPOO - Avis clients par boutique
   Avis partagés (1-5★ + commentaire) avec modération
   côté vendeur : statut pending/approved/rejected.
   Adossé au backend (`/shop-reviews`) pour un partage
   réel cross-utilisateurs ; localStorage sert de cache
   et de repli hors-ligne. L'API publique du store reste
   inchangée (lecture synchrone via useSyncExternalStore).
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";
import { getAccessToken } from "../auth/supabase";
import { logger } from "../lib/logger";
import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";

const BASE = FUNCTIONS_BASE;

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ShopReview = {
  id: string;
  shopSlug: string;
  authorName: string;
  authorId?: string;
  rating: number;       // 1..5
  comment: string;
  vendorReply?: string;
  status: ReviewStatus;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "ippoo:shop-reviews";
const REFRESH_MS = 60_000;

let items: ShopReview[] = [];
let hydrated = false;
let lastFetch = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
let snapshot = "[]";

export const SERVER_SNAPSHOT = "[]";

function emit() {
  safeSetItem(STORAGE_KEY, JSON.stringify(items));
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
}

/** Fusionne les avis serveur avec les éventuels avis locaux non encore synchronisés. */
function mergeServer(serverItems: ShopReview[]) {
  const byId = new Map<string, ShopReview>();
  for (const r of serverItems) if (r?.id) byId.set(r.id, r);
  // Conserve les avis locaux absents du serveur (création hors-ligne).
  for (const r of items) if (r?.id && !byId.has(r.id)) byId.set(r.id, r);
  items = Array.from(byId.values());
  emit();
}

export async function refreshShopReviews(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (isBackendOffline()) return;
  if (!force && Date.now() - lastFetch < REFRESH_MS && items.length) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const token = await getAccessToken().catch(() => null);
      const res = await fetch(`${BASE}/shop-reviews`, {
        headers: { Authorization: `Bearer ${token || SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) {
        logger.warn(`shop-reviews GET failed: HTTP ${res.status}`);
        return;
      }
      const j = await res.json();
      const list: ShopReview[] = Array.isArray(j?.items) ? j.items : [];
      lastFetch = Date.now();
      mergeServer(list);
    } catch (e) {
      if (isNetworkError(e)) markBackendOffline("shop-reviews", e);
      else logger.warn(`shop-reviews GET error: ${e}`);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function hydrateShopReviews() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = safeGetItem(STORAGE_KEY);
    items = raw ? (JSON.parse(raw) as ShopReview[]) : [];
  } catch { items = []; }
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
  // Rafraîchissement réseau en arrière-plan.
  refreshShopReviews(true).catch(() => undefined);
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getShopReviewsSnapshot(): string {
  return snapshot;
}

export function listShopReviews(shopSlug: string, statuses?: ReviewStatus[]): ShopReview[] {
  return items.filter((r) =>
    r.shopSlug === shopSlug && (!statuses || statuses.includes(r.status))
  );
}

export function listApprovedReviews(shopSlug: string): ShopReview[] {
  return listShopReviews(shopSlug, ["approved"]).sort((a, b) => b.createdAt - a.createdAt);
}

export function getShopRatingSummary(shopSlug: string): { count: number; average: number } {
  const all = listApprovedReviews(shopSlug);
  if (all.length === 0) return { count: 0, average: 0 };
  const sum = all.reduce((s, r) => s + r.rating, 0);
  return { count: all.length, average: sum / all.length };
}

export function addReview(input: Omit<ShopReview, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ReviewStatus }): ShopReview {
  const now = Date.now();
  const r: ShopReview = {
    ...input,
    status: input.status ?? "pending",
    id: `REV-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  };
  items = [r, ...items];
  emit();
  // Persistance serveur (best-effort ; reste en local si échec/déconnecté).
  (async () => {
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/shop-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopSlug: r.shopSlug, authorName: r.authorName, rating: r.rating, comment: r.comment }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.review?.id) {
          // Remplace l'id local optimiste par l'enregistrement serveur.
          items = items.map((x) => (x.id === r.id ? { ...j.review } : x));
          emit();
        }
      }
    } catch (e) {
      logger.warn(`shop-reviews POST error: ${e}`);
    }
  })();
  return r;
}

export function updateReview(id: string, patch: Partial<ShopReview>) {
  const current = items.find((r) => r.id === id);
  items = items.map((r) => r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r);
  emit();
  if (!current) return;
  const slug = current.shopSlug;
  (async () => {
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    try {
      await fetch(`${BASE}/shop-reviews/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slug, id,
          status: patch.status,
          vendorReply: "vendorReply" in patch ? (patch.vendorReply ?? "") : undefined,
        }),
      });
    } catch (e) {
      logger.warn(`shop-reviews moderate error: ${e}`);
    }
  })();
}

export function deleteReview(id: string) {
  const current = items.find((r) => r.id === id);
  items = items.filter((r) => r.id !== id);
  emit();
  if (!current) return;
  const slug = current.shopSlug;
  (async () => {
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    try {
      await fetch(`${BASE}/shop-reviews/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, id }),
      });
    } catch (e) {
      logger.warn(`shop-reviews delete error: ${e}`);
    }
  })();
}
