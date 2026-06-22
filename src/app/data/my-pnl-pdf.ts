/* ═══════════════════════════════════════════
   IPPOO - Compte de résultat mensuel (PDF)
   Bilan simplifié à partir des MyInvoice + mouvements
   de stock du vendeur sur un mois civil donné.
   Format : Produits (CA), Charges (réapprovisionnement
   valorisé), Résultat net, ventilation par catégorie.
   ═══════════════════════════════════════════ */

import type { MyInvoice, MyStockMovement, MyOrder } from "./my-products";
import { listMyInvoices, listMyMovements, listMyOrders, getMyProduct } from "./my-products";
import { formatPrice } from "../components/mock-data";
import type { InvoiceVendor } from "./invoice-pdf";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MONTH_LABELS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export type PnlReport = {
  year: number;
  month: number; // 1-12
  monthLabel: string;
  revenue: number;
  ordersCount: number;
  unitsSold: number;
  avgTicket: number;
  refunds: number;
  cogsEstimate: number;
  grossMargin: number;
  byCategory: Array<{ name: string; revenue: number; units: number }>;
  byPayment: Array<{ method: string; revenue: number; count: number }>;
  stockIn: number;
  stockOut: number;
  stockInValue: number;
  invoices: MyInvoice[];
  orders: MyOrder[];
  movements: MyStockMovement[];
};

/** Calcule un compte de résultat simplifié pour un (shopSlug, année, mois). */
export function computeMonthlyPnl(shopSlug: string, year: number, month: number): PnlReport {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime();
  const inRange = <T extends { ts: number }>(x: T) => x.ts >= start && x.ts < end;

  const invoices = listMyInvoices(shopSlug).filter(inRange);
  const orders = listMyOrders(shopSlug).filter(inRange);
  const movements = listMyMovements(shopSlug).filter(inRange);

  const paid = orders.filter((o) => o.status !== "refunded");
  const refunds = orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0);
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const ordersCount = paid.length;
  const unitsSold = paid.reduce((s, o) => s + o.qty, 0);
  const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

  // COGS estimé via le coût d'achat (cost) si renseigné sur le produit.
  let cogsEstimate = 0;
  for (const o of paid) {
    const p = getMyProduct(o.productId);
    const unitCost = (p as { cost?: number } | undefined)?.cost ?? 0;
    cogsEstimate += unitCost * o.qty;
  }
  const grossMargin = revenue - cogsEstimate;

  const byCatMap = new Map<string, { revenue: number; units: number }>();
  for (const inv of invoices) {
    const k = inv.category || "Non catégorisé";
    const c = byCatMap.get(k) ?? { revenue: 0, units: 0 };
    c.revenue += inv.total;
    c.units += inv.qty;
    byCatMap.set(k, c);
  }
  const byCategory = Array.from(byCatMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const byPayMap = new Map<string, { revenue: number; count: number }>();
  for (const inv of invoices) {
    const k = inv.paymentMethod;
    const c = byPayMap.get(k) ?? { revenue: 0, count: 0 };
    c.revenue += inv.total;
    c.count += 1;
    byPayMap.set(k, c);
  }
  const byPayment = Array.from(byPayMap.entries())
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  let stockIn = 0;
  let stockOut = 0;
  let stockInValue = 0;
  for (const m of movements) {
    if (m.delta > 0) {
      stockIn += m.delta;
      const p = getMyProduct(m.productId);
      const unitCost = (p as { cost?: number } | undefined)?.cost ?? 0;
      stockInValue += unitCost * m.delta;
    } else {
      stockOut += -m.delta;
    }
  }

  return {
    year,
    month,
    monthLabel: MONTH_LABELS[month - 1],
    revenue,
    ordersCount,
    unitsSold,
    avgTicket,
    refunds,
    cogsEstimate,
    grossMargin,
    byCategory,
    byPayment,
    stockIn,
    stockOut,
    stockInValue,
    invoices,
    orders,
    movements,
  };
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces", ippoo_cash: "IPPOO CASH", card: "Carte",
  mobile_money: "Mobile Money", transfer: "Virement", credit: "Crédit",
};

export function openMonthlyPnlPdf(report: PnlReport, vendor: InvoiceVendor): void {
  const w = window.open("", "_blank", "noopener");
  if (!w) return;

  const fmt = (n: number) => `${formatPrice(Math.round(n))} FCFA`;
  const netResult = report.grossMargin - report.refunds;

  const catRows = report.byCategory.length === 0
    ? `<tr><td colspan="3" style="text-align:center;color:#9CA3AF">Aucune vente sur la période</td></tr>`
    : report.byCategory.map((c) => `
        <tr>
          <td>${esc(c.name)}</td>
          <td class="right">${c.units}</td>
          <td class="right">${fmt(c.revenue)}</td>
        </tr>`).join("");

  const payRows = report.byPayment.map((p) => `
    <tr>
      <td>${esc(PAYMENT_LABELS[p.method] || p.method)}</td>
      <td class="right">${p.count}</td>
      <td class="right">${fmt(p.revenue)}</td>
    </tr>`).join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Bilan ${esc(report.monthLabel)} ${report.year} - ${esc(vendor.shopName)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 24px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #E11D2E; padding-bottom: 16px; margin-bottom: 22px; }
  header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
  .shop-name { font-size: 20px; font-weight: 800; }
  .meta { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .doc { text-align: right; }
  .doc-title { font-size: 18px; font-weight: 800; color: #E11D2E; letter-spacing: .04em; text-transform: uppercase; }
  .doc-sub { font-size: 13px; font-weight: 700; margin-top: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6B7280; margin: 22px 0 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .kpi { border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px 12px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; color: #9CA3AF; font-weight: 700; }
  .kpi .value { font-size: 16px; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; }
  th { text-align: left; padding: 8px 10px; background: #FAFAFA; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
  td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; font-size: 12px; }
  td.right, th.right { text-align: right; }
  .pnl { border: 2px solid #0F172A; border-radius: 12px; padding: 14px 18px; margin-top: 8px; }
  .pnl .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .pnl .row.sub { color: #6B7280; font-size: 11px; padding: 2px 0 2px 16px; }
  .pnl .row.total { border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 6px; font-weight: 700; }
  .pnl .row.net { border-top: 2px solid #0F172A; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 800; }
  .pnl .row.net .amt { color: ${netResult >= 0 ? "#16A34A" : "#E11D2E"}; }
  footer { margin-top: 26px; padding-top: 12px; border-top: 1px dashed #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { .noprint { display: none !important; } }
  .noprint { position: fixed; top: 12px; right: 12px; }
  .btn { background: #E11D2E; color: #fff; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
</style></head>
<body>
<div class="noprint"><button class="btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="wrap">
  <header>
    ${vendor.logo ? `<img src="${esc(vendor.logo)}" alt="" />` : ""}
    <div style="flex:1">
      <div class="shop-name">${esc(vendor.shopName)}</div>
      <div class="meta">${[vendor.city, vendor.phone, vendor.email].filter(Boolean).map(esc).join(" · ")}</div>
      <div class="meta">
        ${vendor.rccm ? "RCCM : " + esc(vendor.rccm) : ""}
        ${vendor.ifu ? (vendor.rccm ? " · " : "") + "IFU : " + esc(vendor.ifu) : ""}
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">Bilan mensuel</div>
      <div class="doc-sub">${esc(report.monthLabel)} ${report.year}</div>
      <div class="meta">Édité le ${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
  </header>

  <h2>Indicateurs clés</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="label">Chiffre d'affaires</div><div class="value">${fmt(report.revenue)}</div></div>
    <div class="kpi"><div class="label">Commandes</div><div class="value">${report.ordersCount}</div></div>
    <div class="kpi"><div class="label">Unités vendues</div><div class="value">${report.unitsSold}</div></div>
    <div class="kpi"><div class="label">Panier moyen</div><div class="value">${fmt(report.avgTicket)}</div></div>
  </div>

  <h2>Compte de résultat simplifié</h2>
  <div class="pnl">
    <div class="row"><span>Produits - Ventes nettes</span><span>${fmt(report.revenue)}</span></div>
    <div class="row sub"><span>dont remboursements</span><span>− ${fmt(report.refunds)}</span></div>
    <div class="row total"><span>Total produits</span><span>${fmt(report.revenue)}</span></div>

    <div class="row" style="margin-top:10px"><span>Charges - Coût d'achat des marchandises vendues</span><span>− ${fmt(report.cogsEstimate)}</span></div>
    <div class="row sub"><span>Réapprovisionnement valorisé sur la période</span><span>${fmt(report.stockInValue)}</span></div>
    <div class="row total"><span>Marge brute</span><span>${fmt(report.grossMargin)}</span></div>

    <div class="row net"><span>Résultat net estimé</span><span class="amt">${fmt(netResult)}</span></div>
  </div>
  <p class="meta" style="margin-top:6px">
    Le coût d'achat est calculé à partir du champ <em>coût</em> renseigné sur chaque produit.
    Les charges externes (loyer, salaires, frais bancaires) ne sont pas incluses dans ce bilan simplifié.
  </p>

  <h2>Ventilation par catégorie</h2>
  <table>
    <thead><tr><th>Catégorie</th><th class="right">Unités</th><th class="right">CA</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>

  <h2>Modes de paiement</h2>
  <table>
    <thead><tr><th>Moyen</th><th class="right">Transactions</th><th class="right">Montant</th></tr></thead>
    <tbody>${payRows || `<tr><td colspan="3" style="text-align:center;color:#9CA3AF">-</td></tr>`}</tbody>
  </table>

  <h2>Mouvements de stock</h2>
  <table>
    <thead><tr><th>Type</th><th class="right">Unités</th><th class="right">Valeur</th></tr></thead>
    <tbody>
      <tr><td>Entrées (réappro, retours)</td><td class="right">+ ${report.stockIn}</td><td class="right">${fmt(report.stockInValue)}</td></tr>
      <tr><td>Sorties (ventes, casse)</td><td class="right">− ${report.stockOut}</td><td class="right">-</td></tr>
    </tbody>
  </table>

  <footer>
    Document généré via IPPOO Market · ${esc(vendor.shopName)} · ${esc(report.monthLabel)} ${report.year}
    <br/>Bilan comptable simplifié à usage interne. Pour une déclaration officielle, faites valider par votre comptable.
  </footer>
</div>
<script>setTimeout(() => window.print(), 400);</script>
</body></html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
