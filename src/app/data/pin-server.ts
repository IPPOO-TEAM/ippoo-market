/* ═══════════════════════════════════════════
   IPPOO — PIN serveur (Edge Function)
   Le hash et la vérification se font côté serveur (SHA-256 + sel
   aléatoire, lock 15 min après 5 échecs).
   ═══════════════════════════════════════════ */

import { apiFetch, ApiError } from "../api/client";

export type PinStatus = { hasPin: boolean; lockedUntil: number };

export async function fetchPinStatus(): Promise<PinStatus> {
  return apiFetch<PinStatus>("/pin/status");
}

export async function setPin(pin: string): Promise<void> {
  await apiFetch("/pin", { method: "PUT", body: { pin } });
}

export type PinVerifyResult =
  | { ok: true }
  | { ok: false; error: string; remaining?: number; lockedUntil?: number; status: number };

export async function verifyPin(pin: string): Promise<PinVerifyResult> {
  try {
    await apiFetch("/pin/verify", { method: "POST", body: { pin } });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      const details = e.details as { remaining?: number; lockedUntil?: number } | undefined;
      return {
        ok: false,
        error: e.message,
        remaining: details?.remaining,
        lockedUntil: details?.lockedUntil,
        status: e.status,
      };
    }
    return { ok: false, error: "Erreur réseau", status: 0 };
  }
}
