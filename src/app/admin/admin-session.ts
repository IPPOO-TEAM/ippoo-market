/* ═══════════════════════════════════════════
   IPPOO — Session admin AUTONOME
   ─────────────────────────────────────────
   Les administrateurs n'ont AUCUN compte utilisateur Supabase.
   Ils s'authentifient via /admin/login (email+password vérifiés
   côté serveur contre IPPOO_ADMIN_EMAILS + IPPOO_ADMIN_PASSWORD).
   Le token signé HMAC est stocké séparément du token Supabase user.
   ═══════════════════════════════════════════ */

import { useEffect, useState, useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";
import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";

const ADMIN_TOKEN_KEY = "ippoo:admin:token";       // jeton serveur HMAC
const ADMIN_EMAIL_KEY = "ippoo:admin:email";
const ADMIN_EXP_KEY = "ippoo:admin:exp";

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
  // Notifie aussi les autres onglets
  try { localStorage.setItem("ippoo:admin:bump", String(Date.now())); } catch {}
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const t = safeGetItem(ADMIN_TOKEN_KEY);
  const exp = Number(safeGetItem(ADMIN_EXP_KEY) ?? 0);
  if (!t || !exp || Date.now() > exp) { clearAdminSession(); return null; }
  return t;
}

export function getAdminEmail(): string | null {
  return safeGetItem(ADMIN_EMAIL_KEY);
}

export function isAdminLogged(): boolean {
  return !!getAdminToken();
}

export function clearAdminSession() {
  safeRemoveItem(ADMIN_TOKEN_KEY);
  safeRemoveItem(ADMIN_EMAIL_KEY);
  safeRemoveItem(ADMIN_EXP_KEY);
  emit();
}

export function subscribeAdminSession(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith("ippoo:admin:")) fn();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function useAdminLogged(): boolean {
  return useSyncExternalStore(subscribeAdminSession, isAdminLogged, () => false);
}

/* ─── API ─────────────────────────────────────────────────────── */

export type LoginResult = { ok: true; email: string } | { ok: false; error: string };

export async function loginAdminServer(email: string, password: string): Promise<LoginResult> {
  // On tente toujours (action volontaire) — même si le breaker s'est déclenché
  // plus tôt sur d'autres routes. Un succès réinitialise implicitement l'UX.
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: String(j?.error || "Identifiants invalides") };
    if (!j?.token) return { ok: false, error: "Réponse serveur invalide" };
    safeSetItem(ADMIN_TOKEN_KEY, j.token);
    safeSetItem(ADMIN_EMAIL_KEY, j.email);
    safeSetItem(ADMIN_EXP_KEY, String(j.expiresAt ?? Date.now() + 4 * 60 * 60 * 1000));
    emit();
    return { ok: true, email: j.email };
  } catch (e) {
    if (isNetworkError(e)) markBackendOffline("admin/login", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export async function logoutAdminServer(): Promise<void> {
  const t = getAdminToken();
  clearAdminSession();
  if (!t) return;
  try {
    await fetch(`${FUNCTIONS_BASE}/admin/logout`, {
      method: "POST",
      headers: { "x-admin-token": t },
    });
  } catch { /* best-effort */ }
}

/** Vérifie périodiquement la validité du token serveur. */
export function useAdminWhoami(): { loading: boolean; isAdmin: boolean; email: string | null; error: string | null; refresh: () => Promise<void> } {
  const logged = useAdminLogged();
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean; email: string | null; error: string | null }>(() => ({
    loading: logged, isAdmin: logged, email: getAdminEmail(), error: null,
  }));

  async function refresh() {
    const t = getAdminToken();
    if (!t) { setState({ loading: false, isAdmin: false, email: null, error: null }); return; }
    // Backend déjà hors-ligne : on n'attend pas, on montre le formulaire.
    if (isBackendOffline()) {
      setState({ loading: false, isAdmin: false, email: null, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    // Garde-fou : timeout 8s pour ne JAMAIS rester bloqué sur l'écran gris.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/admin/whoami`, {
        headers: { "x-admin-token": t },
        signal: ctrl.signal,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.isAdmin) {
        clearAdminSession();
        setState({ loading: false, isAdmin: false, email: null, error: "Session expirée" });
        return;
      }
      setState({ loading: false, isAdmin: true, email: j.email, error: null });
    } catch (e) {
      // Timeout / réseau : on libère l'UI → le formulaire de connexion s'affiche.
      if (isNetworkError(e) || (e as Error)?.name === "AbortError") markBackendOffline("admin/whoami", e);
      clearAdminSession();
      setState({ loading: false, isAdmin: false, email: null, error: null });
    } finally {
      clearTimeout(timer);
    }
  }

  useEffect(() => { void refresh(); }, [logged]);
  return { ...state, refresh };
}
