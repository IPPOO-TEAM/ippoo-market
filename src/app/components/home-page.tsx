import { useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { useOnPullRefresh } from "../native/RefreshContext";
import { useUserProfile } from "../auth/useUserProfile";
import {
  ShieldCheck,
  Truck,
  BadgeCheck,
  ArrowRight,
  Star,
  ShoppingCart,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Crown,
  Gift,
  Package,
  Copy,
  Flame,
  TrendingUp,
  Users,
  Layers,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { resolveShopVisuals } from "../data/shop-resolver";
import { usePublicVendors } from "../data/usePublicVendors";
import type { PublicVendor } from "../data/public-vendors";
import { slugifyShopName } from "../data/shop-assets";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import {
  IMAGES,
  categories,
  flashProducts,
  topVendors,
  allProducts as mockProducts,
  marketDays,
  formatPrice,
} from "./mock-data";
import { useStorefrontProducts } from "../data/storefront";
import { ProductCard } from "./product-card";
import {
  CouponCarousel,
  CouponStrip,
  SpinWheelTeaser,
  ContestCard,
  LoyaltyPointsBadge,
  DailyDealHighlight,
  FlashPromoBanner,
  GiftsToWinSection,
  GiftBanner,
} from "./promo-widgets";
import { StatsDashboard } from "./stats-dashboard";
import {
  categoryIcons, categoryShortLabels, heroSlides, quickSections, superDeals,
} from "./home-page-data";
import { CATALOG } from "../data/catalog";
import { catalogIdForMainCategory } from "../data/product-catalog-link";
import type { LucideIcon } from "lucide-react";

function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || Date.now();
}

function vendorCardFromPublic(v: PublicVendor) {
  const vis = resolveShopVisuals(v.ownerId || v.name, v.name);
  return {
    id: hashId(v.ownerId || v.name),
    slug: slugifyShopName(v.name),
    name: v.name,
    avatar: vis.logo || v.logo || v.avatar || IMAGES.market,
    category: v.niche || "Boutique",
    rating: 5,
    orders: 0,
    deliveryRate: 100,
    badge: "VERIFIE" as const,
  };
}

type HomeCat = { id: number; name: string; icon: string; color: string; count: number };

function CategorySidebarPanel({
  categories,
  categoryIcons,
  navigate,
}: {
  categories: HomeCat[];
  categoryIcons: Record<string, LucideIcon>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = categories[activeIdx];
  const catalogId = catalogIdForMainCategory(active?.name);
  const catalog = catalogId ? CATALOG.find((c) => c.id === catalogId) : undefined;
  const subs = catalog?.children ?? [];

  return (
    <div className="hidden sm:flex" style={{ minHeight: 460 }}>
      {/* Sidebar : liste verticale des méga-catégories */}
      <aside className="w-60 lg:w-64 border-r border-border bg-[#FAFAFA] max-h-[460px] overflow-y-auto py-1">
        {categories.map((cat, i) => {
          const Icon = (cat.icon && categoryIcons[cat.icon]) || Store;
          const isActive = i === activeIdx;
          return (
            <button
              key={cat.id}
              onMouseEnter={() => setActiveIdx(i)}
              onFocus={() => setActiveIdx(i)}
              onClick={() => navigate(`/explorer?cat=${encodeURIComponent(cat.name)}`)}
              className={`relative w-full flex items-center gap-2.5 pl-3 pr-2 py-2.5 text-left transition-colors ${
                isActive ? "bg-white text-[#FF6A00]" : "text-[#222] hover:bg-white"
              }`}
              style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#FF6A00]" />}
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: isActive ? `${cat.color}1A` : "transparent" }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? "#FF6A00" : cat.color }} strokeWidth={2.2} />
              </span>
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="text-[#9CA3AF]" style={{ fontSize: 10, fontWeight: 600 }}>{cat.count}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? "opacity-100 text-[#FF6A00]" : "opacity-30"}`} />
            </button>
          );
        })}
      </aside>

      {/* Panneau : sous-catégories de la catégorie survolée */}
      <div className="flex-1 p-5 max-h-[460px] overflow-y-auto bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {active && (() => {
              const Icon = (active.icon && categoryIcons[active.icon]) || Store;
              return (
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${active.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: active.color }} strokeWidth={2.2} />
                </span>
              );
            })()}
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{active?.name}</h3>
              <p className="text-[#757575]" style={{ fontSize: 11 }}>
                <span className="text-[#FF6A00]" style={{ fontWeight: 700 }}>{active?.count}</span> produits ·{" "}
                {subs.length} sous-rubriques
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/explorer?cat=${encodeURIComponent(active?.name ?? "")}`)}
            className="px-3 py-1.5 rounded-md border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF1E5] transition-colors flex items-center gap-1"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {subs.length === 0 ? (
          <p className="text-[#757575]" style={{ fontSize: 12 }}>Aucune sous-catégorie référencée.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {subs.slice(0, 9).map((sub, i) => (
              <button
                key={`${sub.name}-${i}`}
                onClick={() =>
                  navigate(
                    `/explorer?cat=${encodeURIComponent(active.name)}&sub=${encodeURIComponent(sub.name)}`,
                  )
                }
                className="group flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-[#FF6A00] hover:bg-[#FFFBF7] transition-all text-left"
              >
                {sub.image ? (
                  <img
                    src={sub.image}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 rounded-md object-cover border border-border shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-[#FAFAFA] border border-border flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[#222] group-hover:text-[#FF6A00]" style={{ fontSize: 13, fontWeight: 600 }}>
                    {sub.name}
                  </p>
                  {sub.children && sub.children.length > 0 && (
                    <p className="text-[#757575] truncate" style={{ fontSize: 11 }}>
                      {sub.children.slice(0, 2).map((c) => c.name).join(" · ")}
                      {sub.children.length > 2 ? ` +${sub.children.length - 2}` : ""}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const publicVendors = usePublicVendors();
  const serverProducts = useStorefrontProducts();
  const allProducts = serverProducts.length
    ? [...serverProducts, ...mockProducts.filter((p) => !serverProducts.some((sp) => sp.id === p.id))]
    : mockProducts;
  const mergedTopVendors = [
    ...publicVendors.map(vendorCardFromPublic),
    ...topVendors.filter((v) => !publicVendors.some((p) => p.name.toLowerCase() === String(v.name).toLowerCase())),
  ];
  const userProfile = useUserProfile();
  const isSellerAccount = !!userProfile && userProfile.accountType !== "acheteur";
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countdown, setCountdown] = useState({ d: 2, h: 5, m: 42, s: 18 });

  useOnPullRefresh(useCallback(async () => {
    setCurrentSlide(0);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Page d'accueil actualisée");
  }, []));

  useEffect(() => {
    const id = setInterval(() => setCurrentSlide((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        let { d, h, m, s } = c;
        if (s > 0) s--;
        else if (m > 0) { s = 59; m--; }
        else if (h > 0) { s = 59; m = 59; h--; }
        else if (d > 0) { s = 59; m = 59; h = 23; d--; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="font-[Inter,sans-serif]">
      {/* Alibaba-style mega search */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-stretch gap-0 rounded-lg border-2 border-[#FF6A00] overflow-hidden bg-white">
            <button
              onClick={() => navigate("/catalogue")}
              className="hidden sm:flex items-center gap-1 px-3 text-[#222] border-r border-[#E5E5E5] hover:bg-[#FAFAFA]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              Toutes catégories <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            <input
              type="text"
              placeholder="Que cherchez-vous aujourd'hui ?"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) navigate(`/explorer?q=${encodeURIComponent(v)}`);
                }
              }}
              className="flex-1 min-w-0 px-3 py-2.5 outline-none bg-white"
              style={{ fontSize: 14 }}
            />
            <button
              onClick={() => navigate("/explorer")}
              className="bg-[#FF6A00] hover:bg-[#FF4400] text-white px-4 sm:px-6 inline-flex items-center gap-1.5 transition-colors"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              <Sparkles className="w-4 h-4" /> Rechercher
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <span className="text-[#757575] shrink-0" style={{ fontSize: 11 }}>Tendances :</span>
            {["Riz parfumé", "Wax", "Smartphones", "Huile de palme", "Ciment", "Panneaux solaires"].map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/explorer?q=${encodeURIComponent(q)}`)}
                className="shrink-0 text-[#222] hover:text-[#FF6A00] transition-colors"
                style={{ fontSize: 11 }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Banner / Big Sale */}
      <section className="relative overflow-hidden">
        <div className="relative bg-[#0F172A]">
          <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-16 lg:py-20">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white max-w-xl"
            >
              <h1
                className="mb-2"
                style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: "clamp(22px, 5vw, 42px)", lineHeight: 1.1 }}
              >
                {slide.title}
              </h1>
              <p className="mb-4 text-white/90" style={{ fontSize: "clamp(13px, 2.5vw, 18px)" }}>
                {slide.subtitle}
              </p>

              {/* Countdown */}
              <div className="flex items-center gap-1.5 mb-4">
                {[
                  { val: String(countdown.d).padStart(2, "0"), label: "j" },
                  { val: String(countdown.h).padStart(2, "0"), label: "h" },
                  { val: String(countdown.m).padStart(2, "0"), label: "m" },
                  { val: String(countdown.s).padStart(2, "0"), label: "s" },
                ].map((t, i) => (
                  <div key={i} className="bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg text-center min-w-[36px]">
                    <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{t.val}</span>
                    <span className="text-white/60 ml-0.5" style={{ fontSize: 9 }}>{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              {slide.promoCode && (
                <button
                  onClick={() => { copyToClipboard(slide.promoCode!); toast.success(`Code ${slide.promoCode} copié !`); }}
                  className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-colors"
                >
                  <span className="px-2 py-0.5 bg-[#F97316] rounded-lg" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11 }}>CODE</span>
                  <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>{slide.promoCode}</span>
                  <Copy className="w-3.5 h-3.5 text-white/70" />
                </button>
              )}

              <button
                onClick={() => navigate(slide.link)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#FF6A00] hover:bg-[#FF4400] text-white rounded-lg transition-all active:scale-95"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
              >
                {slide.cta} <ArrowRight className="inline w-4 h-4 sm:w-5 sm:h-5 ml-1" />
              </button>
            </motion.div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`transition-all rounded-full ${
                  i === currentSlide ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 hidden md:block"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setCurrentSlide((s) => (s + 1) % heroSlides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 hidden md:block"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </section>

      {/* Quick Discovery Sections (pills) */}
      <section className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {quickSections.map((sec) => (
            <button
              key={sec.label}
              onClick={() => navigate(sec.path)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white hover:bg-[#FFF7ED] transition-colors"
            >
              <sec.icon className="w-4 h-4" style={{ color: sec.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: sec.color }}>{sec.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Coupons Carousel */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <CouponCarousel />
      </section>

      {/* Alibaba-style categories : sidebar + sous-rubriques */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>Parcourir par catégorie</h2>
            <button
              onClick={() => navigate("/catalogue")}
              className="text-[#FF6A00] hover:text-[#FF4400] flex items-center gap-1"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Voir tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile : grille 4 colonnes avec icônes XL style Alibaba */}
          <div className="grid grid-cols-4 sm:hidden p-2 gap-1">
            {categories.slice(0, 12).map((cat) => {
              const CatIcon = (cat.icon && categoryIcons[cat.icon]) || Store;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/explorer?cat=${encodeURIComponent(cat.name)}`)}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-md active:bg-[#FFF1E5] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: `${cat.color}18` }}
                  >
                    <CatIcon className="w-6 h-6" style={{ color: cat.color }} strokeWidth={2.2} />
                  </div>
                  <span className="text-center leading-tight line-clamp-2 px-0.5 text-[#222]" style={{ fontSize: 11, fontWeight: 500 }}>
                    {categoryShortLabels[cat.name] || cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop : sidebar verticale + panneau sous-catégories façon Alibaba */}
          <CategorySidebarPanel
            categories={categories}
            categoryIcons={categoryIcons}
            navigate={navigate}
          />
        </div>
      </section>

      {/* Deal du jour + Concours */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Ne ratez pas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DailyDealHighlight />
          <ContestCard
            title="Grand Jeu IPPOO Mars"
            prize="1 000 000 FCFA de produits"
            endsIn="23 jours restants"
            participants={4827}
            link="/jeux"
          />
        </div>
      </section>

      {/* Comment ça marche - compact mobile */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
          {[
            { icon: ShoppingCart, title: "Achetez en gros", desc: "Volume à prix négocié", color: "#FF6B00" },
            { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Paiement protégé & Mobile Money", color: "#00B341" },
            { icon: Truck, title: "Livraison & Retrait", desc: "Hubs, suivi temps réel", color: "#E11D2E" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-3 sm:p-5 border border-border flex items-center gap-2 sm:gap-4 cursor-pointer shrink-0 min-w-[200px] sm:min-w-0"
            >
              <div
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}40)` }}
              >
                <item.icon className="w-4.5 h-4.5 sm:w-6 sm:h-6" style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>{item.title}</h4>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flash Sales */}
      <section className="py-3 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4400] rounded-2xl p-3 sm:p-5 mb-3 sm:mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
                OFFRES FLASH
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/80" />
              <div className="flex gap-1">
                {[
                  String(countdown.h).padStart(2, "0"),
                  String(countdown.m).padStart(2, "0"),
                  String(countdown.s).padStart(2, "0"),
                ].map((t, i) => (
                  <span
                    key={i}
                    className="bg-white text-[#E11D2E] px-1.5 py-0.5 rounded-md"
                    style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button onClick={() => navigate("/promos")} className="text-white/80 ml-2" style={{ fontSize: 11, fontWeight: 600 }}>
                Tout voir <ArrowRight className="inline w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {flashProducts.map((product) => (
              <motion.div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-border cursor-pointer group flex flex-col"
                onClick={() => navigate(`/produit/${product.id}`)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#FF6A00] text-white rounded-lg flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 700 }}>
                    <Zap className="w-2.5 h-2.5" /> -{product.discount}%
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 600 }}>
                    <Star className="w-2.5 h-2.5 fill-[#F0B429] text-[#F0B429]" />
                    {product.rating}
                  </div>
                </div>
                <div className="p-2 sm:p-3 flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <BadgeCheck className="w-3 h-3 text-[#00B341] shrink-0" />
                    <p className="text-muted-foreground truncate" style={{ fontSize: 9 }}>{product.seller}</p>
                  </div>
                  <h4 className="mb-1 line-clamp-2" style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins", lineHeight: 1.3 }}>
                    {product.name}
                  </h4>
                  <span className="text-[#E11D2E]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
                    {formatPrice(product.priceFlash)}
                  </span>
                  <span className="line-through text-muted-foreground" style={{ fontSize: 9 }}>
                    {formatPrice(product.priceOriginal)}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground" style={{ fontSize: 9 }}>
                    <Package className="w-3 h-3" /> {product.stock} · Min. {product.moq} {product.unit}
                  </div>
                  {/* Delivery icons - always visible */}
                  <div className="flex items-center gap-2 mt-1 mb-1.5">
                    <div className="flex items-center gap-0.5" style={{ fontSize: 9, color: "#6B7280" }}>
                      <Truck className="w-3 h-3 text-[#FF6B00]" />
                      <span className="hidden sm:inline">Standard</span>
                    </div>
                    <div className="flex items-center gap-0.5" style={{ fontSize: 9, color: "#6B7280" }}>
                      <Zap className="w-3 h-3 text-[#E11D2E]" />
                      <span className="hidden sm:inline">Express</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.success(`${product.name} ajouté au panier !`); }}
                    className="w-full mt-auto py-2 bg-[#FF6A00] text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#FF4400] transition-colors active:scale-95"
                    style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins", minHeight: 38 }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Commander
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coupon code strip between flash and superdeals */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <CouponStrip code="FLASH20" label="Flash Promo" discount="-20% sur alimentaire et hygiène" condition="Valable aujourd'hui uniquement sur tout le catalogue" color="#E11D2E" icon={Zap} expiry="Aujourd'hui seulement" />
      </section>

      {/* SuperDeals */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="flex items-center gap-1.5" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            <Flame className="w-5 h-5 text-[#E11D2E]" /> SuperDeals
          </h2>
          <button onClick={() => navigate("/promos")} className="text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {superDeals.map((deal) => (
            <motion.div
              key={deal.id}
              onClick={() => navigate(`/produit/${deal.id}`)}
              className="bg-white rounded-[1.1rem] overflow-hidden border border-border cursor-pointer group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img src={deal.image} alt={deal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-1.5 left-1.5 px-2 py-1 bg-[#FF6A00] text-white rounded-xl" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 14 }}>
                  -{deal.discount}%
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <h4 className="truncate mb-1" style={{ fontSize: 12, fontWeight: 600, fontFamily: "Poppins" }}>{deal.name}</h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[#E11D2E]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>{formatPrice(deal.price)}</span>
                  <span className="line-through text-muted-foreground" style={{ fontSize: 9 }}>{formatPrice(deal.originalPrice)}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1" style={{ fontSize: 9 }}>
                  <TrendingUp className="w-3 h-3 text-[#F97316]" /> {deal.sold} vendus
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roue + Fidélité */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SpinWheelTeaser />
          <LoyaltyPointsBadge />
        </div>
      </section>

      {/* Jours de Marché */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            <Sparkles className="inline w-4 h-4 text-[#E8A817] mr-1" />
            JOURS DE MARCHÉ
          </h2>
          <button onClick={() => navigate("/marche")} className="text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Calendrier <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
          {marketDays.map((day, index) => {
            const slugs = ["tokpa", "missebo", "arzeke", "guema"];
            return (
            <motion.div
              key={day.id}
              onClick={() => navigate(`/marche/${slugs[index] || "tokpa"}`)}
              className="rounded-2xl overflow-hidden cursor-pointer shrink-0 w-[180px] sm:w-auto"
              style={{ background: `linear-gradient(135deg, ${day.color}, ${day.color}CC)` }}
            >
              <div className="p-3 sm:p-5 text-white">
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{day.name}</h3>
                <p className="text-white/80 mt-0.5" style={{ fontSize: 10 }}>{day.theme}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/70" />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{day.date}</span>
                </div>
                <button
                  className="mt-2.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-xl border border-white/30 hover:bg-white/30 transition-colors w-full"
                  style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 11 }}
                >
                  Découvrir
                </button>
              </div>
            </motion.div>
          )})}
        </div>
      </section>

      {/* Cadeau à gagner banner */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <GiftBanner
          text="GAGNEZ UN iPhone 16 Pro"
          subtext="Commandez +500 000 FCFA ce mois et tentez votre chance"
          link="/jeux"
        />
      </section>

      {/* ═══ COMMUNAUTÉS & CIRCUIT DE GROS ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Communautés */}
          <motion.div
            onClick={() => navigate("/communautes")}
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            style={{ minHeight: 130 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F] to-[#16A34A]" />
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 16px)" }} />
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Communautés</h3>
                  <p className="text-white/60" style={{ fontSize: 9, fontWeight: 600 }}>488 membres · 6 groupements</p>
                </div>
              </div>
              <p className="text-white/80 mb-2" style={{ fontSize: 11 }}>
                Achats groupés, prix négociés, livraison organisée
              </p>
              <div className="flex items-center gap-1 text-[#FBBF24]" style={{ fontSize: 11, fontWeight: 700 }}>
                Rejoindre <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* Circuit de Gros */}
          <motion.div
            onClick={() => navigate("/profils")}
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            style={{ minHeight: 130 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#E8A817] to-[#7C3AED]" />
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 16px)" }} />
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Circuit de Gros</h3>
                  <p className="text-white/60" style={{ fontSize: 9, fontWeight: 600 }}>7 profils · Producteurs → Grossistes</p>
                </div>
              </div>
              <p className="text-white/80 mb-2" style={{ fontSize: 11 }}>
                Trouvez votre place : producteur, vendeur, acheteur...
              </p>
              <div className="flex items-center gap-1 text-[#FBBF24]" style={{ fontSize: 11, fontWeight: 700 }}>
                Découvrir <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bestsellers / Today's deals */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Meilleures ventes
          </h2>
          <button onClick={() => navigate("/explorer")} className="text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {allProducts.filter((p) => p.inStock).slice(0, 4).map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Flash promo vendeurs */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <FlashPromoBanner
          text="⚡ -30% chez Mama Tokpa Alimentaire"
          subtext="Exclusivité 24h, Riz, huile, conserves à prix cassés"
          link="/vendeur/1"
          color="#FF6B00"
        />
      </section>

      {/* Top Vendeurs */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            VENDEURS RECOMMANDÉS
          </h2>
          <button
            onClick={() => navigate("/vendeurs")}
            className="text-[#E11D2E] flex items-center gap-1"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Tous <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
          {mergedTopVendors.map((vendor) => {
            const vis = resolveShopVisuals(vendor.id?.toString() ?? vendor.name, vendor.name);
            const resolvedAvatar = vis.logo ?? vendor.avatar;
            const resolvedName = vis.name || vendor.name;
            return (
            <motion.div
              key={vendor.id}
              onClick={() => navigate((vendor as { slug?: string }).slug ? `/boutique/${(vendor as { slug?: string }).slug}` : `/vendeur/${vendor.id}`)}
              className="bg-white rounded-2xl p-3 border border-border cursor-pointer shrink-0 w-[200px] sm:w-auto"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#E8A817] shrink-0">
                  <img src={resolvedAvatar} alt={resolvedName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate" style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}>
                    {resolvedName}
                  </h4>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 9 }}>{vendor.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-[#E8A817] text-[#E8A817]" />
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{vendor.rating}</span>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background:
                      vendor.badge === "VIP"
                        ? "linear-gradient(135deg, #E8A817, #FBBF24)"
                        : vendor.badge === "TOP"
                        ? "#E11D2E"
                        : "#16A34A",
                    color: "#fff",
                  }}
                >
                  {vendor.badge}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: 9 }}>
                <span>{vendor.orders} cmd</span>
                <span className="flex items-center gap-0.5">
                  <BadgeCheck className="w-3 h-3 text-[#00B341]" /> {vendor.deliveryRate}%
                </span>
              </div>
            </motion.div>
            );
          })}
        </div>
      </section>

      {/* Cadeaux à gagner section */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <GiftsToWinSection />
      </section>

      {/* ═══════ STATS DASHBOARD ═══════ */}
      <section className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <StatsDashboard />
      </section>

      {/* CTA Devenir Vendeur */}
      <section className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="bg-gradient-to-r from-[#E8A817] to-[#F97316] rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 p-4 sm:p-6 md:p-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-white" />
                <span className="text-white/80" style={{ fontSize: 11, fontWeight: 600 }}>IPPOO MARKET</span>
              </div>
              <h2 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: "clamp(16px, 4vw, 32px)" }}>
                {isSellerAccount ? "PILOTEZ VOTRE BOUTIQUE" : "OUVREZ VOTRE BOUTIQUE DE GROS"}
              </h2>
              <p className="text-white/90 mb-3 sm:mb-5" style={{ fontSize: 12 }}>
                {isSellerAccount
                  ? "Ajoutez des produits, suivez vos commandes et boostez votre chiffre d'affaires."
                  : "Rejoignez des milliers de vendeurs. Publiez vos produits, recevez des commandes en volume."}
              </p>
              <button
                onClick={() => navigate(isSellerAccount ? "/boutique" : "/devenir-vendeur")}
                className="px-5 sm:px-8 py-2 sm:py-3 bg-white text-[#E8A817] rounded-xl transition-all active:scale-95"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
              >
                {isSellerAccount ? "Voir ma boutique" : "Commencer"} <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="w-full md:w-80 h-32 sm:h-48 md:h-auto">
              <img src={IMAGES.entrepreneur} alt="Vendeur IPPOO" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Coupon strip VIP */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <CouponStrip code="VIP20" label="Offre VIP" discount="-20% pour les membres VIP" condition="Réservé aux membres VIP, ce weekend seulement" color="#F0B429" icon={Crown} expiry="Expire dimanche 23h59" />
      </section>

      {/* Promotions & Jeux - compact mobile */}
      <section className="max-w-7xl mx-auto px-4 py-3 sm:py-6 mb-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <motion.div
            onClick={() => navigate("/jeux")}
            className="bg-gradient-to-br from-[#EC4899] to-[#A855F7] rounded-2xl p-4 text-white cursor-pointer"
          >
            <Gift className="w-6 h-6 mb-2" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Roue de la Fortune</h3>
            <p className="text-white/80 mt-0.5" style={{ fontSize: 11 }}>Gagnez des bons d'achat !</p>
          </motion.div>
          <motion.div
            onClick={() => navigate("/vip")}
            className="bg-gradient-to-br from-[#E8A817] to-[#FBBF24] rounded-2xl p-4 text-white cursor-pointer"
          >
            <Crown className="w-6 h-6 mb-2" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Programme VIP</h3>
            <p className="text-white/80 mt-0.5" style={{ fontSize: 11 }}>Cashback exclusif</p>
          </motion.div>
          <motion.div
            onClick={() => navigate("/aide")}
            className="bg-gradient-to-br from-[#16A34A] to-[#059669] rounded-2xl p-4 text-white cursor-pointer"
          >
            <ShieldCheck className="w-6 h-6 mb-2" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Paiement protégé</h3>
            <p className="text-white/80 mt-0.5" style={{ fontSize: 11 }}>Fonds sécurisés</p>
          </motion.div>
        </div>
      </section>

      {/* Alibaba-style footer */}
      <footer className="bg-[#222] text-white mt-6">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6" style={{ fontSize: 12 }}>
          <div>
            <h4 className="mb-3 text-white" style={{ fontWeight: 700, fontSize: 13 }}>Acheter sur IPPOO</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="/explorer" className="hover:text-[#FF6A00]">Explorer le catalogue</a></li>
              <li><a href="/promos" className="hover:text-[#FF6A00]">Promotions</a></li>
              <li><a href="/cotation" className="hover:text-[#FF6A00]">Cotations du marché</a></li>
              <li><a href="/communautes" className="hover:text-[#FF6A00]">Achats groupés</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-white" style={{ fontWeight: 700, fontSize: 13 }}>Vendre sur IPPOO</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="/devenir-vendeur" className="hover:text-[#FF6A00]">Devenir vendeur</a></li>
              <li><a href="/profils" className="hover:text-[#FF6A00]">Circuit de gros</a></li>
              <li><a href="/aide" className="hover:text-[#FF6A00]">Guide vendeur</a></li>
              <li><a href="/parrainage" className="hover:text-[#FF6A00]">Programme parrainage</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-white" style={{ fontWeight: 700, fontSize: 13 }}>Services & paiement</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="/wallet" className="hover:text-[#FF6A00]">Wallet IPPOO</a></li>
              <li><a href="/sav" className="hover:text-[#FF6A00]">Service après-vente</a></li>
              <li><a href="/factures" className="hover:text-[#FF6A00]">Factures</a></li>
              <li><a href="/vip" className="hover:text-[#FF6A00]">Programme VIP</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-white" style={{ fontWeight: 700, fontSize: 13 }}>À propos</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="/aide" className="hover:text-[#FF6A00]">Centre d'aide</a></li>
              <li><a href="/legal/cgu" className="hover:text-[#FF6A00]">Conditions d'utilisation</a></li>
              <li><a href="/legal/confidentialite" className="hover:text-[#FF6A00]">Confidentialité</a></li>
              <li><a href="/notifications" className="hover:text-[#FF6A00]">Notifications</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/50" style={{ fontSize: 11 }}>
            <span>© {new Date().getFullYear()} IPPOO Market - Tous droits réservés</span>
            <span>Bénin · FCFA · Français</span>
          </div>
        </div>
      </footer>
    </div>
  );
}