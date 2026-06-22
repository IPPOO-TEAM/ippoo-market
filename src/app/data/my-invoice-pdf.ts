/* ═══════════════════════════════════════════
   IPPOO - Facture vendeur (vente directe en boutique)
   PDF imprimable via window.print(), pour les MyInvoice
   générées par purchaseMyProduct() - avec UID produit,
   catégorie et référentiels vendeur (RCCM, IFU, contact).
   ═══════════════════════════════════════════ */

import type { MyInvoice } from "./my-products";
import { formatPrice } from "../components/mock-data";
import type { InvoiceVendor } from "./invoice-pdf";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  ippoo_cash: "IPPOO CASH",
  card: "Carte bancaire",
  mobile_money: "Mobile Money",
  transfer: "Virement",
  credit: "Crédit",
};

export function openMyInvoicePdf(inv: MyInvoice, vendor: InvoiceVendor): void {
  const w = window.open("", "_blank", "noopener");
  if (!w) return;

  const total = inv.total;
  const subtotal = inv.unitPrice * inv.qty;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Facture ${esc(inv.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #E11D2E; padding-bottom: 16px; margin-bottom: 20px; }
  header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
  .brand { flex: 1; }
  .shop-name { font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
  .meta { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .doc { text-align: right; }
  .doc-title { font-size: 22px; font-weight: 800; color: #E11D2E; letter-spacing: .04em; }
  .doc-num { font-size: 12px; color: #6B7280; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px; }
  .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px 14px; }
  .label { text-transform: uppercase; font-size: 10px; letter-spacing: .08em; color: #9CA3AF; font-weight: 700; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
  th { text-align: left; padding: 8px 10px; background: #FAFAFA; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
  td { padding: 10px; border-bottom: 1px solid #F3F4F6; font-size: 13px; vertical-align: top; }
  td.right, th.right { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .grand { border-top: 2px solid #0F172A; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 800; }
  .totals .grand .amt { color: #E11D2E; }
  .uid { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #6B7280; }
  footer { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { .noprint { display: none !important; } body { background: #fff; } }
  .noprint { position: fixed; top: 12px; right: 12px; }
  .btn { background: #E11D2E; color: #fff; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
</style></head>
<body>
<div class="noprint"><button class="btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="wrap">
  <header>
    ${vendor.logo ? `<img src="${esc(vendor.logo)}" alt="" />` : ""}
    <div class="brand">
      <div class="shop-name">${esc(vendor.shopName)}</div>
      <div class="meta">
        ${[vendor.city, vendor.phone, vendor.email].filter(Boolean).map(esc).join(" · ")}
      </div>
      <div class="meta">
        ${vendor.rccm ? "RCCM : " + esc(vendor.rccm) : ""}
        ${vendor.ifu ? (vendor.rccm ? " · " : "") + "IFU : " + esc(vendor.ifu) : ""}
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">FACTURE</div>
      <div class="doc-num">N° ${esc(inv.number)}</div>
      <div class="doc-num">${esc(fmtDate(inv.ts))}</div>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <div class="label">Client</div>
      <div style="font-weight:600">${esc(inv.buyerName || "Client comptoir")}</div>
      ${inv.buyerContact ? `<div class="meta">${esc(inv.buyerContact)}</div>` : ""}
    </div>
    <div class="card">
      <div class="label">Paiement</div>
      <div style="font-weight:600">${esc(PAYMENT_LABELS[inv.paymentMethod] || inv.paymentMethod)}</div>
      <div class="meta">Commande ${esc(inv.orderId)}</div>
    </div>
  </div>

  <table>
    <thead><tr>
      <th>Produit</th><th>Réf / UID</th><th class="right">Qté</th>
      <th class="right">PU</th><th class="right">Total</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>
          <div style="font-weight:600">${esc(inv.productName)}</div>
          ${inv.category ? `<div class="meta">Catégorie : ${esc(inv.category)}</div>` : ""}
        </td>
        <td>
          ${inv.productRef ? `<div class="uid">${esc(inv.productRef)}</div>` : ""}
          ${inv.productUid && inv.productUid !== inv.productRef ? `<div class="uid">UID : ${esc(inv.productUid)}</div>` : ""}
        </td>
        <td class="right">${inv.qty}${inv.unit ? " " + esc(inv.unit) : ""}</td>
        <td class="right">${formatPrice(inv.unitPrice)} FCFA</td>
        <td class="right">${formatPrice(subtotal)} FCFA</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total</span><span>${formatPrice(subtotal)} FCFA</span></div>
    <div class="row grand"><span>Total TTC</span><span class="amt">${formatPrice(total)} FCFA</span></div>
  </div>

  <footer>
    Facture générée via IPPOO Market · Conservez ce document pour votre comptabilité.
    ${inv.productUid ? `<br/>Numéro de suivi inventaire : <span class="uid">${esc(inv.productUid)}</span>` : ""}
  </footer>
</div>
<script>setTimeout(() => window.print(), 350);</script>
</body></html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
