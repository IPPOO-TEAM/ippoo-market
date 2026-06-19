/* ═══════════════════════════════════════════
   IPPOO — API client centralisé
   Wrap fetch pour les Edge Functions avec token Bearer auto,
   timeout, parsing d'erreur uniforme.
   ═══════════════════════════════════════════ */

import { projectId } from "/utils/supabase/info";
import { getAccessToken } from "../auth/supabase";

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cc347259`;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean; // default true
  timeoutMs?: number;
};

export async function apiFetch<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true, timeoutMs = 15_000 } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json; charset=utf-8";
  if (auth) {
    const token = await getAccessToken();
    if (!token) throw new ApiError("Authentification requise", 401);
    headers["Authorization"] = `Bearer ${token}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      throw new ApiError(json?.error ?? `HTTP ${res.status}`, res.status, json?.details);
    }
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error)?.name === "AbortError") throw new ApiError("Délai dépassé", 408);
    throw new ApiError((e as Error)?.message ?? "Erreur réseau", 0);
  } finally {
    clearTimeout(timer);
  }
}
