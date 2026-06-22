/* ═══════════════════════════════════════════
   IPPOO - Vendeur · Commandes (vue dédiée + filtres avancés)
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  FileText,
  ShoppingBag,
  CalendarDays,
  X,
  ArrowUpDown,
  Store as StoreIcon,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { listOrders, refreshVendorOrders, type OrderRecord } from "../data/orders-server";
import { openInvoiceForVendor, getInvoiceNumber } from "../data/invoice-pdf";
import {
  getUserProfile,
  subscribe,
  SERVER_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import { getActiveShopSlug, listAllShops } from "../data/my-shops";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import {
  hydrateMyProducts,
  subscribe as subscribeMy,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as MY_SNAPSHOT,
  listMyOrders,
  listMyInvoices,
  type MyOrder,
  type MyInvoice,
} from "../data/my-products";

const fcfa = (n: number) => `${formatPrice(n)} FCFA`;
type Status = OrderRecord["status"];
type Payment = OrderRecord["paymentMethod"];

const STATUS_LABEL: Record<Status, string> = {
  pending: "En attente",
  preparation: "En préparation",
  expedition: "Expédiée",
  livree: "Livrée",
  cloturee: "Clôturée",
  litige: "Litige",
  annulee: "Annulée",
};
const STATUS_TONE: Record<Status, string> = {
  pending: "#F0B429",
  preparation: "#F59E0B",
  expedition: "#3B82F6",
  livree: "#16A34A",
  cloturee: "#6B7280",
  litige: "#E11D2E",
  annulee: "#9CA3AF",
};
const PAYMENT_LABEL: Record<Payment, string> = {
  wallet: "IPPOO CASH",
  cod: "Paiement livraison",
  card: "Carte",
  "mobile-money": "Mobile Money",
};

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function MyShopOrdersPage() {
  const profile = useSyncExternalStore(subscribe, getUserProfile, () => SERVER_SNAPSHOT);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const slug = getActiveShopSlug(profile?.businessName);
  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const activeShop = allShops.find((s) => s.slug === slug) ?? allShops[0];
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  // Filtres
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [payment, setPayment] = useState<"all" | Payment>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!isSeller(profile)) { setLoading(false); return; }
    hydrateMyProducts();
    Promise.all([refreshVendorOrders(), listOrders()])
      .then(([vendorOrders, myOrders]) => {
        if (!alive) return;
        const byId = new Map<string, OrderRecord>();
        for (const o of vendorOrders) byId.set(o.id, o);
        for (const o of myOrders) if (!byId.has(o.id)) byId.set(o.id, o);
        setOrders(Array.from(byId.values()));
      })
      .catch(() => { if (alive) setOrders([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [profile]);

  useSyncExternalStore(subscribeMy, getMyProductsSnapshot, () => MY_SNAPSHOT);
  const myOrders: MyOrder[] = useMemo(() => slug ? listMyOrders(slug) : [], [slug]);
  const myInvoices: MyInvoice[] = useMemo(() => slug ? listMyInvoices(slug) : [], [slug]);
  const myInvoiceByOrder = useMemo(() => {
    const m = new Map<string, MyInvoice>();
    for (const inv of myInvoices) m.set(inv.orderId, inv);
    return m;
  }, [myInvoices]);
  const myTotals = useMemo(() => {
    const sub = myOrders.reduce((s, o) => s + o.total, 0);
    const units = myOrders.reduce((s, o) => s + o.qty, 0);
    return { count: myOrders.length, sub, units };
  }, [myOrders]);

  const rows = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : 0;
    const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
    const minA = minAmount ? parseInt(minAmount, 10) || 0 : 0;
    const ql = q.trim().toLowerCase();
    const list = orders.flatMap((o) => {
      const mine = o.items.filter((it) => it.vendorId === slug || it.vendorId === activeShopName);
      if (mine.length === 0) return [];
      const subtotal = mine.reduce((s, it) => s + it.unitPrice * it.qty, 0);
      if (subtotal < minA) return [];
      if (o.createdAt < fromTs || o.createdAt > toTs) return [];
      if (status !== "all" && o.status !== status) return [];
      if (payment !== "all" && o.paymentMethod !== payment) return [];
      if (ql) {
        const hay = `${o.id} ${o.shippingAddress.name} ${o.shippingAddress.city} ${mine.map((i) => i.title).join(" ")}`.toLowerCase();
        if (!hay.includes(ql)) return [];
      }
      return [{ order: o, items: mine, subtotal }];
    });
    list.sort((a, b) => {
      switch (sort) {
        case "date-asc": return a.order.createdAt - b.order.createdAt;
        case "amount-desc": return b.subtotal - a.subtotal;
        case "amount-asc": return a.subtotal - b.subtotal;
        default: return b.order.createdAt - a.order.createdAt;
      }
    });
    return list;
  }, [orders, slug, activeShopName, q, status, payment, from, to, minAmount, sort]);

  const totals = useMemo(() => {
    const sub = rows.reduce((s, r) => s + r.subtotal, 0);
    const comm = Math.round(sub * 0.08);
    return { count: rows.length, sub, comm, net: sub - comm };
  }, [rows]);

  const resetFilters = () => {
    setQ(""); setStatus("all"); setPayment("all"); setFrom(""); setTo(""); setMinAmount(""); setSort("date-desc");
  };

  const exportCsv = () => {
    if (rows.length === 0) { toast.error("Aucune commande à exporter"); return; }
    const sep = ";";
    const head = ["N° Facture", "Commande", "Date", "Client", "Ville", "Produits", "Qté", "Total HT (FCFA)", "Commission 8% (FCFA)", "Net (FCFA)", "Statut", "Paiement"];
    const lines = rows.map((r) => {
      const qty = r.items.reduce((s, i) => s + i.qty, 0);
      const titles = r.items.map((i) => i.title).join(" | ");
      const comm = Math.round(r.subtotal * 0.08);
      return [
        getInvoiceNumber(slug, r.order.id, r.order.createdAt),
        r.order.id,
        new Date(r.order.createdAt).toLocaleString("fr-FR"),
        r.order.shippingAddress.name,
        r.order.shippingAddress.city,
        titles,
        qty,
        r.subtotal,
        comm,
        r.subtotal - comm,
        STATUS_LABEL[r.order.status],
        PAYMENT_LABEL[r.order.paymentMethod],
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep);
    });
    const totalLine = ["", "", "", "", "", "TOTAUX", "", totals.sub, totals.comm, totals.net, "", ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep);
    const csv = "﻿" + [head.join(sep), ...lines, totalLine].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} commande(s) exportée(s)`);
  };

  if (!isSeller(profile)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Cette page est réservée aux vendeurs.</p>
        <button onClick={() => navigate("/devenir-vendeur")} className="mt-4 px-4 py-2 rounded-xl bg-[#FF6A00] text-white">Devenir vendeur</button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
            <ShoppingBag className="w-6 h-6" /> COMMANDES - {activeShopName.toUpperCase()}
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>
            Filtre, exporte et facture toutes les commandes de ta boutique
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Barre recherche + actions */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (n° commande, client, ville, produit)…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
                style={{ fontSize: 13 }}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-2 rounded-xl border ${showFilters ? "bg-[#FF6A00] text-white border-[#E11D2E]" : "border-border"}`}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <Filter className="w-4 h-4 inline-block mr-1" /> Filtres
            </button>
            <button
              onClick={exportCsv}
              className="px-3 py-2 rounded-xl bg-[#16A34A] text-white"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <Download className="w-4 h-4 inline-block mr-1" /> CSV
            </button>
          </div>

          {showFilters && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-[#F3F4F6]">
              <label className="block">
                <span className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>Statut</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="shipped">Expédiée</option>
                  <option value="completed">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </label>
              <label className="block">
                <span className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>Paiement</span>
                <select value={payment} onChange={(e) => setPayment(e.target.value as typeof payment)} className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                  <option value="all">Tous</option>
                  <option value="wallet">IPPOO CASH</option>
                  <option value="cod">Paiement livraison</option>
                  <option value="card">Carte</option>
                  <option value="mobile-money">Mobile Money</option>
                </select>
              </label>
              <label className="block">
                <span className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>Trier</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                  <option value="date-desc">Date (récent → ancien)</option>
                  <option value="date-asc">Date (ancien → récent)</option>
                  <option value="amount-desc">Montant ↓</option>
                  <option value="amount-asc">Montant ↑</option>
                </select>
              </label>
              <label className="block">
                <span className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 11 }}><CalendarDays className="w-3 h-3" /> Du</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
              </label>
              <label className="block">
                <span className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 11 }}><CalendarDays className="w-3 h-3" /> Au</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
              </label>
              <label className="block">
                <span className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>Montant min (FCFA)</span>
                <input inputMode="numeric" value={minAmount} onChange={(e) => setMinAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" className="w-full px-3 py-2 rounded-xl bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
              </label>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button onClick={resetFilters} className="text-[#E11D2E] inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
                  <X className="w-3 h-3" /> Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Commandes" value={<AnimatedNumber value={totals.count} />} />
          <Kpi label="Chiffre d'affaires" value={<><AnimatedNumber value={totals.sub} format={(n) => formatPrice(n)} /> FCFA</>} />
          <Kpi label="Commission (8%)" value={<><AnimatedNumber value={totals.comm} format={(n) => formatPrice(n)} /> FCFA</>} tone="#F97316" />
          <Kpi label="Net vendeur" value={<><AnimatedNumber value={totals.net} format={(n) => formatPrice(n)} /> FCFA</>} tone="#16A34A" />
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_120px_120px_120px_120px_80px] gap-2 px-4 py-3 bg-[#F9FAFB] text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.04 }}>
            <span>Commande / Client</span>
            <span>Date</span>
            <span>Paiement</span>
            <span>Statut</span>
            <span className="text-right">Total</span>
            <span className="text-right"><ArrowUpDown className="w-3 h-3 inline" /></span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>Chargement…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>Aucune commande ne correspond à tes filtres.</div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {rows.map(({ order, items, subtotal }) => {
                const inv = getInvoiceNumber(slug, order.id, order.createdAt);
                return (
                  <div key={order.id} className="sm:grid sm:grid-cols-[1fr_120px_120px_120px_120px_80px] sm:items-center gap-2 px-4 py-3 hover:bg-muted/30">
                    <div className="min-w-0">
                      <Link to={`/commande/${order.id}`} className="block">
                        <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>
                          {items[0]?.title ?? "-"}{items.length > 1 && <span className="text-muted-foreground"> +{items.length - 1}</span>}
                        </div>
                        <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                          {inv} · {order.shippingAddress.name} · {order.shippingAddress.city}
                        </div>
                      </Link>
                    </div>
                    <div className="text-muted-foreground" style={{ fontSize: 12 }}>
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                    </div>
                    <div className="text-muted-foreground" style={{ fontSize: 12 }}>{PAYMENT_LABEL[order.paymentMethod]}</div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-white" style={{ background: STATUS_TONE[order.status], fontSize: 10, fontWeight: 700 }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <div className="text-right" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{fcfa(subtotal)}</div>
                    <div className="text-right">
                      <button
                        onClick={() => openInvoiceForVendor(order, {
                          shopName: activeShopName,
                          city: profile?.city,
                          phone: profile?.phone,
                          email: profile?.email,
                          rccm: profile?.rccm,
                          ifu: profile?.ifu,
                          logo: profile?.logo,
                        }, slug)}
                        className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        title="Facture PDF"
                        aria-label="Facture PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Ventes encaissées en boutique (scan QR + manuel) ─── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-[#FEF2F2] to-[#FFF7ED] flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-[#E11D2E]" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                Ventes en boutique (scan & comptoir)
              </div>
              <div className="text-muted-foreground" style={{ fontSize: 11 }}>
                {myTotals.count} vente(s) · {fcfa(myTotals.sub)} · {myTotals.units} unité(s) écoulée(s)
              </div>
            </div>
          </div>
          {myOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>
              Aucune vente directe. Encaisse une vente depuis une fiche produit ou laisse un client scanner le QR.
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {myOrders.map((o) => {
                const inv = myInvoiceByOrder.get(o.id);
                const date = new Date(o.ts);
                const sourceLabel = o.source === "scan" ? "QR scan" : o.source === "manual" ? "Comptoir" : "Marketplace";
                const sourceTone = o.source === "scan" ? "#3B82F6" : o.source === "manual" ? "#16A34A" : "#F97316";
                return (
                  <div key={o.id} className="px-4 py-3 hover:bg-muted/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: `${sourceTone}15` }}>
                      {o.source === "scan" ? <QrCode className="w-4 h-4" style={{ color: sourceTone }} /> : <StoreIcon className="w-4 h-4" style={{ color: sourceTone }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>
                        {o.productName}
                      </div>
                      <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                        {inv?.number ?? o.id} · {o.buyerName ?? "Anonyme"} · {date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-white" style={{ background: sourceTone, fontSize: 10, fontWeight: 700 }}>
                      {sourceLabel}
                    </span>
                    <div className="text-right">
                      <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#16A34A" }}>
                        {fcfa(o.total)}
                      </div>
                      <div className="text-muted-foreground" style={{ fontSize: 10 }}>
                        {o.qty} × {fcfa(o.unitPrice)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-3">
      <p className="text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.04, fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: tone ?? "#111827" }}>{value}</p>
    </div>
  );
}
