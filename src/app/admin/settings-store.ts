import { useSyncExternalStore } from "react";
import { logAudit } from "./audit";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { apiFetch } from "../api/client";
import { logger } from "../lib/logger";
import { isBackendOffline, isNetworkError } from "../lib/backend-health";

// Champs « plateforme » persistés côté serveur (source unique de vérité).
// Les autres réglages (notifications, maintenance UI…) restent locaux.
const SERVER_FIELDS = [
  "commission", "vatRate", "shippingStd", "shippingExpress",
  "freeShippingThreshold", "defaultCurrency", "refundWindowDays",
] as const;

export type AdminSettings = {
  commission: number;
  vatRate: number;
  shippingStd: number;
  shippingExpress: number;
  maintenance: boolean;
  freeShippingThreshold: number;
  defaultCurrency: string;
  defaultLanguage: string;
  refundWindowDays: number;
  payoutFrequency: "daily" | "weekly" | "monthly";
  requireKycForVendors: boolean;
  allowGuestCheckout: boolean;
  notifyNewVendor: boolean;
  notifyNewTicket: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;
  publicOrigin: string;
  vapidPublicKey: string;
};

const KEY = "ippoo:admin-settings";

function defaults(): AdminSettings {
  return {
    commission: 8,
    vatRate: 18,
    shippingStd: 2500,
    shippingExpress: 5000,
    maintenance: false,
    freeShippingThreshold: 50000,
    defaultCurrency: "XOF",
    defaultLanguage: "Français",
    refundWindowDays: 7,
    payoutFrequency: "weekly",
    requireKycForVendors: true,
    allowGuestCheckout: false,
    notifyNewVendor: true,
    notifyNewTicket: true,
    notifyLowStock: true,
    lowStockThreshold: 10,
    publicOrigin: "https://ippoomarket.figma.site",
    vapidPublicKey: "",
  };
}

const SERVER_SNAPSHOT: AdminSettings = defaults();
let state: AdminSettings = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): AdminSettings {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function hydrateAdminSettings() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());
  // Aligne les champs « plateforme » sur la source de vérité serveur.
  refreshPlatformSettings().catch(() => undefined);
}

/** Récupère les réglages plateforme publics (commission/TVA/livraison) depuis le serveur. */
export async function refreshPlatformSettings(): Promise<void> {
  if (isBackendOffline()) return;
  try {
    const j = await apiFetch<{ settings: Partial<AdminSettings> }>("/settings/public", { auth: false });
    if (j?.settings) {
      state = { ...state, ...j.settings };
      emit();
    }
  } catch (e) {
    // Échec réseau (backend non déployé) : silencieux, on garde les réglages locaux.
    if (isNetworkError(e) || isBackendOffline()) return;
    logger.warn(`refreshPlatformSettings: ${(e as Error)?.message ?? e}`);
  }
}

function persist() {
  safeSetItem(KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function getAdminSettings(): AdminSettings {
  return state;
}

export function subscribeAdminSettings(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useAdminSettings(): AdminSettings {
  return useSyncExternalStore(subscribeAdminSettings, getAdminSettings, () => SERVER_SNAPSHOT);
}

export function updateAdminSettings(patch: Partial<AdminSettings>) {
  state = { ...state, ...patch };
  emit();
  logAudit("settings.update", "Paramètres back-office", { fields: Object.keys(patch).join(",") });
  // Persiste les champs « plateforme » côté serveur (admin uniquement, best-effort).
  const serverPatch: Record<string, unknown> = {};
  for (const k of SERVER_FIELDS) if (k in patch) serverPatch[k] = (patch as any)[k];
  if (Object.keys(serverPatch).length > 0) {
    apiFetch("/admin/settings", { method: "PUT", body: serverPatch })
      .catch((e) => logger.warn(`settings PUT serveur: ${(e as Error)?.message ?? e}`));
  }
}

export function resetAdminSettings() {
  state = defaults();
  emit();
  logAudit("settings.reset", "Paramètres back-office");
}
