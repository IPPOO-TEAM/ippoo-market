/* ═══════════════════════════════════════════
   IPPOO — Synchronisation complète vers Supabase
   Collecte TOUTES les données de la plateforme (catalogue généré,
   vendeurs, boutiques, catégories/secteurs, blog, cotations) et les
   pousse dans le KV serveur (kv_store_cc347259) par lots, via
   l'endpoint admin /admin/seed (protégé par token admin).

   Idempotent : chaque clé est upsertée. Relançable sans doublon.
   ═══════════════════════════════════════════ */

import { FUNCTIONS_BASE } from "../lib/runtime-config";
import { getAdminToken } from "./admin-session";

type SeedItem = { key: string; value: any };
const BATCH = 400;

export type SeedProgress = {
  total: number;
  written: number;
  phase: string;
  done: boolean;
  error?: string;
};

/** Rassemble toutes les sources de données de la plateforme. */
async function collectAll(): Promise<SeedItem[]> {
  const items: SeedItem[] = [];
  const push = (key: string, value: any) => items.push({ key, value });

  // ── Catalogue produits (généré) ──
  try {
    const { allProducts } = await import("../components/mock-data");
    for (const p of allProducts as any[]) {
      if (p?.id != null) push(`catalog:product:${p.id}`, p);
    }
  } catch { /* ignore */ }

  // ── Vendeurs & boutiques (marketplace) ──
  try {
    const mk = await import("../data/marketplace");
    for (const v of (mk as any).VENDORS ?? []) if (v?.id != null) push(`catalog:vendor:${v.id}`, v);
    for (const s of (mk as any).SHOPS ?? []) if (s?.id != null) push(`catalog:shop:${s.id}`, s);
  } catch { /* ignore */ }

  // ── Vendeurs (annuaire enrichi) ──
  try {
    const vd = await import("../components/vendors/data");
    for (const v of (vd as any).seededVendors ?? []) if (v?.id != null) push(`catalog:vendor-dir:${v.id}`, v);
  } catch { /* ignore */ }

  // ── Secteurs / catégories ──
  try {
    const { SECTORS } = await import("../data/sectors");
    for (const s of SECTORS as any[]) if (s?.id != null) push(`catalog:sector:${s.id}`, s);
  } catch { /* ignore */ }

  // ── Blog ──
  try {
    const { blogArticles } = await import("../data/blog-articles");
    (blogArticles as any[]).forEach((a, i) => push(`blog:${a?.id ?? a?.slug ?? i}`, a));
  } catch { /* ignore */ }

  // ── Cotations ──
  try {
    const cot = await import("../components/cotation/data");
    const list = (cot as any).cotations ?? (cot as any).default ?? [];
    (list as any[]).forEach((x, i) => push(`cotation:${x?.id ?? i}`, x));
  } catch { /* ignore */ }

  // ── Produits curated ──
  try {
    const { curatedProducts } = await import("../components/mock-data-curated");
    (curatedProducts as any[]).forEach((p, i) => push(`catalog:curated:${p?.id ?? i}`, p));
  } catch { /* ignore */ }

  return items;
}

async function postBatch(items: SeedItem[], token: string): Promise<number> {
  const res = await fetch(`${FUNCTIONS_BASE}/admin/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", "x-admin-token": token },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `HTTP ${res.status}`);
  }
  const j = await res.json().catch(() => ({}));
  return Number(j?.written ?? items.length);
}

/**
 * Lance la synchronisation complète. Appelle `onProgress` après chaque lot.
 * Nécessite une session admin active (token).
 */
export async function syncAllToSupabase(onProgress?: (p: SeedProgress) => void): Promise<SeedProgress> {
  const token = getAdminToken();
  if (!token) {
    const p = { total: 0, written: 0, phase: "Non authentifié admin", done: true, error: "Session admin requise" };
    onProgress?.(p);
    return p;
  }

  onProgress?.({ total: 0, written: 0, phase: "Collecte des données…", done: false });
  const all = await collectAll();
  const total = all.length;
  let written = 0;

  for (let i = 0; i < all.length; i += BATCH) {
    const chunk = all.slice(i, i + BATCH);
    try {
      written += await postBatch(chunk, token);
      onProgress?.({ total, written, phase: `Envoi ${written}/${total}…`, done: false });
    } catch (e) {
      const p: SeedProgress = {
        total, written, phase: "Erreur",
        done: true, error: e instanceof Error ? e.message : "Erreur d'envoi",
      };
      onProgress?.(p);
      return p;
    }
  }

  const final: SeedProgress = { total, written, phase: "Synchronisation terminée", done: true };
  onProgress?.(final);
  return final;
}
