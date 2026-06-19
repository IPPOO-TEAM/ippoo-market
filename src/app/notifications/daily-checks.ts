/* ═══════════════════════════════════════════
   IPPOO — Orchestrateur de vérifications quotidiennes
   Lance tous les watchers vendeur (stock bas, escrow,
   paiements en retard) au plus une fois par 24 h grâce
   à un horodatage par (slug, check) en localStorage.
   Boucle in-app : ré-évalue toutes les heures (no-op
   tant que la fenêtre quotidienne n'est pas écoulée).
   ═══════════════════════════════════════════ */

import { checkLowStock } from "./low-stock-watcher";
import { checkSellerEscrowReleases } from "./seller-watcher";
import { listMyOrders } from "../data/my-products";
import { pushNotification } from "./store";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const KEY = "ippoo:daily-checks";
const DAY_MS = 24 * 60 * 60 * 1000;
const LATE_CREDIT_DAYS = 7;
const LATE_SEEN_KEY = "ippoo:late-credit-seen";

type CheckId = "low-stock" | "escrow" | "late-credit";

function load(): Record<string, number> {
  try { return JSON.parse(scopedGetItem(KEY) || "{}"); } catch { return {}; }
}
function save(s: Record<string, number>) {
  scopedSetItem(KEY, JSON.stringify(s));
}

function due(slug: string, id: CheckId): boolean {
  const sched = load();
  const k = `${slug}:${id}`;
  return Date.now() - (sched[k] ?? 0) >= DAY_MS;
}
function mark(slug: string, id: CheckId) {
  const sched = load();
  sched[`${slug}:${id}`] = Date.now();
  save(sched);
}

function getLateSeen(): Record<string, number> {
  try { return JSON.parse(scopedGetItem(LATE_SEEN_KEY) || "{}"); } catch { return {}; }
}
function persistLateSeen(map: Record<string, number>) {
  scopedSetItem(LATE_SEEN_KEY, JSON.stringify(map));
}

/** Vérifie les commandes payées en "credit" dont la date dépasse 7 jours. */
function checkLatePayments(slug: string): number {
  if (!slug) return 0;
  const cutoff = Date.now() - LATE_CREDIT_DAYS * DAY_MS;
  const orders = listMyOrders(slug).filter(
    (o) => o.paymentMethod === "credit" && o.status !== "refunded" && o.ts < cutoff,
  );
  const seen = getLateSeen();
  let count = 0;
  for (const o of orders) {
    count++;
    const last = seen[o.id] ?? 0;
    const daysLate = Math.floor((Date.now() - o.ts) / DAY_MS);
    if (Date.now() - last < DAY_MS) continue;
    pushNotification({
      type: "payment",
      priority: "high",
      title: "Paiement en retard",
      desc: `Commande ${o.id.slice(0, 8)} (${o.productName}) — ${daysLate} j de retard, ${o.buyerName || "client comptoir"}`,
      link: `/vendeur-comptabilite`,
      color: "#E11D2E",
    });
    seen[o.id] = Date.now();
  }
  persistLateSeen(seen);
  return count;
}

export type DailyChecksResult = {
  lowStock: { lowCount: number; outCount: number } | null;
  escrowRan: boolean;
  lateCount: number;
};

/** Exécute tous les checks dus pour cette boutique. */
export async function runDailyChecks(slug: string): Promise<DailyChecksResult> {
  const result: DailyChecksResult = { lowStock: null, escrowRan: false, lateCount: 0 };
  if (!slug || typeof window === "undefined") return result;

  if (due(slug, "low-stock")) {
    try { result.lowStock = checkLowStock(slug); } catch { /* ignore */ }
    mark(slug, "low-stock");
  }
  if (due(slug, "escrow")) {
    try { await checkSellerEscrowReleases(slug); result.escrowRan = true; } catch { /* ignore */ }
    mark(slug, "escrow");
  }
  if (due(slug, "late-credit")) {
    try { result.lateCount = checkLatePayments(slug); } catch { /* ignore */ }
    mark(slug, "late-credit");
  }
  return result;
}

/**
 * Démarre une boucle in-app : vérifie au montage puis toutes les heures.
 * Chaque check ne tourne que si > 24 h depuis sa dernière exécution.
 * Retourne un cleanup à appeler au démontage.
 */
export function startDailyChecks(slug: string): () => void {
  if (!slug || typeof window === "undefined") return () => undefined;
  void runDailyChecks(slug);
  const id = window.setInterval(() => { void runDailyChecks(slug); }, 60 * 60 * 1000);
  return () => window.clearInterval(id);
}
