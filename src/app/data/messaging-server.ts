/* ═══════════════════════════════════════════
   IPPOO - Messagerie serveur (Edge Function)
   ═══════════════════════════════════════════ */

import { apiFetch } from "../api/client";

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
