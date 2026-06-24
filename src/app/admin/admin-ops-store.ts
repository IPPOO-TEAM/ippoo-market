/* Local-first store for admin operational extensions:
   - Platform-wide announcements (broadcast banners)
   - Sub-admin roles & permissions
   No backend deploy required - persisted in localStorage. */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { FUNCTIONS_BASE, SUPABASE_ANON_KEY } from "../lib/runtime-config";
import { getAccessToken } from "../auth/supabase";
import { isBackendOffline, isNetworkError, markBackendOffline } from "../lib/backend-health";

/* ─── ANNOUNCEMENTS ─── */

export type AnnouncementLevel = "info" | "success" | "warning" | "critical";
export type AnnouncementAudience = "all" | "buyers" | "vendors" | "admin";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  level: AnnouncementLevel;
  audience: AnnouncementAudience;
  startsAt: number;
  endsAt: number | null;
  createdAt: number;
  active: boolean;
};

/* ─── SUB-ADMINS ─── */

export type AdminPermission =
  | "orders"
  | "products"
  | "vendors"
  | "users"
  | "kyc"
  | "escrow"
  | "support"
  | "reviews"
  | "promos"
  | "finance"
  | "content"
  | "settings"
  | "disputes"
  | "announcements"
  | "team";

export type SubAdmin = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "ops" | "finance" | "moderator" | "support" | "custom";
  permissions: AdminPermission[];
  status: "active" | "invited" | "suspended";
  invitedAt: number;
  lastSeenAt?: number;
};

export const ROLE_PRESETS: Record<SubAdmin["role"], AdminPermission[]> = {
  owner: ["orders", "products", "vendors", "users", "kyc", "escrow", "support", "reviews", "promos", "finance", "content", "settings", "disputes", "announcements", "team"],
  ops: ["orders", "products", "vendors", "kyc", "escrow", "disputes"],
  finance: ["escrow", "finance", "disputes"],
  moderator: ["products", "reviews", "vendors"],
  support: ["support", "orders", "users"],
  custom: [],
};

type OpsState = {
  announcements: Announcement[];
  subAdmins: SubAdmin[];
};

const KEY = "ippoo:admin-ops:v1";

function defaultState(): OpsState {
  return { announcements: [], subAdmins: [] };
}

function load(): OpsState {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

let state: OpsState = load();
const listeners = new Set<() => void>();
let snapshot = JSON.stringify(state);

function persist() {
  safeSetItem(KEY, JSON.stringify(state));
  snapshot = JSON.stringify(state);
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribeOps(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function getOpsSnapshot(): string { return snapshot; }
export function getOpsState(): OpsState { return state; }

/* ─── ANNOUNCEMENT API ─── */

export function listAnnouncements(): Announcement[] {
  return [...state.announcements].sort((a, b) => b.createdAt - a.createdAt);
}

export function activeAnnouncements(audience?: AnnouncementAudience): Announcement[] {
  const now = Date.now();
  return state.announcements.filter((a) => {
    if (!a.active) return false;
    if (a.startsAt > now) return false;
    if (a.endsAt !== null && a.endsAt <= now) return false;
    if (audience && a.audience !== "all" && a.audience !== audience) return false;
    return true;
  });
}

export function createAnnouncement(input: Omit<Announcement, "id" | "createdAt" | "active"> & { active?: boolean }): Announcement {
  const a: Announcement = {
    ...input,
    active: input.active ?? true,
    id: `ANN-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    createdAt: Date.now(),
  };
  state.announcements = [a, ...state.announcements];
  emit();
  pushAnnouncement(a);
  return a;
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>) {
  let updated: Announcement | undefined;
  state.announcements = state.announcements.map((a) => {
    if (a.id !== id) return a;
    updated = { ...a, ...patch };
    return updated;
  });
  emit();
  if (updated) pushAnnouncement(updated);
}

export function deleteAnnouncement(id: string) {
  state.announcements = state.announcements.filter((a) => a.id !== id);
  emit();
  removeAnnouncement(id);
}

/* ─── Sync serveur des annonces (best-effort) ───────────────────── */

const ANN_BASE = FUNCTIONS_BASE;
let annHydrated = false;
let annLastFetch = 0;
const ANN_REFRESH_MS = 30_000;

/** Récupère les annonces serveur et fusionne dans le state local. */
export async function refreshAnnouncements(force = false): Promise<void> {
  if (typeof window === "undefined" || isBackendOffline()) return;
  if (!force && Date.now() - annLastFetch < ANN_REFRESH_MS && state.announcements.length) return;
  try {
    const res = await fetch(`${ANN_BASE}/announcements/public`, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return;
    const j = await res.json();
    const items: Announcement[] = Array.isArray(j?.items) ? j.items : [];
    annLastFetch = Date.now();
    // Le serveur fait foi : on remplace, en gardant les locales non encore synchronisées.
    const byId = new Map<string, Announcement>();
    for (const a of items) if (a?.id) byId.set(a.id, a);
    for (const a of state.announcements) if (a?.id && !byId.has(a.id)) byId.set(a.id, a);
    state.announcements = Array.from(byId.values());
    emit();
  } catch (e) {
    if (isNetworkError(e)) markBackendOffline("announcements/public", e);
  }
}

/** Hydratation initiale (appelée au montage des pages concernées). */
export function hydrateAnnouncements() {
  if (annHydrated || typeof window === "undefined") return;
  annHydrated = true;
  refreshAnnouncements(true).catch(() => undefined);
}

async function pushAnnouncement(a: Announcement): Promise<void> {
  const token = await getAccessToken().catch(() => null);
  if (!token) return; // invité/non-admin : on garde au moins en local
  try {
    await fetch(`${ANN_BASE}/announcements/${encodeURIComponent(a.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: a }),
    });
  } catch { /* best-effort */ }
}

async function removeAnnouncement(id: string): Promise<void> {
  const token = await getAccessToken().catch(() => null);
  if (!token) return;
  try {
    await fetch(`${ANN_BASE}/announcements/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch { /* best-effort */ }
}

/* ─── SUB-ADMIN API ─── */

export function listSubAdmins(): SubAdmin[] {
  return [...state.subAdmins].sort((a, b) => b.invitedAt - a.invitedAt);
}

export function inviteSubAdmin(input: { email: string; name: string; role: SubAdmin["role"]; permissions?: AdminPermission[] }): SubAdmin {
  const perms = input.permissions ?? ROLE_PRESETS[input.role];
  const sa: SubAdmin = {
    id: `SA-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim() || input.email,
    role: input.role,
    permissions: perms,
    status: "invited",
    invitedAt: Date.now(),
  };
  state.subAdmins = [sa, ...state.subAdmins.filter((x) => x.email !== sa.email)];
  emit();
  return sa;
}

export function updateSubAdmin(id: string, patch: Partial<Pick<SubAdmin, "role" | "permissions" | "status" | "name">>) {
  state.subAdmins = state.subAdmins.map((s) => {
    if (s.id !== id) return s;
    const next = { ...s, ...patch };
    if (patch.role && !patch.permissions) next.permissions = ROLE_PRESETS[patch.role];
    return next;
  });
  emit();
}

export function deleteSubAdmin(id: string) {
  state.subAdmins = state.subAdmins.filter((s) => s.id !== id);
  emit();
}

export function hasPermission(adminId: string | null | undefined, perm: AdminPermission): boolean {
  if (!adminId) return true; // legacy single-admin = full access
  const sa = state.subAdmins.find((s) => s.id === adminId);
  if (!sa || sa.status !== "active") return false;
  return sa.permissions.includes(perm);
}
