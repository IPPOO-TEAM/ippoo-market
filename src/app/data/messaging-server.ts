/* ═══════════════════════════════════════════
   IPPOO - Messagerie serveur (Edge Function)
   ═══════════════════════════════════════════ */

import { apiFetch } from "../api/client";
import { getSupabase } from "../auth/supabase";

export type ServerConversation = {
  id: string;
  participants: string[];
  title: string | null;
  avatar: string | null;
  lastMessage: string;
  lastTs: number;
  lastSenderId: string | null;
  updatedAt: number;
  lastReadAt?: number;
};

export type ServerMessage = {
  id: string;
  convId: string;
  senderId: string;
  senderEmail: string | null;
  type: string;
  text: string;
  attachment?: any;
  ts: number;
};

export async function listServerConversations(): Promise<ServerConversation[]> {
  const j = await apiFetch<{ items: ServerConversation[] }>("/messages/conversations");
  return j.items ?? [];
}

export async function upsertServerConversation(input: {
  otherId: string;
  id?: string;
  title?: string;
  avatar?: string;
}): Promise<ServerConversation> {
  const j = await apiFetch<{ conversation: ServerConversation }>(
    "/messages/conversations/upsert",
    { method: "POST", body: input },
  );
  return j.conversation;
}

export async function listServerMessages(convId: string): Promise<{
  conversation: ServerConversation;
  items: ServerMessage[];
}> {
  return apiFetch<{ conversation: ServerConversation; items: ServerMessage[] }>(
    `/messages/${encodeURIComponent(convId)}`,
  );
}

export async function sendServerMessage(input: {
  convId: string;
  text?: string;
  type?: string;
  attachment?: any;
}): Promise<{ message: ServerMessage; conversation: ServerConversation }> {
  return apiFetch<{ message: ServerMessage; conversation: ServerConversation }>(
    "/messages/send",
    { method: "POST", body: input },
  );
}

export async function markServerConversationRead(convId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/messages/read", { method: "POST", body: { convId } });
}

/* ─── Realtime ───────────────────────────────────────────────────
   Abonnement direct aux nouveaux messages d'une conversation via
   Supabase Realtime (postgres_changes sur public.messages). Le RLS
   garantit que seuls les participants reçoivent les events.
   Retourne une fonction de désabonnement. */
export function subscribeRealtimeMessages(
  convId: string,
  onMessage: (msg: ServerMessage) => void,
): () => void {
  let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
  try {
    const sb = getSupabase();
    channel = sb
      .channel(`messages:${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conv_id=eq.${convId}` },
        (payload: any) => {
          const r = payload?.new;
          if (!r) return;
          onMessage({
            id: r.id,
            convId: r.conv_id,
            senderId: r.sender_id,
            senderEmail: r.sender_email ?? null,
            type: r.type ?? "text",
            text: r.text ?? "",
            attachment: r.attachment ?? undefined,
            ts: Number(r.ts ?? 0),
          });
        },
      )
      .subscribe();
  } catch (e) {
    console.log(`[messaging] realtime subscribe failed: ${e}`);
  }
  return () => {
    try { if (channel) getSupabase().removeChannel(channel); } catch { /* ignore */ }
  };
}

/* Abonnement global aux changements de conversations de l'utilisateur
   (nouvelle conv / dernier message mis à jour). */
export function subscribeRealtimeConversations(onChange: () => void): () => void {
  let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
  try {
    const sb = getSupabase();
    channel = sb
      .channel("conversations:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => onChange(),
      )
      .subscribe();
  } catch (e) {
    console.log(`[messaging] realtime conversations subscribe failed: ${e}`);
  }
  return () => {
    try { if (channel) getSupabase().removeChannel(channel); } catch { /* ignore */ }
  };
}
