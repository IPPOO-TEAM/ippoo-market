import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Search,
  ShoppingCart,
  Wallet,
  User,
  Bell,
  Menu,
  X,
  Gift,
  Crown,
  Store,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronRight,
  Package,
  Zap,
  ScanLine,
  Smartphone,
  Shield,
  Globe,
  Users,
  Layers,
  Wrench,
  Scale,
  Building2,
  BarChart3,
  Play,
  UserCheck,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { PWAInstallPrompt } from "./pwa-install-prompt";
import { LanguageSwitcher } from "./language-switcher";
import { useContent } from "../admin/content";
import { useAdminSettings } from "../admin/settings-store";
import { usePayments } from "../payments/usePayments";
import { useNotifications } from "../notifications/useNotifications";
import { useUserProfile } from "../auth/useUserProfile";
import { Briefcase, Heart } from "lucide-react";
import { allProducts } from "./mock-data";
import { productUid } from "../lib/product-uid";
import { PullToRefresh } from "../native/PullToRefresh";
import { RefreshProvider, useRefreshContext } from "../native/RefreshContext";
import ippooLogo from "../../imports/ippo_market.png";
const ippooOldLogo = ippooLogo;

const navItems = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/explorer", icon: Search, label: "Explorer" },
  { path: "/promos", icon: Zap, label: "Promos" },
  { path: "/commandes", icon: Package, label: "Commandes" },
  { path: "/wallet", icon: Wallet, label: "IPPOO CASH" },
];

const menuItems = [
  { path: "/catalogue", icon: LayoutGrid, label: "Catégories" },
  { path: "/vendeurs", icon: Store, label: "Vendeurs & Boutiques" },
  { path: "/favoris-boutiques", icon: Heart, label: "Boutiques suivies" },
  { path: "/profils", icon: Layers, label: "Circuit de Gros" },
  { path: "/communautes", icon: Users, label: "Communautés" },
  { path: "/achat-groupe", icon: UserCheck, label: "Achat Groupé" },
  { path: "/comite-entreprise", icon: Building2, label: "Comités d'Entreprise" },
  { path: "/comparateur", icon: Scale, label: "Comparatif des prix" },
  { path: "/prix-surveilles", icon: Bell, label: "Mes prix surveillés" },
  { path: "/cotation", icon: BarChart3, label: "Cotation des Prix" },
  { path: "/blog", icon: BookOpen, label: "Blog & Informations" },
  { path: "/international", icon: Globe, label: "International" },
  { path: "/devis", icon: FileText, label: "Devis & Négociation" },
  { path: "/sav", icon: Wrench, label: "Service Après-Vente" },
  { path: "/crm", icon: Shield, label: "CRM Commercial" },
  { path: "/parrainage", icon: Gift, label: "Parrainage & Commissions" },
  { path: "/ressources", icon: Play, label: "Ressources Média" },
  { path: "/transactions", icon: CreditCard, label: "Transactions" },
  { path: "/factures", icon: FileText, label: "Factures & Documents" },
  { path: "/messagerie", icon: MessageSquare, label: "Messagerie" },
  { path: "/jeux", icon: Gift, label: "Jeux & Cadeaux" },
  { path: "/vip", icon: Crown, label: "VIP & Bonus" },
  { path: "/profil", icon: User, label: "Mon Profil" },
  { path: "/parametres", icon: Settings, label: "Paramètres" },
  { path: "/aide", icon: HelpCircle, label: "Aide & Support" },
];

export function Layout() {
  return (
    <RefreshProvider>
      <LayoutInner />
    </RefreshProvider>
  );
}

function LayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLElement>(null);

  // Expose la hauteur du header sticky et de la bottom-nav comme variables CSS
  // (--ippoo-top-h / --ippoo-bottom-h) pour que les pages plein-écran type
  // messagerie puissent se calibrer sans déborder.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const topH = topRef.current?.getBoundingClientRect().height ?? 0;
      const botH = bottomNavRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--ippoo-top-h", `${Math.round(topH)}px`);
      root.style.setProperty("--ippoo-bottom-h", `${Math.round(botH)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (topRef.current) ro.observe(topRef.current);
    if (bottomNavRef.current) ro.observe(bottomNavRef.current);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  // Remonte en haut à chaque changement de page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  // Hydratation centralisée des stores locaux (évite state desync entre pages)
  useEffect(() => {
    Promise.all([
      import("../data/my-shops").then((m) => m.hydrateMyShops()),
      import("../data/my-products").then((m) => m.hydrateMyProducts()),
      import("../data/my-promos").then((m) => m.hydrateMyPromos()),
      import("../data/shop-reviews").then((m) => m.hydrateShopReviews()),
      import("../data/followed-shops").then((m) => m.hydrateFollowedShops()),
    ]).catch(() => undefined);
  }, []);

  // Surveillance temps réel des groupements : toaste quand un nouveau membre
  // rejoint un groupe dont je suis organisateur ou participant. Le store émet
  // déjà sur joinGroup() et synchronise les onglets via "storage".
  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | null = null;
    Promise.all([
      import("../groups/store"),
      import("../auth/account-id"),
      import("sonner"),
    ]).then(([store, acc, sonner]) => {
      if (cancelled) return;
      const me = acc.ensureAccountId().id;
      const isMine = (g: import("../groups/store").Group) =>
        g.organizerId === me || g.participants.some((p) => p.id === me);
      const snapshot = new Map<string, Set<string>>();
      for (const g of store.getGroups()) {
        if (isMine(g)) snapshot.set(g.id, new Set(g.participants.map((p) => p.id)));
      }
      unsub = store.subscribeGroups(() => {
        for (const g of store.getGroups()) {
          if (!isMine(g)) continue;
          const prev = snapshot.get(g.id);
          const curr = new Set(g.participants.map((p) => p.id));
          if (!prev) { snapshot.set(g.id, curr); continue; }
          const fresh = g.participants.filter((p) => !prev.has(p.id) && p.id !== me);
          if (fresh.length > 0) {
            fresh.forEach((p, i) => {
              setTimeout(() => {
                sonner.toast.success(`${p.name} a rejoint ${g.name}`, {
                  description: `${g.participants.length}/${g.maxParticipants} membres · ${p.qty} part${p.qty > 1 ? "s" : ""}`,
                  action: { label: "Voir", onClick: () => navigate("/achat-groupe") },
                  duration: 5500,
                });
              }, i * 350);
            });
          }
          snapshot.set(g.id, curr);
        }
        // Nettoie les groupes disparus
        const liveIds = new Set(store.getGroups().map((g) => g.id));
        for (const id of snapshot.keys()) if (!liveIds.has(id)) snapshot.delete(id);
      });
    }).catch(() => undefined);
    return () => { cancelled = true; unsub?.(); };
  }, [navigate]);

  // Au démarrage, scanne la liste des prix surveillés et notifie quand la
  // tendance 7 j d'un produit vient de passer en négatif (baisse fraîche).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import("./comparateur/data"),
      import("sonner"),
    ]).then(([mod, sonner]) => {
      if (cancelled) return;
      const drops = mod.detectNewPriceDrops();
      drops.forEach((d, i) => {
        setTimeout(() => {
          sonner.toast.success(`Baisse de prix détectée : ${d.productName}`, {
            description: `Tendance 7 j : ${d.evolution7j.toFixed(1)}% · ${d.prixIppoo.toLocaleString("fr-FR")} FCFA / ${d.unit}`,
            action: {
              label: "Voir",
              onClick: () => navigate(`/comparateur/produit/${d.productId}`),
            },
            duration: 6000,
          });
        }, 800 + i * 600);
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [navigate]);

  const pay = usePayments();
  const cartCount = pay.cart.reduce((s, i) => s + i.quantity, 0);
  const notifs = useNotifications();
  const userProfile = useUserProfile();
  const isSellerAccount = !!userProfile && userProfile.accountType !== "acheteur";
  const isBusinessAccount = !!userProfile && (userProfile.accountType === "entreprise" || userProfile.accountType === "organisation");
  const filteredMenuItems = (() => {
    const SELLER_ONLY = new Set(["/crm", "/sav", "/devis"]);
    const BUSINESS_ONLY = new Set(["/comite-entreprise"]);
    const base = menuItems.filter((it) => {
      if (SELLER_ONLY.has(it.path) && !isSellerAccount) return false;
      if (BUSINESS_ONLY.has(it.path) && !isBusinessAccount) return false;
      return true;
    });
    if (isSellerAccount) {
      return [{ path: "/boutique", icon: Briefcase, label: "Ma Boutique" }, ...base];
    }
    return base;
  })();
  const notifCount = notifs.reduce((s, n) => s + (n.read ? 0 : 1), 0);
  const navUnread: Record<string, number> = (() => {
    const acc: Record<string, number> = {};
    for (const n of notifs) {
      if (n.read) continue;
      if (n.type === "order" || n.type === "delivery") acc["/commandes"] = (acc["/commandes"] || 0) + 1;
      else if (n.type === "payment" || n.type === "bonus") acc["/wallet"] = (acc["/wallet"] || 0) + 1;
      else if (n.type === "promo") acc["/promos"] = (acc["/promos"] || 0) + 1;
    }
    return acc;
  })();
  const [searchValue, setSearchValue] = useState("");
  const content = useContent();
  const settings = useAdminSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Boot-router pour les QR codes : intercepte ?ippoo=<uid> et ?ippoo-pay=<id>
  // posés à la racine, et redirige vers la bonne page interne. Ainsi un QR scanné
  // hors de l'app (caméra du téléphone, lecteur tiers) ouvre toujours la fiche
  // produit publique — quel que soit l'hébergement, sans configuration SPA.
  useEffect(() => {
    if (location.pathname !== "/") return;
    const sp = new URLSearchParams(location.search);
    const uid = sp.get("ippoo");
    const payId = sp.get("ippoo-pay");
    if (payId) {
      const qs = new URLSearchParams();
      qs.set("id", payId);
      const amt = sp.get("amt"); if (amt) qs.set("amt", amt);
      const to = sp.get("to"); if (to) qs.set("to", to);
      navigate(`/pay?${qs.toString()}`, { replace: true });
      return;
    }
    if (uid) {
      const decoded = decodeURIComponent(uid).trim();
      const product = allProducts.find(
        (p) => productUid(p) === decoded || String((p as { reference?: string }).reference) === decoded,
      );
      if (product) navigate(`/produit/${product.id}`, { replace: true });
      else navigate(`/scan/${encodeURIComponent(decoded)}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const topBarColor = settings.maintenance
    ? "#F0B429"
    : content.announcement.active && content.announcement.message
      ? content.announcement.bgColor
      : "#FFFFFF";

  useEffect(() => {
    const ensureMeta = (name: string, attr: "name" | "content"): HTMLMetaElement => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      return el;
    };
    ensureMeta("theme-color", "name").setAttribute("content", topBarColor);
    ensureMeta("apple-mobile-web-app-status-bar-style", "name").setAttribute(
      "content",
      topBarColor.toLowerCase() === "#ffffff" ? "default" : "black-translucent",
    );
    ensureMeta("apple-mobile-web-app-capable", "name").setAttribute("content", "yes");
    ensureMeta("mobile-web-app-capable", "name").setAttribute("content", "yes");
    document.body.style.backgroundColor = topBarColor;
  }, [topBarColor]);

  // Bridge "ippoo:navigate" → react-router (utilisé par PromoPopupHost qui
  // vit en dehors du <RouterProvider> et ne peut donc pas appeler useNavigate).
  useEffect(() => {
    const onNav = (e: Event) => {
      const link = (e as CustomEvent<string>).detail;
      if (typeof link === "string" && link.length > 0) navigate(link);
    };
    window.addEventListener("ippoo:navigate", onNav as EventListener);
    return () => window.removeEventListener("ippoo:navigate", onNav as EventListener);
  }, [navigate]);

  const submitSearch = () => {
    const q = searchValue.trim();
    navigate(q ? `/explorer?q=${encodeURIComponent(q)}` : "/explorer");
  };

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif] flex flex-col">
      <div ref={topRef} className="sticky top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top, 0px)", background: topBarColor }}>
        {settings.maintenance && (
          <div className="w-full py-2 px-4 text-center bg-[#F0B429] text-[#0F172A] flex items-center justify-center gap-2" style={{ fontSize: 12, fontWeight: 700 }}>
            <Wrench className="w-3.5 h-3.5" />
            Mode maintenance activé · les achats sont temporairement suspendus
          </div>
        )}
        {/* Alibaba-style utility strip */}
        <div className="hidden lg:block bg-[#FAFAFA] border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between text-[#757575]" style={{ fontSize: 11 }}>
            <div className="flex items-center gap-3">
              <span>Livrer en : <span className="text-[#222]" style={{ fontWeight: 600 }}>Bénin</span></span>
              <span className="text-[#E5E5E5]">|</span>
              <span>Devise : <span className="text-[#222]" style={{ fontWeight: 600 }}>FCFA</span></span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/commandes")} className="hover:text-[#FF6A00] transition-colors">Mes commandes</button>
              <span className="text-[#E5E5E5]">|</span>
              <button onClick={() => navigate("/aide")} className="hover:text-[#FF6A00] transition-colors">Aide</button>
              <span className="text-[#E5E5E5]">|</span>
              <button onClick={() => navigate("/devenir-vendeur")} className="hover:text-[#FF6A00] transition-colors" style={{ fontWeight: 600 }}>Vendre sur IPPOO</button>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <button onClick={() => navigate("/")} aria-label="Retour à l'accueil" className="flex items-center gap-1 shrink-0">
            <img src={ippooOldLogo} alt="IPPOO Market" className="h-9 sm:h-10 w-auto object-contain" />
          </button>

          {/* Search bar with scan */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher produits, vendeurs..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:outline-none"
              style={{ fontSize: 13 }}
              onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
            />
            <button
              onClick={() => navigate("/scanner")}
              aria-label="Scanner un code-barres"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40"
            >
              <ScanLine className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/notifications")}
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} non lues)` : ""}`}
              data-haptic="light"
              className="relative p-1.5 sm:p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 press-feedback"
            >
              <motion.span
                animate={notifCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
                transition={{ duration: 1.2, repeat: notifCount > 0 ? Infinity : 0, repeatDelay: 4, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Bell className="w-5 h-5 text-foreground" />
              </motion.span>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-[#FF6A00]"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                  <span className="relative min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 bg-[#FF6A00] text-white rounded-full flex items-center justify-center" style={{ fontSize: 9, fontWeight: 700 }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/panier")}
              aria-label={`Panier${cartCount > 0 ? ` (${cartCount} articles)` : ""}`}
              data-haptic="light"
              className="relative p-1.5 sm:p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 press-feedback"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] bg-[#F97316] text-white rounded-full flex items-center justify-center" style={{ fontSize: 9, fontWeight: 700 }}>
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-muted transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop secondary nav */}
      <nav className="hidden lg:block bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {[...navItems, ...menuItems.slice(0, 5)].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2.5 whitespace-nowrap transition-colors rounded-t-lg ${
                location.pathname === item.path
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontSize: 14, fontFamily: "Poppins", fontWeight: 500 }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setMenuOpen(true)}
            className="px-4 py-2.5 text-muted-foreground hover:text-foreground whitespace-nowrap"
            style={{ fontSize: 14, fontFamily: "Poppins", fontWeight: 500 }}
          >
            Plus...
          </button>
        </div>
      </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <RefreshableOutlet />
      </main>
      <PWAInstallPrompt />


      {/* Mobile Bottom Nav */}
      <nav ref={bottomNavRef} className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around py-2 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const colors: Record<string, string> = {
              "/": "#FF6A00",
              "/explorer": "#FF6B00",
              "/promos": "#FF6A00",
              "/commandes": "#1A1A2E",
              "/wallet": "#00B341",
            };
            const badge = navUnread[item.path] || 0;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                data-haptic="selection"
                aria-label={badge > 0 ? `${item.label} (${badge} non lu${badge > 1 ? "s" : ""})` : item.label}
                className="flex flex-col items-center gap-0.5 p-1 min-w-[56px] press-feedback relative"
              >
                <div className="relative">
                  <Icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: isActive ? colors[item.path] : "#9CA3AF" }}
                  />
                  {badge > 0 && (
                    <>
                      <span
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-white"
                        style={{ background: "#E11D2E", fontSize: 9, fontWeight: 700, lineHeight: 1 }}
                      >
                        {badge > 9 ? "9+" : badge}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full animate-ping pointer-events-none"
                        style={{ background: "#E11D2E", opacity: 0.4 }}
                      />
                    </>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? colors[item.path] : "#9CA3AF",
                    fontFamily: "Poppins",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Menu Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white overflow-y-auto">
            <div className="relative border-b border-border bg-white py-6 flex items-center justify-center">
              <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <img src={ippooLogo} alt="IPPOO Market" className="h-20 w-auto object-contain" />
            </div>

            <div className="py-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF7ED] transition-colors"
                  >
                    <Icon className="w-5 h-5 text-[#E11D2E]" />
                    <span
                      className="flex-1 text-left"
                      style={{ fontSize: 14, fontFamily: "Inter", fontWeight: 500 }}
                    >
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  navigate(isSellerAccount ? "/boutique" : "/devenir-vendeur");
                  setMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E8A817] to-[#F97316] text-white"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
              >
                {isSellerAccount ? "Voir ma boutique" : "Devenir vendeur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-10 w-2/3 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-muted" />
        <div className="h-28 rounded-2xl bg-muted" />
      </div>
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

function RefreshableOutlet() {
  const { trigger } = useRefreshContext();
  const location = useLocation();
  return (
    <PullToRefresh onRefresh={trigger}>
      <Suspense fallback={<RouteSkeleton />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </PullToRefresh>
  );
}