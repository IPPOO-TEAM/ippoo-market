import { useSyncExternalStore } from "react";
import { logAudit } from "./audit";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

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
}

export function resetAdminSettings() {
  state = defaults();
  emit();
  logAudit("settings.reset", "Paramètres back-office");
}
