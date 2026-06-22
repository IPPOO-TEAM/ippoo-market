/* ═══════════════════════════════════════════════════════════════
   IPPOO — Infrastructure partagée des modules de routes
   Centralise le client Supabase, les helpers d'authentification,
   le rate-limiting, le stockage (signed URLs, upload), le wallet,
   le web-push et l'audit. Chaque module de domaine importe d'ici.
   ═══════════════════════════════════════════════════════════════ */

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import * as kv from "./kv_store.tsx";

// ─── Constantes globales ───────────────────────────────────────
export const BUCKET = "make-cc347259-shop-assets";
export const PREFIX = "/make-server-cc347259";
export const MAX_UPLOAD = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const ALLOWED_DOC_MIME = new Set([...ALLOWED_IMAGE_MIME, "application/pdf"]);
export const COMMISSION_RATE = 0.08; // valeur de repli si aucun réglage configuré

// ─── Réglages plateforme (source unique de vérité, KV `platform:settings`) ─
// Commission, TVA, livraison, etc. Configurables par l'admin et lus par le
// serveur (split escrow/commission) ET le frontend (factures, checkout).
export type PlatformSettings = {
  commission: number;          // pourcentage (ex. 8)
  vatRate: number;             // pourcentage (ex. 18)
  shippingStd: number;
  shippingExpress: number;
  freeShippingThreshold: number;
  defaultCurrency: string;
  refundWindowDays: number;
};
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  commission: 8,
  vatRate: 18,
  shippingStd: 2500,
  shippingExpress: 5000,
  freeShippingThreshold: 50000,
  defaultCurrency: "XOF",
  refundWindowDays: 7,
};

let _settingsCache: PlatformSettings | null = null;
let _settingsAt = 0;
const SETTINGS_TTL = 30_000;

export async function getPlatformSettings(force = false): Promise<PlatformSettings> {
  if (!force && _settingsCache && Date.now() - _settingsAt < SETTINGS_TTL) return _settingsCache;
  try {
    const rec = await kv.get("platform:settings");
    _settingsCache = { ...DEFAULT_PLATFORM_SETTINGS, ...(rec ?? {}) };
  } catch {
    _settingsCache = { ...DEFAULT_PLATFORM_SETTINGS };
  }
  _settingsAt = Date.now();
  return _settingsCache;
}
export async function setPlatformSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const current = await getPlatformSettings(true);
  const next = { ...current, ...patch };
  await kv.set("platform:settings", next);
  _settingsCache = next;
  _settingsAt = Date.now();
  return next;
}
/** Taux de commission effectif (fraction, ex. 0.08). */
export async function getCommissionRate(): Promise<number> {
  const s = await getPlatformSettings();
  const pct = Number(s.commission);
  return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct / 100 : COMMISSION_RATE;
}

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export const ADMIN_EMAILS = new Set(
  (Deno.env.get("IPPOO_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// ─── Bootstrap bucket idempotent ───────────────────────────────
export function bootstrapBucket() {
  (async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) {
        const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
        if (error) console.log("Bucket create error:", error.message);
        else console.log("Bucket created:", BUCKET);
      }
    } catch (e) {
      console.log("Bucket bootstrap error:", e);
    }
  })();
}

// ─── Log sanitization ──────────────────────────────────────────
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function logSafe(label: string, value: string | undefined | null) {
  if (!value) return label;
  return `${label}=${await sha256(value)}`;
}

// ─── Rate limit en mémoire (par instance) ──────────────────────
const RL_BUCKETS = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = RL_BUCKETS.get(key);
  if (!b || b.reset < now) {
    RL_BUCKETS.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
export function clientKey(c: any, suffix: string): string {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  return `${ip}:${suffix}`;
}

// ─── Auth ──────────────────────────────────────────────────────
export async function requireUser(c: any): Promise<{ id: string; email?: string } | { error: string; status: 401 | 403 }> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return { error: "Authentification requise", status: 401 };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log(`Auth check failed: ${error?.message ?? "no user"}`);
    return { error: "Session invalide", status: 401 };
  }
  return { id: data.user.id, email: data.user.email ?? undefined };
}
export async function requireAdmin(c: any) {
  const u = await requireUser(c);
  if ("error" in u) return u;
  if (!u.email || !ADMIN_EMAILS.has(u.email.toLowerCase())) {
    return { error: "Accès admin requis", status: 403 as const };
  }
  return u;
}
export function isAdminEmail(email: string | undefined | null): boolean {
  return !!email && ADMIN_EMAILS.has(String(email).toLowerCase());
}

// ─── Stockage ──────────────────────────────────────────────────
export function sanitizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}
export async function signedFor(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
export function parseDataUrl(dataUrl: string, allowed: Set<string>): { mime: string; bin: Uint8Array } | { error: string; status: 400 | 413 | 415 } {
  const match = dataUrl.match(/^data:([a-z0-9/+.-]+);base64,(.+)$/i);
  if (!match) return { error: "dataUrl invalide", status: 400 };
  const mime = match[1].toLowerCase();
  if (!allowed.has(mime)) return { error: `Type non autorisé: ${mime}`, status: 415 };
  let bin: Uint8Array;
  try {
    bin = Uint8Array.from(atob(match[2]), (ch) => ch.charCodeAt(0));
  } catch {
    return { error: "base64 invalide", status: 400 };
  }
  if (bin.byteLength > MAX_UPLOAD) return { error: "Fichier trop lourd (>8Mo)", status: 413 };
  return { mime, bin };
}
export function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

// ─── Détection de table relationnelle (transition KV → Postgres) ─
// Cache de disponibilité des tables (par instance d'edge function).
const _tableCache = new Map<string, boolean>();
export async function tableReady(table: string): Promise<boolean> {
  const cached = _tableCache.get(table);
  if (cached !== undefined) return cached;
  try {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(1);
    const ok = !error || error.code !== "42P01";
    _tableCache.set(table, ok);
    if (!ok) console.log(`[db] table "${table}" absente — repli KV actif`);
    return ok;
  } catch (e) {
    console.log(`[db] tableReady(${table}) exception: ${e} — repli KV`);
    _tableCache.set(table, false);
    return false;
  }
}
export function resetTableCache(table?: string) {
  if (table) _tableCache.delete(table);
  else _tableCache.clear();
}

// ─── Wallet (helpers transverses) ──────────────────────────────
// Tables `wallets` (user_id pk, balance) et `wallet_transactions`.
// Repli KV (`wallet:<uid>`, `wallet-tx:<uid>:<ts>`) tant que la
// migration 0004 n'est pas appliquée.
export async function getBalance(userId: string): Promise<number> {
  if (await tableReady("wallets")) {
    const { data } = await supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
    return Number(data?.balance ?? 0);
  }
  const w = await kv.get(`wallet:${userId}`);
  return w?.balance ?? 0;
}
export async function creditWallet(userId: string, amount: number, reason: string, meta?: Record<string, unknown>) {
  const now = Date.now();
  if (await tableReady("wallets")) {
    const prev = await getBalance(userId);
    const balance = prev + amount;
    const { error } = await supabase.from("wallets").upsert({
      user_id: userId, balance, updated_at: new Date(now).toISOString(),
    });
    if (error) console.log(`wallets upsert error: ${error.message}`);
    const { error: e2 } = await supabase.from("wallet_transactions").insert({
      id: `${now}-${crypto.randomUUID().slice(0, 6)}`,
      user_id: userId, amount, reason, meta: meta ?? {}, at: new Date(now).toISOString(),
    });
    if (e2) console.log(`wallet_transactions insert error: ${e2.message}`);
    return balance;
  }
  const w = (await kv.get(`wallet:${userId}`)) ?? { balance: 0 };
  w.balance = (w.balance ?? 0) + amount;
  w.updatedAt = now;
  await kv.set(`wallet:${userId}`, w);
  await kv.set(`wallet-tx:${userId}:${now}-${crypto.randomUUID().slice(0, 6)}`, {
    amount, reason, meta: meta ?? {}, at: now,
  });
  return w.balance;
}

// ─── Web Push (VAPID) ──────────────────────────────────────────
export const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@ippoo.market";
let vapidReady = false;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidReady = true;
  } catch (e) {
    console.log("VAPID init failed:", (e as Error).message);
  }
} else {
  console.log("VAPID keys missing — push disabled");
}
export function isVapidReady() {
  return vapidReady;
}

export async function pushKeyForEndpoint(userId: string, endpoint: string) {
  return `push:${userId}:${await sha256(endpoint)}`;
}

export async function sendToUser(userId: string, payload: Record<string, unknown>) {
  if (!vapidReady) return { sent: 0, failed: 0 };
  const subs = (await kv.getByPrefix(`push:${userId}:`)) ?? [];
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (s: any) => {
    try {
      await webpush.sendNotification(s, JSON.stringify(payload));
      sent++;
    } catch (e: any) {
      failed++;
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await kv.del(await pushKeyForEndpoint(userId, s.endpoint));
      }
    }
  }));
  return { sent, failed };
}

// ─── Audit log (helper d'écriture) ─────────────────────────────
export async function auditLog(adminId: string, adminEmail: string | undefined | null, action: string, meta?: any) {
  try {
    const ts = Date.now();
    const id = `${ts}-${Math.random().toString(36).slice(2, 8)}`;
    if (await tableReady("audit_log")) {
      const { error } = await supabase.from("audit_log").insert({
        id, ts, admin_id: adminId, admin_email: adminEmail || null, action, meta: meta ?? null,
      });
      if (error) console.log(`audit_log insert error: ${error.message}`);
      return;
    }
    await kv.set(`audit:${ts}:${id}`, {
      id, ts, adminId, adminEmail: adminEmail || null, action, meta: meta ?? null,
    });
  } catch (e) {
    console.log("auditLog error", e);
  }
}
