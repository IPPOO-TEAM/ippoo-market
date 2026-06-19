import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { TrendingUp, Package, Receipt, BarChart3, ArrowDownRight, ArrowUpRight, FileText, Store, Download, Printer } from "lucide-react";
import { openMyInvoicePdf } from "../data/my-invoice-pdf";
import { computeMonthlyPnl, openMonthlyPnlPdf } from "../data/my-pnl-pdf";
import { toast } from "sonner";
import { vendorAccounting, type VendorPeriod } from "../payments/store";
import { usePayments } from "../payments/usePayments";
import { VENDORS } from "../data/marketplace";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { useEffect, useSyncExternalStore } from "react";
import {
  hydrateMyProducts,
  subscribe as subscribeMy,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as MY_SNAPSHOT,
  listMyOrders,
  listMyMovements,
  listMyInvoices,
} from "../data/my-products";
import { getActiveShopSlug, listAllShops, hydrateMyShops, subscribe as subscribeShops, getMyShopsSnapshot, SERVER_SNAPSHOT as SHOPS_SNAPSHOT } from "../data/my-shops";
import { getUserProfile, subscribe as subscribeProfile, SERVER_SNAPSHOT as PROFILE_SNAPSHOT } from "../auth/user-profile";

const PERIOD_DAYS: Record<VendorPeriod, number | null> = {
  "7d": 7, "30d": 30, "90d": 90, "365d": 365, "all": null,
};

const PERIODS: { id: VendorPeriod; label: string }[] = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "365d", label: "1 an" },
  { id: "all", label: "Tout" },
];

/** Tableau de bord comptable d'un vendeur : ventes, stock, factures, bilan. */
export function VendeurComptabilitePage() {
  usePayments();
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = useState<VendorPeriod>("30d");
  const vendorIdParam = params.get("v") ?? VENDORS[0]?.id ?? "";
  const vendor = useMemo(() => VENDORS.find((v) => v.id === vendorIdParam) ?? VENDORS[0], [vendorIdParam]);

  const acc = useMemo(() => (vendor ? vendorAccounting(vendor.id, period) : undefined), [vendor, period]);

  if (!vendor || !acc) {
    return <div className="p-4">Aucun vendeur disponible.</div>;
  }

  const avgTicket = acc.ordersCount > 0 ? acc.revenue / acc.ordersCount : 0;
  const totalIn = acc.movements.filter((m) => m.delta > 0).reduce((s, m) => s + m.delta, 0);
  const totalOut = acc.movements.filter((m) => m.delta < 0).reduce((s, m) => s - m.delta, 0);

  // ─── Boutique connectée (my-products) ───
  useEffect(() => { hydrateMyProducts(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeMy, getMyProductsSnapshot, () => MY_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  const mySlug = getActiveShopSlug(profile?.businessName);
  const myShopName = mySlug ? listAllShops(profile?.businessName).find((s) => s.slug === mySlug)?.name : undefined;
  const periodDays = PERIOD_DAYS[period];
  const periodStart = periodDays == null ? 0 : Date.now() - periodDays * 86400_000;
  const myOrders = mySlug ? listMyOrders(mySlug).filter((o) => o.ts >= periodStart) : [];
  const myMovements = mySlug ? listMyMovements(mySlug).filter((m) => m.ts >= periodStart) : [];
  const myInvoices = mySlug ? listMyInvoices(mySlug).filter((i) => i.ts >= periodStart) : [];
  const myRevenue = myOrders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.total, 0);
  const myUnits = myOrders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.qty, 0);
  const myStockIn = myMovements.filter((m) => m.delta > 0).reduce((s, m) => s + m.delta, 0);
  const myStockOut = myMovements.filter((m) => m.delta < 0).reduce((s, m) => s + Math.abs(m.delta), 0);

  const exportMyCsv = () => {
    if (myInvoices.length === 0) { toast.info("Aucune facture sur la période"); return; }
    const head = ["N° Facture", "Date", "Produit", "Référence", "UID", "Qté", "Unité", "PU (FCFA)", "Total (FCFA)", "Acheteur", "Paiement", "Catégorie"];
    const lines = myInvoices.map((i) => [
      i.number,
      new Date(i.ts).toISOString().slice(0, 10),
      i.productName,
      i.productRef ?? "",
      i.productUid ?? "",
      String(i.qty),
      i.unit,
      String(i.unitPrice),
      String(i.total),
      i.buyerName ?? "Anonyme",
      i.paymentMethod,
      i.category ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const total = myInvoices.reduce((s, i) => s + i.total, 0);
    const totalLine = ["", "", "TOTAL", "", "", "", "", "", String(total), "", "", ""].map((v) => `"${v}"`).join(";");
    const csv = "﻿" + [head.join(";"), ...lines, totalLine].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-ventes-${mySlug}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${myInvoices.length} facture(s) exportée(s)`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>Comptabilité vendeur</h1>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Suivi des ventes, du stock et bilan comptable consolidé.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openPayoutPdf(vendor, period, acc, { avgTicket, totalIn, totalOut })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6A00] text-white hover:bg-[#B91C1C]"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            <Download className="w-4 h-4" /> Bilan PDF
          </button>
          <select
            value={vendor.id}
            onChange={(e) => setParams({ v: e.target.value })}
            className="px-3 py-2 rounded-xl border border-border bg-white"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            {VENDORS.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg ${period === p.id ? "bg-white shadow" : ""}`}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI icon={<TrendingUp className="w-5 h-5" />} label="Chiffre d'affaires" value={<AnimatedNumber value={acc.revenue} format={(n) => formatPrice(n)} />} color="#E11D2E" />
        <KPI icon={<Receipt className="w-5 h-5" />} label="Commandes" value={<AnimatedNumber value={acc.ordersCount} />} sub={`${acc.salesCount} lignes`} color="#F97316" />
        <KPI icon={<Package className="w-5 h-5" />} label="Unités vendues" value={<AnimatedNumber value={acc.unitsSold} />} color="#1A1A2E" />
        <KPI icon={<BarChart3 className="w-5 h-5" />} label="Panier moyen" value={<AnimatedNumber value={Math.round(avgTicket)} format={(n) => formatPrice(n)} />} color="#16A34A" />
      </div>

      {/* ─── Ma boutique connectée — ventes directes (scan + comptoir) ─── */}
      {mySlug && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
              <Store className="w-4 h-4 text-[#E11D2E]" />
              Ma boutique — ventes directes
              {myShopName && <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>· {myShopName}</span>}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (!mySlug) return;
                  const now = new Date();
                  const report = computeMonthlyPnl(mySlug, now.getFullYear(), now.getMonth() + 1);
                  if (report.invoices.length === 0) { toast.info("Aucune vente ce mois-ci"); return; }
                  openMonthlyPnlPdf(report, {
                    shopName: myShopName || profile?.businessName || "Boutique",
                    city: profile?.city, phone: profile?.phone, email: profile?.email,
                    rccm: profile?.rccm, ifu: profile?.ifu, logo: profile?.logo,
                  });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white"
                style={{ background: "#1A1A2E", fontSize: 11, fontWeight: 700 }}
              >
                <FileText className="w-3.5 h-3.5" /> Bilan mensuel PDF
              </button>
              <button
                onClick={exportMyCsv}
                disabled={myInvoices.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <MiniKPI label="CA direct" value={<AnimatedNumber value={myRevenue} format={(n) => formatPrice(n)} />} color="#E11D2E" />
            <MiniKPI label="Ventes" value={<AnimatedNumber value={myOrders.length} />} color="#F97316" />
            <MiniKPI label="Unités" value={<AnimatedNumber value={myUnits} />} color="#1A1A2E" />
            <MiniKPI label="Entrées stock" value={<AnimatedNumber value={myStockIn} prefix="+" />} color="#16A34A" />
            <MiniKPI label="Sorties stock" value={<AnimatedNumber value={myStockOut} prefix="-" />} color="#E11D2E" />
          </div>
          {myInvoices.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full" style={{ fontSize: 12 }}>
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>FACTURE</th>
                    <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>DATE</th>
                    <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>PRODUIT</th>
                    <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>ACHETEUR</th>
                    <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>TOTAL</th>
                    <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {myInvoices.slice(0, 12).map((i) => (
                    <tr key={i.id} className="border-b border-[#F3F4F6]">
                      <td className="px-2 py-1.5" style={{ fontFamily: "ui-monospace", fontWeight: 600 }}>{i.number}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{new Date(i.ts).toLocaleDateString("fr-FR")}</td>
                      <td className="px-2 py-1.5">
                        <div className="truncate max-w-[200px]" style={{ fontWeight: 600 }}>{i.productName}</div>
                        <div className="text-muted-foreground" style={{ fontSize: 10 }}>{i.qty} × {formatPrice(i.unitPrice)}</div>
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[140px]">{i.buyerName ?? "Anonyme"}</td>
                      <td className="px-2 py-1.5 text-right" style={{ fontWeight: 700, color: "#16A34A" }}>{formatPrice(i.total)}</td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => openMyInvoicePdf(i, {
                            shopName: i.sellerShopName || profile?.businessName || "Boutique",
                            city: profile?.city,
                            phone: profile?.phone,
                            email: profile?.email,
                            rccm: profile?.rccm,
                            ifu: profile?.ifu,
                            logo: profile?.logo,
                          })}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Imprimer / PDF"
                          aria-label="Imprimer la facture"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {myInvoices.length > 12 && (
                <p className="text-center text-muted-foreground pt-2" style={{ fontSize: 11 }}>
                  + {myInvoices.length - 12} facture(s) — exporter en CSV pour voir tout
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <Package className="w-4 h-4 text-[#F97316]" /> Mouvements de stock
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 rounded-xl bg-[#16A34A]/10">
              <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>ENTRÉES</p>
              <p className="flex items-center gap-1" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#16A34A" }}>
                <ArrowUpRight className="w-4 h-4" /> <AnimatedNumber value={totalIn} prefix="+" />
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#E11D2E]/10">
              <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>SORTIES</p>
              <p className="flex items-center gap-1" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#E11D2E" }}>
                <ArrowDownRight className="w-4 h-4" /> <AnimatedNumber value={totalOut} prefix="-" />
              </p>
            </div>
          </div>
          {acc.movements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>
              Aucun mouvement sur la période.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-auto">
              {acc.movements.slice(0, 30).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40" style={{ fontSize: 12 }}>
                  <div className="min-w-0">
                    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 600 }}>{m.uid}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>{m.date} · {m.reason}{m.ref ? ` · ${m.ref}` : ""}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: m.delta > 0 ? "#16A34A" : "#E11D2E" }}>
                    {m.delta > 0 ? "+" : ""}{m.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <TrendingUp className="w-4 h-4 text-[#E11D2E]" /> Top produits
          </h3>
          {acc.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>
              Aucune vente sur la période.
            </p>
          ) : (
            <div className="space-y-1.5">
              {acc.topProducts.map((p) => (
                <div key={p.uid} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40" style={{ fontSize: 12 }}>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate" style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="text-muted-foreground" style={{ fontFamily: "ui-monospace", fontSize: 11 }}>{p.uid}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontWeight: 700 }}>{formatPrice(p.revenue)}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>{p.units} u.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          <FileText className="w-4 h-4 text-[#1A1A2E]" /> Factures de la période
        </h3>
        {acc.invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>
            Aucune facture sur la période.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-2 py-2" style={{ fontWeight: 700, fontSize: 11 }}>FACTURE</th>
                  <th className="px-2 py-2" style={{ fontWeight: 700, fontSize: 11 }}>DATE</th>
                  <th className="px-2 py-2" style={{ fontWeight: 700, fontSize: 11 }}>ACHETEUR</th>
                  <th className="px-2 py-2 text-right" style={{ fontWeight: 700, fontSize: 11 }}>MONTANT</th>
                  <th className="px-2 py-2 text-right" style={{ fontWeight: 700, fontSize: 11 }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {acc.invoices.map((inv) => {
                  const myLines = inv.lines?.filter((l) => l.vendorId === vendor.id || l.vendorName === vendor.id) ?? [];
                  const mySubtotal = myLines.reduce((s, l) => s + l.total, 0);
                  return (
                    <tr key={inv.id} className="border-b border-border">
                      <td className="px-2 py-2">
                        <Link to={`/facture/${inv.id}`} className="text-[#E11D2E] hover:underline" style={{ fontFamily: "ui-monospace", fontWeight: 700 }}>
                          {inv.id}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{inv.date}</td>
                      <td className="px-2 py-2">{inv.buyer?.name ?? "—"}</td>
                      <td className="px-2 py-2 text-right" style={{ fontWeight: 700 }}>{formatPrice(mySubtotal)}</td>
                      <td className="px-2 py-2 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded"
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: inv.status === "paid" ? "rgba(22,163,74,0.12)" : "rgba(234,179,8,0.18)",
                            color: inv.status === "paid" ? "#16A34A" : "#A16207",
                          }}
                        >
                          {inv.status === "paid" ? "PAYÉE" : "EN ATTENTE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-xl border border-dashed border-border flex items-center justify-between" style={{ fontSize: 12 }}>
        <span className="flex items-center gap-2 text-muted-foreground">
          <Store className="w-4 h-4" /> Boutique référence · {vendor.name} · {vendor.city}
        </span>
        <Link to={`/vendeur/${vendor.id}`} className="text-[#E11D2E] hover:underline" style={{ fontWeight: 700 }}>
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}

type AccLike = ReturnType<typeof vendorAccounting>;
type Vendor = (typeof VENDORS)[number];

function openPayoutPdf(
  vendor: Vendor,
  period: VendorPeriod,
  acc: AccLike,
  extra: { avgTicket: number; totalIn: number; totalOut: number },
) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    toast.error("Le navigateur a bloqué l'ouverture de la page. Autorise les pop-ups.");
    return;
  }
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? period;
  const now = new Date();
  const generatedAt = now.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

  const invoiceRows = acc.invoices.map((inv) => {
    const myLines = inv.lines?.filter((l) => l.vendorId === vendor.id || l.vendorName === vendor.id) ?? [];
    const mySubtotal = myLines.reduce((s, l) => s + l.total, 0);
    return `<tr>
      <td>${esc(inv.id)}</td>
      <td>${esc(inv.date)}</td>
      <td>${esc(inv.buyer?.name ?? "—")}</td>
      <td style="text-align:right;font-weight:700">${fmt(mySubtotal)}</td>
      <td style="text-align:right">${inv.status === "paid" ? "PAYÉE" : "EN ATTENTE"}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" style="text-align:center;color:#888">Aucune facture sur la période.</td></tr>`;

  const topProductsRows = acc.topProducts.map((p) => `
    <tr>
      <td>${esc(p.name)}</td>
      <td style="font-family:ui-monospace,monospace;color:#666">${esc(p.uid)}</td>
      <td style="text-align:right">${p.units}</td>
      <td style="text-align:right;font-weight:700">${fmt(p.revenue)}</td>
    </tr>`).join("") || `<tr><td colspan="4" style="text-align:center;color:#888">Aucune vente.</td></tr>`;

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bilan reversement · ${esc(vendor.name)} · ${esc(periodLabel)}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1A2E; margin: 0; padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E11D2E; padding-bottom: 12px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 22px; }
    .muted { color: #666; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
    .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #666; }
    .kpi .value { font-size: 16px; font-weight: 800; margin-top: 4px; color: #E11D2E; }
    h2 { font-size: 14px; margin: 18px 0 8px; border-left: 4px solid #E11D2E; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #fafafa; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #666; }
    footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
    .toolbar { position: fixed; top: 8px; right: 8px; display: flex; gap: 6px; }
    .toolbar button { padding: 6px 10px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .toolbar { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
    <button onclick="window.close()">Fermer</button>
  </div>

  <header>
    <div>
      <h1>Bilan de reversement</h1>
      <p class="muted">IPPOO Market · ${esc(vendor.name)} · ${esc(vendor.city ?? "")}</p>
    </div>
    <div style="text-align:right">
      <p class="muted" style="margin:0">Période</p>
      <p style="margin:2px 0;font-weight:800">${esc(periodLabel)}</p>
      <p class="muted" style="margin:0">Émis le ${esc(generatedAt)}</p>
    </div>
  </header>

  <div class="grid">
    <div class="kpi"><div class="label">Chiffre d'affaires</div><div class="value">${fmt(acc.revenue)}</div></div>
    <div class="kpi"><div class="label">Commandes</div><div class="value">${acc.ordersCount}</div></div>
    <div class="kpi"><div class="label">Unités vendues</div><div class="value">${acc.unitsSold.toLocaleString("fr-FR")}</div></div>
    <div class="kpi"><div class="label">Panier moyen</div><div class="value">${fmt(Math.round(extra.avgTicket))}</div></div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="kpi"><div class="label">Lignes vendues</div><div class="value" style="color:#1A1A2E">${acc.salesCount}</div></div>
    <div class="kpi"><div class="label">Stock entrées</div><div class="value" style="color:#16A34A">+${extra.totalIn.toLocaleString("fr-FR")}</div></div>
    <div class="kpi"><div class="label">Stock sorties</div><div class="value" style="color:#E11D2E">-${extra.totalOut.toLocaleString("fr-FR")}</div></div>
  </div>

  <h2>Top produits</h2>
  <table>
    <thead><tr><th>Produit</th><th>UID</th><th style="text-align:right">Unités</th><th style="text-align:right">CA</th></tr></thead>
    <tbody>${topProductsRows}</tbody>
  </table>

  <h2>Factures de la période</h2>
  <table>
    <thead><tr><th>Facture</th><th>Date</th><th>Acheteur</th><th style="text-align:right">Montant</th><th style="text-align:right">Statut</th></tr></thead>
    <tbody>${invoiceRows}</tbody>
  </table>

  <footer>
    <span>IPPOO Market · Bilan généré automatiquement</span>
    <span>Vendeur ID : ${esc(vendor.id)}</span>
  </footer>

  <script>
    setTimeout(() => { try { window.focus(); } catch (e) {} }, 100);
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  toast.success("Bilan ouvert dans un nouvel onglet — utilise « Imprimer » pour enregistrer en PDF.");
}

function KPI({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>
        <span style={{ color }}>{icon}</span>{label}
      </div>
      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color }}>{value}</p>
      {sub ? <p className="text-muted-foreground" style={{ fontSize: 11 }}>{sub}</p> : null}
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-[#FAFAFA] px-3 py-2">
      <div className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.04 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color }}>{value}</div>
    </div>
  );
}
