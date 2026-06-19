import { getState } from "./store";
import type { Invoice, StockMovement } from "./types";

export type VendorPeriod = "7d" | "30d" | "90d" | "365d" | "all";

const PERIOD_DAYS: Record<VendorPeriod, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  all: null,
};

export type VendorAccounting = {
  vendorId: string;
  period: VendorPeriod;
  fromTs: number;
  toTs: number;
  salesCount: number;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  invoices: Invoice[];
  topProducts: { uid: string; name: string; units: number; revenue: number }[];
  movements: StockMovement[];
};

/** Agrégat comptable pour un vendeur sur une période donnée. */
export function vendorAccounting(vendorId: string, period: VendorPeriod = "30d"): VendorAccounting {
  const state = getState();
  const now = Date.now();
  const days = PERIOD_DAYS[period];
  const fromTs = days === null ? 0 : now - days * 24 * 60 * 60 * 1000;
  const invoices = state.invoices.filter(
    (inv) =>
      inv.ts >= fromTs &&
      inv.lines?.some((l) => l.vendorId === vendorId || l.vendorName === vendorId),
  );
  let revenue = 0;
  let unitsSold = 0;
  let salesCount = 0;
  const productAgg = new Map<string, { uid: string; name: string; units: number; revenue: number }>();
  const orderIds = new Set<string>();
  for (const inv of invoices) {
    orderIds.add(inv.orderId);
    for (const l of inv.lines ?? []) {
      if (l.vendorId !== vendorId && l.vendorName !== vendorId) continue;
      revenue += l.total;
      unitsSold += l.quantity;
      salesCount += 1;
      const key = l.uid;
      const cur = productAgg.get(key) ?? { uid: l.uid, name: l.name, units: 0, revenue: 0 };
      cur.units += l.quantity;
      cur.revenue += l.total;
      productAgg.set(key, cur);
    }
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const movements = state.movements.filter(
    (m) => m.ts >= fromTs && (m.vendorId === vendorId || m.vendorName === vendorId),
  );
  return {
    vendorId,
    period,
    fromTs,
    toTs: now,
    salesCount,
    ordersCount: orderIds.size,
    unitsSold,
    revenue,
    invoices,
    topProducts,
    movements,
  };
}

/** Agrégat global plateforme (admin). */
export function platformAccounting(period: VendorPeriod = "30d") {
  const state = getState();
  const now = Date.now();
  const days = PERIOD_DAYS[period];
  const fromTs = days === null ? 0 : now - days * 24 * 60 * 60 * 1000;
  const invoices = state.invoices.filter((inv) => inv.ts >= fromTs);
  const revenue = invoices.reduce((s, inv) => s + inv.total, 0);
  const vendorAgg = new Map<string, { vendorId: string; vendorName: string; revenue: number; units: number }>();
  let unitsSold = 0;
  for (const inv of invoices) {
    for (const l of inv.lines ?? []) {
      unitsSold += l.quantity;
      const key = l.vendorId ?? l.vendorName ?? "—";
      const cur = vendorAgg.get(key) ?? { vendorId: key, vendorName: l.vendorName ?? "—", revenue: 0, units: 0 };
      cur.revenue += l.total;
      cur.units += l.quantity;
      vendorAgg.set(key, cur);
    }
  }
  return {
    period,
    fromTs,
    toTs: now,
    invoicesCount: invoices.length,
    revenue,
    unitsSold,
    vendors: [...vendorAgg.values()].sort((a, b) => b.revenue - a.revenue),
  };
}
