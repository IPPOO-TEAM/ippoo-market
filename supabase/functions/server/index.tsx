import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const BUCKET = "make-cc347259-shop-assets";
const PREFIX = "/make-server-cc347259";
const MAX_UPLOAD = 8 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOC_MIME = new Set([...ALLOWED_IMAGE_MIME, "application/pdf"]);
const COMMISSION_RATE = 0.08;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ADMIN_EMAILS = new Set(
  (Deno.env.get("IPPOO_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// ── Bootstrap bucket idempotently ──────────────────────────────
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

// ─── Helpers : log sanitization ────────────────────────────────
async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function logSafe(label: string, value: string | undefined | null) {
  if (!value) return label;
  return `${label}=${await sha256(value)}`;
}

// ─── Rate limit in-memory (per instance) ───────────────────────
const RL_BUCKETS = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
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
function clientKey(c: any, suffix: string): string {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  return `${ip}:${suffix}`;
}

// ─── Auth ──────────────────────────────────────────────────────
async function requireUser(c: any): Promise<{ id: string; email?: string } | { error: string; status: 401 | 403 }> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return { error: "Authentification requise", status: 401 };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log(`Auth check failed: ${error?.message ?? "no user"}`);
    return { error: "Session invalide", status: 401 };
  }
  return { id: data.user.id, email: data.user.email ?? undefined };
}
async function requireAdmin(c: any) {
  const u = await requireUser(c);
  if ("error" in u) return u;
  if (!u.email || !ADMIN_EMAILS.has(u.email.toLowerCase())) {
    return { error: "Accès admin requis", status: 403 as const };
  }
  return u;
}

function sanitizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}
async function signedFor(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
function parseDataUrl(dataUrl: string, allowed: Set<string>): { mime: string; bin: Uint8Array } | { error: string; status: 400 | 413 | 415 } {
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
function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ─── Signup ────────────────────────────────────────────────────
const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
});

app.post(`${PREFIX}/signup`, async (c) => {
  if (!rateLimit(clientKey(c, "signup"), 5, 60_000)) {
    return c.json({ error: "Trop de tentatives, réessayez dans 1 min." }, 429);
  }
  try {
    const parsed = SignupSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Champs invalides", details: parsed.error.flatten() }, 400);
    const { email, password, name } = parsed.data;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || "" },
      email_confirm: true,
    });
    if (error) {
      console.log(`Signup error ${await logSafe("email", email)}: ${error.message}`);
      return c.json({ error: "Impossible de créer le compte" }, 400);
    }
    return c.json({ ok: true, userId: data.user?.id });
  } catch (e) {
    console.log(`Signup exception: ${e}`);
    return c.json({ error: `Erreur serveur signup` }, 500);
  }
});

// ─── Shop assets ───────────────────────────────────────────────
const ShopAssetPutSchema = z.object({
  kind: z.enum(["logo", "banner"]),
  dataUrl: z.string().min(20),
});

app.get(`${PREFIX}/shop-assets/:key`, async (c) => {
  const key = sanitizeKey(c.req.param("key"));
  if (!key) return c.json({ error: "Clé invalide" }, 400);
  const meta = await kv.get(`shop-assets:${key}`);
  if (!meta) return c.json({});
  const out: { logo?: string; banner?: string; updatedAt?: number } = { updatedAt: meta.updatedAt };
  if (meta.logoPath) out.logo = (await signedFor(meta.logoPath)) ?? undefined;
  if (meta.bannerPath) out.banner = (await signedFor(meta.bannerPath)) ?? undefined;
  return c.json(out);
});

app.put(`${PREFIX}/shop-assets/:key`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(`upload:${auth.id}`, 20, 60_000)) return c.json({ error: "Trop d'uploads" }, 429);
    const key = sanitizeKey(c.req.param("key"));
    if (!key) return c.json({ error: "Clé invalide" }, 400);
    const existing = (await kv.get(`shop-assets:${key}`)) ?? {};
    if (existing.ownerId && existing.ownerId !== auth.id) {
      console.log(`Ownership denied key=${key} ${await logSafe("caller", auth.id)}`);
      return c.json({ error: "Cette boutique appartient à un autre vendeur" }, 403);
    }
    const parsed = ShopAssetPutSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
    const file = parseDataUrl(parsed.data.dataUrl, ALLOWED_IMAGE_MIME);
    if ("error" in file) return c.json({ error: file.error }, file.status);
    const path = `${key}/${parsed.data.kind}.${extFromMime(file.mime)}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file.bin, {
      contentType: file.mime,
      upsert: true,
    });
    if (upErr) {
      console.log(`Upload error ${path}: ${upErr.message}`);
      return c.json({ error: `Upload échoué` }, 500);
    }
    const meta = { ...existing, [`${parsed.data.kind}Path`]: path, ownerId: auth.id, updatedAt: Date.now() };
    await kv.set(`shop-assets:${key}`, meta);
    const signed = await signedFor(path);
    return c.json({ ok: true, kind: parsed.data.kind, url: signed });
  } catch (e) {
    console.log(`shop-assets PUT error: ${e}`);
    return c.json({ error: `Erreur serveur` }, 500);
  }
});

app.delete(`${PREFIX}/shop-assets/:key/:kind`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const key = sanitizeKey(c.req.param("key"));
    const kind = c.req.param("kind");
    if (!key || (kind !== "logo" && kind !== "banner")) return c.json({ error: "Paramètres invalides" }, 400);
    const meta = (await kv.get(`shop-assets:${key}`)) ?? {};
    if (meta.ownerId && meta.ownerId !== auth.id) {
      return c.json({ error: "Cette boutique appartient à un autre vendeur" }, 403);
    }
    const path = meta[`${kind}Path`];
    if (path) {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) console.log(`Delete storage error: ${error.message}`);
    }
    delete meta[`${kind}Path`];
    meta.updatedAt = Date.now();
    await kv.set(`shop-assets:${key}`, meta);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`shop-assets DELETE error: ${e}`);
    return c.json({ error: `Erreur serveur` }, 500);
  }
});

// ─── User files ────────────────────────────────────────────────
const ALLOWED_KINDS = new Set(["avatar", "kyc-id", "kyc-rccm", "kyc-ifu", "kyc-shop", "logo", "shop-photo", "certificate"]);
const UserFilePutSchema = z.object({ dataUrl: z.string().min(20) });

app.get(`${PREFIX}/user-files/:kind`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const kind = c.req.param("kind");
    if (!ALLOWED_KINDS.has(kind)) return c.json({ error: "Type non autorisé" }, 400);
    const meta = await kv.get(`user-files:${auth.id}:${kind}`);
    if (!meta?.path) return c.json({});
    const url = await signedFor(meta.path);
    return c.json({ url, updatedAt: meta.updatedAt });
  } catch (e) {
    console.log(`user-files GET error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.put(`${PREFIX}/user-files/:kind`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(`upload:${auth.id}`, 20, 60_000)) return c.json({ error: "Trop d'uploads" }, 429);
    const kind = c.req.param("kind");
    if (!ALLOWED_KINDS.has(kind)) return c.json({ error: "Type non autorisé" }, 400);
    const parsed = UserFilePutSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "dataUrl requis" }, 400);
    const allowed = kind.startsWith("kyc-") || kind === "certificate" ? ALLOWED_DOC_MIME : ALLOWED_IMAGE_MIME;
    const file = parseDataUrl(parsed.data.dataUrl, allowed);
    if ("error" in file) return c.json({ error: file.error }, file.status);
    const path = `users/${auth.id}/${kind}.${extFromMime(file.mime)}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file.bin, { contentType: file.mime, upsert: true });
    if (upErr) {
      console.log(`user-files upload error ${path}: ${upErr.message}`);
      return c.json({ error: `Upload échoué` }, 500);
    }
    await kv.set(`user-files:${auth.id}:${kind}`, { path, updatedAt: Date.now() });
    const url = await signedFor(path);
    return c.json({ ok: true, url });
  } catch (e) {
    console.log(`user-files PUT error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.delete(`${PREFIX}/user-files/:kind`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const kind = c.req.param("kind");
    if (!ALLOWED_KINDS.has(kind)) return c.json({ error: "Type non autorisé" }, 400);
    const meta = await kv.get(`user-files:${auth.id}:${kind}`);
    if (meta?.path) {
      const { error } = await supabase.storage.from(BUCKET).remove([meta.path]);
      if (error) console.log(`user-files delete storage error: ${error.message}`);
    }
    await kv.del(`user-files:${auth.id}:${kind}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`user-files DELETE error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

// ─── User-KV ───────────────────────────────────────────────────
const ALLOWED_USER_KV = new Set(["addresses", "team", "preferences", "security"]);
const KvPutSchema = z.object({ value: z.unknown() });

app.get(`${PREFIX}/user-kv/:key`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const key = c.req.param("key");
    if (!ALLOWED_USER_KV.has(key)) return c.json({ error: "Clé non autorisée" }, 400);
    const value = await kv.get(`user-kv:${auth.id}:${key}`);
    return c.json({ value: value ?? null });
  } catch (e) {
    console.log(`user-kv GET error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.put(`${PREFIX}/user-kv/:key`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const key = c.req.param("key");
    if (!ALLOWED_USER_KV.has(key)) return c.json({ error: "Clé non autorisée" }, 400);
    const parsed = KvPutSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "value manquant" }, 400);
    const json = JSON.stringify(parsed.data.value);
    if (json.length > 256 * 1024) return c.json({ error: "Trop volumineux (>256Ko)" }, 413);
    await kv.set(`user-kv:${auth.id}:${key}`, parsed.data.value);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`user-kv PUT error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

// ─── Public vendors ────────────────────────────────────────────
const VENDOR_PREFIX = "vendors:public:";
const VENDOR_MAX_BYTES = 32 * 1024;
const VendorPublicSchema = z.object({
  value: z.object({
    name: z.string().min(2).max(120),
    city: z.string().max(120).optional(),
    niche: z.string().max(60).optional(),
    description: z.string().max(2000).optional(),
  }).passthrough(),
});

app.get(`${PREFIX}/vendors/public`, async (c) => {
  try {
    const items = await kv.getByPrefix(VENDOR_PREFIX);
    return c.json({ items: items ?? [] });
  } catch (e) {
    console.log(`vendors/public GET error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.put(`${PREFIX}/vendors/public/me`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = VendorPublicSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Profil invalide", details: parsed.error.flatten() }, 400);
    const json = JSON.stringify(parsed.data.value);
    if (json.length > VENDOR_MAX_BYTES) return c.json({ error: "Profil trop volumineux (>32Ko)" }, 413);
    const record = { ...parsed.data.value, ownerId: auth.id, updatedAt: Date.now() };
    await kv.set(`${VENDOR_PREFIX}${auth.id}`, record);
    return c.json({ ok: true, ownerId: auth.id });
  } catch (e) {
    console.log(`vendors/public PUT error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.delete(`${PREFIX}/vendors/public/me`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    await kv.del(`${VENDOR_PREFIX}${auth.id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`vendors/public DELETE error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

// ─── Public products (catalogue vendeurs cross-utilisateurs) ──
// Chaque produit publié par un vendeur est stocké à la clé
// `products:public:<ownerId>:<productId>`. Tous les utilisateurs peuvent
// lister via GET ; seul le propriétaire (auth.id) peut PUT/DELETE
// les siens, garantissant qu'un vendeur ne peut pas modifier la fiche
// d'un autre. Cela alimente le comparateur de prix cross-plateforme.
const PRODUCT_PREFIX = "products:public:";
const PRODUCT_MAX_BYTES = 96 * 1024;
const PRODUCT_ID_RE = /^[A-Z0-9-]{3,40}$/;
const ProductPublicSchema = z.object({
  value: z.object({
    name: z.string().min(2).max(200),
    price: z.number().nonnegative(),
    unit: z.string().max(40).optional(),
    moq: z.number().nonnegative().optional(),
    category: z.string().max(80).optional(),
    image: z.string().max(2048).optional(),
    brand: z.string().max(120).optional(),
    description: z.string().max(4000).optional(),
    stockQty: z.number().nonnegative().optional(),
    shopSlug: z.string().max(120).optional(),
  }).passthrough(),
});

app.get(`${PREFIX}/products/public`, async (c) => {
  try {
    const items = await kv.getByPrefix(PRODUCT_PREFIX);
    return c.json({ items: items ?? [] });
  } catch (e) {
    console.log(`products/public GET error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.put(`${PREFIX}/products/public/me/:productId`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const productId = c.req.param("productId");
    if (!PRODUCT_ID_RE.test(productId)) return c.json({ error: "productId invalide" }, 400);
    const parsed = ProductPublicSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Produit invalide", details: parsed.error.flatten() }, 400);
    const json = JSON.stringify(parsed.data.value);
    if (json.length > PRODUCT_MAX_BYTES) return c.json({ error: "Produit trop volumineux (>96Ko)" }, 413);
    const record = { ...parsed.data.value, id: productId, ownerId: auth.id, updatedAt: Date.now() };
    await kv.set(`${PRODUCT_PREFIX}${auth.id}:${productId}`, record);
    return c.json({ ok: true, product: record });
  } catch (e) {
    console.log(`products/public PUT error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.delete(`${PREFIX}/products/public/me/:productId`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const productId = c.req.param("productId");
    if (!PRODUCT_ID_RE.test(productId)) return c.json({ error: "productId invalide" }, 400);
    await kv.del(`${PRODUCT_PREFIX}${auth.id}:${productId}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`products/public DELETE error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

// ─── Public groups (achat groupé) ─────────────────────────────
// Each group is stored at `groups:public:<groupId>` so that any user can
// discover and join open groups across devices. Only the organizer (the
// owner of `value.organizerId` matching the auth user id) can upsert/delete
// a group. Participant joins are accepted as long as the caller is just
// appending themselves — full-rewrite by the organizer is also allowed.
const GROUP_PREFIX = "groups:public:";
const GROUP_MAX_BYTES = 64 * 1024;
const GROUP_ID_RE = /^GRP-[A-Z0-9-]{3,40}$/;
const GroupPublicSchema = z.object({
  value: z.object({
    id: z.string().regex(GROUP_ID_RE),
    name: z.string().min(1).max(160),
    product: z.string().min(1).max(160),
    organizerId: z.string().min(1).max(80),
    participants: z.array(z.object({ id: z.string().max(80) }).passthrough()).max(100),
  }).passthrough(),
});

app.get(`${PREFIX}/groups/public`, async (c) => {
  try {
    const items = await kv.getByPrefix(GROUP_PREFIX);
    return c.json({ items: items ?? [] });
  } catch (e) {
    console.log(`groups/public GET error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.put(`${PREFIX}/groups/public/:id`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!GROUP_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const parsed = GroupPublicSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Groupement invalide", details: parsed.error.flatten() }, 400);
    if (parsed.data.value.id !== id) return c.json({ error: "Identifiant incohérent" }, 400);
    const json = JSON.stringify(parsed.data.value);
    if (json.length > GROUP_MAX_BYTES) return c.json({ error: "Groupement trop volumineux (>64Ko)" }, 413);
    const existing = await kv.get(`${GROUP_PREFIX}${id}`);
    const next = parsed.data.value;
    if (existing && existing.organizerId && existing.organizerId !== next.organizerId) {
      return c.json({ error: "Organisateur immuable" }, 403);
    }
    if (existing && existing.organizerId !== auth.id) {
      // Caller is not the organizer : allow only join-like changes
      // (add/update their own participant entry, leave everything else intact).
      const sameMeta =
        existing.name === next.name &&
        existing.product === next.product &&
        existing.priceNormal === next.priceNormal &&
        existing.targetQty === next.targetQty &&
        existing.maxParticipants === next.maxParticipants &&
        existing.expiresAt === next.expiresAt &&
        existing.status === next.status;
      if (!sameMeta) return c.json({ error: "Seul l'organisateur peut éditer le groupement" }, 403);
      const others = (existing.participants ?? []).filter((p: any) => p.id !== auth.id);
      const proposedOthers = (next.participants ?? []).filter((p: any) => p.id !== auth.id);
      if (JSON.stringify(others) !== JSON.stringify(proposedOthers)) {
        return c.json({ error: "Vous ne pouvez modifier que votre propre participation" }, 403);
      }
    } else if (!existing && next.organizerId !== auth.id) {
      return c.json({ error: "L'organisateur doit être l'auteur" }, 403);
    }
    await kv.set(`${GROUP_PREFIX}${id}`, next);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`groups/public PUT error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

app.delete(`${PREFIX}/groups/public/:id`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!GROUP_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const existing = await kv.get(`${GROUP_PREFIX}${id}`);
    if (!existing) return c.json({ ok: true });
    if (existing.organizerId !== auth.id) return c.json({ error: "Seul l'organisateur peut supprimer" }, 403);
    await kv.del(`${GROUP_PREFIX}${id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`groups/public DELETE error: ${e}`);
    return c.json({ error: `Erreur` }, 500);
  }
});

// ─── DEVIS (Request-For-Quote, buyer ↔ vendors) ────────────────
// Modèle : un devis appartient à `buyerId`, cible une liste `targetVendorIds`,
// et accumule des `responses` produites par chacun des vendeurs ciblés.
// Indexation : on stocke un seul enregistrement par devis sous la clé
// `devis:<id>`. Les listages utilisent kv.getByPrefix puis filtrent en mémoire
// (volume attendu modéré ; suffisant pour la phase actuelle).
const DEVIS_PREFIX = "devis:";
const DEVIS_MAX_BYTES = 96 * 1024;
const DEVIS_ID_RE = /^DEV-[A-Z0-9-]{3,40}$/;

const DevisProductSchema = z.object({
  name: z.string().min(1).max(200),
  qty: z.number().nonnegative(),
  unit: z.string().min(1).max(40),
});
const DevisResponseSchema = z.object({
  id: z.string().min(1).max(80),
  vendorId: z.string().min(1).max(80),
  vendorName: z.string().min(1).max(160),
  price: z.number().nonnegative(),
  leadTime: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    name: z.string().max(200),
    qty: z.number().nonnegative(),
    unitPrice: z.number().nonnegative(),
  })).max(50).optional(),
  createdAt: z.number().int().nonnegative(),
});
const DevisCreateSchema = z.object({
  id: z.string().regex(DEVIS_ID_RE),
  products: z.array(DevisProductSchema).min(1).max(20),
  targetVendorIds: z.array(z.string().min(1).max(80)).max(50),
  deadline: z.string().max(40).optional(),
  location: z.string().max(160).optional(),
  notes: z.string().max(2000).optional(),
});

type DevisRecord = {
  id: string;
  buyerId: string;
  products: { name: string; qty: number; unit: string }[];
  targetVendorIds: string[];
  deadline?: string;
  location?: string;
  notes?: string;
  responses: z.infer<typeof DevisResponseSchema>[];
  status: "open" | "accepted" | "cancelled";
  acceptedResponseId?: string;
  createdAt: number;
  updatedAt: number;
};

function canRead(d: DevisRecord, userId: string): boolean {
  return d.buyerId === userId || d.targetVendorIds.includes(userId);
}

app.post(`${PREFIX}/devis`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = DevisCreateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Devis invalide", details: parsed.error.flatten() }, 400);
    const existing = await kv.get(`${DEVIS_PREFIX}${parsed.data.id}`);
    if (existing) return c.json({ error: "Identifiant déjà utilisé" }, 409);
    const now = Date.now();
    const record: DevisRecord = {
      ...parsed.data,
      buyerId: auth.id,
      responses: [],
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    if (JSON.stringify(record).length > DEVIS_MAX_BYTES) {
      return c.json({ error: "Devis trop volumineux (>96Ko)" }, 413);
    }
    await kv.set(`${DEVIS_PREFIX}${record.id}`, record);
    return c.json({ ok: true, devis: record });
  } catch (e) {
    console.log(`devis POST error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.get(`${PREFIX}/devis/mine`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const all = (await kv.getByPrefix(DEVIS_PREFIX)) as DevisRecord[];
    const mine = (all ?? []).filter((d) => d?.buyerId === auth.id);
    return c.json({ items: mine });
  } catch (e) {
    console.log(`devis/mine GET error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.get(`${PREFIX}/devis/inbox`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const all = (await kv.getByPrefix(DEVIS_PREFIX)) as DevisRecord[];
    const inbox = (all ?? []).filter((d) => d?.targetVendorIds?.includes(auth.id));
    return c.json({ items: inbox });
  } catch (e) {
    console.log(`devis/inbox GET error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.get(`${PREFIX}/devis/:id`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const rec = (await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord | null;
    if (!rec) return c.json({ error: "Introuvable" }, 404);
    if (!canRead(rec, auth.id)) return c.json({ error: "Accès refusé" }, 403);
    return c.json({ devis: rec });
  } catch (e) {
    console.log(`devis GET error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.post(`${PREFIX}/devis/:id/respond`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const rec = (await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord | null;
    if (!rec) return c.json({ error: "Introuvable" }, 404);
    if (rec.status !== "open") return c.json({ error: "Devis clôturé" }, 409);
    if (!rec.targetVendorIds.includes(auth.id)) {
      return c.json({ error: "Vous n'êtes pas destinataire de ce devis" }, 403);
    }
    const parsed = DevisResponseSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Réponse invalide", details: parsed.error.flatten() }, 400);
    if (parsed.data.vendorId !== auth.id) return c.json({ error: "vendorId doit être l'auteur" }, 403);
    // Remplace une éventuelle réponse précédente du même vendeur (édition).
    const responses = rec.responses.filter((r) => r.vendorId !== auth.id).concat(parsed.data);
    const next: DevisRecord = { ...rec, responses, updatedAt: Date.now() };
    if (JSON.stringify(next).length > DEVIS_MAX_BYTES) {
      return c.json({ error: "Devis trop volumineux après réponse (>96Ko)" }, 413);
    }
    await kv.set(`${DEVIS_PREFIX}${id}`, next);
    return c.json({ ok: true, devis: next });
  } catch (e) {
    console.log(`devis respond error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.post(`${PREFIX}/devis/:id/accept`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const rec = (await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord | null;
    if (!rec) return c.json({ error: "Introuvable" }, 404);
    if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut accepter" }, 403);
    if (rec.status !== "open") return c.json({ error: "Devis déjà clôturé" }, 409);
    const body = await c.req.json().catch(() => ({})) as { responseId?: string };
    const responseId = String(body?.responseId ?? "");
    if (!rec.responses.some((r) => r.id === responseId)) {
      return c.json({ error: "responseId introuvable" }, 400);
    }
    const next: DevisRecord = { ...rec, status: "accepted", acceptedResponseId: responseId, updatedAt: Date.now() };
    await kv.set(`${DEVIS_PREFIX}${id}`, next);
    return c.json({ ok: true, devis: next });
  } catch (e) {
    console.log(`devis accept error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.post(`${PREFIX}/devis/:id/cancel`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const rec = (await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord | null;
    if (!rec) return c.json({ error: "Introuvable" }, 404);
    if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut annuler" }, 403);
    if (rec.status !== "open") return c.json({ error: "Déjà clôturé" }, 409);
    const next: DevisRecord = { ...rec, status: "cancelled", updatedAt: Date.now() };
    await kv.set(`${DEVIS_PREFIX}${id}`, next);
    return c.json({ ok: true, devis: next });
  } catch (e) {
    console.log(`devis cancel error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

app.delete(`${PREFIX}/devis/:id`, async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const id = c.req.param("id");
    if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
    const rec = (await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord | null;
    if (!rec) return c.json({ ok: true });
    if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut supprimer" }, 403);
    await kv.del(`${DEVIS_PREFIX}${id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`devis DELETE error: ${e}`);
    return c.json({ error: "Erreur" }, 500);
  }
});

// ─── PIN (server-side hash + lock) ─────────────────────────────
const PinSetSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });
const PinVerifySchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

async function hashPin(pin: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

app.get(`${PREFIX}/pin/status`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const rec = await kv.get(`pin:${auth.id}`);
  return c.json({ hasPin: !!rec?.hash, lockedUntil: rec?.lockedUntil ?? 0 });
});

app.put(`${PREFIX}/pin`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = PinSetSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "PIN invalide (4 à 6 chiffres)" }, 400);
  const salt = crypto.randomUUID();
  const hash = await hashPin(parsed.data.pin, salt);
  await kv.set(`pin:${auth.id}`, { salt, hash, failures: 0, lockedUntil: 0, updatedAt: Date.now() });
  return c.json({ ok: true });
});

app.post(`${PREFIX}/pin/verify`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  if (!rateLimit(`pin:${auth.id}`, 10, 60_000)) return c.json({ error: "Trop de tentatives" }, 429);
  const parsed = PinVerifySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "PIN invalide" }, 400);
  const rec = await kv.get(`pin:${auth.id}`);
  if (!rec?.hash) return c.json({ error: "Aucun PIN configuré" }, 404);
  const now = Date.now();
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return c.json({ error: "PIN verrouillé", lockedUntil: rec.lockedUntil }, 423);
  }
  const hash = await hashPin(parsed.data.pin, rec.salt);
  if (hash !== rec.hash) {
    const failures = (rec.failures ?? 0) + 1;
    const lockedUntil = failures >= 5 ? now + 15 * 60_000 : 0;
    await kv.set(`pin:${auth.id}`, { ...rec, failures, lockedUntil });
    return c.json({ error: "PIN incorrect", remaining: Math.max(0, 5 - failures), lockedUntil }, 401);
  }
  await kv.set(`pin:${auth.id}`, { ...rec, failures: 0, lockedUntil: 0 });
  return c.json({ ok: true });
});

// ─── Wallet ────────────────────────────────────────────────────
async function getBalance(userId: string): Promise<number> {
  const w = await kv.get(`wallet:${userId}`);
  return w?.balance ?? 0;
}
async function creditWallet(userId: string, amount: number, reason: string, meta?: Record<string, unknown>) {
  const w = (await kv.get(`wallet:${userId}`)) ?? { balance: 0 };
  w.balance = (w.balance ?? 0) + amount;
  w.updatedAt = Date.now();
  await kv.set(`wallet:${userId}`, w);
  await kv.set(`wallet-tx:${userId}:${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, {
    amount, reason, meta: meta ?? {}, at: Date.now(),
  });
  return w.balance;
}

app.get(`${PREFIX}/wallet`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const balance = await getBalance(auth.id);
  const txs = await kv.getByPrefix(`wallet-tx:${auth.id}:`);
  return c.json({ balance, transactions: txs ?? [] });
});

const WalletCreditSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-10_000_000).max(10_000_000),
  reason: z.string().max(120),
});

app.post(`${PREFIX}/wallet/credit`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = WalletCreditSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
  const balance = await creditWallet(parsed.data.userId, parsed.data.amount, parsed.data.reason, { by: auth.id });
  await auditLog(auth.id, auth.email, "wallet.credit", { userId: parsed.data.userId, amount: parsed.data.amount, reason: parsed.data.reason });
  return c.json({ ok: true, balance });
});

// ─── Orders + escrow + commission split ────────────────────────
const OrderItemSchema = z.object({
  productId: z.string().min(1).max(80),
  vendorId: z.string().min(1).max(120),
  title: z.string().max(200),
  unitPrice: z.number().int().min(0).max(50_000_000),
  qty: z.number().int().min(1).max(999),
});
const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  shippingAddress: z.object({
    name: z.string().max(120),
    phone: z.string().max(40),
    city: z.string().max(80),
    line1: z.string().max(200),
    line2: z.string().max(200).optional(),
  }),
  paymentMethod: z.enum(["wallet", "cod", "card", "mobile-money"]),
});

function newOrderId(): string {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `ORD-${Date.now().toString(36).toUpperCase()}-${hex.toUpperCase()}`;
}

app.get(`${PREFIX}/orders`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = await kv.getByPrefix(`order:${auth.id}:`);
  return c.json({ items: items ?? [] });
});

app.post(`${PREFIX}/orders`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  if (!rateLimit(`order:${auth.id}`, 10, 60_000)) return c.json({ error: "Trop de commandes" }, 429);
  const parsed = OrderCreateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Commande invalide", details: parsed.error.flatten() }, 400);
  const { items, shippingAddress, paymentMethod } = parsed.data;
  const total = items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  if (total <= 0) return c.json({ error: "Total invalide" }, 400);

  if (paymentMethod === "wallet") {
    const balance = await getBalance(auth.id);
    if (balance < total) return c.json({ error: "Solde insuffisant", balance }, 402);
    await creditWallet(auth.id, -total, "order:debit", { });
  }

  const vendorShares: Record<string, number> = {};
  for (const it of items) {
    const gross = it.unitPrice * it.qty;
    const net = Math.round(gross * (1 - COMMISSION_RATE));
    vendorShares[it.vendorId] = (vendorShares[it.vendorId] ?? 0) + net;
  }

  const orderId = newOrderId();
  const now = Date.now();
  const order = {
    id: orderId,
    userId: auth.id,
    items, shippingAddress, paymentMethod,
    total,
    commission: total - Object.values(vendorShares).reduce((a, b) => a + b, 0),
    vendorShares,
    status: "pending" as const,
    escrowStatus: "held" as const,
    createdAt: now, updatedAt: now,
  };
  await kv.set(`order:${auth.id}:${orderId}`, order);
  await kv.set(`escrow:${orderId}`, { orderId, userId: auth.id, vendorShares, total, status: "held", at: now });
  for (const vendorId of Object.keys(vendorShares)) {
    await kv.set(`order-by-vendor:${vendorId}:${orderId}`, { orderId, userId: auth.id, share: vendorShares[vendorId], at: now });
  }
  console.log(`order:created id=${orderId} ${await logSafe("user", auth.id)} total=${total}`);
  // Push de confirmation (fire-and-forget)
  sendToUser(auth.id, {
    title: "Commande confirmée",
    body: `Votre commande ${orderId} a été enregistrée (${total.toLocaleString("fr-FR")} FCFA).`,
    link: `/commandes/${orderId}`,
    tag: `order-${orderId}`,
    priority: "high",
  }).catch(() => { /* ignore */ });
  return c.json({ ok: true, order });
});

app.get(`${PREFIX}/orders/:orderId`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const order = await kv.get(`order:${auth.id}:${c.req.param("orderId")}`);
  if (!order) return c.json({ error: "Commande introuvable" }, 404);
  return c.json({ order });
});

app.get(`${PREFIX}/vendor/orders`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const idx = (await kv.getByPrefix(`order-by-vendor:${auth.id}:`)) ?? [];
  const orders = await Promise.all(
    idx.map(async (i: any) => {
      const o = await kv.get(`order:${i.userId}:${i.orderId}`);
      if (!o) return null;
      return {
        ...o,
        items: (o.items as any[]).filter((it) => it.vendorId === auth.id),
        vendorShare: i.share,
      };
    })
  );
  const items = orders.filter(Boolean).sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items });
});

// ─── Admin: liste de toutes les commandes ──────────────────────
app.get(`${PREFIX}/admin/orders`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("order:")) ?? [];
  items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items });
});

// ─── Mise à jour du statut d'une commande ──────────────────────
// Permet à un admin OU à un vendeur partie prenante de faire avancer
// la commande (preparation → expedition → livree → cloturee), ou de
// l'annuler. La synchronisation est propagée à l'index escrow et aux
// indexes vendeur.
const OrderStatusSchema = z.object({
  orderId: z.string().min(4).max(80),
  userId: z.string().uuid().optional(),
  status: z.enum(["preparation", "expedition", "livree", "cloturee", "litige", "annulee", "pending"]),
});

app.post(`${PREFIX}/orders/status`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = OrderStatusSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
  const isAdmin = !!auth.email && ADMIN_EMAILS.has(auth.email.toLowerCase());
  const userId = parsed.data.userId || auth.id;
  const order: any = await kv.get(`order:${userId}:${parsed.data.orderId}`);
  if (!order) return c.json({ error: "Commande introuvable" }, 404);
  const isOwner = order.userId === auth.id;
  const isVendor = !!order.vendorShares && Object.keys(order.vendorShares).includes(auth.id);
  if (!isAdmin && !isVendor && !isOwner) return c.json({ error: "Accès refusé" }, 403);
  if (!isAdmin && !isVendor && parsed.data.status !== "annulee") {
    return c.json({ error: "Acheteur peut seulement annuler" }, 403);
  }
  order.status = parsed.data.status;
  order.updatedAt = Date.now();
  await kv.set(`order:${userId}:${parsed.data.orderId}`, order);
  if (isAdmin) {
    await auditLog(auth.id, auth.email, "order.status", { orderId: parsed.data.orderId, status: parsed.data.status });
  }
  sendToUser(order.userId, {
    title: "Commande mise à jour",
    body: `Votre commande ${parsed.data.orderId} est maintenant: ${parsed.data.status}.`,
    link: `/commandes/${parsed.data.orderId}`,
    tag: `order-${parsed.data.orderId}`,
  }).catch(() => {});
  return c.json({ ok: true, order });
});

// ─── Admin: escrow release ─────────────────────────────────────
const EscrowReleaseSchema = z.object({ orderId: z.string().min(4).max(80) });

app.get(`${PREFIX}/admin/escrow/held`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const all = await kv.getByPrefix("escrow:");
  const items = (all ?? []).filter((e: any) => e?.status === "held");
  return c.json({ items });
});

app.post(`${PREFIX}/admin/escrow/release`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = EscrowReleaseSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "orderId requis" }, 400);
  const esc = await kv.get(`escrow:${parsed.data.orderId}`);
  if (!esc) return c.json({ error: "Escrow introuvable" }, 404);
  if (esc.status !== "held") return c.json({ error: `Escrow déjà ${esc.status}` }, 409);
  for (const [vendorId, share] of Object.entries(esc.vendorShares as Record<string, number>)) {
    await creditWallet(vendorId, share, "escrow:release", { orderId: esc.orderId });
  }
  esc.status = "released";
  esc.releasedAt = Date.now();
  await kv.set(`escrow:${esc.orderId}`, esc);
  const order = await kv.get(`order:${esc.userId}:${esc.orderId}`);
  if (order) {
    order.escrowStatus = "released";
    order.status = "completed";
    order.updatedAt = Date.now();
    await kv.set(`order:${esc.userId}:${esc.orderId}`, order);
  }
  await auditLog(auth.id, auth.email, "escrow.release", { orderId: esc.orderId, total: Object.values(esc.vendorShares as Record<string, number>).reduce((a, b) => a + b, 0) });
  return c.json({ ok: true });
});

// ─── KYC ───────────────────────────────────────────────────────
const KycDecisionSchema = z.object({
  userId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).optional(),
});

app.get(`${PREFIX}/kyc/me`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const rec = await kv.get(`kyc:${auth.id}`);
  return c.json({ kyc: rec ?? { status: "pending" } });
});

app.get(`${PREFIX}/admin/kyc/pending`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const all = await kv.getByPrefix("kyc:");
  const pending = (all ?? []).filter((k: any) => k?.status === "pending" || !k?.status);
  return c.json({ items: pending });
});

app.post(`${PREFIX}/admin/kyc/decision`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = KycDecisionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
  const rec = (await kv.get(`kyc:${parsed.data.userId}`)) ?? { userId: parsed.data.userId };
  rec.status = parsed.data.decision;
  rec.reason = parsed.data.reason ?? "";
  rec.decidedAt = Date.now();
  rec.decidedBy = auth.id;
  await kv.set(`kyc:${parsed.data.userId}`, rec);
  return c.json({ ok: true, kyc: rec });
});

// ─── Web Push (VAPID) ──────────────────────────────────────────
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
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

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  expirationTime: z.number().nullable().optional(),
});
const PushSendSchema = z.object({
  userId: z.string().min(1).optional(),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  link: z.string().max(300).optional(),
  tag: z.string().max(80).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

async function pushKeyForEndpoint(userId: string, endpoint: string) {
  return `push:${userId}:${await sha256(endpoint)}`;
}

async function sendToUser(userId: string, payload: Record<string, unknown>) {
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

app.get(`${PREFIX}/push/vapid-public`, (c) => c.json({ key: VAPID_PUBLIC }));

app.post(`${PREFIX}/push/subscribe`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  if (!rateLimit(clientKey(c, `push-sub:${auth.id}`), 20, 60_000)) {
    return c.json({ error: "Trop de requêtes" }, 429);
  }
  const parsed = SubscriptionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Abonnement invalide" }, 400);
  const sub = parsed.data;
  const key = await pushKeyForEndpoint(auth.id, sub.endpoint);
  await kv.set(key, { ...sub, userId: auth.id, ts: Date.now() });
  return c.json({ ok: true });
});

app.post(`${PREFIX}/push/unsubscribe`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return c.json({ error: "Endpoint manquant" }, 400);
  await kv.del(await pushKeyForEndpoint(auth.id, endpoint));
  return c.json({ ok: true });
});

// Test perso : l'utilisateur s'envoie un push à lui-même
app.post(`${PREFIX}/push/self`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  if (!rateLimit(clientKey(c, `push-self:${auth.id}`), 5, 60_000)) {
    return c.json({ error: "Trop de requêtes" }, 429);
  }
  const parsed = PushSendSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Payload invalide" }, 400);
  const r = await sendToUser(auth.id, parsed.data);
  return c.json({ ok: true, ...r });
});

// Admin : push vers n'importe quel utilisateur
app.post(`${PREFIX}/admin/push/send`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const parsed = PushSendSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success || !parsed.data.userId) {
    return c.json({ error: "Payload invalide (userId requis)" }, 400);
  }
  const { userId, ...payload } = parsed.data;
  const r = await sendToUser(userId, payload);
  return c.json({ ok: true, ...r });
});

// ─── Admin: whoami (vérification rôle côté serveur) ────────────
app.get(`${PREFIX}/admin/whoami`, async (c) => {
  const u = await requireUser(c);
  if ("error" in u) return c.json({ error: u.error, isAdmin: false }, u.status);
  const isAdmin = !!u.email && ADMIN_EMAILS.has(u.email.toLowerCase());
  return c.json({ isAdmin, email: u.email ?? null, id: u.id });
});

// ─── Admin: liste utilisateurs ─────────────────────────────────
app.get(`${PREFIX}/admin/users`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = Math.min(200, parseInt(c.req.query("perPage") || "100"));
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
    const users = (data?.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      emailConfirmed: !!u.email_confirmed_at,
      metadata: u.user_metadata ?? {},
      isAdmin: !!u.email && ADMIN_EMAILS.has(String(u.email).toLowerCase()),
    }));
    await auditLog(auth.id, auth.email, "users.list", { page, perPage, count: users.length });
    return c.json({ users, page, perPage });
  } catch (e: any) {
    console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
  }
});

app.post(`${PREFIX}/admin/users/ban`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const banDurationHours = Math.max(1, Math.min(24 * 365, parseInt(body.hours || "168")));
  if (!userId) return c.json({ error: "userId requis" }, 400);
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: `${banDurationHours}h`,
    } as any);
    if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
    await auditLog(auth.id, auth.email, "users.ban", { userId, hours: banDurationHours });
    return c.json({ ok: true });
  } catch (e: any) {
    console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
  }
});

app.post(`${PREFIX}/admin/users/unban`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  if (!userId) return c.json({ error: "userId requis" }, 400);
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    } as any);
    if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
    await auditLog(auth.id, auth.email, "users.unban", { userId });
    return c.json({ ok: true });
  } catch (e: any) {
    console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
  }
});

// ─── Admin: vendeurs (publiés + cachés) ────────────────────────
app.get(`${PREFIX}/admin/vendors`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("vendor:")) ?? [];
  await auditLog(auth.id, auth.email, "vendors.list", { count: items.length });
  return c.json({ items });
});

app.post(`${PREFIX}/admin/vendors/suspend`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({}));
  const ownerId = String(body.ownerId || "");
  const suspended = !!body.suspended;
  if (!ownerId) return c.json({ error: "ownerId requis" }, 400);
  const key = `vendor:${ownerId}`;
  const v = await kv.get(key);
  if (!v) return c.json({ error: "vendeur introuvable" }, 404);
  v.suspended = suspended;
  v.shopStatus = suspended ? "closed" : (v.shopStatus === "closed" ? "open" : v.shopStatus);
  v.updatedAt = Date.now();
  await kv.set(key, v);
  await auditLog(auth.id, auth.email, suspended ? "vendors.suspend" : "vendors.unsuspend", { ownerId });
  return c.json({ ok: true });
});

// ─── Admin: produits (tous) ────────────────────────────────────
app.get(`${PREFIX}/admin/products`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("product:")) ?? [];
  await auditLog(auth.id, auth.email, "products.list", { count: items.length });
  return c.json({ items });
});

app.post(`${PREFIX}/admin/products/hide`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({}));
  const productId = String(body.productId || "");
  const hidden = !!body.hidden;
  if (!productId) return c.json({ error: "productId requis" }, 400);
  const all = (await kv.getByPrefix("product:")) ?? [];
  const found = all.find((p: any) => String(p?.id) === productId);
  if (!found) return c.json({ error: "produit introuvable" }, 404);
  const key = `product:${found.ownerId}:${found.id}`;
  found.hidden = hidden;
  found.updatedAt = Date.now();
  await kv.set(key, found);
  await auditLog(auth.id, auth.email, hidden ? "products.hide" : "products.unhide", { productId });
  return c.json({ ok: true });
});

// ─── Admin: dashboard stats (KPI réels) ────────────────────────
app.get(`${PREFIX}/admin/stats`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const [orders, escrows, vendors, products, kycs] = await Promise.all([
    kv.getByPrefix("order:"),
    kv.getByPrefix("escrow:"),
    kv.getByPrefix("vendor:"),
    kv.getByPrefix("product:"),
    kv.getByPrefix("kyc:"),
  ]);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last30 = now - 30 * dayMs;
  const last7 = now - 7 * dayMs;
  const ordersArr = orders ?? [];
  const escrowsArr = escrows ?? [];
  const orders30 = ordersArr.filter((o: any) => (o?.createdAt ?? 0) >= last30);
  const orders7 = ordersArr.filter((o: any) => (o?.createdAt ?? 0) >= last7);
  const sum = (arr: any[], k: string) => arr.reduce((s, o) => s + (Number(o?.[k]) || 0), 0);
  let usersCount = 0;
  try {
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    usersCount = (data as any)?.total ?? (data?.users?.length ?? 0);
  } catch {
    usersCount = 0;
  }
  return c.json({
    users: usersCount,
    vendors: (vendors ?? []).length,
    products: (products ?? []).length,
    orders: {
      total: ordersArr.length,
      last30: orders30.length,
      last7: orders7.length,
      gmvTotal: sum(ordersArr, "total"),
      gmv30: sum(orders30, "total"),
      gmv7: sum(orders7, "total"),
    },
    escrow: {
      held: escrowsArr.filter((e: any) => e?.status === "held").length,
      released: escrowsArr.filter((e: any) => e?.status === "released").length,
      heldAmount: escrowsArr.filter((e: any) => e?.status === "held").reduce((s, e: any) => s + (Number(e?.total) || 0), 0),
    },
    kyc: {
      pending: (kycs ?? []).filter((k: any) => !k?.status || k?.status === "pending").length,
      approved: (kycs ?? []).filter((k: any) => k?.status === "approved").length,
      rejected: (kycs ?? []).filter((k: any) => k?.status === "rejected").length,
    },
    generatedAt: now,
  });
});

// ─── Audit log (lecture admin + helper d'écriture) ─────────────
async function auditLog(adminId: string, adminEmail: string | undefined, action: string, meta?: any) {
  try {
    const ts = Date.now();
    const id = `${ts}-${Math.random().toString(36).slice(2, 8)}`;
    await kv.set(`audit:${ts}:${id}`, {
      id, ts, adminId, adminEmail: adminEmail || null, action, meta: meta ?? null,
    });
  } catch (e) {
    console.log("auditLog error", e);
  }
}

app.get(`${PREFIX}/admin/audit`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("audit:")) ?? [];
  items.sort((a: any, b: any) => (b?.ts ?? 0) - (a?.ts ?? 0));
  return c.json({ items: items.slice(0, 500) });
});

/* ── Categories CRUD ── */
app.get(`${PREFIX}/admin/categories`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("category:")) ?? [];
  items.sort((a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/admin/categories/upsert`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  if (!body || typeof body.name !== "string") return c.json({ error: "name required" }, 400);
  const id = String(body.id || `c${Date.now().toString(36)}`);
  const cat = {
    id,
    name: String(body.name),
    slug: String(body.slug || body.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    icon: String(body.icon || "Tag"),
    color: String(body.color || "#0F172A"),
    active: body.active !== false,
    sortOrder: Number(body.sortOrder ?? Date.now()),
  };
  await kv.set(`category:${id}`, cat);
  await auditLog(auth.id, auth.email ?? null, "category.upsert", { id, name: cat.name });
  return c.json({ category: cat });
});

app.post(`${PREFIX}/admin/categories/delete`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { id } = await c.req.json().catch(() => ({} as any));
  if (!id) return c.json({ error: "id required" }, 400);
  await kv.del(`category:${id}`);
  await auditLog(auth.id, auth.email ?? null, "category.delete", { id });
  return c.json({ ok: true });
});

/* ── Payouts / Reversements ── */
app.get(`${PREFIX}/admin/payouts`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("payout:")) ?? [];
  items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/admin/payouts/create`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  if (!body?.vendorId || typeof body.amount !== "number") return c.json({ error: "vendorId, amount required" }, 400);
  const id = `po_${Date.now().toString(36)}`;
  const payout = {
    id,
    vendorId: String(body.vendorId),
    vendorName: String(body.vendorName || body.vendorId),
    amount: Math.max(0, Number(body.amount)),
    method: String(body.method || "mobile_money"),
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await kv.set(`payout:${id}`, payout);
  await auditLog(auth.id, auth.email ?? null, "payout.create", { id, vendorId: payout.vendorId, amount: payout.amount });
  return c.json({ payout });
});

app.post(`${PREFIX}/admin/payouts/status`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { id, status } = await c.req.json().catch(() => ({} as any));
  if (!id || !status) return c.json({ error: "id, status required" }, 400);
  const cur: any = await kv.get(`payout:${id}`);
  if (!cur) return c.json({ error: "not found" }, 404);
  const next = { ...cur, status, updatedAt: Date.now() };
  await kv.set(`payout:${id}`, next);
  await auditLog(auth.id, auth.email ?? null, "payout.status", { id, status });
  return c.json({ payout: next });
});

/* ── Reviews / Avis ── */
app.get(`${PREFIX}/reviews/:targetType/:targetId`, async (c) => {
  const { targetType, targetId } = c.req.param();
  const items = (await kv.getByPrefix(`review:${targetType}:${targetId}:`)) ?? [];
  const visible = items.filter((r: any) => r?.status !== "hidden");
  visible.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items: visible });
});

app.post(`${PREFIX}/reviews/create`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const targetType = String(body.targetType || "");
  const targetId = String(body.targetId || "");
  const rating = Math.max(1, Math.min(5, Number(body.rating || 0)));
  const comment = String(body.comment || "").slice(0, 2000);
  if (!targetType || !targetId || !rating) return c.json({ error: "targetType, targetId, rating required" }, 400);
  const id = `rv_${Date.now().toString(36)}`;
  const review = {
    id, targetType, targetId, rating, comment,
    userId: auth.id,
    userEmail: auth.email ?? null,
    status: "active",
    createdAt: Date.now(),
  };
  await kv.set(`review:${targetType}:${targetId}:${id}`, review);
  return c.json({ review });
});

app.get(`${PREFIX}/admin/reviews`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("review:")) ?? [];
  items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items: items.slice(0, 500) });
});

app.post(`${PREFIX}/admin/reviews/moderate`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { targetType, targetId, id, action } = await c.req.json().catch(() => ({} as any));
  if (!targetType || !targetId || !id || !action) return c.json({ error: "missing fields" }, 400);
  const key = `review:${targetType}:${targetId}:${id}`;
  const cur: any = await kv.get(key);
  if (!cur) return c.json({ error: "not found" }, 404);
  if (action === "delete") {
    await kv.del(key);
    await auditLog(auth.id, auth.email ?? null, "review.delete", { id });
    return c.json({ ok: true });
  }
  const status = action === "hide" ? "hidden" : "active";
  const next = { ...cur, status };
  await kv.set(key, next);
  await auditLog(auth.id, auth.email ?? null, "review.moderate", { id, status });
  return c.json({ review: next });
});

/* ── Subscriptions / Abonnements ── */
app.get(`${PREFIX}/admin/subscriptions`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("subscription:")) ?? [];
  items.sort((a: any, b: any) => (b?.updatedAt ?? b?.createdAt ?? 0) - (a?.updatedAt ?? a?.createdAt ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/admin/subscriptions/upsert-plan`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  if (!body?.id || typeof body.priceMonthly !== "number") return c.json({ error: "id, priceMonthly required" }, 400);
  const plan = {
    id: String(body.id),
    label: String(body.label || body.id),
    priceMonthly: Number(body.priceMonthly),
    priceYearly: Number(body.priceYearly ?? body.priceMonthly * 10),
    features: Array.isArray(body.features) ? body.features.map(String) : [],
    active: body.active !== false,
    updatedAt: Date.now(),
  };
  await kv.set(`plan:${plan.id}`, plan);
  await auditLog(auth.id, auth.email ?? null, "plan.upsert", { id: plan.id });
  return c.json({ plan });
});

app.get(`${PREFIX}/admin/plans`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("plan:")) ?? [];
  return c.json({ items });
});

/* ── Messagerie (conversations + messages) ──
   Schéma KV:
   - conv:<convId> = { id, participants[], title, lastMessage, lastTs, lastSenderId, updatedAt }
   - convidx:<userId>:<convId> = { convId, updatedAt } (index pour lister les conversations d'un user)
   - msg:<convId>:<ts>:<msgId> = { id, convId, senderId, type, text, ts, ... }
   - convread:<convId>:<userId> = { lastReadAt }
*/
function isParticipant(conv: any, userId: string): boolean {
  return Array.isArray(conv?.participants) && conv.participants.includes(userId);
}

app.get(`${PREFIX}/messages/conversations`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const idx = (await kv.getByPrefix(`convidx:${auth.id}:`)) ?? [];
  if (idx.length === 0) return c.json({ items: [] });
  const ids = idx.map((p: any) => `conv:${p.convId}`);
  const convs = (await kv.mget(ids)) ?? [];
  const reads = await Promise.all(
    convs
      .filter(Boolean)
      .map((c2: any) => kv.get(`convread:${c2.id}:${auth.id}`).catch(() => null))
  );
  const items = convs
    .filter(Boolean)
    .map((c2: any, i: number) => ({
      ...c2,
      lastReadAt: (reads[i] as any)?.lastReadAt ?? 0,
    }))
    .sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/messages/conversations/upsert`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const otherId = String(body.otherId || "").trim().slice(0, 120);
  if (!otherId || otherId === auth.id) return c.json({ error: "otherId requis" }, 400);
  const id = String(body.id || [auth.id, otherId].sort().join("_")).slice(0, 160);
  const existing: any = await kv.get(`conv:${id}`);
  const title = body.title == null ? null : String(body.title).slice(0, 200);
  const avatar = body.avatar == null ? null : String(body.avatar).slice(0, 500);
  const conv = {
    id,
    participants: existing?.participants ?? [auth.id, otherId],
    title: title ?? existing?.title ?? null,
    avatar: avatar ?? existing?.avatar ?? null,
    lastMessage: existing?.lastMessage ?? "",
    lastTs: existing?.lastTs ?? Date.now(),
    lastSenderId: existing?.lastSenderId ?? null,
    updatedAt: Date.now(),
  };
  await kv.set(`conv:${id}`, conv);
  await Promise.all(
    conv.participants.map((p: string) =>
      kv.set(`convidx:${p}:${id}`, { convId: id, updatedAt: conv.updatedAt })
    )
  );
  return c.json({ conversation: conv });
});

app.get(`${PREFIX}/messages/:convId`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const convId = c.req.param("convId");
  const conv: any = await kv.get(`conv:${convId}`);
  if (!conv) return c.json({ error: "Conversation introuvable" }, 404);
  if (!isParticipant(conv, auth.id)) return c.json({ error: "Accès refusé" }, 403);
  const items = (await kv.getByPrefix(`msg:${convId}:`)) ?? [];
  items.sort((a: any, b: any) => (a?.ts ?? 0) - (b?.ts ?? 0));
  return c.json({ conversation: conv, items });
});

app.post(`${PREFIX}/messages/send`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const convId = String(body.convId || "").slice(0, 160);
  const conv: any = await kv.get(`conv:${convId}`);
  if (!conv) return c.json({ error: "Conversation introuvable" }, 404);
  if (!isParticipant(conv, auth.id)) return c.json({ error: "Accès refusé" }, 403);
  const text = String(body.text ?? "").slice(0, 4000);
  const allowedTypes = new Set(["text", "image", "file", "system"]);
  const type = allowedTypes.has(String(body.type)) ? String(body.type) : "text";
  if (type === "text" && !text.trim()) return c.json({ error: "Message vide" }, 400);
  let attachment: any = null;
  if (body.attachment && typeof body.attachment === "object") {
    attachment = {
      url: String((body.attachment as any).url || "").slice(0, 1000),
      name: String((body.attachment as any).name || "").slice(0, 200),
      size: Math.min(50_000_000, Math.max(0, Number((body.attachment as any).size) || 0)),
      mime: String((body.attachment as any).mime || "").slice(0, 120),
    };
  }
  const ts = Date.now();
  const id = `m_${ts.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const msg = {
    id,
    convId,
    senderId: auth.id,
    senderEmail: auth.email ?? null,
    type,
    text,
    attachment,
    ts,
  };
  await kv.set(`msg:${convId}:${ts}:${id}`, msg);
  const updated = {
    ...conv,
    lastMessage: text || `[${type}]`,
    lastTs: ts,
    lastSenderId: auth.id,
    updatedAt: ts,
  };
  await kv.set(`conv:${convId}`, updated);
  await Promise.all(
    conv.participants.map((p: string) =>
      kv.set(`convidx:${p}:${convId}`, { convId, updatedAt: ts })
    )
  );
  return c.json({ message: msg, conversation: updated });
});

app.post(`${PREFIX}/messages/read`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const convId = String(body.convId || "").slice(0, 160);
  if (!convId) return c.json({ error: "convId requis" }, 400);
  const conv: any = await kv.get(`conv:${convId}`);
  if (!conv || !isParticipant(conv, auth.id)) return c.json({ error: "Accès refusé" }, 403);
  await kv.set(`convread:${convId}:${auth.id}`, { lastReadAt: Date.now() });
  return c.json({ ok: true });
});

/* ── Promotions (codes promo) ── */
app.get(`${PREFIX}/admin/promos`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("promo:")) ?? [];
  items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/admin/promos/upsert`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return c.json({ error: "code requis" }, 400);
  const existing: any = await kv.get(`promo:${code}`);
  const promo = {
    code,
    label: String(body.label || code),
    type: body.type === "amount" ? "amount" : "percent",
    value: Math.max(0, Number(body.value ?? 0)),
    minAmount: Number(body.minAmount ?? 0),
    maxUses: body.maxUses == null ? null : Math.max(0, Number(body.maxUses)),
    uses: existing?.uses ?? 0,
    active: body.active !== false,
    expiresAt: body.expiresAt ? Number(body.expiresAt) : null,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  await kv.set(`promo:${code}`, promo);
  await auditLog(auth.id, auth.email ?? null, "promo.upsert", { code });
  return c.json({ promo });
});

app.post(`${PREFIX}/admin/promos/delete`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { code } = await c.req.json().catch(() => ({} as any));
  if (!code) return c.json({ error: "code requis" }, 400);
  await kv.del(`promo:${String(code).toUpperCase()}`);
  await auditLog(auth.id, auth.email ?? null, "promo.delete", { code });
  return c.json({ ok: true });
});

app.post(`${PREFIX}/admin/promos/toggle`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { code } = await c.req.json().catch(() => ({} as any));
  const key = `promo:${String(code).toUpperCase()}`;
  const cur: any = await kv.get(key);
  if (!cur) return c.json({ error: "introuvable" }, 404);
  const next = { ...cur, active: !cur.active, updatedAt: Date.now() };
  await kv.set(key, next);
  await auditLog(auth.id, auth.email ?? null, "promo.toggle", { code, active: next.active });
  return c.json({ promo: next });
});

/* ── Support tickets ── */
app.post(`${PREFIX}/support/tickets`, async (c) => {
  const auth = await requireUser(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const body = await c.req.json().catch(() => ({} as any));
  const subject = String(body.subject || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 4000);
  if (!subject || !message) return c.json({ error: "subject, message requis" }, 400);
  const ts = Date.now();
  const id = `t_${ts.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const ticket = {
    id,
    userId: auth.id,
    userEmail: auth.email ?? null,
    subject,
    message,
    category: String(body.category || "general"),
    priority: "normal" as const,
    status: "open" as const,
    createdAt: ts,
    updatedAt: ts,
    replies: [] as Array<{ at: number; from: "user" | "admin"; text: string }>,
  };
  await kv.set(`ticket:${id}`, ticket);
  return c.json({ ticket });
});

app.get(`${PREFIX}/admin/tickets`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const items = (await kv.getByPrefix("ticket:")) ?? [];
  items.sort((a: any, b: any) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
  return c.json({ items });
});

app.post(`${PREFIX}/admin/tickets/update`, async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);
  const { id, status, priority, reply } = await c.req.json().catch(() => ({} as any));
  if (!id) return c.json({ error: "id requis" }, 400);
  const cur: any = await kv.get(`ticket:${id}`);
  if (!cur) return c.json({ error: "introuvable" }, 404);
  const next = {
    ...cur,
    status: status ?? cur.status,
    priority: priority ?? cur.priority,
    replies: reply ? [...(cur.replies ?? []), { at: Date.now(), from: "admin" as const, text: String(reply).slice(0, 4000) }] : cur.replies,
    updatedAt: Date.now(),
  };
  await kv.set(`ticket:${id}`, next);
  await auditLog(auth.id, auth.email ?? null, "ticket.update", { id, status: next.status, priority: next.priority });
  return c.json({ ticket: next });
});

Deno.serve(app.fetch);
