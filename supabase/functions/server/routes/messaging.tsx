import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

/* Tables : conversations, messages, conversation_reads (migration 0005).
   Repli KV :
   - conv:<convId>, convidx:<userId>:<convId>
   - msg:<convId>:<ts>:<msgId>, convread:<convId>:<userId>
*/
const T_CONV = "conversations";
const T_MSG = "messages";
const T_READ = "conversation_reads";

function isParticipant(conv: any, userId: string): boolean {
  return Array.isArray(conv?.participants) && conv.participants.includes(userId);
}

function convFromRow(r: any): any {
  return {
    id: r.id, participants: r.participants ?? [], title: r.title ?? null,
    avatar: r.avatar ?? null, lastMessage: r.last_message ?? "",
    lastTs: Number(r.last_ts ?? 0), lastSenderId: r.last_sender_id ?? null,
    updatedAt: Number(r.updated_at ?? 0),
  };
}
function convToRow(c2: any) {
  return {
    id: c2.id, participants: c2.participants ?? [], title: c2.title ?? null,
    avatar: c2.avatar ?? null, last_message: c2.lastMessage ?? "",
    last_ts: c2.lastTs ?? 0, last_sender_id: c2.lastSenderId ?? null,
    updated_at: c2.updatedAt ?? 0,
  };
}
function msgFromRow(r: any): any {
  return {
    id: r.id, convId: r.conv_id, senderId: r.sender_id, senderEmail: r.sender_email ?? null,
    type: r.type, text: r.text ?? "", attachment: r.attachment ?? null, ts: Number(r.ts ?? 0),
  };
}
function msgToRow(m: any) {
  return {
    id: m.id, conv_id: m.convId, sender_id: m.senderId, sender_email: m.senderEmail ?? null,
    type: m.type, text: m.text ?? "", attachment: m.attachment ?? null, ts: m.ts ?? 0,
  };
}

async function convReady() { return await tableReady(T_CONV); }

async function getConv(convId: string): Promise<any | null> {
  if (await convReady()) {
    const { data } = await supabase.from(T_CONV).select("*").eq("id", convId).maybeSingle();
    return data ? convFromRow(data) : null;
  }
  return (await kv.get(`conv:${convId}`)) ?? null;
}
async function saveConv(conv: any): Promise<void> {
  if (await convReady()) {
    const { error } = await supabase.from(T_CONV).upsert(convToRow(conv));
    if (error) console.log(`conversations upsert error: ${error.message}`);
    return;
  }
  await kv.set(`conv:${conv.id}`, conv);
  await Promise.all((conv.participants ?? []).map((p: string) =>
    kv.set(`convidx:${p}:${conv.id}`, { convId: conv.id, updatedAt: conv.updatedAt })));
}
async function getRead(convId: string, userId: string): Promise<number> {
  if (await convReady()) {
    const { data } = await supabase.from(T_READ).select("last_read_at").eq("conv_id", convId).eq("user_id", userId).maybeSingle();
    return Number(data?.last_read_at ?? 0);
  }
  const r = await kv.get(`convread:${convId}:${userId}`);
  return r?.lastReadAt ?? 0;
}

export function registerMessaging(app: any) {
  app.get(`${PREFIX}/messages/conversations`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    let convs: any[] = [];
    if (await convReady()) {
      const { data } = await supabase.from(T_CONV).select("*").contains("participants", [auth.id]);
      convs = (data ?? []).map(convFromRow);
    } else {
      const idx = (await kv.getByPrefix(`convidx:${auth.id}:`)) ?? [];
      if (idx.length === 0) return c.json({ items: [] });
      const ids = idx.map((p: any) => `conv:${p.convId}`);
      convs = ((await kv.mget(ids)) ?? []).filter(Boolean);
    }
    const reads = await Promise.all(convs.map((c2: any) => getRead(c2.id, auth.id).catch(() => 0)));
    const items = convs
      .map((c2: any, i: number) => ({ ...c2, lastReadAt: reads[i] ?? 0 }))
      .sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return c.json({ items });
  });

  app.post(`${PREFIX}/messages/conversations/upsert`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const otherId = String(body.otherId || "").trim().slice(0, 120);
    if (!otherId || otherId === auth.id) return c.json({ error: "otherId requis" }, 400);
    const id = String(body.id || [auth.id, otherId].sort().join("_")).slice(0, 160);
    const existing: any = await getConv(id);
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
    await saveConv(conv);
    return c.json({ conversation: conv });
  });

  app.get(`${PREFIX}/messages/:convId`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const convId = c.req.param("convId");
    const conv: any = await getConv(convId);
    if (!conv) return c.json({ error: "Conversation introuvable" }, 404);
    if (!isParticipant(conv, auth.id)) return c.json({ error: "Accès refusé" }, 403);
    let items: any[];
    if (await convReady()) {
      const { data } = await supabase.from(T_MSG).select("*").eq("conv_id", convId).order("ts", { ascending: true });
      items = (data ?? []).map(msgFromRow);
    } else {
      items = (await kv.getByPrefix(`msg:${convId}:`)) ?? [];
      items.sort((a: any, b: any) => (a?.ts ?? 0) - (b?.ts ?? 0));
    }
    return c.json({ conversation: conv, items });
  });

  app.post(`${PREFIX}/messages/send`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const convId = String(body.convId || "").slice(0, 160);
    const conv: any = await getConv(convId);
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
    const msg = { id, convId, senderId: auth.id, senderEmail: auth.email ?? null, type, text, attachment, ts };
    if (await convReady()) {
      const { error } = await supabase.from(T_MSG).upsert(msgToRow(msg));
      if (error) console.log(`messages upsert error: ${error.message}`);
    } else {
      await kv.set(`msg:${convId}:${ts}:${id}`, msg);
    }
    const updated = { ...conv, lastMessage: text || `[${type}]`, lastTs: ts, lastSenderId: auth.id, updatedAt: ts };
    await saveConv(updated);
    return c.json({ message: msg, conversation: updated });
  });

  app.post(`${PREFIX}/messages/read`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const convId = String(body.convId || "").slice(0, 160);
    if (!convId) return c.json({ error: "convId requis" }, 400);
    const conv: any = await getConv(convId);
    if (!conv || !isParticipant(conv, auth.id)) return c.json({ error: "Accès refusé" }, 403);
    if (await convReady()) {
      await supabase.from(T_READ).upsert({ conv_id: convId, user_id: auth.id, last_read_at: Date.now() });
    } else {
      await kv.set(`convread:${convId}:${auth.id}`, { lastReadAt: Date.now() });
    }
    return c.json({ ok: true });
  });

  // ── Backfill admin : KV → tables (accès direct à la table KV pour les clés) ──
  app.post(`${PREFIX}/admin/migrate/messaging`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(T_CONV); resetTableCache(T_MSG); resetTableCache(T_READ);
    if (!(await convReady())) return c.json({ error: "Tables messagerie absentes : appliquez d'abord la migration 0005." }, 409);
    let convN = 0, msgN = 0, readN = 0;
    const convs = (await kv.getByPrefix("conv:")) ?? [];
    const convRows = convs.filter((x: any) => x?.id).map(convToRow);
    if (convRows.length) { const { error } = await supabase.from(T_CONV).upsert(convRows); if (!error) convN = convRows.length; }
    const msgs = (await kv.getByPrefix("msg:")) ?? [];
    const msgRows = msgs.filter((m: any) => m?.id && m?.convId).map(msgToRow);
    if (msgRows.length) { const { error } = await supabase.from(T_MSG).upsert(msgRows); if (!error) msgN = msgRows.length; }
    // Lectures : clé `convread:<convId>:<userId>` → accès direct table KV.
    const { data: readRows } = await supabase.from("kv_store_cc347259").select("key,value").like("key", "convread:%");
    const reads = (readRows ?? []).map((r: any) => {
      const rest = r.key.slice("convread:".length);
      const idx = rest.indexOf(":");
      return { conv_id: rest.slice(0, idx), user_id: rest.slice(idx + 1), last_read_at: Number(r.value?.lastReadAt ?? 0) };
    }).filter((x: any) => x.conv_id && x.user_id);
    if (reads.length) { const { error } = await supabase.from(T_READ).upsert(reads); if (!error) readN = reads.length; }
    return c.json({ ok: true, conversations: convN, messages: msgN, reads: readN });
  });
}
