/* ═══════════════════════════════════════════
   IPPOO — Synchronisation serveur des commandes
   Source unique pour acheteur (mes commandes),
   vendeur (commandes reçues) et admin (toutes
   les commandes). Cache localStorage + abonnements
   React via useSyncExternalStore.
   ═══════════════════════════════════════════ */

import { useEffect, useSyncExternalStore } from "react";
import { apiFetch } from "../api/client";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export type OrderItem = {
  productId: string;
  vendorId: string;
  title: string;
  unitPrice: number;
  qty: number;
};

export type OrderShipping = {
  name: string;
  phone: string;
  city: string;
  line1: string;
  line2?: string;
};

export type OrderPaymentMethod = "wallet" | "cod" | "card" | "mobile-money";

export type OrderStatus =
  | "pending"
  | "preparation"
  | "expedition"
  | "livree"
  | "cloturee"
  | "litige"
  | "annulee";

export type OrderRecord = {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: OrderShipping;
  paymentMethod: OrderPaymentMethod;
  total: number;
  commission: number;
  vendorShares: Record<string, number>;
  status: OrderStatus;
  escrowStatus: "held" | "released" | "refunded" | "n/a";
  createdAt: number;
  updatedAt: number;
  vendorShare?: number;
};

/* ─── Stores indépendants pour les 3 surfaces ─── */
function makeStore(cacheKey: string) {
  let state: OrderRecord[] = (() => {
    try {
      const raw = safeGetItem(cacheKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
    } catch { return []; }
  })();
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: OrderRecord[]) => {
      state = next;
      try { safeSetItem(cacheKey, JSON.stringify(state)); } catch {}
      listeners.forEach((l) => l());
    },
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  };
}

const buyerStore = makeStore("ippoo:orders:mine");
const vendorStore = makeStore("ippoo:orders:vendor");
const adminStore = makeStore("ippoo:orders:admin");

/* ─── Refresh ─── */
export async function refreshMyOrders(): Promise<OrderRecord[]> {
  try {
    const j = await apiFetch<{ items: OrderRecord[] }>("/orders");
    const items = (j.items ?? []).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    buyerStore.set(items);
    return items;
  } catch { return buyerStore.get(); }
}

export async function refreshVendorOrders(): Promise<OrderRecord[]> {
  try {
    const j = await apiFetch<{ items: OrderRecord[] }>("/vendor/orders");
    const items = (j.items ?? []).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    vendorStore.set(items);
    return items;
  } catch { return vendorStore.get(); }
}

export async function refreshAdminOrders(): Promise<OrderRecord[]> {
  try {
    const j = await apiFetch<{ items: OrderRecord[] }>("/admin/orders");
    const items = (j.items ?? []).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    adminStore.set(items);
    return items;
  } catch { return adminStore.get(); }
}

/* ─── Mutations ─── */
export async function createOrder(input: {
  items: OrderItem[];
  shippingAddress: OrderShipping;
  paymentMethod: OrderPaymentMethod;
}): Promise<OrderRecord> {
  const j = await apiFetch<{ order: OrderRecord }>("/orders", { method: "POST", body: input });
  buyerStore.set([j.order, ...buyerStore.get().filter((o) => o.id !== j.order.id)]);
  return j.order;
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId?: string
): Promise<OrderRecord | null> {
  try {
    const j = await apiFetch<{ order: OrderRecord }>("/orders/status", {
      method: "POST",
      body: { orderId, status, userId },
    });
    const merge = (arr: OrderRecord[]) =>
      arr.map((o) => (o.id === orderId ? { ...o, ...j.order } : o));
    buyerStore.set(merge(buyerStore.get()));
    vendorStore.set(merge(vendorStore.get()));
    adminStore.set(merge(adminStore.get()));
    return j.order;
  } catch {
    return null;
  }
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  try {
    const j = await apiFetch<{ order: OrderRecord }>(`/orders/${encodeURIComponent(orderId)}`);
    return j.order ?? null;
  } catch { return null; }
}

/* ─── Hooks ─── */
export function useMyOrders(): OrderRecord[] {
  useEffect(() => { void refreshMyOrders(); }, []);
  return useSyncExternalStore(buyerStore.subscribe, buyerStore.get, buyerStore.get);
}

export function useVendorOrders(): OrderRecord[] {
  useEffect(() => { void refreshVendorOrders(); }, []);
  return useSyncExternalStore(vendorStore.subscribe, vendorStore.get, vendorStore.get);
}

export function useAdminOrders(): OrderRecord[] {
  useEffect(() => { void refreshAdminOrders(); }, []);
  return useSyncExternalStore(adminStore.subscribe, adminStore.get, adminStore.get);
}

/* ─── Compat (anciens appels) ─── */
export async function listOrders(): Promise<OrderRecord[]> { return refreshMyOrders(); }
export async function listVendorOrders(): Promise<OrderRecord[]> { return refreshVendorOrders(); }
