/* ═══════════════════════════════════════════
   IPPOO — Avis clients par boutique
   Store local de reviews (1-5★ + commentaire) avec
   modération côté vendeur : statut pending/approved/rejected.
   La boutique publique n'affiche que les avis "approved".
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";

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

let items: ShopReview[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
let snapshot = "[]";

export const SERVER_SNAPSHOT = "[]";

function emit() {
  safeSetItem(STORAGE_KEY, JSON.stringify(items));
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
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
  return r;
}

export function updateReview(id: string, patch: Partial<ShopReview>) {
  items = items.map((r) => r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r);
  emit();
}

export function deleteReview(id: string) {
  items = items.filter((r) => r.id !== id);
  emit();
}
