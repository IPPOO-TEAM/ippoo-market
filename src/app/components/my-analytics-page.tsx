/* ═══════════════════════════════════════════
   IPPOO - Analytics boutique
   KPIs dérivés des commandes locales : CA total,
   commandes, panier moyen, taux d'acceptation,
   top produits, CA par jour (7 derniers jours).
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  ArrowLeft, TrendingUp, ShoppingBag, Wallet, CheckCircle2, Crown, Download,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  getUserProfile,
  subscribe as subscribeProfile,
  SERVER_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import {
  hydrateMyShops,
  subscribe as subscribeShops,
  getMyShopsSnapshot,
  SERVER_SNAPSHOT as SHOPS_SNAPSHOT,
  listAllShops,
  getActiveShopSlug,
} from "../data/my-shops";
import { listOrders, type OrderRecord } from "../data/orders-server";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import {
  hydrateMyProducts,
  subscribe as subscribeMy,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as MY_SNAPSHOT,
  listMyOrders,
  listMyMovements,
} from "../data/my-products";

type Period = 7 | 30 | 90;

export function MyAnalyticsPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => SERVER_SNAPSHOT);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);
  type ExportScope = "all" | "no-cancelled" | "completed-only";
  const [exportScope, setExportScope] = useState<ExportScope>("no-cancelled");
  useEffect(() => { hydrateMyShops(); hydrateMyProducts(); }, []);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);
  useSyncExternalStore(subscribeMy, getMyProductsSnapshot, () => MY_SNAPSHOT);

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug);
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  useEffect(() => {
    let alive = true;
    if (!isSeller(profile)) { setLoading(false); return; }
    listOrders()
      .then((all) => {
        if (!alive) return;
        const mine = all.filter((o) =>
          o.items.some((it) => it.vendorId === slug || it.vendorId === activeShopName),
        );
        setOrders(mine);
      })
      .catch(() => { if (alive) setOrders([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [profile, slug, activeShopName]);

  if (!isSeller(profile) || !slug) {
    return <Navigate to="/boutique" replace />;
  }

  const periodStart = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (period - 1));
    return d.getTime();
  })();
  const ordersInPeriod = orders.filter((o) => o.createdAt >= periodStart);

  const myItems = ordersInPeriod.flatMap((o) =>
    o.items
      .filter((it) => it.vendorId === slug || it.vendorId === activeShopName)
      .map((it) => ({ ...it, status: o.status, createdAt: o.createdAt })),
  );

  // Ventes encaissées en boutique (scan QR + manuel)
  const myOrders = listMyOrders(slug).filter((o) => o.ts >= periodStart);
  const myMovements = listMyMovements(slug).filter((m) => m.ts >= periodStart);

  const marketplaceRevenue = myItems
    .filter((it) => it.status !== "annulee")
    .reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const directRevenue = myOrders
    .filter((o) => o.status !== "refunded")
    .reduce((s, o) => s + o.total, 0);
  const revenue = marketplaceRevenue + directRevenue;
  const marketplaceCount = ordersInPeriod.filter((o) => o.status !== "annulee").length;
  const directCount = myOrders.filter((o) => o.status !== "refunded").length;
  const ordersCount = marketplaceCount + directCount;
  const avgBasket = ordersCount ? Math.round(revenue / ordersCount) : 0;
  const completed = ordersInPeriod.filter((o) => o.status === "cloturee").length + directCount;
  const total = ordersInPeriod.length + directCount;
  const conversionPct = total ? Math.round((completed / total) * 100) : 0;
  const unitsSold = myItems.filter((it) => it.status !== "annulee").reduce((s, it) => s + it.qty, 0)
    + myOrders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.qty, 0);
  const stockEntries = myMovements.filter((m) => m.delta > 0).reduce((s, m) => s + m.delta, 0);
  const stockExits = myMovements.filter((m) => m.delta < 0).reduce((s, m) => s + Math.abs(m.delta), 0);

  // Bucketing : journalier sur 7j, agrégation par semaine sur 30/90j
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bucketSize = period === 7 ? 1 : period === 30 ? 3 : 7; // jours par bucket
  const bucketCount = Math.ceil(period / bucketSize);
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const start = new Date(today);
    start.setDate(start.getDate() - (period - 1) + i * bucketSize);
    return {
      start: start.getTime(),
      end: start.getTime() + bucketSize * 86400000,
      label: period === 7
        ? start.toLocaleDateString("fr-FR", { weekday: "short" })
        : start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      ca: 0,
      n: 0,
    };
  });
  for (const it of myItems) {
    if (it.status === "annulee") continue;
    const b = buckets.find((bk) => it.createdAt >= bk.start && it.createdAt < bk.end);
    if (b) { b.ca += it.unitPrice * it.qty; b.n += 1; }
  }
  for (const o of myOrders) {
    if (o.status === "refunded") continue;
    const b = buckets.find((bk) => o.ts >= bk.start && o.ts < bk.end);
    if (b) { b.ca += o.total; b.n += 1; }
  }
  const chartData = buckets.map((b) => ({ name: b.label, CA: b.ca, Commandes: b.n }));

  // Top 5 produits par CA
  const productMap = new Map<string, { title: string; qty: number; ca: number }>();
  for (const it of myItems) {
    if (it.status === "annulee") continue;
    const cur = productMap.get(it.productId) ?? { title: it.title, qty: 0, ca: 0 };
    cur.qty += it.qty;
    cur.ca += it.unitPrice * it.qty;
    productMap.set(it.productId, cur);
  }
  for (const o of myOrders) {
    if (o.status === "refunded") continue;
    const cur = productMap.get(o.productId) ?? { title: o.productName, qty: 0, ca: 0 };
    cur.qty += o.qty;
    cur.ca += o.total;
    productMap.set(o.productId, cur);
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.ca - a.ca).slice(0, 5);

  const handleExport = () => {
    const COMMISSION_RATE = 0.08;
    const header = [
      "Date", "Commande", "Produit", "Quantite", "PU (FCFA)", "Total HT (FCFA)",
      "Commission IPPOO (FCFA)", "Net vendeur (FCFA)", "Statut", "Paiement",
    ];
    const rows: string[][] = [[...header]];
    const accept = (s: OrderRecord["status"]) =>
      exportScope === "all" ? true
      : exportScope === "no-cancelled" ? s !== "annulee"
      : s === "cloturee";
    for (const o of ordersInPeriod) {
      if (!accept(o.status)) continue;
      const date = new Date(o.createdAt).toISOString().slice(0, 10);
      for (const it of o.items) {
        if (it.vendorId !== slug && it.vendorId !== activeShopName) continue;
        const total = it.unitPrice * it.qty;
        const com = Math.round(total * COMMISSION_RATE);
        const net = total - com;
        rows.push([
          date, o.id, it.title, String(it.qty),
          String(it.unitPrice), String(total), String(com), String(net),
          o.status, o.paymentMethod,
        ]);
      }
    }
    if (rows.length === 1) { toast.info("Aucune commande sur cette période"); return; }
    const totalCa = rows.slice(1).reduce((s, r) => s + Number(r[5] || 0), 0);
    const totalCom = rows.slice(1).reduce((s, r) => s + Number(r[6] || 0), 0);
    const totalNet = rows.slice(1).reduce((s, r) => s + Number(r[7] || 0), 0);
    rows.push([]);
    rows.push(["", "", "TOTAUX", "", "", String(totalCa), String(totalCom), String(totalNet), "", ""]);

    const escape = (v: string) => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = "﻿" + rows.map((r) => r.map(escape).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeShop = (activeShopName || "boutique").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ippoo-export-${safeShop}-${period}j-${today}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length - 3} ligne(s) exportée(s)`);
  };

  const kpis: Array<{ label: string; numeric: number; suffix: string; icon: LucideIcon; tone: string }> = [
    { label: "CA total", numeric: revenue, suffix: " FCFA", icon: TrendingUp, tone: "#16A34A" },
    { label: "Commandes", numeric: ordersCount, suffix: "", icon: ShoppingBag, tone: "#3B82F6" },
    { label: "Panier moyen", numeric: avgBasket, suffix: " FCFA", icon: Wallet, tone: "#F97316" },
    { label: "Conversion", numeric: conversionPct, suffix: "%", icon: CheckCircle2, tone: "#E11D2E" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Analytics
          </h1>
          {allShops.length > 1 && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              Boutique : {activeShopName}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {([7, 30, 90] as Period[]).map((p) => {
          const active = period === p;
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 px-3 py-2 rounded-xl border transition ${active ? "border-[#E11D2E] bg-[#FEF2F2]" : "border-border bg-white hover:bg-muted/40"}`}
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: active ? "#E11D2E" : "#374151" }}
            >
              {p} jours
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-border">
        <span className="text-muted-foreground" style={{ fontSize: 11, fontFamily: "Poppins", fontWeight: 600 }}>
          Export comptable
        </span>
        <select
          value={exportScope}
          onChange={(e) => setExportScope(e.target.value as typeof exportScope)}
          className="px-2 py-1.5 rounded-lg border border-border bg-white"
          style={{ fontFamily: "Poppins", fontSize: 12, color: "#374151" }}
        >
          <option value="completed-only">Livrées uniquement (encaissé)</option>
          <option value="no-cancelled">Toutes hors annulées</option>
          <option value="all">Toutes y compris annulées</option>
        </select>
        <button
          onClick={handleExport}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted/40 transition"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: "#374151" }}
          title="Exporter en CSV (compatible Excel)"
        >
          <Download className="w-4 h-4" />
          Télécharger CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{k.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${k.tone}15` }}>
                  <Icon className="w-4 h-4" style={{ color: k.tone }} />
                </div>
              </div>
              <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
                <AnimatedNumber value={k.numeric} suffix={k.suffix} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventaire & ventes directes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniStat label="Unités vendues" value={unitsSold.toString()} tone="#16A34A" />
        <MiniStat label="Ventes directes" value={`${directCount}`} tone="#3B82F6" sub={fcfaShort(directRevenue)} />
        <MiniStat label="Entrées stock" value={`+${stockEntries}`} tone="#16A34A" />
        <MiniStat label="Sorties stock" value={`-${stockExits}`} tone="#E11D2E" />
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-5">
        <div className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
          CA des 7 derniers jours
        </div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
              <Tooltip
                formatter={(v: number, n: string) => n === "CA" ? `${formatPrice(v)} FCFA` : String(v)}
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
              />
              <Bar dataKey="CA" radius={[6, 6, 0, 0]} fill="#E11D2E" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4" style={{ color: "#F0B429" }} />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>Top produits</div>
        </div>
        {loading ? (
          <div className="py-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>Chargement…</div>
        ) : topProducts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>
            Pas encore de données. Vos meilleures ventes apparaîtront ici.
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p, i) => {
              const max = topProducts[0].ca || 1;
              const pct = Math.round((p.ca / max) * 100);
              return (
                <div key={p.title + i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate flex-1 pr-2" style={{ fontSize: 13, fontWeight: 600 }}>
                      {i + 1}. {p.title}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: 11 }}>
                      {p.qty} vendus
                    </span>
                    <span className="ml-3 flex-shrink-0" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#E11D2E" }}>
                      {formatPrice(p.ca)} FCFA
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #E11D2E 0%, #F97316 100%)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fcfaShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return formatPrice(n);
}

function MiniStat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-3">
      <div className="text-muted-foreground" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.04, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: tone }}>{value}</div>
      {sub && <div className="text-muted-foreground" style={{ fontSize: 10 }}>{sub} FCFA</div>}
    </div>
  );
}

export default MyAnalyticsPage;
