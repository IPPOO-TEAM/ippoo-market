import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin, auditLog } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const TABLE = "support_tickets";

function fromRow(r: any): any {
  return {
    id: r.id, userId: r.user_id ?? null, userEmail: r.user_email ?? null,
    subject: r.subject, message: r.message, category: r.category,
    priority: r.priority, status: r.status, replies: r.replies ?? [],
    createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
  };
}
function toRow(t: any) {
  return {
    id: t.id, user_id: t.userId ?? null, user_email: t.userEmail ?? null,
    subject: t.subject, message: t.message, category: t.category,
    priority: t.priority, status: t.status, replies: t.replies ?? [],
    created_at: t.createdAt, updated_at: t.updatedAt,
  };
}

export function registerSupport(app: any) {
  app.post(`${PREFIX}/support/tickets`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 4000);
    if (!subject || !message) return c.json({ error: "subject, message requis" }, 400);
    const ts = Date.now();
    const id = `t_${ts.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const ticket = {
      id, userId: auth.id, userEmail: auth.email ?? null,
      subject, message, category: String(body.category || "general"),
      priority: "normal" as const, status: "open" as const,
      createdAt: ts, updatedAt: ts,
      replies: [] as Array<{ at: number; from: "user" | "admin"; text: string }>,
    };
    if (await tableReady(TABLE)) {
      const { error } = await supabase.from(TABLE).upsert(toRow(ticket));
      if (error) console.log(`support_tickets upsert error: ${error.message}`);
    } else {
      await kv.set(`ticket:${id}`, ticket);
    }
    return c.json({ ticket });
  });

  app.get(`${PREFIX}/admin/tickets`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    let items: any[];
    if (await tableReady(TABLE)) {
      const { data } = await supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
      items = (data ?? []).map(fromRow);
    } else {
      items = (await kv.getByPrefix("ticket:")) ?? [];
      items.sort((a: any, b: any) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
    }
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/tickets/update`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { id, status, priority, reply } = await c.req.json().catch(() => ({} as any));
    if (!id) return c.json({ error: "id requis" }, 400);
    const useTable = await tableReady(TABLE);
    const cur: any = useTable
      ? fromRowOrNull((await supabase.from(TABLE).select("*").eq("id", id).maybeSingle()).data)
      : await kv.get(`ticket:${id}`);
    if (!cur) return c.json({ error: "introuvable" }, 404);
    const next = {
      ...cur,
      status: status ?? cur.status,
      priority: priority ?? cur.priority,
      replies: reply ? [...(cur.replies ?? []), { at: Date.now(), from: "admin" as const, text: String(reply).slice(0, 4000) }] : cur.replies,
      updatedAt: Date.now(),
    };
    if (useTable) await supabase.from(TABLE).upsert(toRow(next));
    else await kv.set(`ticket:${id}`, next);
    await auditLog(auth.id, auth.email ?? null, "ticket.update", { id, status: next.status, priority: next.priority });
    return c.json({ ticket: next });
  });

  // ── Backfill admin : KV → table ──
  app.post(`${PREFIX}/admin/migrate/tickets`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(TABLE);
    if (!(await tableReady(TABLE))) return c.json({ error: "Table support_tickets absente : appliquez d'abord la migration 0006." }, 409);
    const legacy = (await kv.getByPrefix("ticket:")) ?? [];
    const rows = legacy.filter((t: any) => t?.id).map(toRow);
    if (rows.length === 0) return c.json({ ok: true, migrated: 0 });
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true, migrated: rows.length });
  });
}

function fromRowOrNull(r: any): any | null {
  return r ? {
    id: r.id, userId: r.user_id ?? null, userEmail: r.user_email ?? null,
    subject: r.subject, message: r.message, category: r.category,
    priority: r.priority, status: r.status, replies: r.replies ?? [],
    createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
  } : null;
}
