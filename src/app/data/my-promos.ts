/* ═══════════════════════════════════════════
   IPPOO - Promotions vendeur (codes & remises)
   Store local indexé par shopSlug. Permet aux vendeurs
   de créer des codes promo applicables à leurs propres
   produits, avec un % de remise, une période de validité,
   un usage maximal et un statut actif/inactif.
   ═══════════════════════════════════════════ */

import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";
import { getUserKv, setUserKv } from "./user-kv";

export type PromoType = "percent" | "amount";

export type MyPromo = {
  id: string;
  shopSlug: string;
  code: string;          // ex: SOLDES10
  label?: string;
  type: PromoType;
  value: number;         // % si percent, FCFA si amount
  minOrder?: number;     // commande minimum
  startsAt?: string;     // ISO date
  endsAt?: string;       // ISO date
  maxUses?: number;
  usedCount: number;
  productIds?: string[]; // restreint à ces produits (sinon toute la boutique)
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "ippoo:my-promos";

let items: MyPromo[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
let snapshot = "[]";

export const SERVER_SNAPSHOT = "[]";

function emit() {
  scopedSetItem(STORAGE_KEY, JSON.stringify(items));
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
}

/** Pousse les promos vendeur vers user-kv (best-effort). */
function pushServer() {
  setUserKv("my-promos", items).catch(() => undefined);
}

/** Récupère l'état serveur et fusionne (le plus récent par id gagne). */
export async function refreshMyPromos(): Promise<void> {
  try {
    const remote = await getUserKv<MyPromo[]>("my-promos");
    if (!Array.isArray(remote)) return;
    const byId = new Map<string, MyPromo>();
    for (const p of items) if (p?.id) byId.set(p.id, p);
    for (const p of remote) {
      if (!p?.id) continue;
      const local = byId.get(p.id);
      if (!local || (p.updatedAt ?? 0) >= (local.updatedAt ?? 0)) byId.set(p.id, p);
    }
    items = Array.from(byId.values());
    emit();
  } catch { /* hors-ligne : cache local conservé */ }
}

export function hydrateMyPromos() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as MyPromo[];
  } catch { items = []; }
  snapshot = JSON.stringify(items);
  listeners.forEach((l) => l());
  // Synchronisation serveur en arrière-plan.
  refreshMyPromos().catch(() => undefined);
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getMyPromosSnapshot(): string {
  return snapshot;
}

export function listMyPromos(shopSlug: string): MyPromo[] {
  return items.filter((p) => p.shopSlug === shopSlug);
}

export function addMyPromo(input: Omit<MyPromo, "id" | "createdAt" | "updatedAt" | "usedCount">): MyPromo {
  const now = Date.now();
  const p: MyPromo = {
    ...input,
    code: input.code.toUpperCase().trim(),
    id: `PR-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  items = [p, ...items];
  emit();
  pushServer();
  return p;
}

export function updateMyPromo(id: string, patch: Partial<MyPromo>) {
  items = items.map((p) => p.id === id ? {
    ...p, ...patch,
    code: patch.code ? patch.code.toUpperCase().trim() : p.code,
    updatedAt: Date.now(),
  } : p);
  emit();
  pushServer();
}

export function deleteMyPromo(id: string) {
  items = items.filter((p) => p.id !== id);
  emit();
  pushServer();
}

export function isPromoActive(p: MyPromo): boolean {
  if (!p.active) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (p.startsAt && today < p.startsAt) return false;
  if (p.endsAt && today > p.endsAt) return false;
  if (p.maxUses != null && p.usedCount >= p.maxUses) return false;
  return true;
}
