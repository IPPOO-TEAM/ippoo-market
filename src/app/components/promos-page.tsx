import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Zap,
  Gift,
  Crown,
  Sparkles,
  Clock,
  Ticket,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Star,
  Tag,
  Copy,
  ChevronRight,
  Target,
  Flame,
  PartyPopper,
  Heart,
  Package,
  CalendarDays,
  Award,
  Medal,
  Gem,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { promos, flashProducts, marketDays, formatPrice, IMAGES } from "./mock-data";
import { CouponCarousel } from "./promo-widgets";
import { CouponInput } from "./coupon-input";
import { FortuneWheelFull } from "./fortune-wheel";

/* ═══════════════════════════════════════════
   COUNTDOWN HOOK
   ═══════════════════════════════════════════ */
function useCountdown(totalSeconds: number) {
  const [sec, setSec] = useState(totalSeconds);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s2 = sec % 60;
  return { h, m, s: s2, total: sec };
}

/* ══════════════════════════════════════════
   SECTION CONFIGS, each theme has its own palette
   ═══════════════════════════════════════════ */
const sections = [
  { key: "all", label: "Toutes", icon: Sparkles, color: "#E11D2E", bg: "#E11D2E" },
  { key: "flash", label: "Flash", icon: Zap, color: "#F97316", bg: "#FF6B00" },
  { key: "marche", label: "Jours de marché", icon: CalendarDays, color: "#E8A817", bg: "#E8A817" },
  { key: "coupons", label: "Coupons", icon: Ticket, color: "#16A34A", bg: "#16A34A" },
  { key: "jeux", label: "Jeux", icon: Gift, color: "#EC4899", bg: "#EC4899" },
  { key: "vip", label: "VIP", icon: Crown, color: "#E8A817", bg: "#1A1A2E" },
];

/* ═══════════════════════════════════════════
   FLASH PRODUCT CARD (mini)
   ═══════════════════════════════════════════ */
function FlashProductCard({ product }: { product: (typeof flashProducts)[0] }) {
  const navigate = useNavigate();
  const stockPercent = Math.max(10, 100 - product.stock * 1.5);
  return (
    <motion.div
      onClick={() => navigate(`/produit/${product.id}`)}
      className="shrink-0 bg-white rounded-[1.1rem] overflow-hidden cursor-pointer"
      style={{ width: 175, border: "1px solid #F0EBE5" }}
    >
      {/* Image */}
      <div className="relative h-28 overflow-hidden">
        <img src={product.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Discount badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E11D2E]">
          <Zap className="w-2.5 h-2.5 text-white" />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>-{product.discount}%</span>
        </div>
        {/* Timer */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm">
          <Clock className="w-2.5 h-2.5 text-white" />
          <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>12:45:22</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: "#1A1A2E" }}>
          {product.name}
        </p>
        <p className="truncate" style={{ fontSize: 9, color: "#9CA3AF", marginTop: 1 }}>{product.seller}</p>
        <div className="flex items-center gap-2 mt-2">
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#E11D2E" }}>
            {formatPrice(product.priceFlash)}
          </span>
        </div>
        <span className="line-through" style={{ fontSize: 10, color: "#9CA3AF" }}>
          {formatPrice(product.priceOriginal)}
        </span>
        {/* Stock bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 8, fontWeight: 600, color: "#FF6B00" }}>Stock limité</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#9CA3AF" }}>{product.stock} restants</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#FEE2E2]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF4400]" style={{ width: `${stockPercent}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MARKET DAY CARD, Rich cultural design
   ═══════════════════════════════════════════ */
function MarketDayCard({ day, index }: { day: (typeof marketDays)[0]; index: number }) {
  const navigate = useNavigate();
  const patterns = [
    "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)",
    "repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(255,255,255,0.04) 6px, rgba(255,255,255,0.04) 12px)",
    "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)",
    "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 40%)",
  ];
  const marketImages = [IMAGES.textile, IMAGES.market, IMAGES.grocery, IMAGES.vegetables];
  const slugs = ["tokpa", "missebo", "arzeke", "guema"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => navigate(`/marche/${slugs[index] || "tokpa"}`)}
      className="relative rounded-3xl overflow-hidden cursor-pointer"
      style={{ minHeight: 180 }}
    >
      {/* Background image */}
      <img src={marketImages[index % 4]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${day.color}E6, ${day.color}99)` }} />
      <div className="absolute inset-0" style={{ backgroundImage: patterns[index % 4] }} />

      <div className="relative z-10 p-4 flex flex-col justify-between h-full" style={{ minHeight: 180 }}>
        {/* Top */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>JOUR DE MARCHÉ</span>
            </div>
          </div>
          <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, lineHeight: "24px" }}>
            {day.name}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{day.theme}</p>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-2.5 py-1.5">
            <CalendarDays className="w-3 h-3 text-white" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{day.date}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════
   COUPON TICKET (full-width, rich)
   ═══════════════════════════════════════════ */
const fullCoupons = [
  { code: "TOKPA10", value: "-10%", desc: "Sur les textiles", condition: "Minimum 3 pièces", valid: "08 Mars 2026", color: "#E8A817", icon: Tag },
  { code: "GROS5000", value: "5 000 FCFA", desc: "Dès 100 000 FCFA d'achat", condition: "Toutes catégories", valid: "15 Mars 2026", color: "#16A34A", icon: Gift },
  { code: "BIENVENUE25", value: "-25%", desc: "Première commande", condition: "Nouveaux membres", valid: "31 Mars 2026", color: "#E11D2E", icon: Heart },
  { code: "LIVFREE", value: "Livraison offerte", desc: "Dès 50 000 FCFA", condition: "Cotonou & Porto-Novo", valid: "15 Avril 2026", color: "#6366F1", icon: Package },
  { code: "VIP20", value: "-20%", desc: "Exclusif VIP", condition: "Membres Or et +", valid: "Ce weekend", color: "#F0B429", icon: Crown },
  { code: "FLASH5K", value: "5 000 FCFA offerts", desc: "Sur votre prochain achat", condition: "Minimum 75 000 FCFA", valid: "Aujourd'hui", color: "#EC4899", icon: Zap },
];

function CouponTicket({ coupon, index }: { coupon: (typeof fullCoupons)[0]; index: number }) {
  const CIcon = coupon.icon;
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => {
        copyToClipboard(coupon.code);
        toast.success(`Code ${coupon.code} copié ! ${coupon.value}`);
      }}
      className="w-full relative bg-white rounded-2xl overflow-hidden text-left"
      style={{ minHeight: 90, border: "1px solid #F0EBE5" }}
    >
      {/* Notch circles */}
      <div className="absolute w-6 h-6 rounded-full z-10" style={{ background: "#FFF7ED", left: -12, top: "50%", transform: "translateY(-50%)" }} />
      <div className="absolute w-6 h-6 rounded-full z-10" style={{ background: "#FFF7ED", right: -12, top: "50%", transform: "translateY(-50%)" }} />

      <div className="flex h-full">
        {/* Left: Value panel */}
        <div
          className="flex flex-col items-center justify-center px-3 py-3 shrink-0 relative"
          style={{ width: 85, background: `${coupon.color}08` }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5" style={{ background: `${coupon.color}14` }}>
            <CIcon className="w-5 h-5" style={{ color: coupon.color }} />
          </div>
          <span
            className="text-center"
            style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: coupon.color, lineHeight: "16px" }}
          >
            {coupon.value}
          </span>
          {/* Dashed separator */}
          <div className="absolute right-0 top-3 bottom-3" style={{ borderRight: "2px dashed #E8E0D8" }} />
        </div>

        {/* Right: Details */}
        <div className="flex-1 py-3 px-4 flex flex-col justify-between min-w-0">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E", lineHeight: "18px" }}>{coupon.desc}</p>
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{coupon.condition}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#9CA3AF]" />
              <span style={{ fontSize: 9, color: "#9CA3AF" }}>Expire le {coupon.valid}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: `${coupon.color}0D` }}>
              <Copy className="w-2.5 h-2.5" style={{ color: coupon.color }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 10, color: coupon.color, letterSpacing: 0.5 }}>
                {coupon.code}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════
   VIP SECTION, Premium gold/dark
   ═══════════════════════════════════════════ */
function VIPSection() {
  const navigate = useNavigate();
  const levels = [
    { name: "Bronze", min: 0, max: 100000, color: "#CD7F32", Icon: Medal },
    { name: "Argent", min: 100000, max: 500000, color: "#9CA3AF", Icon: Award },
    { name: "Or", min: 500000, max: 1500000, color: "#E8A817", Icon: Trophy },
    { name: "Diamant", min: 1500000, max: 5000000, color: "#6366F1", Icon: Gem },
  ];
  const currentSpend = 380000;
  const currentLevel = levels[1]; // Argent
  const nextLevel = levels[2]; // Or
  const progress = ((currentSpend - currentLevel.min) / (nextLevel.max - currentLevel.min)) * 100;

  return (
    <div className="space-y-4">
      {/* Main VIP card */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D1B4E 60%, #1A1A2E 100%)" }}>
        <div className="absolute rounded-full opacity-20" style={{ width: 200, height: 200, top: -60, right: -30, background: "radial-gradient(circle, #E8A817, transparent 70%)" }} />
        <div className="absolute rounded-full opacity-10" style={{ width: 150, height: 150, bottom: -30, left: -20, background: "radial-gradient(circle, #FBBF24, transparent 60%)" }} />

        <div className="relative z-10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>Programme VIP</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Montez de niveau et débloquez des avantages</p>
            </div>
          </div>

          {/* Current level + progress */}
          <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <currentLevel.Icon className="w-6 h-6" style={{ color: currentLevel.color }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: currentLevel.color }}>Niveau {currentLevel.name}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{formatPrice(currentSpend)} dépensés</p>
                </div>
              </div>
              <div className="text-right">
                <nextLevel.Icon className="w-6 h-6" style={{ color: nextLevel.color }} />
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Prochain : {nextLevel.name}</p>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` }}
              />
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              {formatPrice(nextLevel.min - currentSpend)} restants pour passer {nextLevel.name}
            </p>
          </div>

          {/* Level cards */}
          <div className="grid grid-cols-4 gap-2">
            {levels.map((l, i) => {
              const isActive = l.name === currentLevel.name;
              const isPast = i < levels.indexOf(currentLevel);
              return (
                <div
                  key={l.name}
                  className="rounded-xl p-2.5 text-center"
                  style={{
                    background: isActive ? `${l.color}20` : "rgba(255,255,255,0.03)",
                    border: isActive ? `1.5px solid ${l.color}` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <l.Icon className="w-5 h-5 mx-auto" style={{ color: isActive ? l.color : isPast ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)" }} />
                  <p style={{ fontSize: 9, fontWeight: 700, color: isActive ? l.color : isPast ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {l.name}
                  </p>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: l.color }} />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate("/vip")}
            className="w-full mt-4 py-3 rounded-2xl text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #E8A817, #FBBF24)", fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
          >
            Voir tous les avantages VIP <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contest card */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #E11D2E, #F97316)" }}>
        <div className="absolute rounded-full opacity-15" style={{ width: 180, height: 180, top: -50, right: -40, background: "radial-gradient(circle, #FFD700, transparent 70%)" }} />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>Concours du mois</h3>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Top acheteur Mars 2026</p>
            </div>
          </div>

          <p className="text-white/80 mb-4" style={{ fontSize: 12, lineHeight: "18px" }}>
            Le meilleur volume ce mois gagne <strong>100 000 FCFA</strong> + accès <strong>VIP Or</strong> pendant 3 mois !
          </p>

          <div className="space-y-2">
            {[
              { rank: 1, name: "Koffi M.", amount: "1 250 000 FCFA", color: "#FFD700" },
              { rank: 2, name: "Aminata D.", amount: "980 000 FCFA", color: "#C0C0C0" },
              { rank: 3, name: "Ibrahim K.", amount: "750 000 FCFA", color: "#CD7F32" },
              { rank: 4, name: "Vous", amount: "380 000 FCFA", color: "#fff" },
            ].map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: p.rank === 4 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)" }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: p.rank <= 3 ? `${p.color}30` : "rgba(255,255,255,0.15)" }}>
                  {p.rank <= 3 ? (
                    <Trophy className="w-3.5 h-3.5" style={{ color: p.color }} />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <span className="flex-1 text-white" style={{ fontSize: 12, fontWeight: p.rank === 4 ? 800 : 500 }}>{p.name}</span>
                <span className="text-white" style={{ fontSize: 12, fontWeight: 700 }}>{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GIFTS TO WIN SECTION
   ═══════════════════════════════════════════════════════ */
const giftsToWin = [
  { title: "iPhone 16 Pro", condition: "Commandez +500 000 FCFA ce mois", chance: "1/500", color: "#0066FF", icon: Star },
  { title: "Bon d'achat 50 000 FCFA", condition: "Parrainez 3 amis actifs", chance: "1/50", color: "#16A34A", icon: Gift },
  { title: "1 an livraison gratuite", condition: "Atteignez le niveau VIP Or", chance: "1/100", color: "#E8A817", icon: Crown },
  { title: "Pack Beauté Premium", condition: "Achetez dans 3 catégories", chance: "1/200", color: "#EC4899", icon: Sparkles },
];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export function PromosPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("all");
  const { h, m, s } = useCountdown(43218);

  const show = (key: string) => activeSection === "all" || activeSection === key;

  return (
    <div className="pb-24">
      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #E11D2E 0%, #FF3D00 40%, #F97316 80%, #FBBF24 100%)" }} />
        {/* Decorative elements */}
        <div className="absolute rounded-full opacity-20" style={{ width: 250, height: 250, top: -80, right: -60, background: "radial-gradient(circle, #fff, transparent 70%)" }} />
        <div className="absolute rounded-full opacity-15" style={{ width: 150, height: 150, bottom: -40, left: -20, background: "radial-gradient(circle, #FFD700, transparent 60%)" }} />
        {/* Floating percent signs */}
        {[
          { top: 20, left: "15%", size: 40, rot: -15 },
          { top: 50, left: "70%", size: 30, rot: 20 },
          { top: 100, left: "85%", size: 22, rot: -30 },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.12, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="absolute text-white"
            style={{ top: p.top, left: p.left, fontSize: p.size, fontWeight: 900, transform: `rotate(${p.rot}deg)` }}
          >
            %
          </motion.div>
        ))}

        <div className="relative z-10 px-4 pt-6 pb-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MARKETPLACE B2B</p>
            </div>
            <h1 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28, lineHeight: "34px" }}>
              Promos &<br />Offres spéciales
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", maxWidth: 300, lineHeight: "18px" }}>
              Flash sales, jours de marché, coupons exclusifs, jeux et programme VIP
            </p>

            {/* Global countdown */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <Flame className="w-4 h-4 text-[#FFD700]" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Fin des FLASH dans</span>
              </div>
              <div className="flex gap-1.5">
                {[
                  { val: String(h).padStart(2, "0"), label: "h" },
                  { val: String(m).padStart(2, "0"), label: "m" },
                  { val: String(s).padStart(2, "0"), label: "s" },
                ].map((t, i) => (
                  <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-center" style={{ minWidth: 36 }}>
                    <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: "#fff" }}>{t.val}</span>
                    <span style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", display: "block", marginTop: -2 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-4">
              {[
                { val: "12", label: "Offres actives" },
                { val: "6", label: "Coupons" },
                { val: "2", label: "Tours roue" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.val}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════ SECTION PILLS ═══════ */}
      <div className="bg-white border-b" style={{ borderColor: "#F0EBE5" }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {sections.map((sec) => {
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all ${
                    isActive ? "text-white" : "bg-white text-[#6B7280] border-[#E8E0D8] hover:bg-[#FFF7ED]"
                  }`}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    ...(isActive ? { background: sec.bg, borderColor: sec.bg } : {}),
                  }}
                >
                  <sec.icon className="w-3.5 h-3.5" />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 space-y-8">

        {/* ═══════ 1. FLASH SALES ═══════ */}
        {show("flash") && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>Ventes Flash</h2>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Prix cassés, quantités limitées</p>
              </div>
              <button
                onClick={() => navigate("/explorer")}
                className="ml-auto px-3 py-1.5 rounded-xl border flex items-center gap-1 hover:bg-[#FFF7ED] transition-colors"
                style={{ borderColor: "#E8E0D8", fontSize: 11, fontWeight: 600, color: "#6B7280" }}
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Flash products carousel */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {flashProducts.map((p) => (
                <FlashProductCard key={p.id} product={p} />
              ))}
              {/* Extra fake flash items */}
              {flashProducts.slice(0, 2).map((p) => (
                <FlashProductCard key={`extra-${p.id}`} product={{ ...p, id: p.id + 100, priceFlash: Math.round(p.priceFlash * 0.9), discount: p.discount + 5 }} />
              ))}
            </div>

            {/* Active promo banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {promos
                .filter((p) => p.type === "flash" || p.type === "marche")
                .map((promo, i) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{ minHeight: 120 }}
                    onClick={() => navigate("/explorer")}
                  >
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${promo.color}, ${promo.color}BB)` }} />
                    <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)" }} />
                    <div className="relative z-10 p-4 flex flex-col justify-between h-full" style={{ minHeight: 120 }}>
                      <div className="flex items-center gap-2">
                        {promo.type === "flash" ? <Zap className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                        <span className="px-2 py-0.5 bg-white/20 rounded-lg" style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
                          {promo.type.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, lineHeight: "20px" }}>{promo.title}</h3>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{promo.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-white/60" style={{ fontSize: 10 }}>
                          <Clock className="w-3 h-3" /> Jusqu'au {promo.endDate}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.section>
        )}

        {/* ═══════ 2. JOURS DE MARCHÉ ═══════ */}
        {show("marche") && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>Jours de Marché</h2>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Les grands marchés du Bénin en ligne</p>
              </div>
              <button
                onClick={() => navigate("/marche")}
                className="ml-auto px-3 py-1.5 rounded-xl border flex items-center gap-1 hover:bg-[#FFF7ED] transition-colors"
                style={{ borderColor: "#E8E0D8", fontSize: 11, fontWeight: 600, color: "#6B7280" }}
              >
                Tout voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {marketDays.map((day, i) => (
                <MarketDayCard key={day.id} day={day} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ═══════ 3. COUPONS & BONS ═══════ */}
        {show("coupons") && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#22C55E] flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>Coupons & Bons d'Achat</h2>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Copiez un code et économisez au panier</p>
              </div>
            </div>

            {/* Coupon carousel from promo-widgets */}
            <div className="mb-5">
              <CouponCarousel />
            </div>

            {/* Full coupon tickets */}
            <div className="space-y-2.5">
              {fullCoupons.map((coupon, i) => (
                <CouponTicket key={coupon.code} coupon={coupon} index={i} />
              ))}
            </div>

            {/* Code input — composant unifié, branché sur le store de paiement */}
            <div className="mt-5">
              <CouponInput title="Saisir un code promo" />
            </div>
          </motion.section>
        )}

        {/* ═══════ 4. JEUX, Roue + Cadeaux ═══════ */}
        {show("jeux") && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>Jeux & Lots</h2>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Tentez votre chance et gagnez des récompenses</p>
              </div>
            </div>

            <FortuneWheelFull id="promos" size={260} showLegend={false} />

            {/* Gifts to win */}
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-3">
                <PartyPopper className="w-4 h-4 text-[#EC4899]" />
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>CADEAUX À GAGNER</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {giftsToWin.map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => navigate("/jeux")}
                    className="rounded-2xl bg-white p-3.5 cursor-pointer"
                    style={{ border: "1px solid #F0EBE5" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${g.color}12` }}>
                      <g.icon className="w-5 h-5" style={{ color: g.color }} />
                    </div>
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: g.color }}>{g.title}</p>
                    <p style={{ fontSize: 10, color: "#6B7280", marginTop: 2, lineHeight: "14px" }}>{g.condition}</p>
                    <div className="flex items-center gap-1 mt-2.5 pt-2" style={{ borderTop: "1px solid #F5F0EB" }}>
                      <Target className="w-3 h-3" style={{ color: g.color }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: g.color }}>Chance: {g.chance}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══════ 5. VIP & CONCOURS ═══════ */}
        {show("vip") && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>Programme VIP & Concours</h2>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Montez de niveau et gagnez des récompenses</p>
              </div>
            </div>

            <VIPSection />
          </motion.section>
        )}

      </div>
    </div>
  );
}