import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const TABLE = "public_vendors";
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

// ── Mapping ligne SQL ↔ enregistrement (forme identique au KV) ──
function fromRow(r: any): any {
  return { ...(r.data ?? {}), ownerId: r.owner_id, updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now() };
}
function toRow(ownerId: string, value: any, updatedAt: number) {
  return {
    owner_id: ownerId,
    name: value?.name ?? "",
    city: value?.city ?? null,
    niche: value?.niche ?? null,
    description: value?.description ?? null,
    data: value ?? {},
    updated_at: new Date(updatedAt).toISOString(),
  };
}

async function listVendors(): Promise<any[]> {
  if (await tableReady(TABLE)) {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) { console.log(`public_vendors select error: ${error.message}`); return []; }
    return (data ?? []).map(fromRow);
  }
  return ((await kv.getByPrefix(VENDOR_PREFIX)) ?? []);
}

async function saveVendor(ownerId: string, value: any): Promise<number> {
  const updatedAt = Date.now();
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).upsert(toRow(ownerId, value, updatedAt));
    if (error) console.log(`public_vendors upsert error: ${error.message}`);
  } else {
    await kv.set(`${VENDOR_PREFIX}${ownerId}`, { ...value, ownerId, updatedAt });
  }
  return updatedAt;
}

async function deleteVendor(ownerId: string): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).delete().eq("owner_id", ownerId);
    if (error) console.log(`public_vendors delete error: ${error.message}`);
    return;
  }
  await kv.del(`${VENDOR_PREFIX}${ownerId}`);
}

export function registerVendors(app: any) {
  app.get(`${PREFIX}/vendors/public`, async (c: any) => {
    try {
      return c.json({ items: await listVendors() });
    } catch (e) {
      console.log(`vendors/public GET error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.put(`${PREFIX}/vendors/public/me`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const parsed = VendorPublicSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Profil invalide", details: parsed.error.flatten() }, 400);
      const json = JSON.stringify(parsed.data.value);
      if (json.length > VENDOR_MAX_BYTES) return c.json({ error: "Profil trop volumineux (>32Ko)" }, 413);
      await saveVendor(auth.id, parsed.data.value);
      return c.json({ ok: true, ownerId: auth.id });
    } catch (e) {
      console.log(`vendors/public PUT error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.delete(`${PREFIX}/vendors/public/me`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      await deleteVendor(auth.id);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`vendors/public DELETE error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/vendors`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) {
      return c.json({ error: "Table public_vendors absente : appliquez d'abord la migration 0003." }, 409);
    }
    const legacy = (await kv.getByPrefix(VENDOR_PREFIX)) ?? [];
    const rows = legacy.filter((v: any) => v?.ownerId && v?.name)
      .map((v: any) => toRow(v.ownerId, v, v.updatedAt ?? Date.now()));
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
