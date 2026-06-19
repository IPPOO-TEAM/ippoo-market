/* ═══════════════════════════════════════════
   IPPOO — Tableau de bord vendeur
   Vue d'ensemble de la boutique : KPIs, commandes
   récentes, raccourcis, aperçu public.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router";
import {
  Store,
  ArrowRight,
  Eye,
  Package,
  ShoppingBag,
  Wallet,
  MessageCircle,
  Plus,
  Settings,
  TrendingUp,
  BarChart3,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  QrCode,
  Download,
  Share2,
  X,
  ChevronDown,
  PlusCircle,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  getUserProfile,
  subscribe,
  SERVER_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import { slugifyShopName, getShopAssets } from "../data/shop-assets";
import { listOrders, type OrderRecord } from "../data/orders-server";
import { openInvoiceForVendor } from "../data/invoice-pdf";
import { FileText, BadgePercent, Star, Sparkles, Inbox } from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "./animated-number";
import {
  hydrateMyProducts,
  subscribe as subscribeProducts,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as PRODUCTS_SNAPSHOT,
  listMyProducts,
} from "../data/my-products";
import { publishMyVendor } from "../data/public-vendors";
import {
  hydrateMyShops,
  subscribe as subscribeShops,
  getMyShopsSnapshot,
  SERVER_SNAPSHOT as SHOPS_SNAPSHOT,
  listAllShops,
  getActiveShopSlug,
  setActiveShop,
  addShop,
  removeShop,
} from "../data/my-shops";
import { isOrganization, isBusiness } from "../auth/user-profile";
import { formatPrice } from "./mock-data";

const fcfa = (n: number) => `${formatPrice(n)} FCFA`;

function statusLabel(s: OrderRecord["status"]): string {
  return { pending: "En attente", shipped: "Expédiée", completed: "Livrée", cancelled: "Annulée" }[s];
}

function statusTone(s: OrderRecord["status"]): string {
  return {
    pending: "#F59E0B",
    shipped: "#3B82F6",
    completed: "#16A34A",
    cancelled: "#9CA3AF",
  }[s];
}

export function MyShopPage() {
  const profile = useSyncExternalStore(subscribe, getUserProfile, () => SERVER_SNAPSHOT);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [shopSwitcherOpen, setShopSwitcherOpen] = useState(false);
  const [addShopOpen, setAddShopOpen] = useState(false);
  useEffect(() => { hydrateMyProducts(); hydrateMyShops(); }, []);

  useSyncExternalStore(subscribeProducts, getMyProductsSnapshot, () => PRODUCTS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug) ?? allShops[0];
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";
  const canMultiShop = isOrganization(profile) || isBusiness(profile);

  const assets = useMemo(() => (slug ? getShopAssets(slug, activeShopName) : null), [slug, activeShopName]);

  useEffect(() => {
    let alive = true;
    if (!isSeller(profile)) { setLoading(false); return; }
    let stopDaily: (() => void) | undefined;
    if (slug) {
      void import("../notifications/daily-checks").then((m) => { stopDaily = m.startDailyChecks(slug); }).catch(() => undefined);
    }
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
    return () => { alive = false; stopDaily?.(); };
  }, [profile, slug]);

  if (!isSeller(profile) || !profile?.businessName?.trim()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-border p-8 shadow-sm">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)" }}
          >
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20 }}>
            Vous n'avez pas encore de boutique
          </h2>
          <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
            Devenez vendeur sur IPPOO Market pour ouvrir votre boutique et commencer à vendre.
          </p>
          <Link
            to="/devenir-vendeur"
            className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 6px 14px rgba(232,32,42,.3)",
            }}
          >
            Ouvrir ma boutique
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= todayStart.getTime());
  const todayRevenue = todayOrders.reduce(
    (s, o) =>
      s + o.items
        .filter((it) => it.vendorId === slug || it.vendorId === activeShopName)
        .reduce((ss, it) => ss + it.unitPrice * it.qty, 0),
    0,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const kpis: Array<{ label: string; value: string; numeric?: number; suffix?: string; icon: LucideIcon; tone: string }> = [
    { label: "CA du jour", value: fcfa(todayRevenue), numeric: todayRevenue, suffix: " FCFA", icon: TrendingUp, tone: "#16A34A" },
    { label: "Commandes en attente", value: String(pendingCount), numeric: pendingCount, icon: Clock, tone: "#F59E0B" },
    { label: "Commandes totales", value: String(orders.length), numeric: orders.length, icon: ShoppingBag, tone: "#3B82F6" },
    { label: "Produits publiés", value: String(listMyProducts(slug).filter((p) => p.status === "published").length), numeric: listMyProducts(slug).filter((p) => p.status === "published").length, icon: Package, tone: "#8B5CF6" },
  ];

  const onboarding = [
    { key: "logo", label: "Ajouter un logo", done: !!assets?.logo || !!profile.logo, to: "/profil" },
    { key: "banner", label: "Ajouter une bannière", done: !!assets?.banner || !!profile.shopPhoto, to: "/profil" },
    { key: "desc", label: "Décrire votre boutique", done: !!profile.description?.trim(), to: "/profil" },
    { key: "delivery", label: "Configurer la livraison", done: (profile.deliveryMethods?.length ?? 0) > 0, to: "/profil" },
    { key: "payment", label: "Recevoir des paiements", done: (profile.paymentMethods?.length ?? 0) > 0, to: "/profil" },
    { key: "product", label: "Publier un premier produit", done: listMyProducts(slug).some((p) => p.status === "published"), to: "/boutique/produits" },
  ];
  const doneCount = onboarding.filter((o) => o.done).length;
  const progress = Math.round((doneCount / onboarding.length) * 100);

  const pendingReviewsCount = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const r = require("../data/shop-reviews") as typeof import("../data/shop-reviews");
      r.hydrateShopReviews();
      return r.listShopReviews(slug, ["pending"]).length;
    } catch { return 0; }
  })();

  const lowStockInfo = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const r = require("../notifications/low-stock-watcher") as typeof import("../notifications/low-stock-watcher");
      return r.checkLowStock(slug);
    } catch { return { lowCount: 0, outCount: 0 }; }
  })();
  const stockAlertCount = lowStockInfo.lowCount + lowStockInfo.outCount;

  const actions: Array<{ label: string; icon: LucideIcon; to: string; tone: string; badge?: number; badgeTone?: string }> = [
    { label: "Mes produits", icon: Plus, to: "/boutique/produits", tone: "#E11D2E", badge: stockAlertCount, badgeTone: lowStockInfo.outCount > 0 ? "#E11D2E" : "#F59E0B" },
    { label: "Analytics", icon: BarChart3, to: "/boutique/analytics", tone: "#8B5CF6" },
    { label: "Commandes reçues", icon: Package, to: "/boutique/commandes", tone: "#3B82F6", badge: pendingCount },
    { label: "Mes clients", icon: Users, to: "/boutique/clients", tone: "#0EA5E9" },
    { label: "Promotions", icon: BadgePercent, to: "/boutique/promotions", tone: "#E11D2E" },
    { label: "Avis clients", icon: Star, to: "/boutique/avis", tone: "#F59E0B", badge: pendingReviewsCount },
    { label: "Devis reçus", icon: Inbox, to: "/boutique/devis", tone: "#10B981" },
    { label: "Comptabilité", icon: Wallet, to: "/vendeur-comptabilite", tone: "#16A34A" },
    { label: "Messages", icon: MessageCircle, to: "/messagerie", tone: "#F97316" },
    { label: "Paramètres", icon: Settings, to: "/parametres", tone: "#6B7280" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      {/* En-tête boutique — design moderne avec halo et glass */}
      <div
        className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{
          background: assets?.banner
            ? `linear-gradient(135deg, rgba(225,29,46,.78), rgba(249,115,22,.78)), url(${assets.banner}) center/cover`
            : "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
          boxShadow: "0 18px 40px -18px rgba(225,29,46,.55)",
        }}
      >
        {/* Halos décoratifs */}
        <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,.25) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-3 text-white">
          {assets?.logo ? (
            <img src={assets.logo} alt={activeShopName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
              <Store className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="opacity-90 flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 600 }}>
              <Sparkles className="w-3 h-3" />
              Ma boutique
              {allShops.length > 1 && (
                <span className="px-1.5 rounded-full bg-white/25 backdrop-blur-sm" style={{ fontSize: 10, fontWeight: 700 }}>
                  {allShops.length}
                </span>
              )}
            </div>
            <button
              onClick={() => canMultiShop && setShopSwitcherOpen((v) => !v)}
              className={`truncate inline-flex items-center gap-1.5 mt-0.5 ${canMultiShop ? "hover:opacity-90" : ""}`}
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, letterSpacing: "-.01em" }}
              disabled={!canMultiShop}
            >
              {activeShopName}
              {canMultiShop && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm">
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                </span>
              )}
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <QrCode className="w-4 h-4" />
              QR
            </button>
            <button
              onClick={() => navigate(`/boutique/${slug}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#E11D2E] hover:scale-[1.02] transition shadow-md"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
            >
              <Eye className="w-4 h-4" />
              Aperçu public
            </button>
          </div>
        </div>
        <div className="sm:hidden relative mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white"
            style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          <button
            onClick={() => navigate(`/boutique/${slug}`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#E11D2E] shadow-md"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
          >
            <Eye className="w-4 h-4" />
            Aperçu
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {qrOpen && (
        <ShopQrModal
          slug={slug}
          shopName={activeShopName}
          onClose={() => setQrOpen(false)}
        />
      )}

      {shopSwitcherOpen && canMultiShop && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShopSwitcherOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp .25s cubic-bezier(.2,.8,.2,1)" }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D4A 100%)" }}
            >
              <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(225,29,46,.35) 0%, transparent 70%)" }} />
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)" }}>
                <Store className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="relative flex-1">
                <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                  Mes boutiques
                </h3>
                <div className="text-white/60" style={{ fontSize: 11 }}>
                  {allShops.length} boutique{allShops.length > 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => setShopSwitcherOpen(false)} className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5">
              {allShops.map((s, idx) => {
                const active = s.slug === slug;
                const isPrimary = idx === 0;
                const shopAssets = getShopAssets(s.slug, s.name);
                return (
                  <div
                    key={s.slug}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl transition ${active ? "bg-gradient-to-r from-[#FEF2F2] to-[#FFF7ED] ring-1 ring-[#E11D2E]/30" : "hover:bg-muted/40"}`}
                  >
                    <button
                      onClick={() => { setActiveShop(s.slug); setShopSwitcherOpen(false); }}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      {shopAssets?.logo ? (
                        <img src={shopAssets.logo} alt={s.name} className={`w-11 h-11 rounded-xl object-cover flex-shrink-0 ${active ? "ring-2 ring-[#E11D2E]" : ""}`} />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ background: active ? "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)" : "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)" }}
                        >
                          <Store className={`w-5 h-5 ${active ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate flex items-center gap-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                          {s.name}
                          {isPrimary && (
                            <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D4A 100%)", fontSize: 9, fontWeight: 700 }}>
                              Principale
                            </span>
                          )}
                        </div>
                        <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
                          {[s.city, s.niche].filter(Boolean).join(" · ") || s.slug}
                        </div>
                      </div>
                      {active && (
                        <div className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-sm" style={{ fontSize: 10, fontWeight: 700, color: "#16A34A" }}>
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </div>
                      )}
                    </button>
                    {!isPrimary && (
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer la boutique "${s.name}" ?`)) {
                            removeShop(s.slug);
                            toast.success("Boutique supprimée");
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-[#FEF2F2] hover:text-[#E11D2E] text-muted-foreground transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-border bg-muted/20">
              <button
                onClick={() => { setShopSwitcherOpen(false); setAddShopOpen(true); }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-white hover:scale-[1.01] transition"
                style={{
                  background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                  fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
                  boxShadow: "0 8px 18px rgba(232,32,42,.35)",
                }}
              >
                <PlusCircle className="w-4 h-4" />
                Ajouter une boutique
              </button>
            </div>
          </div>
        </div>
      )}

      {addShopOpen && (
        <AddShopModal
          onClose={() => setAddShopOpen(false)}
          onAdded={() => { setAddShopOpen(false); toast.success("Boutique créée"); }}
        />
      )}

      {/* KPIs — design moderne avec accent latéral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="group bg-white rounded-2xl border border-border p-4 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-1 rounded-r-full opacity-70 group-hover:opacity-100 transition"
                style={{ background: `linear-gradient(180deg, ${k.tone} 0%, ${k.tone}99 100%)` }}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".02em" }}>{k.label}</span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition"
                  style={{ background: `${k.tone}15`, boxShadow: `0 4px 10px ${k.tone}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: k.tone }} />
                </div>
              </div>
              <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "#1A1A2E" }}>
                {k.numeric != null
                  ? <AnimatedNumber value={k.numeric} suffix={k.suffix ?? ""} />
                  : k.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboarding — masqué quand tout est complété */}
      {progress < 100 && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
                Complétez votre boutique
              </div>
              <div className="text-muted-foreground" style={{ fontSize: 12 }}>
                {doneCount}/{onboarding.length} étapes terminées
              </div>
            </div>
            <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18, color: "#E11D2E" }}>
              {progress}%
            </div>
          </div>
          <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #E11D2E 0%, #F97316 100%)",
              }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {onboarding.map((o) => {
              const Icon = o.done ? CheckCircle2 : Circle;
              return (
                <Link
                  key={o.key}
                  to={o.to}
                  className={`flex items-center gap-2 p-2 rounded-xl ${o.done ? "bg-[#F0FDF4]" : "hover:bg-muted/40"}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color: o.done ? "#16A34A" : "#9CA3AF" }} />
                  <span
                    className={o.done ? "line-through text-muted-foreground" : ""}
                    style={{ fontSize: 13 }}
                  >
                    {o.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div className="mb-5">
        <div className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
          Raccourcis
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.to}
                className="relative bg-white rounded-2xl border border-border p-4 flex flex-col items-start gap-2 hover:border-[#E11D2E] hover:shadow-sm transition press-feedback"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${a.tone}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: a.tone }} />
                </div>
                <span style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>{a.label}</span>
                {a.badge != null && a.badge > 0 && (
                  <span
                    className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full text-white flex items-center justify-center"
                    style={{ background: a.badgeTone ?? "#E11D2E", fontFamily: "Poppins", fontWeight: 700, fontSize: 10, boxShadow: `0 2px 6px ${a.badgeTone ?? "#E11D2E"}66` }}
                  >
                    {a.badge > 99 ? "99+" : a.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Commandes récentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>Commandes récentes</div>
          <Link to="/boutique/commandes" className="text-[#E11D2E] inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>Chargement…</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <div className="text-muted-foreground" style={{ fontSize: 13 }}>
                Aucune commande pour le moment.
              </div>
            </div>
          ) : (
            recentOrders.map((o, i) => {
              const myItems = o.items.filter((it) => it.vendorId === slug || it.vendorId === activeShopName);
              const subtotal = myItems.reduce((s, it) => s + it.unitPrice * it.qty, 0);
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-2 p-3 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Link
                    to={`/commande/${o.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:bg-muted/40 -m-3 p-3 rounded-l-xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                        {myItems[0]?.title ?? `Commande ${o.id.slice(0, 6)}`}
                        {myItems.length > 1 && <span className="text-muted-foreground"> +{myItems.length - 1}</span>}
                      </div>
                      <div className="text-muted-foreground" style={{ fontSize: 11 }}>
                        {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{fcfa(subtotal)}</div>
                      <span
                        className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-white"
                        style={{ background: statusTone(o.status), fontSize: 10, fontWeight: 600 }}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() =>
                      openInvoiceForVendor(o, {
                        shopName: activeShopName,
                        city: profile.city,
                        phone: profile.phone,
                        email: profile.email,
                        rccm: profile.rccm,
                        ifu: profile.ifu,
                        logo: profile.logo,
                      }, slug)
                    }
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    title="Télécharger la facture PDF"
                    aria-label="Télécharger la facture PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AddShopModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <h3 className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            Nouvelle boutique
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <label className="block">
            <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Nom de la boutique</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-white"
              style={{ fontSize: 13 }}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Ville</div>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white"
                style={{ fontSize: 13 }}
              />
            </label>
            <label className="block">
              <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Niche</div>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white"
                style={{ fontSize: 13 }}
                placeholder="alimentation, beauté…"
              />
            </label>
          </div>
          <label className="block">
            <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Description (optionnel)</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-white resize-none"
              style={{ fontSize: 13 }}
            />
          </label>
        </div>
        <div className="p-3 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted"
            style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (!name.trim()) { toast.error("Nom requis"); return; }
              addShop({
                name: name.trim(),
                city: city.trim() || undefined,
                niche: niche.trim() || undefined,
                description: description.trim() || undefined,
              });
              onAdded();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
              boxShadow: "0 6px 14px rgba(232,32,42,.3)",
            }}
          >
            Créer la boutique
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopQrModal({ slug, shopName, onClose }: { slug: string; shopName: string; onClose: () => void }) {
  const url = `${window.location.origin}/boutique/${slug}`;

  const handleDownload = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#shop-qr-canvas canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-qrcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    const text = `Découvrez ma boutique ${shopName} sur IPPOO Market`;
    if (navigator.share) {
      try { await navigator.share({ title: shopName, text, url }); return; } catch { /* annulé */ }
    }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>QR Code de la boutique</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div id="shop-qr-canvas" className="flex flex-col items-center bg-[#FAFAFA] rounded-xl p-4 mb-4">
          <QRCodeCanvas
            value={url}
            size={220}
            level="H"
            includeMargin
            fgColor="#1A1A2E"
          />
          <div className="mt-3 text-center" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
            {shopName}
          </div>
          <div className="text-muted-foreground text-center break-all" style={{ fontSize: 11 }}>{url}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted"
            style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyShopPage;
