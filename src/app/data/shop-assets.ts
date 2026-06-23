import { logger } from "../lib/logger";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";
/* ═══════════════════════════════════════════
   IPPOO - Branding boutique (Supabase Storage)
   - Upload logo/bannière en JPEG compressé vers le serveur
   - Le serveur stocke dans le bucket privé make-cc347259-shop-assets
   - Récupération via URL signées (1h), cache local en complément
   ═══════════════════════════════════════════ */

import { getAccessToken } from "../auth/supabase";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

const CACHE_KEY = "ippoo:shop-assets-cache";
const BASE = FUNCTIONS_BASE;

export type ShopAssets = {
  logo?: string;   // URL signée ou data URL fallback
  banner?: string;
  updatedAt?: number;
};

type CacheEntry = ShopAssets & { fetchedAt?: number };
type Cache = Record<string, CacheEntry>;
const SIGNED_TTL_MS = 50 * 60 * 1000; // signed URLs valident 1h, on rafraîchit à 50min

export function slugifyShopName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}

function loadCache(): Cache {
  try { return JSON.parse(safeGetItem(CACHE_KEY) || "{}") as Cache; } catch { return {}; }
}
function saveCache(c: Cache) {
  safeSetItem(CACHE_KEY, JSON.stringify(c));
  try { window.dispatchEvent(new Event("ippoo:shop-assets")); } catch { /* ignore */ }
}

/** Cache synchrone, utilisable pour le rendu immédiat. */
export function getShopAssets(shopId: string, shopName?: string): ShopAssets {
  const cache = loadCache();
  const a = cache[sanitizeKey(shopId)];
  if (a) return a;
  if (shopName) {
    const slug = slugifyShopName(shopName);
    if (cache[slug]) return cache[slug];
  }
  return {};
}

/** Fetch les assets depuis le serveur et met à jour le cache. */
export async function refreshShopAssets(key: string): Promise<ShopAssets> {
  const k = sanitizeKey(key);
  if (!k) return {};
  const cache = loadCache();
  const cached = cache[k];
  if (cached?.fetchedAt && Date.now() - cached.fetchedAt < SIGNED_TTL_MS) return cached;
  try {
    const res = await fetch(`${BASE}/shop-assets/${k}`, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) {
      logger.warn(`refreshShopAssets failed (${res.status}) for key=${k}`);
      return cached ?? {};
    }
    const remote = (await res.json()) as ShopAssets;
    const next: CacheEntry = { ...remote, fetchedAt: Date.now() };
    cache[k] = next;
    saveCache(cache);
    return next;
  } catch (e) {
    logger.warn(`refreshShopAssets error for key=${k}: ${e}`);
    return cached ?? {};
  }
}

/** Upload un asset (logo/banner) vers Supabase Storage via le serveur. */
export async function uploadShopAsset(key: string, kind: "logo" | "banner", dataUrl: string): Promise<string | null> {
  const k = sanitizeKey(key);
  if (!k) throw new Error("Clé boutique invalide");
  const token = await getAccessToken();
  if (!token) throw new Error("Connectez-vous pour modifier le branding de votre boutique");
  const res = await fetch(`${BASE}/shop-assets/${k}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ kind, dataUrl }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    logger.warn(`uploadShopAsset failed for key=${k} kind=${kind}: ${msg}`);
    throw new Error(msg);
  }
  const { url } = (await res.json()) as { url?: string };
  if (url) {
    const cache = loadCache();
    cache[k] = { ...cache[k], [kind]: url, fetchedAt: Date.now(), updatedAt: Date.now() };
    saveCache(cache);
  }
  return url ?? null;
}

export async function deleteShopAsset(key: string, kind: "logo" | "banner"): Promise<void> {
  const k = sanitizeKey(key);
  if (!k) return;
  const token = await getAccessToken();
  if (!token) throw new Error("Connectez-vous pour modifier votre boutique");
  const res = await fetch(`${BASE}/shop-assets/${k}/${kind}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    logger.warn(`deleteShopAsset failed for key=${k} kind=${kind}: HTTP ${res.status}`);
    throw new Error(`Suppression échouée (${res.status})`);
  }
  const cache = loadCache();
  if (cache[k]) {
    delete cache[k][kind];
    cache[k].fetchedAt = Date.now();
    saveCache(cache);
  }
}

/** Convertit un File en data URL compressée (JPEG q=0.82). */
export function fileToCompressedDataUrl(file: File, maxW = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponible"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
