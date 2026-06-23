import { logger } from "../lib/logger";
import { FUNCTIONS_BASE } from "../lib/runtime-config";
/* ═══════════════════════════════════════════
   IPPOO - Fichiers utilisateur (avatar, KYC, etc.)
   Owner-based : la propriété est l'utilisateur Supabase authentifié.
   ═══════════════════════════════════════════ */

import { getAccessToken } from "../auth/supabase";

const BASE = FUNCTIONS_BASE;

export type UserFileKind =
  | "avatar"
  | "kyc-id" | "kyc-rccm" | "kyc-ifu" | "kyc-shop"
  | "logo" | "shop-photo" | "certificate";

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new Error("Connectez-vous pour gérer vos fichiers");
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}

export async function getUserFile(kind: UserFileKind): Promise<string | null> {
  try {
    const res = await authedFetch(`/user-files/${kind}`);
    if (!res.ok) {
      logger.warn(`getUserFile(${kind}) failed: HTTP ${res.status}`);
      return null;
    }
    const j = await res.json();
    return j?.url ?? null;
  } catch (e) {
    logger.warn(`getUserFile(${kind}) error: ${e}`);
    return null;
  }
}

export async function uploadUserFile(kind: UserFileKind, dataUrl: string): Promise<string | null> {
  const res = await authedFetch(`/user-files/${kind}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    logger.warn(`uploadUserFile(${kind}) failed: ${msg}`);
    throw new Error(msg);
  }
  const { url } = (await res.json()) as { url?: string };
  return url ?? null;
}

export async function deleteUserFile(kind: UserFileKind): Promise<void> {
  const res = await authedFetch(`/user-files/${kind}`, { method: "DELETE" });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    logger.warn(`deleteUserFile(${kind}) failed: ${msg}`);
    throw new Error(msg);
  }
}

export function fileToCompressedDataUrl(file: File, maxW = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      const r = new FileReader();
      r.onerror = () => reject(r.error);
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponible"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
