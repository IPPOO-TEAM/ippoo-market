import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const TABLE = "devis";

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

// ─── Repo : table `devis` si dispo, sinon KV (`devis:<id>`) ──────
function rowToRecord(r: any): DevisRecord { return r.data as DevisRecord; }
function recordToRow(rec: DevisRecord) {
  return {
    id: rec.id,
    buyer_id: rec.buyerId,
    status: rec.status,
    target_vendor_ids: rec.targetVendorIds ?? [],
    data: rec,
    created_at: new Date(rec.createdAt).toISOString(),
    updated_at: new Date(rec.updatedAt).toISOString(),
  };
}
async function dGet(id: string): Promise<DevisRecord | null> {
  if (await tableReady(TABLE)) {
    const { data } = await supabase.from(TABLE).select("data").eq("id", id).maybeSingle();
    return data ? rowToRecord(data) : null;
  }
  return ((await kv.get(`${DEVIS_PREFIX}${id}`)) as DevisRecord) ?? null;
}
async function dSet(rec: DevisRecord): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).upsert(recordToRow(rec));
    if (error) console.log(`devis upsert error: ${error.message}`);
    return;
  }
  await kv.set(`${DEVIS_PREFIX}${rec.id}`, rec);
}
async function dDel(id: string): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) console.log(`devis delete error: ${error.message}`);
    return;
  }
  await kv.del(`${DEVIS_PREFIX}${id}`);
}
async function dMine(uid: string): Promise<DevisRecord[]> {
  if (await tableReady(TABLE)) {
    const { data } = await supabase.from(TABLE).select("data").eq("buyer_id", uid);
    return (data ?? []).map(rowToRecord);
  }
  const all = (await kv.getByPrefix(DEVIS_PREFIX)) as DevisRecord[];
  return (all ?? []).filter((d) => d?.buyerId === uid);
}
async function dInbox(uid: string): Promise<DevisRecord[]> {
  if (await tableReady(TABLE)) {
    const { data } = await supabase.from(TABLE).select("data").contains("target_vendor_ids", [uid]);
    return (data ?? []).map(rowToRecord);
  }
  const all = (await kv.getByPrefix(DEVIS_PREFIX)) as DevisRecord[];
  return (all ?? []).filter((d) => d?.targetVendorIds?.includes(uid));
}

export function registerDevis(app: any) {
  app.post(`${PREFIX}/devis`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const parsed = DevisCreateSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Devis invalide", details: parsed.error.flatten() }, 400);
      const existing = await dGet(parsed.data.id);
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
      await dSet(record);
      return c.json({ ok: true, devis: record });
    } catch (e) {
      console.log(`devis POST error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.get(`${PREFIX}/devis/mine`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const mine = await dMine(auth.id);
      return c.json({ items: mine });
    } catch (e) {
      console.log(`devis/mine GET error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.get(`${PREFIX}/devis/inbox`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const inbox = await dInbox(auth.id);
      return c.json({ items: inbox });
    } catch (e) {
      console.log(`devis/inbox GET error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.get(`${PREFIX}/devis/:id`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const rec = await dGet(id);
      if (!rec) return c.json({ error: "Introuvable" }, 404);
      if (!canRead(rec, auth.id)) return c.json({ error: "Accès refusé" }, 403);
      return c.json({ devis: rec });
    } catch (e) {
      console.log(`devis GET error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.post(`${PREFIX}/devis/:id/respond`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const rec = await dGet(id);
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
      await dSet(next);
      return c.json({ ok: true, devis: next });
    } catch (e) {
      console.log(`devis respond error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.post(`${PREFIX}/devis/:id/accept`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const rec = await dGet(id);
      if (!rec) return c.json({ error: "Introuvable" }, 404);
      if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut accepter" }, 403);
      if (rec.status !== "open") return c.json({ error: "Devis déjà clôturé" }, 409);
      const body = await c.req.json().catch(() => ({})) as { responseId?: string };
      const responseId = String(body?.responseId ?? "");
      if (!rec.responses.some((r) => r.id === responseId)) {
        return c.json({ error: "responseId introuvable" }, 400);
      }
      const next: DevisRecord = { ...rec, status: "accepted", acceptedResponseId: responseId, updatedAt: Date.now() };
      await dSet(next);
      return c.json({ ok: true, devis: next });
    } catch (e) {
      console.log(`devis accept error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.post(`${PREFIX}/devis/:id/cancel`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const rec = await dGet(id);
      if (!rec) return c.json({ error: "Introuvable" }, 404);
      if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut annuler" }, 403);
      if (rec.status !== "open") return c.json({ error: "Déjà clôturé" }, 409);
      const next: DevisRecord = { ...rec, status: "cancelled", updatedAt: Date.now() };
      await dSet(next);
      return c.json({ ok: true, devis: next });
    } catch (e) {
      console.log(`devis cancel error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.delete(`${PREFIX}/devis/:id`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!DEVIS_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const rec = await dGet(id);
      if (!rec) return c.json({ ok: true });
      if (rec.buyerId !== auth.id) return c.json({ error: "Seul l'acheteur peut supprimer" }, 403);
      await dDel(id);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`devis DELETE error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/devis`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) {
      return c.json({ error: "Table devis absente : appliquez d'abord la migration 0004." }, 409);
    }
    const legacy = ((await kv.getByPrefix(DEVIS_PREFIX)) ?? []) as DevisRecord[];
    const rows = legacy.filter((d) => d?.id && d?.buyerId).map(recordToRow);
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
