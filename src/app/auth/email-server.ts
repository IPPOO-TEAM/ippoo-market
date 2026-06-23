/* ═══════════════════════════════════════════
   IPPOO — Emails d'authentification (frontend)
   Appelle les endpoints serveur qui envoient via Resend :
   code de vérification (OTP), reset mot de passe, alerte connexion.
   Tout est best-effort : si le backend n'est pas joignable, on
   échoue proprement sans bloquer l'UX.
   ═══════════════════════════════════════════ */

import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";

const BASE = FUNCTIONS_BASE;

async function post(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (isBackendOffline()) return { ok: false, error: "Service indisponible" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: String(j?.error || `HTTP ${res.status}`) };
    return { ok: true };
  } catch (e) {
    if (isNetworkError(e)) markBackendOffline(path, e);
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

/** Demande l'envoi d'un code de vérification à 6 chiffres par email. */
export function requestEmailOtp(email: string) {
  return post("/auth/otp/request", { email });
}

/** Vérifie le code OTP saisi par l'utilisateur. */
export function verifyEmailOtp(email: string, code: string) {
  return post("/auth/otp/verify", { email, code });
}

/** Demande un email de réinitialisation de mot de passe (lien Resend). */
export function requestPasswordReset(email: string, redirectTo?: string) {
  return post("/auth/password/reset-request", { email, redirectTo });
}

/** Notifie une nouvelle connexion (alerte sécurité). Best-effort, fire-and-forget. */
export function notifyLoginAlert(email: string) {
  void post("/auth/login-alert", { email });
}
