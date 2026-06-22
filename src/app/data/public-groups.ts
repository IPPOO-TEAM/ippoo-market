/* ═══════════════════════════════════════════
   IPPOO - Registre public des groupements Achat Groupé
   Cache (localStorage + abonnés) sur l'endpoint serveur
   `groups/public`. Permet à n'importe quel utilisateur de
   découvrir, rejoindre puis suivre un groupement créé par
   un autre membre de la plateforme.
   ═══════════════════════════════════════════ */

import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getAccessToken } from "../auth/supabase";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { logger } from "../lib/logger";
import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";
import type { Group } from "../groups/store";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cc347259`;
const CACHE_KEY = "ippoo:public-groups:v1";
const REFRESH_MS = 30_000;

let cache: Group[] = [];
let lastFetch = 0;
let inflight: Promise<Group[]> | null = null;
const listeners = new Set<() => void>();

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = safeGetItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cache = parsed;
  } catch {
    /* parse / quota */
  }
}
hydrate();

function persist() { safeSetItem(CACHE_KEY, JSON.stringify(cache)); }
function emit() { persist(); listeners.forEach((l) => l()); }

export function subscribePublicGroups(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getPublicGroups(): Group[] { return cache; }

export function findPublicGroup(id: string): Group | undefined {
  return cache.find((g) => g.id === id);
}

function upsertLocal(g: Group) {
  cache = [g, ...cache.filter((x) => x.id !== g.id)];
  emit();
}

function removeLocal(id: string) {
  const next = cache.filter((x) => x.id !== id);
  if (next.length !== cache.length) { cache = next; emit(); }
}

/** Récupère la liste réseau et met à jour le cache. Idempotent. */
export async function refreshPublicGroups(force = false): Promise<Group[]> {
  if (isBackendOffline()) return cache;
  if (!force && Date.now() - lastFetch < REFRESH_MS && cache.length) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${BASE}/groups/public`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) {
        logger.warn(`groups/public GET failed: HTTP ${res.status}`);
        return cache;
      }
      const j = await res.json();
      const items: Group[] = Array.isArray(j?.items) ? j.items : [];
      cache = items.sort((a, b) => b.createdAt - a.createdAt);
      lastFetch = Date.now();
      emit();
      return cache;
    } catch (e) {
      if (isNetworkError(e)) markBackendOffline("groups/public", e);
      else logger.warn(`groups/public GET error: ${e}`);
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Publie/met à jour un groupement côté serveur. Best-effort. */
export async function publishGroup(g: Group): Promise<void> {
  upsertLocal(g);
  const token = await getAccessToken();
  if (!token) return; // invité : on garde au moins en cache local
  try {
    const res = await fetch(`${BASE}/groups/public/${encodeURIComponent(g.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: g }),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
      logger.warn(`groups/public PUT failed: ${msg}`);
    }
  } catch (e) {
    logger.warn(`groups/public PUT error: ${e}`);
  }
}

/** Supprime un groupement côté serveur. Best-effort. */
export async function unpublishGroup(id: string): Promise<void> {
  removeLocal(id);
  const token = await getAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${BASE}/groups/public/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) logger.warn(`groups/public DELETE failed: HTTP ${res.status}`);
  } catch (e) {
    logger.warn(`groups/public DELETE error: ${e}`);
  }
}
