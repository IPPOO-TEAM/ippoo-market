/* ═══════════════════════════════════════════
   IPPOO - Facture imprimable (PDF via window.print)
   Ouvre un onglet HTML stylé en format A4 et déclenche
   automatiquement la boîte d'impression. L'utilisateur
   peut alors "Enregistrer en PDF" depuis son navigateur.
   ═══════════════════════════════════════════ */

import type { OrderRecord } from "./orders-server";
import { formatPrice } from "../components/mock-data";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { getAdminSettings } from "../admin/settings-store";
import { apiFetch } from "../api/client";

/**
 * Demande au serveur un numéro de facture séquentiel (atomique, dédoublonné
 * par orderId). Si l'appel échoue, fallback sur la séquence locale.
 */
export async function reserveInvoiceNumber(scope: string, orderId: string): Promise<string> {
  try {
    const j = await apiFetch<{ number: string }>("/invoices/number", {
      method: "POST",
      body: { scope, orderId },
    });
    if (j?.number) return j.number;
  } catch { /* fallback local */ }
  return getInvoiceNumber(scope, orderId);
}

export type InvoiceVendor = {
  shopName: string;
  city?: string;
  phone?: string;
  email?: string;
  rccm?: string;
  ifu?: string;
  logo?: string; // data URL ou http(s)
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Génère (ou retrouve) un numéro de facture séquentiel par boutique et par année.
 * Format : INV-YYYY-NNNN (ex. INV-2026-0001). Persisté en localStorage,
 * stable pour un (slug, orderId) donné (réimpression = même numéro).
 */
export function getInvoiceNumber(slug: string, orderId: string, when: number = Date.now()): string {
  const year = new Date(when).getFullYear();
  const mapKey = `ippoo:invoice-map:${slug}`;
  const seqKey = `ippoo:invoice-seq:${slug}:${year}`;
  try {
    const raw = safeGetItem(mapKey);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (map[orderId]) return map[orderId];
    const next = (parseInt(safeGetItem(seqKey) || "0", 10) || 0) + 1;
    safeSetItem(seqKey, String(next));
    const num = `INV-${year}-${String(next).padStart(4, "0")}`;
    map[orderId] = num;
    safeSetItem(mapKey, JSON.stringify(map));
    return num;
  } catch {
    return `INV-${year}-${orderId.slice(0, 4).toUpperCase()}`;
  }
}

/** Génère + ouvre la facture imprimable pour les items du vendeur dans une commande. */
export function openInvoiceForVendor(order: OrderRecord, vendor: InvoiceVendor, vendorSlug: string) {
  const items = order.items.filter(
    (it) => it.vendorId === vendorSlug || it.vendorId === vendor.shopName,
  );
  if (items.length === 0) return;
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  // Réglages plateforme (source : serveur via settings-store, repli défauts).
  const settings = getAdminSettings();
  const commissionPct = Number.isFinite(settings.commission) ? settings.commission : 8;
  const vatPct = Number.isFinite(settings.vatRate) ? settings.vatRate : 18;
  const commission = Math.round((subtotal * commissionPct) / 100);
  const net = subtotal - commission;
  // Prix affichés TTC → TVA incluse = TTC × taux / (100 + taux).
  const vatIncluded = vatPct > 0 ? Math.round((subtotal * vatPct) / (100 + vatPct)) : 0;
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const invoiceNo = getInvoiceNumber(vendorSlug, order.id, order.createdAt);
  const ship = order.shippingAddress;
  const rows = items
    .map(
      (it) => `
      <tr>
        <td>${esc(it.title)}</td>
        <td class="num">${esc(it.qty)}</td>
        <td class="num">${formatPrice(it.unitPrice)} FCFA</td>
        <td class="num">${formatPrice(it.unitPrice * it.qty)} FCFA</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture ${esc(invoiceNo)} - ${esc(vendor.shopName)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827; margin: 0; padding: 24px;
    }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-size: 24px; font-weight: 700; color: #E11D2E; }
    .meta { text-align: right; font-size: 12px; color: #6B7280; }
    h1 { font-size: 18px; margin: 24px 0 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px; }
    .card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin: 0 0 6px; }
    .card p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; text-align: left; }
    th { background: #F9FAFB; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 16px; margin-left: auto; width: 260px; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { border-top: 2px solid #111827; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 14px; }
    footer { margin-top: 48px; font-size: 11px; color: #9CA3AF; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-paid { background: #DCFCE7; color: #166534; }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:flex-start;gap:14px;">
      ${vendor.logo ? `<img src="${esc(vendor.logo)}" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0;" />` : ""}
      <div>
      <div class="brand">${esc(vendor.shopName)}</div>
      ${vendor.city ? `<p style="font-size:12px;color:#6B7280;margin:4px 0 0;">${esc(vendor.city)}</p>` : ""}
      ${vendor.phone ? `<p style="font-size:12px;color:#6B7280;margin:2px 0 0;">${esc(vendor.phone)}</p>` : ""}
      ${vendor.email ? `<p style="font-size:12px;color:#6B7280;margin:2px 0 0;">${esc(vendor.email)}</p>` : ""}
      ${vendor.rccm ? `<p style="font-size:11px;color:#9CA3AF;margin:6px 0 0;">RCCM : ${esc(vendor.rccm)}</p>` : ""}
      ${vendor.ifu ? `<p style="font-size:11px;color:#9CA3AF;margin:2px 0 0;">IFU : ${esc(vendor.ifu)}</p>` : ""}
      </div>
    </div>
    <div class="meta">
      <h1 style="margin:0;font-size:22px;color:#111827;">FACTURE</h1>
      <p style="margin:4px 0 0;font-weight:700;color:#111827;">N° ${esc(invoiceNo)}</p>
      <p style="margin:2px 0 0;font-size:11px;">Réf. commande : ${esc(order.id)}</p>
      <p style="margin:2px 0 0;">${esc(date)}</p>
      <p style="margin:8px 0 0;">
        <span class="badge ${order.status === "cloturee" ? "badge-paid" : "badge-pending"}">
          ${order.status === "cloturee" ? "PAYÉE" : order.status === "annulee" ? "ANNULÉE" : "EN COURS"}
        </span>
      </p>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <h3>Facturé à</h3>
      <p><strong>${esc(ship.name)}</strong></p>
      <p>${esc(ship.line1)}</p>
      ${ship.line2 ? `<p>${esc(ship.line2)}</p>` : ""}
      <p>${esc(ship.city)}</p>
      <p>${esc(ship.phone)}</p>
    </div>
    <div class="card">
      <h3>Paiement</h3>
      <p>Mode : ${esc(order.paymentMethod)}</p>
      <p>Paiement protégé : ${esc(order.escrowStatus)}</p>
      <p>Date commande : ${esc(date)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Produit</th><th class="num">Qté</th><th class="num">PU</th><th class="num">Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total (TTC)</span><span>${formatPrice(subtotal)} FCFA</span></div>
    ${vatIncluded > 0 ? `<div class="row" style="color:#6B7280;"><span>Dont TVA (${vatPct}%)</span><span>${formatPrice(vatIncluded)} FCFA</span></div>` : ""}
    <div class="row" style="color:#6B7280;"><span>Commission IPPOO (${commissionPct}%)</span><span>− ${formatPrice(commission)} FCFA</span></div>
    <div class="row grand"><span>Net vendeur</span><span>${formatPrice(net)} FCFA</span></div>
  </div>

  <footer>
    Facture générée via IPPOO Market - ippoo.com<br/>
    Document non contractuel, conservé pour votre comptabilité.
  </footer>

  <script>
    window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 200); });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
