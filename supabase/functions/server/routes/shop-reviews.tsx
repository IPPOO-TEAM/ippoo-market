import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

/* Avis boutique partagés (cross-utilisateurs).

   Stockage relationnel : table `public.shop_reviews` (migration 0001).
   Repli KV (avant migration) : clé `shopreview:<slug>:<id>`.

   - Lecture publique : seuls les avis "approved" sont exposés à tous.
   - L'auteur voit toujours ses propres avis (tous statuts).
   - Le propriétaire de la boutique (shop-assets:<slug>.ownerId)
     voit tous les avis de SA boutique et peut les modérer / répondre.
*/

const TABLE = "shop_reviews";
const PREFIX_KEY = "shopreview:";

type Review = {
  id: string;
  shopSlug: string;
  authorName: string;
  authorId?: string;
  rating: number;
  comment: string;
  vendorReply?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  updatedAt: number;
};

// La propriété d'une boutique reste portée par shop-assets (KV).
async function ownerOf(slug: string): Promise<string | undefined> {
  const meta = await kv.get(`shop-assets:${slug}`);
  return meta?.ownerId;
}

// ── Mapping ligne SQL ↔ objet métier (forme identique au KV) ──
function fromRow(r: any): Review {
  return {
    id: r.id,
    shopSlug: r.shop_slug,
    authorName: r.author_name,
    authorId: r.author_id ?? undefined,
    rating: Number(r.rating),
    comment: r.comment ?? "",
    vendorReply: r.vendor_reply ?? undefined,
    status: r.status,
    createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  };
}
function toRow(rev: Review) {
  return {
    id: rev.id,
    shop_slug: rev.shopSlug,
    author_id: rev.authorId ?? null,
    author_name: rev.authorName,
    rating: rev.rating,
    comment: rev.comment,
    vendor_reply: rev.vendorReply ?? null,
    status: rev.status,
    created_at: new Date(rev.createdAt).toISOString(),
    updated_at: new Date(rev.updatedAt).toISOString(),
  };
}

// ── Accès données (table si dispo, sinon KV) ──
async function loadAll(): Promise<Review[]> {
  if (await tableReady(TABLE)) {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) { console.log(`shop_reviews select error: ${error.message}`); return []; }
    return (data ?? []).map(fromRow);
  }
  return ((await kv.getByPrefix(PREFIX_KEY)) ?? []) as Review[];
}

async function loadOne(slug: string, id: string): Promise<Review | null> {
  if (await tableReady(TABLE)) {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) { console.log(`shop_reviews select one error: ${error.message}`); return null; }
    return data ? fromRow(data) : null;
  }
  const rec = await kv.get(`${PREFIX_KEY}${slug}:${id}`);
  return (rec as Review) ?? null;
}

async function saveOne(rev: Review): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).upsert(toRow(rev));
    if (error) console.log(`shop_reviews upsert error: ${error.message}`);
    return;
  }
  await kv.set(`${PREFIX_KEY}${rev.shopSlug}:${rev.id}`, rev);
}

async function removeOne(slug: string, id: string): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) console.log(`shop_reviews delete error: ${error.message}`);
    return;
  }
  await kv.del(`${PREFIX_KEY}${slug}:${id}`);
}

export function registerShopReviews(app: any) {
  // ── Liste (publique + extras si authentifié) ──
  app.get(`${PREFIX}/shop-reviews`, async (c: any) => {
    try {
      const all = await loadAll();
      const approved = all.filter((r) => r?.status === "approved");

      // Tentative d'authentification souple (token optionnel).
      const auth = await requireUser(c);
      if ("error" in auth) {
        return c.json({ items: approved });
      }

      // Slugs possédés par l'utilisateur : on teste la propriété pour
      // chaque slug distinct apparaissant dans les avis (shop-assets ne
      // stocke pas le slug dans sa valeur, mais bien dans sa clé).
      const distinctSlugs = Array.from(new Set(all.map((r) => r?.shopSlug).filter(Boolean)));
      const ownership = await Promise.all(distinctSlugs.map((s) => ownerOf(s as string)));
      const ownedSlugs = new Set(distinctSlugs.filter((_, i) => ownership[i] === auth.id));

      const byId = new Map<string, Review>();
      for (const r of approved) byId.set(r.id, r);
      for (const r of all) {
        if (!r?.id) continue;
        if (r.authorId === auth.id || ownedSlugs.has(r.shopSlug)) byId.set(r.id, r);
      }
      return c.json({ items: Array.from(byId.values()) });
    } catch (e) {
      console.log(`shop-reviews GET error: ${e}`);
      return c.json({ items: [] });
    }
  });

  // ── Création d'un avis (statut pending) ──
  app.post(`${PREFIX}/shop-reviews`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const shopSlug = String(body.shopSlug || "").trim().slice(0, 120);
    const authorName = String(body.authorName || "").trim().slice(0, 120) || "Client";
    const rating = Math.max(1, Math.min(5, Number(body.rating || 0)));
    const comment = String(body.comment || "").trim().slice(0, 2000);
    if (!shopSlug || !rating) return c.json({ error: "shopSlug, rating requis" }, 400);
    const now = Date.now();
    const review: Review = {
      id: `REV-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      shopSlug, authorName, authorId: auth.id,
      rating, comment, status: "pending",
      createdAt: now, updatedAt: now,
    };
    await saveOne(review);
    return c.json({ review });
  });

  // ── Modération / réponse vendeur (propriétaire uniquement) ──
  app.post(`${PREFIX}/shop-reviews/moderate`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const slug = String(body.slug || "").trim().slice(0, 120);
    const id = String(body.id || "").trim().slice(0, 120);
    if (!slug || !id) return c.json({ error: "slug, id requis" }, 400);
    const cur = await loadOne(slug, id);
    if (!cur) return c.json({ error: "introuvable" }, 404);
    const owner = await ownerOf(slug);
    if (owner && owner !== auth.id) return c.json({ error: "Cette boutique appartient à un autre vendeur" }, 403);
    if (!owner) return c.json({ error: "Publiez d'abord votre boutique pour modérer les avis" }, 403);
    const next: Review = { ...cur, updatedAt: Date.now() };
    if (body.status === "approved" || body.status === "rejected" || body.status === "pending") {
      next.status = body.status;
    }
    if (typeof body.vendorReply === "string") {
      next.vendorReply = body.vendorReply.trim().slice(0, 2000) || undefined;
    }
    await saveOne(next);
    return c.json({ review: next });
  });

  // ── Suppression (propriétaire ou auteur) ──
  app.post(`${PREFIX}/shop-reviews/delete`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const slug = String(body.slug || "").trim().slice(0, 120);
    const id = String(body.id || "").trim().slice(0, 120);
    if (!slug || !id) return c.json({ error: "slug, id requis" }, 400);
    const cur = await loadOne(slug, id);
    if (!cur) return c.json({ ok: true });
    const owner = await ownerOf(slug);
    if (cur.authorId !== auth.id && owner !== auth.id) {
      return c.json({ error: "Action non autorisée" }, 403);
    }
    await removeOne(slug, id);
    return c.json({ ok: true });
  });

  // ── Backfill admin : copie des avis KV existants vers la table ──
  // À lancer UNE FOIS après application de la migration 0001, pour ne
  // perdre aucun avis créé avant la bascule. Idempotent (upsert par id).
  app.post(`${PREFIX}/admin/migrate/shop-reviews`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) {
      return c.json({ error: "Table shop_reviews absente : appliquez d'abord la migration 0001." }, 409);
    }
    const legacy = ((await kv.getByPrefix(PREFIX_KEY)) ?? []) as Review[];
    if (legacy.length === 0) return c.json({ ok: true, migrated: 0 });
    const rows = legacy.filter((r) => r?.id && r?.shopSlug).map(toRow);
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
