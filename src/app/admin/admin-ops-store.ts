/* Local-first store for admin operational extensions:
   - Platform-wide announcements (broadcast banners)
   - Sub-admin roles & permissions
   No backend deploy required - persisted in localStorage. */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";

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
  return a;
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>) {
  state.announcements = state.announcements.map((a) => a.id === id ? { ...a, ...patch } : a);
  emit();
}

export function deleteAnnouncement(id: string) {
  state.announcements = state.announcements.filter((a) => a.id !== id);
  emit();
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
