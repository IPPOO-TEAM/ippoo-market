/* ═══════════════════════════════════════════
   IPPOO — Boutiques secondaires (multi-shop)
   Pour les organisations / coopératives qui gèrent
   plusieurs points de vente sous un même compte.
   La boutique "primaire" reste dérivée de
   profile.businessName. Les boutiques secondaires
   sont stockées ici et listées en plus de la
   primaire dans le switcher.
   ═══════════════════════════════════════════ */

import { slugifyShopName } from "./shop-assets";
import { scopedGetItem, scopedSetItem, scopedRemoveItem } from "../lib/scoped-storage";

export type ShopEntry = {
  slug: string;
  name: string;
  niche?: string;
  city?: string;
  description?: string;
  createdAt: number;
};

const STORAGE_KEY = "ippoo:my-shops";
const ACTIVE_KEY = "ippoo:active-shop-slug";

let extras: ShopEntry[] = [];
let activeSlug: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
let snapshot = "[]|";

export const SERVER_SNAPSHOT = "[]|";

function emit() {
  scopedSetItem(STORAGE_KEY, JSON.stringify(extras));
  if (activeSlug) scopedSetItem(ACTIVE_KEY, activeSlug);
  else scopedRemoveItem(ACTIVE_KEY);
  snapshot = `${JSON.stringify(extras)}|${activeSlug ?? ""}`;
  listeners.forEach((l) => l());
}

export function hydrateMyShops() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (raw) extras = JSON.parse(raw) as ShopEntry[];
  } catch { extras = []; }
  activeSlug = scopedGetItem(ACTIVE_KEY);
  snapshot = `${JSON.stringify(extras)}|${activeSlug ?? ""}`;
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getMyShopsSnapshot(): string {
  return snapshot;
}

/** Toutes les boutiques accessibles : primaire (businessName) + extras. */
export function listAllShops(primaryName: string | undefined): ShopEntry[] {
  const primary: ShopEntry | null = primaryName?.trim()
    ? { slug: slugifyShopName(primaryName), name: primaryName, createdAt: 0 }
    : null;
  const all = primary ? [primary, ...extras] : [...extras];
  // Dédup par slug (la primaire l'emporte si même slug que extra).
  const seen = new Set<string>();
  return all.filter((s) => {
    if (seen.has(s.slug)) return false;
    seen.add(s.slug);
    return true;
  });
}

/** Slug actif (par défaut = slug de la boutique primaire). */
export function getActiveShopSlug(primaryName: string | undefined): string {
  const all = listAllShops(primaryName);
  if (activeSlug && all.some((s) => s.slug === activeSlug)) return activeSlug;
  return all[0]?.slug ?? "";
}

export function setActiveShop(slug: string) {
  activeSlug = slug;
  emit();
}

export function addShop(input: { name: string; niche?: string; city?: string; description?: string }): ShopEntry {
  const slug = slugifyShopName(input.name);
  const entry: ShopEntry = {
    slug,
    name: input.name.trim(),
    niche: input.niche,
    city: input.city,
    description: input.description,
    createdAt: Date.now(),
  };
  extras = [entry, ...extras.filter((s) => s.slug !== slug)];
  activeSlug = slug;
  emit();
  return entry;
}

export function removeShop(slug: string) {
  extras = extras.filter((s) => s.slug !== slug);
  if (activeSlug === slug) activeSlug = null;
  emit();
}
