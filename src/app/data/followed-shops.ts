/* ═══════════════════════════════════════════
   IPPOO - Boutiques suivies (favoris acheteur)
   Ensemble de boutiques suivies, synchronisé multi-appareils
   via user-kv ("follows") avec localStorage en cache. Observable
   via useSyncExternalStore (lecture synchrone en mémoire).
   ═══════════════════════════════════════════ */

import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";
import { getUserKv, setUserKv } from "./user-kv";

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

/** Pousse l'état courant vers user-kv (best-effort, ignoré si déconnecté). */
function pushServer() {
  setUserKv("follows", items).catch(() => undefined);
}

/** Récupère l'état serveur et fusionne (le plus récent par slug gagne). */
export async function refreshFollowedShops(): Promise<void> {
  try {
    const remote = await getUserKv<Entry[]>("follows");
    if (!Array.isArray(remote)) return;
    const bySlug = new Map<string, Entry>();
    for (const e of items) if (e?.slug) bySlug.set(e.slug, e);
    for (const e of remote) {
      if (!e?.slug) continue;
      const local = bySlug.get(e.slug);
      if (!local || (e.followedAt ?? 0) >= (local.followedAt ?? 0)) bySlug.set(e.slug, e);
    }
    items = Array.from(bySlug.values());
    emit();
  } catch { /* hors-ligne : on garde le cache local */ }
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
  // Synchronisation serveur en arrière-plan.
  refreshFollowedShops().catch(() => undefined);
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
  pushServer();
}

export function unfollowShop(slug: string) {
  items = items.filter((e) => e.slug !== slug);
  emit();
  pushServer();
}

export function toggleFollowShop(slug: string, name: string): boolean {
  const was = isFollowingShop(slug);
  if (was) unfollowShop(slug);
  else followShop(slug, name);
  return !was;
}
