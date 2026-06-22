import { useSyncExternalStore, useEffect } from "react";
import { getAdminSettings } from "./settings-store";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import {
  listAdminPayouts,
  createAdminPayout,
  setAdminPayoutStatus,
  AdminPayout,
} from "../data/admin-server";

export type Payout = {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  commission: number;
  net: number;
  status: "pending" | "processing" | "paid" | "failed";
  createdAt: number;
  paidAt?: number;
  method: "wallet" | "bank" | "momo";
  reference?: string;
};

const CACHE_KEY = "ippoo:admin-payouts";

function fromServer(p: AdminPayout): Payout {
  const commissionPct = getAdminSettings().commission / 100;
  const commission = Math.round(p.amount * commissionPct);
  const method: Payout["method"] =
    p.method === "bank" ? "bank" : p.method === "wallet" ? "wallet" : "momo";
  return {
    id: p.id,
    vendorId: p.vendorId,
    vendorName: p.vendorName,
    amount: p.amount,
    commission,
    net: Math.max(0, p.amount - commission),
    status: p.status,
    createdAt: p.createdAt,
    paidAt: p.status === "paid" ? p.updatedAt : undefined,
    method,
  };
}

function readCache(): Payout[] {
  try {
    const raw = safeGetItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Payout[]) : [];
  } catch {
    return [];
  }
}

let state: Payout[] = readCache();
const listeners = new Set<() => void>();

function emit() {
  try { safeSetItem(CACHE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

export function getPayouts(): Payout[] { return state; }

export function subscribePayouts(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export async function refreshPayouts(): Promise<void> {
  try {
    const items = await listAdminPayouts();
    state = items.map(fromServer);
    emit();
  } catch {
    /* ignore - keep cache */
  }
}

export function usePayouts(): Payout[] {
  useEffect(() => { void refreshPayouts(); }, []);
  return useSyncExternalStore(subscribePayouts, getPayouts, getPayouts);
}

export async function setPayoutStatus(id: string, status: Payout["status"]): Promise<void> {
  const saved = await setAdminPayoutStatus(id, status);
  state = state.map((p) => p.id === id ? { ...fromServer(saved), commission: p.commission, net: p.net } : p);
  emit();
}

export function createPayout(vendorId: string, amount: number, method: Payout["method"]): Payout | null {
  if (!vendorId || amount <= 0) return null;
  const commission = Math.round(amount * (getAdminSettings().commission / 100));
  const optimistic: Payout = {
    id: `tmp_${Date.now().toString(36)}`,
    vendorId,
    vendorName: vendorId,
    amount,
    commission,
    net: amount - commission,
    status: "pending",
    createdAt: Date.now(),
    method,
  };
  state = [optimistic, ...state];
  emit();
  void (async () => {
    try {
      const saved = await createAdminPayout({ vendorId, amount, method });
      const real = fromServer(saved);
      state = state.map((p) => p.id === optimistic.id ? real : p);
      emit();
    } catch {
      state = state.filter((p) => p.id !== optimistic.id);
      emit();
      try {
        const { toast } = await import("sonner");
        toast.error("Échec création du reversement côté serveur");
      } catch { /* sonner indisponible */ }
    }
  })();
  return optimistic;
}
