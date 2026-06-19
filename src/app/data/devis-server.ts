/* ═══════════════════════════════════════════
   IPPOO — Devis (RFQ) cross-utilisateurs
   Wrapper REST sur les endpoints `/devis*` du serveur Supabase.
   Deux listes côté client : `mine` (acheteur) et `inbox` (vendeur ciblé).
   Cache localStorage scopé par compte + listeners pour rafraîchir l'UI.
   ═══════════════════════════════════════════ */

import { projectId } from "/utils/supabase/info";
import { getAccessToken } from "../auth/supabase";
import { scopedGetJSON, scopedSetJSON } from "../lib/scoped-storage";
import { logger } from "../lib/logger";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cc347259`;
const MINE_KEY = "ippoo:devis:mine:v1";
const INBOX_KEY = "ippoo:devis:inbox:v1";

export type DevisProduct = { name: string; qty: number; unit: string };
export type DevisResponseItem = { name: string; qty: number; unitPrice: number };
export type DevisResponse = {
  id: string;
  vendorId: string;
  vendorName: string;
  price: number;
  leadTime?: string;
  notes?: string;
  items?: DevisResponseItem[];
  createdAt: number;
};
export type Devis = {
  id: string;
  buyerId: string;
  products: DevisProduct[];
  targetVendorIds: string[];
  deadline?: string;
  location?: string;
  notes?: string;
  responses: DevisResponse[];
  status: "open" | "accepted" | "cancelled";
  acceptedResponseId?: string;
  createdAt: number;
  updatedAt: number;
};

let mine: Devis[] = [];
let inbox: Devis[] = [];
const listeners = new Set<() => void>();

function hydrate() {
  if (typeof window === "undefined") return;
  mine = scopedGetJSON<Devis[]>(MINE_KEY, []);
  inbox = scopedGetJSON<Devis[]>(INBOX_KEY, []);
}
hydrate();

function emit() {
  scopedSetJSON(MINE_KEY, mine);
  scopedSetJSON(INBOX_KEY, inbox);
  listeners.forEach((l) => l());
}

export function subscribeDevis(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getMyDevis(): Devis[] { return mine; }
export function getInboxDevis(): Devis[] { return inbox; }

function upsert(list: Devis[], d: Devis): Devis[] {
  return [d, ...list.filter((x) => x.id !== d.id)].sort((a, b) => b.createdAt - a.createdAt);
}

async function authHeaders(): Promise<HeadersInit | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" };
}

export async function refreshMyDevis(): Promise<Devis[]> {
  const headers = await authHeaders();
  if (!headers) return mine;
  try {
    const res = await fetch(`${BASE}/devis/mine`, { headers });
    if (!res.ok) { logger.warn(`devis/mine GET HTTP ${res.status}`); return mine; }
    const j = await res.json();
    mine = (Array.isArray(j?.items) ? j.items : []).sort((a: Devis, b: Devis) => b.createdAt - a.createdAt);
    emit();
    return mine;
  } catch (e) {
    logger.warn(`devis/mine GET error: ${e}`);
    return mine;
  }
}

export async function refreshInboxDevis(): Promise<Devis[]> {
  const headers = await authHeaders();
  if (!headers) return inbox;
  try {
    const res = await fetch(`${BASE}/devis/inbox`, { headers });
    if (!res.ok) { logger.warn(`devis/inbox GET HTTP ${res.status}`); return inbox; }
    const j = await res.json();
    inbox = (Array.isArray(j?.items) ? j.items : []).sort((a: Devis, b: Devis) => b.createdAt - a.createdAt);
    emit();
    return inbox;
  } catch (e) {
    logger.warn(`devis/inbox GET error: ${e}`);
    return inbox;
  }
}

export function genDevisId(): string {
  return `DEV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export type CreateDevisInput = {
  products: DevisProduct[];
  targetVendorIds: string[];
  deadline?: string;
  location?: string;
  notes?: string;
};

export async function createDevis(input: CreateDevisInput): Promise<{ ok: true; devis: Devis } | { ok: false; error: string }> {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "Connexion requise" };
  const id = genDevisId();
  try {
    const res = await fetch(`${BASE}/devis`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id, ...input }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: j?.error ?? `HTTP ${res.status}` };
    mine = upsert(mine, j.devis as Devis);
    emit();
    return { ok: true, devis: j.devis as Devis };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function respondDevis(
  id: string,
  body: { responseId?: string; vendorName: string; price: number; leadTime?: string; notes?: string; items?: DevisResponseItem[] },
  vendorId: string,
): Promise<{ ok: true; devis: Devis } | { ok: false; error: string }> {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "Connexion requise" };
  const payload: DevisResponse = {
    id: body.responseId ?? `RESP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase(),
    vendorId,
    vendorName: body.vendorName,
    price: body.price,
    leadTime: body.leadTime,
    notes: body.notes,
    items: body.items,
    createdAt: Date.now(),
  };
  try {
    const res = await fetch(`${BASE}/devis/${encodeURIComponent(id)}/respond`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: j?.error ?? `HTTP ${res.status}` };
    inbox = upsert(inbox, j.devis as Devis);
    emit();
    return { ok: true, devis: j.devis as Devis };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function acceptDevisResponse(
  id: string,
  responseId: string,
): Promise<{ ok: true; devis: Devis } | { ok: false; error: string }> {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "Connexion requise" };
  try {
    const res = await fetch(`${BASE}/devis/${encodeURIComponent(id)}/accept`, {
      method: "POST",
      headers,
      body: JSON.stringify({ responseId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: j?.error ?? `HTTP ${res.status}` };
    mine = upsert(mine, j.devis as Devis);
    emit();
    return { ok: true, devis: j.devis as Devis };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function cancelDevis(id: string): Promise<boolean> {
  const headers = await authHeaders();
  if (!headers) return false;
  try {
    const res = await fetch(`${BASE}/devis/${encodeURIComponent(id)}/cancel`, { method: "POST", headers });
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({}));
    if (j?.devis) { mine = upsert(mine, j.devis as Devis); emit(); }
    return true;
  } catch {
    return false;
  }
}

export async function deleteDevis(id: string): Promise<boolean> {
  const headers = await authHeaders();
  if (!headers) return false;
  try {
    const res = await fetch(`${BASE}/devis/${encodeURIComponent(id)}`, { method: "DELETE", headers });
    if (!res.ok) return false;
    mine = mine.filter((d) => d.id !== id);
    emit();
    return true;
  } catch {
    return false;
  }
}
