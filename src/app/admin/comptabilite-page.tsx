/* ═══════════════════════════════════════════
   IPPOO — Comptabilité admin
   Agrège toutes les MyInvoice (ventes directes vendeurs)
   par boutique et par période. Permet à l'admin de
   suivre le CA global, ventilation par vendeur,
   par catégorie et par moyen de paiement.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";
import { Download, FileText, TrendingUp, Store, Receipt, Package } from "lucide-react";
import { toast } from "sonner";
import {
  hydrateMyProducts,
  subscribe as subscribeMy,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as MY_SNAPSHOT,
  listAllInvoices,
  listAllOrders,
} from "../data/my-products";
import { formatPrice } from "../components/mock-data";
import { AnimatedNumber } from "../components/animated-number";

type Period = "7d" | "30d" | "90d" | "365d" | "all";
const PERIOD_DAYS: Record<Period, number | null> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365, all: null };
const PERIODS: Array<{ id: Period; label: string }> = [
  { id: "7d", label: "7 j" }, { id: "30d", label: "30 j" }, { id: "90d", label: "90 j" },
  { id: "365d", label: "1 an" }, { id: "all", label: "Tout" },
];

export function AdminComptabilitePage() {
  useEffect(() => { hydrateMyProducts(); }, []);
  useSyncExternalStore(subscribeMy, getMyProductsSnapshot, () => MY_SNAPSHOT);

  const [period, setPeriod] = useState<Period>("30d");
  const periodDays = PERIOD_DAYS[period];
  const start = periodDays == null ? 0 : Date.now() - periodDays * 86_400_000;

  const invoices = useMemo(() => listAllInvoices().filter((i) => i.ts >= start), [period]);
  const orders = useMemo(() => listAllOrders().filter((o) => o.ts >= start), [period]);

  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalUnits = invoices.reduce((s, i) => s + i.qty, 0);
  const totalRefunds = orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0);

  const byShop = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; revenue: number; orders: number; units: number }>();
    for (const inv of invoices) {
      const k = inv.shopSlug;
      const c = map.get(k) ?? { slug: k, name: inv.sellerShopName || k, revenue: 0, orders: 0, units: 0 };
      c.revenue += inv.total;
      c.orders += 1;
      c.units += inv.qty;
      if (!c.name && inv.sellerShopName) c.name = inv.sellerShopName;
      map.set(k, c);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; units: number }>();
    for (const inv of invoices) {
      const k = inv.category || "Non catégorisé";
      const c = map.get(k) ?? { name: k, revenue: 0, units: 0 };
      c.revenue += inv.total;
      c.units += inv.qty;
      map.set(k, c);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  const byPayment = useMemo(() => {
    const map = new Map<string, { method: string; revenue: number; count: number }>();
    for (const inv of invoices) {
      const c = map.get(inv.paymentMethod) ?? { method: inv.paymentMethod, revenue: 0, count: 0 };
      c.revenue += inv.total;
      c.count += 1;
      map.set(inv.paymentMethod, c);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  const exportCsv = () => {
    if (invoices.length === 0) { toast.info("Aucune facture sur la période"); return; }
    const head = ["N° Facture", "Date", "Boutique", "Produit", "UID", "Qté", "PU", "Total", "Paiement", "Catégorie"];
    const lines = invoices.map((i) => [
      i.number, new Date(i.ts).toISOString().slice(0, 10),
      i.sellerShopName ?? i.shopSlug, i.productName, i.productUid ?? "",
      i.qty, i.unitPrice, i.total, i.paymentMethod, i.category ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const totalLine = ["", "", "TOTAL", "", "", "", "", String(totalRevenue), "", ""].map((v) => `"${v}"`).join(";");
    const csv = "﻿" + [head.join(";"), ...lines, totalLine].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-admin-comptabilite-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${invoices.length} facture(s) exportée(s)`);
  };

  const PAYMENT_LABELS: Record<string, string> = {
    cash: "Espèces", ippoo_cash: "IPPOO CASH", card: "Carte",
    mobile_money: "Mobile Money", transfer: "Virement", credit: "Crédit",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>Comptabilité plateforme</h1>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Agrégation des ventes directes (MyInvoice) de toutes les boutiques.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={exportCsv}
            disabled={invoices.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white disabled:opacity-50"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<TrendingUp className="w-5 h-5" />} label="CA agrégé" value={<AnimatedNumber value={totalRevenue} format={(n) => formatPrice(n)} suffix=" FCFA" />} tone="#E11D2E" />
        <KPI icon={<Receipt className="w-5 h-5" />} label="Factures" value={<AnimatedNumber value={invoices.length} />} tone="#F97316" />
        <KPI icon={<Package className="w-5 h-5" />} label="Unités vendues" value={<AnimatedNumber value={totalUnits} />} tone="#1A1A2E" />
        <KPI icon={<Store className="w-5 h-5" />} label="Boutiques actives" value={<AnimatedNumber value={byShop.length} />} tone="#16A34A" />
      </div>

      {totalRefunds > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-3 text-[#991B1B]" style={{ fontSize: 12 }}>
          Remboursements sur la période : <strong>{formatPrice(totalRefunds)} FCFA</strong>
        </div>
      )}

      <section className="bg-card border border-border rounded-2xl p-4">
        <h2 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          <Store className="w-4 h-4 text-[#E11D2E]" /> Top boutiques
        </h2>
        {byShop.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>Aucune vente sur la période.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>BOUTIQUE</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>FACTURES</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>UNITÉS</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>CA</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>PART</th>
                </tr>
              </thead>
              <tbody>
                {byShop.slice(0, 20).map((s) => {
                  const share = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr key={s.slug} className="border-b border-[#F3F4F6]">
                      <td className="px-2 py-1.5">
                        <Link to={`/boutique/${s.slug}`} className="hover:underline" style={{ fontWeight: 600 }}>
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5 text-right">{s.orders}</td>
                      <td className="px-2 py-1.5 text-right">{s.units}</td>
                      <td className="px-2 py-1.5 text-right" style={{ fontWeight: 700, color: "#16A34A" }}>
                        {formatPrice(s.revenue)} FCFA
                      </td>
                      <td className="px-2 py-1.5 text-right text-muted-foreground">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <FileText className="w-4 h-4 text-[#1A1A2E]" /> Par catégorie
          </h2>
          {byCategory.length === 0 ? (
            <div className="text-muted-foreground text-center p-4" style={{ fontSize: 12 }}>—</div>
          ) : (
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>CATÉGORIE</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>UNITÉS</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>CA</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.name} className="border-b border-[#F3F4F6]">
                    <td className="px-2 py-1.5" style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="px-2 py-1.5 text-right">{c.units}</td>
                    <td className="px-2 py-1.5 text-right" style={{ fontWeight: 700 }}>{formatPrice(c.revenue)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <Receipt className="w-4 h-4 text-[#F97316]" /> Par moyen de paiement
          </h2>
          {byPayment.length === 0 ? (
            <div className="text-muted-foreground text-center p-4" style={{ fontSize: 12 }}>—</div>
          ) : (
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>MOYEN</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>NB</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>MONTANT</th>
                </tr>
              </thead>
              <tbody>
                {byPayment.map((p) => (
                  <tr key={p.method} className="border-b border-[#F3F4F6]">
                    <td className="px-2 py-1.5" style={{ fontWeight: 600 }}>{PAYMENT_LABELS[p.method] || p.method}</td>
                    <td className="px-2 py-1.5 text-right">{p.count}</td>
                    <td className="px-2 py-1.5 text-right" style={{ fontWeight: 700 }}>{formatPrice(p.revenue)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="bg-card border border-border rounded-2xl p-4">
        <h2 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          <FileText className="w-4 h-4 text-[#E11D2E]" /> Dernières factures
        </h2>
        {invoices.length === 0 ? (
          <div className="text-muted-foreground text-center p-6" style={{ fontSize: 13 }}>Aucune facture sur la période.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>FACTURE</th>
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>DATE</th>
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>BOUTIQUE</th>
                  <th className="px-2 py-1.5" style={{ fontWeight: 700, fontSize: 10 }}>PRODUIT</th>
                  <th className="px-2 py-1.5 text-right" style={{ fontWeight: 700, fontSize: 10 }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 30).map((i) => (
                  <tr key={i.id} className="border-b border-[#F3F4F6]">
                    <td className="px-2 py-1.5" style={{ fontFamily: "ui-monospace", fontWeight: 600 }}>{i.number}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{new Date(i.ts).toLocaleDateString("fr-FR")}</td>
                    <td className="px-2 py-1.5 truncate max-w-[160px]">{i.sellerShopName || i.shopSlug}</td>
                    <td className="px-2 py-1.5">
                      <div className="truncate max-w-[180px]" style={{ fontWeight: 600 }}>{i.productName}</div>
                      <div className="text-muted-foreground" style={{ fontSize: 10 }}>{i.qty} × {formatPrice(i.unitPrice)}</div>
                    </td>
                    <td className="px-2 py-1.5 text-right" style={{ fontWeight: 700, color: "#16A34A" }}>{formatPrice(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length > 30 && (
              <p className="text-center text-muted-foreground pt-2" style={{ fontSize: 11 }}>
                + {invoices.length - 30} facture(s) — exporter en CSV pour le détail complet
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${tone}15`, color: tone }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  );
}

export default AdminComptabilitePage;
