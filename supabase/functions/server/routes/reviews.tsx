import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin, auditLog } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const TABLE = "reviews";

function fromRow(r: any): any {
  return {
    id: r.id, targetType: r.target_type, targetId: r.target_id,
    rating: Number(r.rating), comment: r.comment ?? "",
    userId: r.user_id ?? null, userEmail: r.user_email ?? null,
    status: r.status, createdAt: Number(r.created_at),
  };
}
function toRow(rev: any) {
  return {
    id: rev.id, target_type: rev.targetType, target_id: rev.targetId,
    user_id: rev.userId ?? null, user_email: rev.userEmail ?? null,
    rating: rev.rating, comment: rev.comment ?? "", status: rev.status ?? "active",
    created_at: rev.createdAt ?? Date.now(),
  };
}

export function registerReviews(app: any) {
  app.get(`${PREFIX}/reviews/:targetType/:targetId`, async (c: any) => {
    const { targetType, targetId } = c.req.param();
    let items: any[];
    if (await tableReady(TABLE)) {
      const { data } = await supabase.from(TABLE).select("*").eq("target_type", targetType).eq("target_id", targetId);
      items = (data ?? []).map(fromRow);
    } else {
      items = (await kv.getByPrefix(`review:${targetType}:${targetId}:`)) ?? [];
    }
    const visible = items.filter((r: any) => r?.status !== "hidden");
    visible.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items: visible });
  });

  app.post(`${PREFIX}/reviews/create`, async (c: any) => {
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
      userId: auth.id, userEmail: auth.email ?? null,
      status: "active", createdAt: Date.now(),
    };
    if (await tableReady(TABLE)) {
      const { error } = await supabase.from(TABLE).upsert(toRow(review));
      if (error) console.log(`reviews upsert error: ${error.message}`);
    } else {
      await kv.set(`review:${targetType}:${targetId}:${id}`, review);
    }
    return c.json({ review });
  });

  app.get(`${PREFIX}/admin/reviews`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    let items: any[];
    if (await tableReady(TABLE)) {
      const { data } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false }).limit(500);
      items = (data ?? []).map(fromRow);
    } else {
      items = (await kv.getByPrefix("review:")) ?? [];
      items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
      items = items.slice(0, 500);
    }
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/reviews/moderate`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { targetType, targetId, id, action } = await c.req.json().catch(() => ({} as any));
    if (!targetType || !targetId || !id || !action) return c.json({ error: "missing fields" }, 400);
    const useTable = await tableReady(TABLE);
    const key = `review:${targetType}:${targetId}:${id}`;
    const cur: any = useTable
      ? (await supabase.from(TABLE).select("*").eq("id", id).maybeSingle()).data
      : await kv.get(key);
    if (!cur) return c.json({ error: "not found" }, 404);
    if (action === "delete") {
      if (useTable) await supabase.from(TABLE).delete().eq("id", id);
      else await kv.del(key);
      await auditLog(auth.id, auth.email ?? null, "review.delete", { id });
      return c.json({ ok: true });
    }
    const status = action === "hide" ? "hidden" : "active";
    if (useTable) {
      await supabase.from(TABLE).update({ status }).eq("id", id);
      await auditLog(auth.id, auth.email ?? null, "review.moderate", { id, status });
      return c.json({ review: { ...fromRow(cur), status } });
    }
    const next = { ...cur, status };
    await kv.set(key, next);
    await auditLog(auth.id, auth.email ?? null, "review.moderate", { id, status });
    return c.json({ review: next });
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/reviews`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) return c.json({ error: "Table reviews absente : appliquez d'abord la migration 0006." }, 409);
    const legacy = (await kv.getByPrefix("review:")) ?? [];
    const rows = legacy.filter((r: any) => r?.id && r?.targetType && r?.targetId).map(toRow);
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}
