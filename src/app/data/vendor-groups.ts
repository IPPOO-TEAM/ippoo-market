/* IPPOO - Groupements de vendeurs.
   Un groupement réunit jusqu'à 7 vendeurs d'une même niche ou de niches
   complémentaires. Les vendeurs peuvent créer, rejoindre, quitter. Les
   groupements sont visibles publiquement (page "/groupements") et
   modérables par l'admin. Persisté en localStorage avec pattern store
   subscribe/snapshot. */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export const MAX_MEMBERS = 7;

export type GroupMemberRole = "leader" | "member";
export type GroupMemberStatus = "pending" | "active" | "removed";
export type GroupStatus = "forming" | "active" | "archived" | "rejected";
export type GroupVisibility = "public" | "private";

export type VendorGroupMember = {
  vendorId: string;        // shopSlug ou ownerId
  vendorName: string;
  vendorNiche?: string;
  vendorCity?: string;
  avatar?: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: number;
};

export type VendorGroup = {
  id: string;
  name: string;
  description: string;
  /** Niche principale du groupement (ex. "Alimentaire"). */
  primaryNiche: string;
  /** Niches complémentaires autorisées (ex. ["Emballage", "Boissons"]). */
  complementaryNiches: string[];
  city?: string;
  tags: string[];
  coverImage?: string;
  visibility: GroupVisibility;
  status: GroupStatus;
  members: VendorGroupMember[];
  /** ID du leader (créateur). */
  leaderId: string;
  /** Motivation/charte du groupement (visible aux candidats). */
  charter?: string;
  createdAt: number;
  updatedAt: number;
  /** Modération admin. */
  moderation: "pending" | "approved" | "rejected";
  moderationReason?: string;
  moderatedAt?: number;
};

const STORAGE_KEY = "ippoo:vendor-groups:v1";

let groups: VendorGroup[] = load();
const listeners = new Set<() => void>();
let snapshot = JSON.stringify(groups);

function load(): VendorGroup[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  safeSetItem(STORAGE_KEY, JSON.stringify(groups));
  snapshot = JSON.stringify(groups);
}
function emit() { persist(); listeners.forEach((l) => l()); }

export function subscribeVendorGroups(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function getVendorGroupsSnapshot(): string { return snapshot; }

/* ─── LECTURE ─── */

export function listAllVendorGroups(): VendorGroup[] {
  return [...groups].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Groupements visibles publiquement (statut approuvé + visibility public). */
export function listPublicVendorGroups(): VendorGroup[] {
  return groups
    .filter((g) => g.visibility === "public" && g.moderation === "approved" && g.status !== "archived")
    .sort((a, b) => activeMembers(b).length - activeMembers(a).length || b.updatedAt - a.updatedAt);
}

export function listGroupsForVendor(vendorId: string): VendorGroup[] {
  return groups.filter((g) => g.members.some((m) => m.vendorId === vendorId && m.status !== "removed"));
}

export function getVendorGroup(id: string): VendorGroup | undefined {
  return groups.find((g) => g.id === id);
}

export function activeMembers(g: VendorGroup): VendorGroupMember[] {
  return g.members.filter((m) => m.status === "active");
}

export function isFull(g: VendorGroup): boolean {
  return activeMembers(g).length >= MAX_MEMBERS;
}

/* ─── CRÉATION & EDITION ─── */

export type CreateGroupInput = {
  name: string;
  description: string;
  primaryNiche: string;
  complementaryNiches?: string[];
  city?: string;
  tags?: string[];
  coverImage?: string;
  visibility?: GroupVisibility;
  charter?: string;
  leader: Omit<VendorGroupMember, "role" | "status" | "joinedAt">;
};

export function createVendorGroup(input: CreateGroupInput): VendorGroup {
  const now = Date.now();
  const leader: VendorGroupMember = {
    ...input.leader,
    role: "leader",
    status: "active",
    joinedAt: now,
  };
  const g: VendorGroup = {
    id: `VG-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    primaryNiche: input.primaryNiche,
    complementaryNiches: input.complementaryNiches ?? [],
    city: input.city,
    tags: input.tags ?? [],
    coverImage: input.coverImage,
    visibility: input.visibility ?? "public",
    status: "forming",
    members: [leader],
    leaderId: leader.vendorId,
    charter: input.charter,
    createdAt: now,
    updatedAt: now,
    moderation: "pending",
  };
  groups = [g, ...groups];
  emit();
  return g;
}

export function updateVendorGroup(id: string, patch: Partial<Omit<VendorGroup, "id" | "members" | "leaderId" | "createdAt">>) {
  groups = groups.map((g) => g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g);
  emit();
}

export function deleteVendorGroup(id: string) {
  groups = groups.filter((g) => g.id !== id);
  emit();
}

/* ─── MEMBRES ─── */

export type JoinResult = { ok: true; group: VendorGroup } | { ok: false; error: string };

/** Un vendeur rejoint un groupement (statut "pending" si moderation requise par
 *  le leader sinon "active"). Refuse si déjà membre ou plein. */
export function joinVendorGroup(groupId: string, candidate: Omit<VendorGroupMember, "role" | "status" | "joinedAt">, autoApprove = true): JoinResult {
  const g = groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  if (g.members.some((m) => m.vendorId === candidate.vendorId && m.status !== "removed")) {
    return { ok: false, error: "Vous êtes déjà membre de ce groupement" };
  }
  if (isFull(g)) return { ok: false, error: `Groupement complet (${MAX_MEMBERS}/${MAX_MEMBERS})` };
  if (g.moderation !== "approved") return { ok: false, error: "Groupement en attente de modération admin" };

  const member: VendorGroupMember = {
    ...candidate,
    role: "member",
    status: autoApprove ? "active" : "pending",
    joinedAt: Date.now(),
  };
  groups = groups.map((x) => {
    if (x.id !== groupId) return x;
    const nextMembers = [...x.members, member];
    const activeCount = nextMembers.filter((m) => m.status === "active").length;
    return {
      ...x,
      members: nextMembers,
      status: activeCount >= MAX_MEMBERS ? "active" : "forming",
      updatedAt: Date.now(),
    };
  });
  emit();
  return { ok: true, group: groups.find((x) => x.id === groupId)! };
}

export function leaveVendorGroup(groupId: string, vendorId: string): { ok: boolean; error?: string } {
  const g = groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  if (g.leaderId === vendorId) return { ok: false, error: "Le leader doit transférer son rôle avant de quitter" };
  groups = groups.map((x) => {
    if (x.id !== groupId) return x;
    const nextMembers = x.members.map((m) => m.vendorId === vendorId ? { ...m, status: "removed" as const } : m);
    const activeCount = nextMembers.filter((m) => m.status === "active").length;
    return { ...x, members: nextMembers, status: activeCount >= MAX_MEMBERS ? "active" : "forming", updatedAt: Date.now() };
  });
  emit();
  return { ok: true };
}

export function approveMember(groupId: string, vendorId: string) {
  groups = groups.map((g) => {
    if (g.id !== groupId) return g;
    const nextMembers = g.members.map((m) => m.vendorId === vendorId && m.status === "pending" ? { ...m, status: "active" as const } : m);
    const activeCount = nextMembers.filter((m) => m.status === "active").length;
    return { ...g, members: nextMembers, status: activeCount >= MAX_MEMBERS ? "active" : "forming", updatedAt: Date.now() };
  });
  emit();
}

export function rejectMember(groupId: string, vendorId: string) {
  groups = groups.map((g) => g.id !== groupId ? g : {
    ...g,
    members: g.members.map((m) => m.vendorId === vendorId ? { ...m, status: "removed" as const } : m),
    updatedAt: Date.now(),
  });
  emit();
}

export function transferLeadership(groupId: string, newLeaderId: string): { ok: boolean; error?: string } {
  const g = groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  if (!g.members.some((m) => m.vendorId === newLeaderId && m.status === "active")) {
    return { ok: false, error: "Le nouveau leader doit être un membre actif" };
  }
  groups = groups.map((x) => x.id !== groupId ? x : {
    ...x,
    leaderId: newLeaderId,
    members: x.members.map((m) => ({ ...m, role: m.vendorId === newLeaderId ? "leader" : (m.role === "leader" ? "member" : m.role) })),
    updatedAt: Date.now(),
  });
  emit();
  return { ok: true };
}

/* ─── MODÉRATION ADMIN ─── */

export function setGroupModeration(id: string, status: "approved" | "rejected", reason?: string) {
  groups = groups.map((g) => g.id !== id ? g : {
    ...g,
    moderation: status,
    moderationReason: status === "rejected" ? (reason ?? "Non conforme") : undefined,
    moderatedAt: Date.now(),
    status: status === "rejected" ? "rejected" as GroupStatus : g.status,
    updatedAt: Date.now(),
  });
  emit();
}

export function archiveGroup(id: string) {
  groups = groups.map((g) => g.id !== id ? g : { ...g, status: "archived", updatedAt: Date.now() });
  emit();
}
