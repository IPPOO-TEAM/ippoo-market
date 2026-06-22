import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const TABLE = "kyc";

const KycDecisionSchema = z.object({
  userId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).optional(),
});

function fromRow(r: any): any {
  return { ...(r.data ?? {}), userId: r.user_id, status: r.status, reason: r.reason ?? "", decidedAt: r.decided_at ?? undefined, decidedBy: r.decided_by ?? undefined };
}
function toRow(rec: any) {
  return {
    user_id: rec.userId,
    status: rec.status ?? "pending",
    reason: rec.reason ?? null,
    data: rec,
    decided_at: rec.decidedAt ?? null,
    decided_by: rec.decidedBy ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function kGet(userId: string): Promise<any | null> {
  if (await tableReady(TABLE)) {
    const { data } = await supabase.from(TABLE).select("*").eq("user_id", userId).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return (await kv.get(`kyc:${userId}`)) ?? null;
}
async function kSet(rec: any): Promise<void> {
  if (await tableReady(TABLE)) {
    const { error } = await supabase.from(TABLE).upsert(toRow(rec));
    if (error) console.log(`kyc upsert error: ${error.message}`);
    return;
  }
  await kv.set(`kyc:${rec.userId}`, rec);
}
async function kPending(): Promise<any[]> {
  if (await tableReady(TABLE)) {
    const { data } = await supabase.from(TABLE).select("*").eq("status", "pending");
    return (data ?? []).map(fromRow);
  }
  const all = (await kv.getByPrefix("kyc:")) ?? [];
  return all.filter((k: any) => k?.status === "pending" || !k?.status);
}

export function registerKyc(app: any) {
  app.get(`${PREFIX}/kyc/me`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const rec = await kGet(auth.id);
    return c.json({ kyc: rec ?? { status: "pending" } });
  });

  app.get(`${PREFIX}/admin/kyc/pending`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    return c.json({ items: await kPending() });
  });

  app.post(`${PREFIX}/admin/kyc/decision`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = KycDecisionSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
    const rec = (await kGet(parsed.data.userId)) ?? { userId: parsed.data.userId };
    rec.status = parsed.data.decision;
    rec.reason = parsed.data.reason ?? "";
    rec.decidedAt = Date.now();
    rec.decidedBy = auth.id;
    await kSet(rec);
    return c.json({ ok: true, kyc: rec });
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/kyc`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) return c.json({ error: "Table kyc absente : appliquez d'abord la migration 0006." }, 409);
    const legacy = (await kv.getByPrefix("kyc:")) ?? [];
    const rows = legacy.filter((k: any) => k?.userId).map(toRow);
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
