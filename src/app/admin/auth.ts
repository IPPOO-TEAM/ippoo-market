/* ═══════════════════════════════════════════
   IPPOO — Auth admin (serveur + PIN local)
   ─────────────────────────────────────────
   1. La vérification *réelle* du rôle admin se fait côté serveur
      via /admin/whoami (email présent dans IPPOO_ADMIN_EMAILS).
   2. Un PIN local (TOTP simplifié) sert de seconde barrière pour
      éviter qu'un onglet ouvert sans surveillance donne accès.
   ═══════════════════════════════════════════ */

import { useEffect, useState, useSyncExternalStore } from "react";
import { logAudit } from "./audit";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";
import { adminWhoami } from "../data/admin-server";

const SESSION_KEY = "ippoo:admin-session";
const PIN_KEY = "ippoo:admin-pin";
const LOCKOUT_KEY = "ippoo:admin-lockout";
const WHOAMI_CACHE_KEY = "ippoo:admin-whoami";
const TTL_MS = 4 * 60 * 60 * 1000;
const WHOAMI_TTL_MS = 10 * 60 * 1000;
const DEFAULT_PIN = "1234";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

type Lockout = { fails: number; until: number };

function readLockout(): Lockout {
  try {
    const raw = safeGetItem(LOCKOUT_KEY);
    if (!raw) return { fails: 0, until: 0 };
    return JSON.parse(raw) as Lockout;
  } catch {
    return { fails: 0, until: 0 };
  }
}

function writeLockout(l: Lockout) {
  safeSetItem(LOCKOUT_KEY, JSON.stringify(l));
}

export function getLockoutRemaining(): number {
  const l = readLockout();
  if (l.until <= Date.now()) return 0;
  return l.until - Date.now();
}

type Session = { authedAt: number };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readSession(): Session | null {
  try {
    const raw = safeGetItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.authedAt || Date.now() - s.authedAt > TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

function getPin(): string {
  return safeGetItem(PIN_KEY) || DEFAULT_PIN;
}

export function isAdminPinAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return !!readSession();
}

/* Compat : ancien nom. La garde réelle utilise désormais useAdminAccess(). */
export function isAdminAuthed(): boolean {
  return isAdminPinAuthed();
}

export function subscribeAdminAuth(fn: () => void) {
  listeners.add(fn);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === WHOAMI_CACHE_KEY) fn();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(fn);
  };
}

export function useAdminAuth(): boolean {
  return useSyncExternalStore(subscribeAdminAuth, isAdminPinAuthed, () => false);
}

export function loginAdmin(pin: string): { ok: true } | { ok: false; error: string } {
  const remaining = getLockoutRemaining();
  if (remaining > 0) {
    return { ok: false, error: `Trop de tentatives. Réessayez dans ${Math.ceil(remaining / 60000)} min.` };
  }
  if (pin !== getPin()) {
    const l = readLockout();
    const fails = l.fails + 1;
    if (fails >= MAX_ATTEMPTS) {
      writeLockout({ fails: 0, until: Date.now() + LOCKOUT_MS });
      return { ok: false, error: `Compte verrouillé pendant ${Math.ceil(LOCKOUT_MS / 60000)} min` };
    }
    writeLockout({ fails, until: 0 });
    return { ok: false, error: `PIN incorrect (${MAX_ATTEMPTS - fails} essai(s) restant(s))` };
  }
  writeLockout({ fails: 0, until: 0 });
  safeSetItem(SESSION_KEY, JSON.stringify({ authedAt: Date.now() } as Session));
  emit();
  logAudit("auth.login", "Session admin");
  return { ok: true };
}

export function logoutAdmin() {
  safeRemoveItem(SESSION_KEY);
  safeRemoveItem(WHOAMI_CACHE_KEY);
  emit();
  logAudit("auth.logout", "Session admin");
}

export function changeAdminPin(currentPin: string, newPin: string): { ok: true } | { ok: false; error: string } {
  if (currentPin !== getPin()) return { ok: false, error: "PIN actuel incorrect" };
  if (!/^\d{4,8}$/.test(newPin)) return { ok: false, error: "Le nouveau PIN doit contenir 4 à 8 chiffres" };
  safeSetItem(PIN_KEY, newPin);
  logAudit("auth.pin_change", "PIN admin modifié");
  return { ok: true };
}

/* ─── Vérification serveur du rôle admin (vraie sécurité) ─── */
type WhoamiCache = { isAdmin: boolean; email: string | null; checkedAt: number };

function readWhoamiCache(): WhoamiCache | null {
  try {
    const raw = safeGetItem(WHOAMI_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as WhoamiCache;
    if (!c.checkedAt || Date.now() - c.checkedAt > WHOAMI_TTL_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export type AdminAccess = {
  loading: boolean;
  serverAuthorized: boolean;     // email dans IPPOO_ADMIN_EMAILS (serveur)
  pinAuthorized: boolean;        // PIN local validé
  email: string | null;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Vérifie le rôle admin via /admin/whoami serveur, et expose en plus
 * le statut du PIN local. L'admin n'est totalement autorisé que si
 * `serverAuthorized && pinAuthorized`.
 */
export function useAdminAccess(): AdminAccess {
  const pinAuthorized = useAdminAuth();
  const [state, setState] = useState<Omit<AdminAccess, "pinAuthorized" | "refresh">>(() => {
    const cached = readWhoamiCache();
    if (cached) {
      return { loading: false, serverAuthorized: cached.isAdmin, email: cached.email, error: null };
    }
    return { loading: true, serverAuthorized: false, email: null, error: null };
  });

  async function refresh() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await adminWhoami();
      safeSetItem(WHOAMI_CACHE_KEY, JSON.stringify({ isAdmin: r.isAdmin, email: r.email, checkedAt: Date.now() }));
      setState({ loading: false, serverAuthorized: r.isAdmin, email: r.email, error: null });
    } catch (e: any) {
      setState({ loading: false, serverAuthorized: false, email: null, error: e?.message || "Vérification impossible" });
    }
  }

  useEffect(() => {
    void refresh();
    // Re-vérifie périodiquement tant que l'onglet est ouvert
    const id = setInterval(() => { void refresh(); }, WHOAMI_TTL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, pinAuthorized, refresh };
}
