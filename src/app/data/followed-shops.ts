/* ═══════════════════════════════════════════
   IPPOO — Boutiques suivies (favoris acheteur)
   Store local d'un ensemble de slugs de boutiques
   suivies, persisté en localStorage et observable
   via useSyncExternalStore.
   ═══════════════════════════════════════════ */

import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const STORAGE_KEY = "ippoo:followed-shops";

type Entry = { slug: string; name: string; followedAt: number };

let items: Entry[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
let snapshot = "[]";

export const SERVER_SNAPSHOT = "[]";

function emit() {
  scopedSetItem(STORAGE_KEY, JSON.stringify(items));
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
}

export function hydrateFollowedShops() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as Entry[];
  } catch { items = []; }
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getFollowedSnapshot(): string {
  return snapshot;
}

export function listFollowedShops(): Entry[] {
  return items.slice().sort((a, b) => b.followedAt - a.followedAt);
}

export function isFollowingShop(slug: string): boolean {
  return items.some((e) => e.slug === slug);
}

export function followShop(slug: string, name: string) {
  if (items.some((e) => e.slug === slug)) return;
  items = [{ slug, name, followedAt: Date.now() }, ...items];
  emit();
}

export function unfollowShop(slug: string) {
  items = items.filter((e) => e.slug !== slug);
  emit();
}

export function toggleFollowShop(slug: string, name: string): boolean {
  const was = isFollowingShop(slug);
  if (was) unfollowShop(slug);
  else followShop(slug, name);
  return !was;
}
