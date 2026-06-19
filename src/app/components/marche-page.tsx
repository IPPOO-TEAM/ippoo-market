import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  Zap,
  Star,
  ShoppingCart,
  Truck,
  BadgeCheck,
  Crown,
  Users,
  Gift,
  Sparkles,
  Tag,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Percent,
  Copy,
  Package,
  Ticket,
  Timer,
  Store,
  Heart,
  Share2,
  Bell,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { formatPrice } from "./mock-data";
import { CouponStrip } from "./promo-widgets";
import { marketsData, type MarketProduct } from "./marche-data";


/* ═══════════════════════════════════════════════════
   COUNTDOWN COMPONENT
   ═══════════════════════════════════════════════════ */
function CountdownTimer({ color }: { color: string }) {
  const [sec, setSec] = useState(43218);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s2 = sec % 60;
  return (
    <div className="flex gap-1.5">
      {[
        { val: String(h).padStart(2, "0"), label: "h" },
        { val: String(m).padStart(2, "0"), label: "m" },
        { val: String(s2).padStart(2, "0"), label: "s" },
      ].map((t, i) => (
        <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-center" style={{ minWidth: 36 }}>
          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: "#fff" }}>{t.val}</span>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", display: "block", marginTop: -2 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MARKET PRODUCT CARD
   ═══════════════════════════════════════════════════ */
function MarketProductCard({ product, color }: { product: MarketProduct; color: string }) {
  const navigate = useNavigate();
  const stockPercent = Math.min(90, Math.max(15, 100 - product.stock * 0.3));
  return (
    <motion.div
      onClick={() => navigate(`/produit/${product.id}`)}
      className="shrink-0 bg-white rounded-[1.1rem] overflow-hidden cursor-pointer"
      style={{ width: 175, border: "1px solid #F0EBE5" }}
    >
      <div className="relative h-28 overflow-hidden">
        <img src={product.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: color }}>
          <Zap className="w-2.5 h-2.5 text-white" />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>-{product.discount}%</span>
        </div>
      </div>
      <div className="p-3">
        <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, color: "#1A1A2E", lineHeight: "15px" }}>
          {product.name}
        </p>
        <p className="truncate" style={{ fontSize: 9, color: "#9CA3AF", marginTop: 1 }}>{product.seller}</p>
        <div className="mt-1.5">
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color }}>{formatPrice(product.price)}</span>
        </div>
        <span className="line-through" style={{ fontSize: 10, color: "#9CA3AF" }}>{formatPrice(product.originalPrice)}</span>
        <div className="mt-2">
          <div className="w-full h-1.5 rounded-full" style={{ background: `${color}20` }}>
            <div className="h-full rounded-full" style={{ width: `${stockPercent}%`, background: color }} />
          </div>
          <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md w-fit" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5" }}>
            <Package className="w-2.5 h-2.5" style={{ color: "#E11D2E" }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#E11D2E" }}>MOQ {product.moq} {product.unit}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   HUB PAGE, /marche
   ═══════════════════════════════════════════════════ */
export function MarcheHubPage() {
  const navigate = useNavigate();
  const [reminded, setReminded] = useState<number[]>([]);

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #E8A817 0%, #F0B429 40%, #FBBF24 80%, #FDE68A 100%)" }} />
        <div className="absolute rounded-full opacity-20" style={{ width: 250, height: 250, top: -80, right: -60, background: "radial-gradient(circle, #fff, transparent 70%)" }} />
        <div className="absolute rounded-full opacity-10" style={{ width: 150, height: 150, bottom: -30, left: -20, background: "radial-gradient(circle, #E11D2E, transparent 60%)" }} />

        <div className="relative z-10 px-4 pt-6 pb-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: 2 }}>IPPOO MARKET</p>
            </div>
            <h1 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28, lineHeight: "34px" }}>
              Jours de<br />Marché
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", maxWidth: 320, lineHeight: "18px" }}>
              Les plus grands marchés du Bénin, en ligne. Prix de gros, livraison rapide, vendeurs certifiés.
            </p>

            <div className="flex items-center gap-4 mt-4">
              {[
                { val: "4", label: "Marchés" },
                { val: "1 465", label: "Acheteurs" },
                { val: "40+", label: "Vendeurs" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.val}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 space-y-5">
        {/* Calendar strip */}
        <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0EBE5" }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-[#E8A817]" />
            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>Calendrier de la semaine</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {marketsData.map((m, i) => {
              const dayNames = ["SAM", "DIM", "LUN", "MAR"];
              const dayNums = ["8", "9", "10", "11"];
              const isToday = i === 0;
              return (
                <motion.button
                  key={m.id}
                  onClick={() => navigate(`/marche/${m.slug}`)}
                  className="shrink-0 rounded-xl text-center transition-all"
                  style={{
                    width: 65,
                    padding: "8px 4px",
                    background: isToday ? m.color : "#F9F5F0",
                    border: isToday ? "none" : "1px solid #E8E0D8",
                  }}
                >
                  <p style={{ fontSize: 9, fontWeight: 700, color: isToday ? "rgba(255,255,255,0.7)" : "#9CA3AF", letterSpacing: 1 }}>{dayNames[i]}</p>
                  <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, color: isToday ? "#fff" : "#1A1A2E" }}>{dayNums[i]}</p>
                  <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ background: m.color, opacity: isToday ? 0 : 1 }} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Market cards */}
        {marketsData.map((market, i) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="relative rounded-3xl overflow-hidden cursor-pointer" onClick={() => navigate(`/marche/${market.slug}`)}>
              {/* Background */}
              <img src={market.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${market.color}E6 0%, ${market.color}99 60%, ${market.color}66 100%)` }} />
              <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)" }} />

              <div className="relative z-10 p-5" style={{ minHeight: 220 }}>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{market.dateLabel.toUpperCase()}</span>
                    </div>
                    {i === 0 && (
                      <div className="px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-sm flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>AUJOURD'HUI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1">
                    <Users className="w-3 h-3 text-white" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{market.participants}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, lineHeight: "28px" }}>{market.name}</h2>
                <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>{market.theme}</p>

                {/* Location & date */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-white/70">
                    <MapPin className="w-3 h-3" />
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{market.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/70">
                    <CalendarDays className="w-3 h-3" />
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{market.date}</span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {market.highlights.slice(0, 2).map((h, j) => (
                    <div key={j} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1">
                      <Zap className="w-2.5 h-2.5 text-[#FFD700]" />
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#fff" }}>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {market.deliveryFree && (
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Truck className="w-3 h-3 text-white" />
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Livraison gratuite</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (reminded.includes(market.id)) {
                          toast.info("Rappel déjà activé !");
                        } else {
                          setReminded((r) => [...r, market.id]);
                          toast.success(`Rappel activé pour ${market.name} !`);
                        }
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: reminded.includes(market.id) ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)" }}
                    >
                      {reminded.includes(market.id) ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Bell className="w-4 h-4 text-white" />
                      )}
                    </motion.button>
                    <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#2D2B55] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8A817]/20 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-[#E8A817]" />
            </div>
            <div>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Devenez vendeur de marché</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: "15px" }}>
                Inscrivez votre boutique pour apparaître dans les jours de marché IPPOO
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/devenir-vendeur")}
            className="mt-3 w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #E8A817, #FBBF24)", fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: "#1A1A2E" }}
          >
            <Store className="w-4 h-4" /> S'inscrire comme vendeur
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DETAIL PAGE, /marche/:slug
   ═══════════════════════════════════════════════════ */
export function MarcheDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const market = marketsData.find((m) => m.slug === slug);
  const [activeTab, setActiveTab] = useState<"produits" | "vendeurs" | "programme">("produits");
  const [reminded, setReminded] = useState(false);

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Store className="w-12 h-12 text-[#9CA3AF]" />
        <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Marché introuvable</p>
        <button onClick={() => navigate("/marche")} className="px-4 py-2 bg-[#E8A817] text-white rounded-xl" style={{ fontSize: 13, fontWeight: 600 }}>
          Voir tous les marchés
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ═══════ BREADCRUMB ═══════ */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground" style={{ fontWeight: 500 }}>Accueil</button>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <button onClick={() => navigate("/marche")} className="text-muted-foreground hover:text-foreground" style={{ fontWeight: 500 }}>Jours de marché</button>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className="truncate" style={{ fontWeight: 700, color: market.color }}>{market.name}</span>
      </div>

      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src={market.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${market.color}99 0%, ${market.color}DD 50%, ${market.color}F2 100%)` }} />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)" }} />

        {/* Back button */}
        <button
          onClick={() => navigate("/marche")}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Share & Remind */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => {
              setReminded(true);
              toast.success("Rappel activé !");
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: reminded ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            {reminded ? <Check className="w-4 h-4 text-white" /> : <Bell className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={() => toast.success("Lien copié !")}
            className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="relative z-10 px-4 pt-16 pb-5 flex flex-col justify-end" style={{ minHeight: 280 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{market.dateLabel.toUpperCase()}</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-white" />
              <span style={{ fontSize: 9, fontWeight: 600, color: "#fff" }}>{market.location}</span>
            </div>
          </div>

          <h1 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28, lineHeight: "34px" }}>
            {market.name}
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 14, fontWeight: 600 }}>{market.theme}</p>

          <div className="flex items-center gap-3 mt-3">
            <CountdownTimer color={market.color} />
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
              <Users className="w-3.5 h-3.5 text-white" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{market.participants} acheteurs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 space-y-5">

        {/* ═══════ DESCRIPTION ═══════ */}
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: "20px" }}>{market.description}</p>

        {/* ═══════ HIGHLIGHTS ═══════ */}
        <div className="flex flex-wrap gap-2">
          {market.highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${market.color}10`, border: `1px solid ${market.color}25` }}>
              <Zap className="w-3 h-3" style={{ color: market.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: market.color }}>{h}</span>
            </div>
          ))}
          {market.deliveryFree && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16A34A]/10" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
              <Truck className="w-3 h-3 text-[#16A34A]" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>Livraison gratuite dès {formatPrice(market.deliveryFreeMin)}</span>
            </div>
          )}
        </div>

        {/* ═══════ COUPON ═══════ */}
        <CouponStrip
          code={market.couponCode}
          label={market.name}
          discount={market.couponDiscount}
          color={market.color}
          condition={market.couponCondition}
          expiry={`Valable le ${market.date}`}
          icon={Tag}
        />

        {/* ═══════ CATEGORIES CHIPS ═══════ */}
        <div>
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E", marginBottom: 8 }}>Catégories du marché</p>
          <div className="flex flex-wrap gap-1.5">
            {market.categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => navigate("/explorer")}
                className="px-3 py-1.5 rounded-full bg-white transition-colors"
                style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", border: "1px solid #E8E0D8" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ TAB BAR ═══════ */}
        <div className="flex gap-1 bg-[#F5F0EB] rounded-xl p-1">
          {([
            { key: "produits", label: "Produits", icon: Package },
            { key: "vendeurs", label: "Vendeurs", icon: Store },
            { key: "programme", label: "Programme", icon: Clock },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all"
              style={{
                background: activeTab === tab.key ? "#fff" : "transparent",
                fontSize: 12,
                fontWeight: 700,
                color: activeTab === tab.key ? market.color : "#9CA3AF",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════ TAB: PRODUCTS ═══════ */}
        {activeTab === "produits" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>
                Offres du {market.name}
              </h3>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{market.products.length} produits</span>
            </div>

            {/* Horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {market.products.map((p) => (
                <MarketProductCard key={p.id} product={p} color={market.color} />
              ))}
            </div>

            {/* Grid view */}
            <div className="grid grid-cols-2 gap-2.5">
              {market.products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/produit/${p.id}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                  style={{ border: "1px solid #F0EBE5" }}
                >
                  <div className="relative h-24 overflow-hidden">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full" style={{ background: market.color }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>-{p.discount}%</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2" style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E", lineHeight: "14px" }}>{p.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-2.5 h-2.5 text-[#E8A817] fill-[#E8A817]" />
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF" }}>{p.rating} • {p.seller}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: market.color }}>{formatPrice(p.price)}</span>
                    </div>
                    <span className="line-through" style={{ fontSize: 9, color: "#C4C4C4" }}>{formatPrice(p.originalPrice)}</span>
                    <div className="mt-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md w-fit" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5" }}>
                      <Package className="w-2.5 h-2.5" style={{ color: "#E11D2E" }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#E11D2E" }}>MOQ {p.moq} {p.unit}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`${p.name} ajouté au panier !`);
                      }}
                      className="mt-2 w-full py-1.5 rounded-lg flex items-center justify-center gap-1 text-white"
                      style={{ background: market.color, fontSize: 10, fontWeight: 700 }}
                    >
                      <ShoppingCart className="w-3 h-3" /> Ajouter
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════ TAB: VENDORS ═══════ */}
        {activeTab === "vendeurs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>
              Vendeurs participants
            </h3>
            {market.vendors.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate(`/vendeur/${v.id}`)}
                className="bg-white rounded-2xl p-4 cursor-pointer flex items-start gap-3"
                style={{ border: "1px solid #F0EBE5" }}
              >
                <img src={v.avatar} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>{v.name}</p>
                    <span
                      className="px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        color: v.badge === "VIP" ? "#E8A817" : v.badge === "TOP" ? "#E11D2E" : "#16A34A",
                        background: v.badge === "VIP" ? "#FEF9E7" : v.badge === "TOP" ? "#FEE2E2" : "#F0FDF4",
                      }}
                    >
                      {v.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{v.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-[#E8A817] fill-[#E8A817]" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E" }}>{v.rating}</span>
                  </div>
                  {/* Special offer */}
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${market.color}10` }}>
                    <Zap className="w-3 h-3" style={{ color: market.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: market.color }}>{v.specialOffer}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D1D5DB] shrink-0 mt-4" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ═══════ TAB: SCHEDULE ═══════ */}
        {activeTab === "programme" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>
              Programme du {market.name}
            </h3>

            {/* Schedule timeline */}
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2.5 top-0 bottom-0 w-0.5" style={{ background: `${market.color}25` }} />

              {market.schedule.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative pb-5 last:pb-0"
                >
                  {/* Dot */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      left: -18,
                      top: 4,
                      width: item.highlight ? 12 : 8,
                      height: item.highlight ? 12 : 8,
                      background: item.highlight ? market.color : "#D1D5DB",
                      border: item.highlight ? `2px solid ${market.color}40` : "none",
                    }}
                  />
                  <div
                    className="rounded-xl px-3.5 py-2.5"
                    style={{
                      background: item.highlight ? `${market.color}08` : "#fff",
                      border: item.highlight ? `1px solid ${market.color}20` : "1px solid #F0EBE5",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: item.highlight ? market.color : "#1A1A2E" }}>
                        {item.time}
                      </span>
                      {item.highlight && <Zap className="w-3 h-3" style={{ color: market.color }} />}
                    </div>
                    <p style={{ fontSize: 12, color: item.highlight ? "#1A1A2E" : "#6B7280", fontWeight: item.highlight ? 600 : 400, marginTop: 2 }}>
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0EBE5" }}>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }}>Règles du marché</p>
              <div className="space-y-2">
                {market.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${market.color}12` }}>
                      <Check className="w-3 h-3" style={{ color: market.color }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280", lineHeight: "16px" }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: `${market.color}08`, border: `1px solid ${market.color}15` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${market.color}15` }}>
                <MapPin className="w-5 h-5" style={{ color: market.color }} />
              </div>
              <div>
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{market.location}</p>
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{market.date} • {market.time}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                  Prix en ligne = Prix du marché physique. Achetez depuis votre téléphone, recevez chez vous.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════ STICKY BOTTOM BAR ═══════ */}
      <div className="fixed left-0 right-0 z-30 px-4 pb-2 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl p-3 flex items-center gap-3" style={{ border: "1px solid #E8E0D8" }}>
          <div className="flex-1">
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{market.name}</p>
            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{market.products.length} offres • {market.vendors.length} vendeurs</p>
          </div>
          <button
            onClick={() => {
              copyToClipboard(market.couponCode);
              toast.success(`Code ${market.couponCode} copié ! ${market.couponDiscount}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: `${market.color}10`, fontSize: 11, fontWeight: 700, color: market.color }}
          >
            <Copy className="w-3 h-3" />
            {market.couponCode}
          </button>
          <button
            onClick={() => navigate("/explorer")}
            className="px-5 py-2.5 rounded-xl text-white flex items-center gap-1.5"
            style={{ background: market.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
          >
            Explorer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
