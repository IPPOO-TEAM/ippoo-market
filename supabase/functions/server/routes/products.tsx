import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

// Chaque produit publié par un vendeur est stocké à la clé
// `products:public:<ownerId>:<productId>` (repli KV) ou dans la table
// `public_products` (owner_id, product_id). Tous les utilisateurs
// peuvent lister via GET ; seul le propriétaire peut PUT/DELETE les
// siens. Cela alimente le comparateur de prix cross-plateforme.
const TABLE = "public_products";
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

// ── Mapping ligne SQL ↔ enregistrement (forme identique au KV) ──
function fromRow(r: any): any {
  return {
    ...(r.data ?? {}),
    id: r.product_id,
    ownerId: r.owner_id,
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  };
}
function toRow(ownerId: string, productId: string, value: any, updatedAt: number) {
  return {
    owner_id: ownerId,
    product_id: productId,
    name: value?.name ?? "",
    price: Math.round(Number(value?.price ?? 0)),
    category: value?.category ?? null,
    data: value ?? {},
    updated_at: new Date(updatedAt).toISOString(),
  };
}

async function listProducts(): Promise<any[]> {
  if (await tableReady(TABLE)) {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) { console.log(`public_products select error: ${error.message}`); return []; }
    return (data ?? []).map(fromRow);
  }
  return ((await kv.getByPrefix(PRODUCT_PREFIX)) ?? []);
}

async function saveProduct(ownerId: string, productId: string, value: any): Promise<any> {
  const updatedAt = Date.now();
  const record = { ...value, id: productId, ownerId, updatedAt };
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).upsert(toRow(ownerId, productId, value, updatedAt));
    if (error) console.log(`public_products upsert error: ${error.message}`);
  } else {
    await kv.set(`${PRODUCT_PREFIX}${ownerId}:${productId}`, record);
  }
  return record;
}

async function deleteProduct(ownerId: string, productId: string): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).delete().eq("owner_id", ownerId).eq("product_id", productId);
    if (error) console.log(`public_products delete error: ${error.message}`);
    return;
  }
  await kv.del(`${PRODUCT_PREFIX}${ownerId}:${productId}`);
}

export function registerProducts(app: any) {
  app.get(`${PREFIX}/products/public`, async (c: any) => {
    try {
      return c.json({ items: await listProducts() });
    } catch (e) {
      console.log(`products/public GET error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.put(`${PREFIX}/products/public/me/:productId`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const productId = c.req.param("productId");
      if (!PRODUCT_ID_RE.test(productId)) return c.json({ error: "productId invalide" }, 400);
      const parsed = ProductPublicSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Produit invalide", details: parsed.error.flatten() }, 400);
      const json = JSON.stringify(parsed.data.value);
      if (json.length > PRODUCT_MAX_BYTES) return c.json({ error: "Produit trop volumineux (>96Ko)" }, 413);
      const record = await saveProduct(auth.id, productId, parsed.data.value);
      return c.json({ ok: true, product: record });
    } catch (e) {
      console.log(`products/public PUT error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.delete(`${PREFIX}/products/public/me/:productId`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const productId = c.req.param("productId");
      if (!PRODUCT_ID_RE.test(productId)) return c.json({ error: "productId invalide" }, 400);
      await deleteProduct(auth.id, productId);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`products/public DELETE error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/products`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) {
      return c.json({ error: "Table public_products absente : appliquez d'abord la migration 0003." }, 409);
    }
    const legacy = (await kv.getByPrefix(PRODUCT_PREFIX)) ?? [];
    const rows = legacy.filter((p: any) => p?.ownerId && p?.id && p?.name)
      .map((p: any) => toRow(p.ownerId, p.id, p, p.updatedAt ?? Date.now()));
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
