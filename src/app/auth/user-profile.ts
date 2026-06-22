/* ═══════════════════════════════════════════
   IPPOO Market - Profil utilisateur complet
   Centralise toutes les infos saisies à l'inscription :
   perso, pro, logistique, paiement, documents.
   Persisté localStorage + abonnements (useSyncExternalStore).
   Le filtrage par accountType garantit que chaque espace compte
   n'affiche que les données pertinentes à son utilisateur.
   ═══════════════════════════════════════════ */

import type { CircuitId, JuridicalForm } from "../data/sectors";
import { scopedGetItem, scopedSetItem, scopedRemoveItem } from "../lib/scoped-storage";

export type AccountType = "acheteur" | "vendeur_individuel" | "entreprise" | "organisation";

export type DeliveryMethod = "perso" | "partenaires" | "retrait";
export type PaymentMethod = "mtn" | "moov" | "celtis" | "carte" | "livraison";
export type ShopStatus = "open" | "vacation" | "closed";

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  open: "Ouverte",
  vacation: "En vacances",
  closed: "Fermée",
};

export const SHOP_STATUS_COLORS: Record<ShopStatus, string> = {
  open: "#16A34A",
  vacation: "#F59E0B",
  closed: "#9CA3AF",
};

export type UserProfile = {
  // A. Identité (commun à tous)
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string; // base64 ou data URL

  // B. Pro (si vendeur / entreprise / organisation)
  businessName?: string;
  juridicalForm?: JuridicalForm;
  rccm?: string;       // RCCM
  ifu?: string;        // IFU
  sectorId?: string;       // "primaire" | "secondaire" | "tertiaire"
  subsectorId?: string;
  niche?: string;
  circuit?: CircuitId;
  description?: string;
  fullAddress?: string;
  country?: string; // code ISO-2 (BJ, CI, …)
  region?: string;  // région / département / état
  city?: string;
  whatsapp?: string;

  // C. Logistique (vendeurs)
  deliveryMethods?: DeliveryMethod[];
  openingHours?: string;
  processingDelay?: string;

  // D. Paiements (commun, mais les vendeurs cochent ce qu'ils acceptent)
  paymentMethods?: PaymentMethod[];
  mobileMoneyNumber?: string;

  // E. Statut boutique (vendeurs)
  shopStatus?: ShopStatus;
  vacationStart?: string; // ISO date YYYY-MM-DD
  vacationEnd?: string;   // ISO date YYYY-MM-DD

  // F. Documents (vendeurs)
  logo?: string;        // data URL
  shopPhoto?: string;   // data URL
  certificate?: string; // data URL

  // Méta
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "ippoo:user-profile";

let current: UserProfile | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

export const SERVER_SNAPSHOT: UserProfile | null = null;

function persist() {
  if (current) scopedSetItem(STORAGE_KEY, JSON.stringify(current));
  else scopedRemoveItem(STORAGE_KEY);
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function hydrateUserProfile() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (raw) current = JSON.parse(raw) as UserProfile;
  } catch {
    current = null;
  }
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getUserProfile(): UserProfile | null {
  return current;
}

export function saveUserProfile(p: Omit<UserProfile, "createdAt" | "updatedAt">) {
  const now = Date.now();
  current = {
    ...p,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
  emit();
}

export function patchUserProfile(patch: Partial<UserProfile>) {
  if (!current) return;
  current = { ...current, ...patch, updatedAt: Date.now() };
  emit();
}

export function clearUserProfile() {
  current = null;
  emit();
}

/* ─── Helpers de filtrage par type de compte ─── */

export function isSeller(p: UserProfile | null): boolean {
  return !!p && p.accountType !== "acheteur";
}

export function isBuyer(p: UserProfile | null): boolean {
  return !!p && p.accountType === "acheteur";
}

/** Calcule le statut effectif: si vacances planifiées englobent aujourd'hui → "vacation". */
export function getEffectiveShopStatus(p: Pick<UserProfile, "shopStatus" | "vacationStart" | "vacationEnd"> | null | undefined): ShopStatus {
  if (!p) return "open";
  const today = new Date().toISOString().slice(0, 10);
  if (p.vacationStart && p.vacationEnd && p.vacationStart <= today && today <= p.vacationEnd) {
    return "vacation";
  }
  return p.shopStatus ?? "open";
}

export function isOrganization(p: UserProfile | null): boolean {
  return p?.accountType === "organisation";
}

export function isBusiness(p: UserProfile | null): boolean {
  return p?.accountType === "entreprise" || p?.accountType === "organisation";
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  acheteur:            "Acheteur",
  vendeur_individuel:  "Vendeur individuel",
  entreprise:          "Entreprise / Professionnel",
  organisation:        "Organisation / Coopérative",
};

export const ACCOUNT_TYPE_DESC: Record<AccountType, string> = {
  acheteur:            "Commander, profiter des promos, jeux et cashback.",
  vendeur_individuel:  "Vendre vos produits en tant que particulier.",
  entreprise:          "Boutique en ligne complète pour votre entreprise.",
  organisation:        "Espace dédié aux coopératives, GIE et associations.",
};

/** Nom d'icône lucide-react à mapper côté UI (pas d'emoji). */
export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  acheteur:           "ShoppingBag",
  vendeur_individuel: "User",
  entreprise:         "Building2",
  organisation:       "Users",
};

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  perso:       "Livraison personnelle",
  partenaires: "Livraison via partenaires IPPOO",
  retrait:     "Retrait en boutique",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  mtn:       "MTN Mobile Money",
  moov:      "Moov Money",
  celtis:    "Celtiis Cash",
  carte:     "Carte bancaire",
  livraison: "Paiement à la livraison",
};
