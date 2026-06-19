// Store local pour la fonctionnalité Achat Groupé (Groupements Famille).
// État persistant (localStorage) + abonnements pour refresh UI.
// Intégré au portefeuille IPPOO CASH pour les paiements de part.
import { scopedGetItem, scopedSetItem, scopedKey } from "../lib/scoped-storage";
import { pushNotification } from "../notifications/store";
import { payWalletInstant } from "../payments/store";
import { publishGroup, unpublishGroup, refreshPublicGroups } from "../data/public-groups";

export interface GroupParticipant {
  id: string;          // identifiant local (uuid timestamp)
  name: string;
  qty: number;         // nombre d'unités souscrites
  amount: number;      // montant dû en FCFA (= qty * prix palier courant)
  paid: boolean;
  paidAt?: number;
  txnId?: string;
}

export type GroupStatus = "ouvert" | "complet" | "verrouillé" | "livré" | "annulé";
export type GroupPaymentMode = "individuel" | "leader";

export interface Group {
  id: string;                     // GRP-xxxx
  name: string;
  product: string;
  image: string;
  organizer: string;
  organizerId: string;            // identifiant local du créateur
  zone: string;
  targetQty: number;
  maxParticipants: number;
  priceNormal: number;
  paliers: { pct: number; price: number }[];
  paymentMode: GroupPaymentMode;
  delivery: string;
  status: GroupStatus;
  participants: GroupParticipant[];
  createdAt: number;
  expiresAt: number;              // timestamp
}

type State = { groups: Group[] };

const KEY = "ippoo:groups";

function load(): State {
  try {
    const raw = scopedGetItem(KEY);
    if (!raw) return { groups: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.groups)) return { groups: [] };
    return { groups: parsed.groups as Group[] };
  } catch {
    return { groups: [] };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() { scopedSetItem(KEY, JSON.stringify(state)); }
function emit() { persist(); listeners.forEach((l) => l()); }

/** Publie un groupement modifié vers le registre public (best-effort, non bloquant). */
function syncPublish(g: Group) {
  publishGroup(g).catch(() => undefined);
}
function syncUnpublish(id: string) {
  unpublishGroup(id).catch(() => undefined);
}

// Démarre un refresh initial du registre public pour hydrater le cache local.
if (typeof window !== "undefined") {
  refreshPublicGroups().catch(() => undefined);
}

// Synchronisation cross-tab : si un autre onglet (ou la fenêtre de l'invité
// qui vient d'utiliser ?join=) modifie la liste, on rejoue l'état et on
// notifie les abonnés pour que le toaster "Nouveau membre" se déclenche.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== scopedKey(KEY)) return;
    state = load();
    listeners.forEach((l) => l());
  });
}

export function subscribeGroups(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getGroups(): Group[] {
  return state.groups;
}

export function getGroup(id: string): Group | undefined {
  return state.groups.find((g) => g.id === id);
}

/**
 * Cherche un groupement encore ouvert organisé par `organizerId` pour le même
 * produit (comparaison insensible à la casse / accents) afin de fusionner les
 * relances multiples côté fiche produit plutôt que d'empiler les groupes.
 */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
export function findOpenGroupFor(
  organizerId: string,
  product: string,
): Group | undefined {
  const target = normalize(product);
  return state.groups.find(
    (g) =>
      g.organizerId === organizerId &&
      g.status === "ouvert" &&
      g.expiresAt > Date.now() &&
      normalize(g.product) === target,
  );
}

/**
 * Augmente la cible / le plafond participants d'un groupement existant et
 * met à jour la part initiale de l'organisateur (sans dupliquer le groupe).
 */
export function extendGroup(
  groupId: string,
  patch: {
    targetQty?: number;
    maxParticipants?: number;
    organizerQty?: number;
    durationHours?: number;
  },
): Group | undefined {
  const g = state.groups.find((x) => x.id === groupId);
  if (!g) return undefined;
  const targetQty = Math.max(g.targetQty, patch.targetQty ?? g.targetQty);
  const maxParticipants = Math.max(g.maxParticipants, patch.maxParticipants ?? g.maxParticipants);
  const expiresAt = patch.durationHours
    ? Math.max(g.expiresAt, Date.now() + patch.durationHours * 3_600_000)
    : g.expiresAt;
  let nextParticipants = g.participants;
  if (typeof patch.organizerQty === "number" && patch.organizerQty > 0) {
    const exists = g.participants.find((p) => p.id === g.organizerId);
    if (exists) {
      if (!exists.paid) {
        nextParticipants = g.participants.map((p) =>
          p.id === g.organizerId ? { ...p, qty: Math.max(p.qty, patch.organizerQty!) } : p,
        );
      }
    } else {
      nextParticipants = [
        { id: g.organizerId, name: g.organizer, qty: patch.organizerQty, amount: 0, paid: false },
        ...g.participants,
      ];
    }
  }
  let next: Group = { ...g, targetQty, maxParticipants, expiresAt, participants: nextParticipants };
  next = recomputeAmounts(next);
  next = transition(next);
  state.groups = state.groups.map((x) => (x.id === groupId ? next : x));
  emit();
  syncPublish(next);
  return next;
}

/* ─── Helpers ─── */
export function currentPalierPrice(g: Group): number {
  const qty = g.participants.reduce((s, p) => s + p.qty, 0);
  const pct = g.targetQty > 0 ? (qty / g.targetQty) * 100 : 0;
  const reached = [...g.paliers].sort((a, b) => a.pct - b.pct).filter((p) => pct >= p.pct).pop();
  return reached ? reached.price : g.priceNormal;
}

export function currentQty(g: Group): number {
  return g.participants.reduce((s, p) => s + p.qty, 0);
}

export function timeLeftLabel(g: Group): string {
  if (g.status === "verrouillé" || g.status === "livré") return "Verrouillé";
  if (g.status === "annulé") return "Annulé";
  const ms = g.expiresAt - Date.now();
  if (ms <= 0) return "Expiré";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}j restants`;
  if (h >= 1) return `${h}h restantes`;
  const m = Math.max(1, Math.floor(ms / 60_000));
  return `${m} min restantes`;
}

function genId(prefix = "GRP"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

function recomputeAmounts(g: Group): Group {
  const price = currentPalierPrice(g);
  return {
    ...g,
    participants: g.participants.map((p) => ({ ...p, amount: p.paid ? p.amount : p.qty * price })),
  };
}

function transition(g: Group): Group {
  const qty = currentQty(g);
  if (g.status === "ouvert" && qty >= g.targetQty) return { ...g, status: "complet" };
  return g;
}

/* ─── CRUD ─── */
export type CreateGroupInput = {
  name: string;
  product: string;
  image: string;
  organizer: string;
  organizerId: string;
  zone: string;
  targetQty: number;
  maxParticipants: number;
  priceNormal: number;
  paliers?: { pct: number; price: number }[];
  paymentMode: GroupPaymentMode;
  delivery: string;
  durationHours: number;
  /** Participation initiale du créateur (qty). 0 = ne participe pas. */
  organizerQty?: number;
};

export function createGroup(input: CreateGroupInput): Group {
  const id = genId("GRP");
  const paliers = (input.paliers && input.paliers.length > 0)
    ? input.paliers
    : [
      { pct: 30, price: Math.round(input.priceNormal * 0.92) },
      { pct: 60, price: Math.round(input.priceNormal * 0.85) },
      { pct: 100, price: Math.round(input.priceNormal * 0.75) },
    ];
  const expiresAt = Date.now() + Math.max(1, input.durationHours) * 3_600_000;
  const initialQty = Math.max(0, Math.floor(input.organizerQty ?? 0));
  const g0: Group = {
    id,
    name: input.name,
    product: input.product,
    image: input.image,
    organizer: input.organizer,
    organizerId: input.organizerId,
    zone: input.zone,
    targetQty: Math.max(1, input.targetQty),
    maxParticipants: Math.max(1, input.maxParticipants),
    priceNormal: input.priceNormal,
    paliers,
    paymentMode: input.paymentMode,
    delivery: input.delivery,
    status: "ouvert",
    participants: initialQty > 0 ? [{
      id: input.organizerId,
      name: input.organizer,
      qty: initialQty,
      amount: initialQty * input.priceNormal,
      paid: false,
    }] : [],
    createdAt: Date.now(),
    expiresAt,
  };
  const g = transition(recomputeAmounts(g0));
  state.groups = [g, ...state.groups];
  emit();
  syncPublish(g);
  pushNotification({
    type: "system",
    title: "Groupement créé",
    desc: `${g.name} · cible ${g.targetQty} ${g.product}`,
    link: "/achat-groupe",
    color: "#E11D2E",
  });
  return g;
}

export function joinGroup(
  groupId: string,
  participant: { id: string; name: string; qty: number },
): { ok: true; group: Group } | { ok: false; error: string } {
  const g = state.groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  if (g.status !== "ouvert" && g.status !== "complet") return { ok: false, error: "Ce groupement est fermé" };
  if (Date.now() > g.expiresAt) return { ok: false, error: "Ce groupement a expiré" };
  if (g.participants.length >= g.maxParticipants && !g.participants.some((p) => p.id === participant.id)) {
    return { ok: false, error: "Nombre maximum de membres atteint" };
  }
  if (participant.qty < 1) return { ok: false, error: "Quantité invalide" };

  const exists = g.participants.find((p) => p.id === participant.id);
  let nextParticipants;
  if (exists) {
    if (exists.paid) return { ok: false, error: "Votre part est déjà réglée, retirez-vous d'abord" };
    nextParticipants = g.participants.map((p) => (p.id === participant.id ? {
      ...p, qty: participant.qty, amount: 0,
    } : p));
  } else {
    nextParticipants = [...g.participants, {
      id: participant.id, name: participant.name,
      qty: participant.qty, amount: 0, paid: false,
    }];
  }
  let next: Group = { ...g, participants: nextParticipants };
  next = recomputeAmounts(next);
  next = transition(next);
  state.groups = state.groups.map((x) => (x.id === groupId ? next : x));
  emit();
  syncPublish(next);
  pushNotification({
    type: "system",
    title: "Inscription au groupement",
    desc: `${participant.name} · ${participant.qty} part(s) dans ${g.name}`,
    link: "/achat-groupe",
    color: "#3B82F6",
  });
  return { ok: true, group: next };
}

export function leaveGroup(groupId: string, participantId: string): { ok: boolean; error?: string } {
  const g = state.groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  const member = g.participants.find((p) => p.id === participantId);
  if (!member) return { ok: false, error: "Vous ne participez pas à ce groupement" };
  if (member.paid) return { ok: false, error: "Part déjà payée — contactez le responsable pour un remboursement" };
  let next: Group = { ...g, participants: g.participants.filter((p) => p.id !== participantId) };
  next = recomputeAmounts(next);
  if (next.status === "complet" && currentQty(next) < g.targetQty) next = { ...next, status: "ouvert" };
  state.groups = state.groups.map((x) => (x.id === groupId ? next : x));
  emit();
  syncPublish(next);
  return { ok: true };
}

/** Paie sa part via IPPOO CASH. Verrouille le groupe quand 100 % des parts sont payées et cible atteinte. */
export function payShare(
  groupId: string,
  participantId: string,
): { ok: true; txnId: string } | { ok: false; error: string; deficit?: number } {
  const g = state.groups.find((x) => x.id === groupId);
  if (!g) return { ok: false, error: "Groupement introuvable" };
  const member = g.participants.find((p) => p.id === participantId);
  if (!member) return { ok: false, error: "Vous ne participez pas à ce groupement" };
  if (member.paid) return { ok: false, error: "Part déjà réglée" };
  const result = payWalletInstant({
    amount: member.amount,
    label: `Achat groupé · ${g.name}`,
    vendor: g.organizer,
  });
  if (!result.ok) return { ok: false, error: result.error, deficit: (result as { deficit?: number }).deficit };
  const updatedParticipants = g.participants.map((p) => (p.id === participantId ? {
    ...p, paid: true, paidAt: Date.now(), txnId: result.txnId,
  } : p));
  let next: Group = { ...g, participants: updatedParticipants };
  const allPaid = next.participants.length > 0 && next.participants.every((p) => p.paid);
  if (allPaid && currentQty(next) >= next.targetQty) next = { ...next, status: "verrouillé" };
  state.groups = state.groups.map((x) => (x.id === groupId ? next : x));
  emit();
  syncPublish(next);
  if (next.status === "verrouillé") {
    pushNotification({
      type: "system",
      title: "Groupement verrouillé",
      desc: `${next.name} · commande confirmée chez ${next.organizer}`,
      link: "/achat-groupe",
      color: "#16A34A",
    });
  }
  return { ok: true, txnId: result.txnId };
}

export function closeGroup(groupId: string, status: GroupStatus = "annulé") {
  let updated: Group | undefined;
  state.groups = state.groups.map((g) => {
    if (g.id !== groupId) return g;
    updated = { ...g, status };
    return updated;
  });
  emit();
  if (updated) syncPublish(updated);
}

export function deleteGroup(groupId: string) {
  state.groups = state.groups.filter((g) => g.id !== groupId);
  emit();
  syncUnpublish(groupId);
}

export function markDelivered(groupId: string) {
  let updated: Group | undefined;
  state.groups = state.groups.map((g) => {
    if (g.id !== groupId) return g;
    updated = { ...g, status: "livré" as const };
    return updated;
  });
  emit();
  if (updated) syncPublish(updated);
}
