import { useSyncExternalStore, useEffect } from "react";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import {
  listAdminCategories,
  upsertAdminCategory,
  deleteAdminCategory,
  AdminCategoryServer,
} from "../data/admin-server";

export type AdminCategory = AdminCategoryServer;

const CACHE_KEY = "ippoo:admin-categories";

const SEED: AdminCategory[] = [
  { id: "c1", name: "Alimentaire", slug: "alimentaire", icon: "UtensilsCrossed", color: "#16A34A", active: true, sortOrder: 1 },
  { id: "c2", name: "Beauté", slug: "beaute", icon: "Sparkles", color: "#E11D2E", active: true, sortOrder: 2 },
  { id: "c3", name: "Hygiène", slug: "hygiene", icon: "SprayCan", color: "#3B82F6", active: true, sortOrder: 3 },
  { id: "c4", name: "Textile", slug: "textile", icon: "Shirt", color: "#F0B429", active: true, sortOrder: 4 },
  { id: "c5", name: "Quincaillerie", slug: "quincaillerie", icon: "Wrench", color: "#6B7280", active: true, sortOrder: 5 },
  { id: "c6", name: "Électroménager", slug: "electromenager", icon: "Plug", color: "#9333EA", active: true, sortOrder: 6 },
];

function readCache(): AdminCategory[] {
  try {
    const raw = safeGetItem(CACHE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED;
    return parsed as AdminCategory[];
  } catch {
    return SEED;
  }
}

let state: AdminCategory[] = readCache();
let sortedCache: AdminCategory[] = [...state].sort((a, b) => a.sortOrder - b.sortOrder);
const listeners = new Set<() => void>();

function emit() {
  sortedCache = [...state].sort((a, b) => a.sortOrder - b.sortOrder);
  try { safeSetItem(CACHE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

export function getCategories(): AdminCategory[] {
  return sortedCache;
}

export function subscribeCategories(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export async function refreshCategories(): Promise<void> {
  try {
    const items = await listAdminCategories();
    if (items.length > 0) {
      state = items;
      emit();
    }
  } catch {
    /* ignore - keep cache */
  }
}

export function useCategories(): AdminCategory[] {
  useEffect(() => { void refreshCategories(); }, []);
  return useSyncExternalStore(subscribeCategories, getCategories, getCategories);
}

export async function upsertCategory(c: AdminCategory): Promise<void> {
  const saved = await upsertAdminCategory(c);
  const exists = state.some((x) => x.id === saved.id);
  state = exists ? state.map((x) => (x.id === saved.id ? saved : x)) : [...state, saved];
  emit();
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteAdminCategory(id);
  state = state.filter((c) => c.id !== id);
  emit();
}

export async function toggleCategory(id: string): Promise<void> {
  const cur = state.find((c) => c.id === id);
  if (!cur) return;
  await upsertCategory({ ...cur, active: !cur.active });
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  const sorted = [...state].sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = sorted.findIndex((c) => c.id === id);
  const swap = idx + direction;
  if (idx < 0 || swap < 0 || swap >= sorted.length) return;
  const a = sorted[idx];
  const b = sorted[swap];
  await upsertCategory({ ...a, sortOrder: b.sortOrder });
  await upsertCategory({ ...b, sortOrder: a.sortOrder });
}
