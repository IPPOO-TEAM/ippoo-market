import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import {
  PREFIX, BUCKET, supabase, requireUser, rateLimit, sanitizeKey, signedFor,
  parseDataUrl, extFromMime, ALLOWED_IMAGE_MIME, ALLOWED_DOC_MIME, logSafe,
} from "../_shared.tsx";

// ─── Shop assets ───────────────────────────────────────────────
const ShopAssetPutSchema = z.object({
  kind: z.enum(["logo", "banner"]),
  dataUrl: z.string().min(20),
});

// ─── User files ────────────────────────────────────────────────
const ALLOWED_KINDS = new Set(["avatar", "kyc-id", "kyc-rccm", "kyc-ifu", "kyc-shop", "logo", "shop-photo", "certificate"]);
const UserFilePutSchema = z.object({ dataUrl: z.string().min(20) });

export function registerStorage(app: any) {
  // ── Shop assets ──
  app.get(`${PREFIX}/shop-assets/:key`, async (c: any) => {
    const key = sanitizeKey(c.req.param("key"));
    if (!key) return c.json({ error: "Clé invalide" }, 400);
    const meta = await kv.get(`shop-assets:${key}`);
    if (!meta) return c.json({});
    const out: { logo?: string; banner?: string; updatedAt?: number } = { updatedAt: meta.updatedAt };
    if (meta.logoPath) out.logo = (await signedFor(meta.logoPath)) ?? undefined;
    if (meta.bannerPath) out.banner = (await signedFor(meta.bannerPath)) ?? undefined;
    return c.json(out);
  });

  app.put(`${PREFIX}/shop-assets/:key`, async (c: any) => {
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

  app.delete(`${PREFIX}/shop-assets/:key/:kind`, async (c: any) => {
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

  // ── User files ──
  app.get(`${PREFIX}/user-files/:kind`, async (c: any) => {
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

  app.put(`${PREFIX}/user-files/:kind`, async (c: any) => {
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

  app.delete(`${PREFIX}/user-files/:kind`, async (c: any) => {
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
}
