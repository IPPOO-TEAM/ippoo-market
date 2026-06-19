import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Gift,
  Zap,
  Copy,
  Crown,
  Ticket,
  Star,
  Trophy,
  Clock,
  ArrowRight,
  Sparkles,
  Percent,
  PartyPopper,
  Target,
  Check,
  Scissors,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { MiniWheelVisual } from "./fortune-wheel";
import { formatPrice } from "./mock-data";

/* ─── Coupon Ticket Card, Modern "cut-out" ticket ─── */
export function CouponStrip({
  code,
  label,
  discount,
  color = "#E11D2E",
  bgColor,
  condition,
  expiry,
  icon: IconProp,
}: {
  code: string;
  label?: string;
  discount: string;
  color?: string;
  bgColor?: string;
  condition?: string;
  expiry?: string;
  icon?: React.ElementType;
}) {
  const CouponIcon = IconProp || Ticket;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(code);
    setCopied(true);
    toast.success(`Code ${code} copié ! ${discount}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="w-full relative overflow-hidden rounded-2xl"
      style={{ minHeight: 110 }}
    >
      {/* Solid color background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ background: color }}
      />

      {/* Notch circles */}
      <div
        className="absolute w-7 h-7 rounded-full z-10"
        style={{ background: "var(--background)", left: -14, top: "50%", transform: "translateY(-50%)" }}
      />
      <div
        className="absolute w-7 h-7 rounded-full z-10"
        style={{ background: "var(--background)", right: -14, top: "50%", transform: "translateY(-50%)" }}
      />

      <div className="flex h-full relative">
        {/* Left panel: Icon badge */}
        <div className="flex flex-col items-center justify-center px-3 py-4 shrink-0 relative" style={{ width: 80 }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1.5"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <CouponIcon className="w-6 h-6 text-white" />
          </div>
          <p
            className="text-center text-white/80"
            style={{ fontSize: 9, fontWeight: 700, lineHeight: "11px", maxWidth: 60, fontFamily: "Poppins" }}
          >
            {label}
          </p>
        </div>

        {/* Dotted middle line separator */}
        <div className="absolute left-[80px] top-4 bottom-4 flex flex-col items-center justify-between z-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-[2px] h-[4px] rounded-full bg-white/40" />
          ))}
        </div>

        {/* Right panel: content */}
        <div className="flex-1 py-3 px-4 text-left flex flex-col justify-between min-w-0">
          <div>
            <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, lineHeight: "20px" }}>
              {discount}
            </p>
            {condition && (
              <p className="text-white/70" style={{ fontSize: 11, marginTop: 3, lineHeight: "14px" }}>
                {condition}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2.5 gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-white/50" />
              <p className="text-white/50" style={{ fontSize: 9, fontWeight: 500 }}>
                {expiry || "Offre limitée"}
              </p>
            </div>
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px dashed rgba(255,255,255,0.35)" }}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span
                className="text-white"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                {code}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Flash Promo Banner (mini) ─── */
export function FlashPromoBanner({
  text,
  subtext,
  link,
  color = "#E11D2E",
}: {
  text: string;
  subtext: string;
  link: string;
  color?: string;
}) {
  const navigate = useNavigate();
  const [flash, setFlash] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setFlash((f) => !f), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(link)}
      className="relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
      }}
    >
      {/* Shine effect */}
      <motion.div
        animate={{ x: [-200, 400] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        className="absolute top-0 w-20 h-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)" }}
      />
      <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        <Zap
          className="w-5 h-5 text-white"
          style={{ opacity: flash ? 1 : 0.3, transition: "opacity 0.3s" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white truncate" style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}>
          {text}
        </p>
        <p className="text-white/70 truncate" style={{ fontSize: 10 }}>
          {subtext}
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </div>
    </motion.div>
  );
}

/* ─── Concours Countdown Card ─── */
export function ContestCard({
  title,
  prize,
  endsIn,
  participants,
  link,
}: {
  title: string;
  prize: string;
  endsIn: string;
  participants: number;
  link: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      onClick={() => navigate(link)}
      className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#F0278E] rounded-2xl p-4 text-white cursor-pointer"
    >
      {/* Decorative elements */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#FBBF24]" />
          </div>
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
            CONCOURS
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins", lineHeight: "18px" }}>{title}</p>
        <div className="flex items-center gap-1.5 mt-1.5 bg-white/10 rounded-xl px-2.5 py-1.5 w-fit">
          <Gift className="w-3.5 h-3.5 text-[#FBBF24]" />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{prize}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/15">
          <span className="flex items-center gap-1 text-white/80" style={{ fontSize: 10, fontWeight: 500 }}>
            <Clock className="w-3 h-3" /> {endsIn}
          </span>
          <span className="flex items-center gap-1 text-white/80" style={{ fontSize: 10, fontWeight: 500 }}>
            <Target className="w-3 h-3" /> {participants.toLocaleString()} joueurs
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Cadeau à gagner banner ─── */
export function GiftBanner({
  text,
  subtext,
  link,
}: {
  text: string;
  subtext: string;
  link: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      onClick={() => navigate(link)}
      className="relative overflow-hidden bg-gradient-to-r from-[#E8A817] via-[#F0B429] to-[#FF8C00] rounded-2xl p-4 text-white cursor-pointer"
    >
      {/* Sparkle decorations */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute -top-4 right-8 w-16 h-16 opacity-20"
      >
        <Sparkles className="w-full h-full" />
      </motion.div>

      <div className="flex items-center gap-3 relative">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Gift className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
            {text}
          </p>
          <p className="text-white/85 truncate mt-0.5" style={{ fontSize: 11 }}>
            {subtext}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Multi-Coupon Carousel ─── */
const couponsData = [
  {
    code: "BIENVENUE25",
    label: "Bienvenue",
    discount: "-25% 1ère commande",
    condition: "Min. 5 000 FCFA",
    color: "#E11D2E",
    gradientTo: "#FF4757",
    icon: Gift,
    expiry: "31 mars 2026",
  },
  {
    code: "ORANGE1000",
    label: "Orange Money",
    discount: "1 000 FCFA offerts",
    condition: "Crédités sur IPPOO CASH",
    color: "#FF7A00",
    gradientTo: "#FFA94D",
    icon: Ticket,
    expiry: "31 mars 2026",
  },
  {
    code: "GROS10",
    label: "Volume +10",
    discount: "-10% dès 10 cartons",
    condition: "Tout le catalogue B2B",
    color: "#FF6B00",
    gradientTo: "#F97316",
    icon: Percent,
    expiry: "Offre permanente",
  },
  {
    code: "LIVFREE",
    label: "Livraison",
    discount: "Livraison gratuite",
    condition: "Dès 50 000 FCFA d'achat",
    color: "#16A34A",
    gradientTo: "#22C55E",
    icon: Gift,
    expiry: "15 avril 2026",
  },
  {
    code: "VIP20",
    label: "Exclusif VIP",
    discount: "-20% membres VIP",
    condition: "Membres OR et supérieur",
    color: "#E8A817",
    gradientTo: "#FBBF24",
    icon: Crown,
    expiry: "Ce weekend",
  },
  {
    code: "FLASH5K",
    label: "Flash",
    discount: "5 000 FCFA offerts",
    condition: "Dès 100 000 FCFA d'achat",
    color: "#EC4899",
    gradientTo: "#F472B6",
    icon: Zap,
    expiry: "Aujourd'hui",
  },
  {
    code: "BEAUTY15",
    label: "Beauté",
    discount: "-15% Beauté & Hygiène",
    condition: "Catégorie beauté",
    color: "#9333EA",
    gradientTo: "#A855F7",
    icon: Sparkles,
    expiry: "20 mars 2026",
  },
];

export function CouponCarousel() {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#9333EA] flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#111" }}>
              Coupons exclusifs
            </p>
            <p style={{ fontSize: 10, color: "#999" }}>
              Appuyez pour copier le code
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-[#EC4899]/10">
          <span style={{ fontSize: 10, fontWeight: 700, color: "#EC4899" }}>{couponsData.length} dispo</span>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {couponsData.map((c) => (
          <CouponCard key={c.code} coupon={c} />
        ))}
      </div>
    </div>
  );
}

function CouponCard({ coupon: c }: { coupon: typeof couponsData[0] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(c.code);
    setCopied(true);
    toast.success(`Code ${c.code} copié ! ${c.discount}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="shrink-0 relative overflow-hidden text-left rounded-2xl"
      style={{ width: 260, minHeight: 130 }}
    >
      {/* Solid color background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ background: c.color }}
      />

      {/* Notch circles */}
      <div
        className="absolute w-7 h-7 rounded-full z-10"
        style={{ background: "var(--background)", left: -14, top: "50%", transform: "translateY(-50%)" }}
      />
      <div
        className="absolute w-7 h-7 rounded-full z-10"
        style={{ background: "var(--background)", right: -14, top: "50%", transform: "translateY(-50%)" }}
      />

      <div className="flex h-full relative">
        {/* Left: Icon + label */}
        <div className="flex flex-col items-center justify-center py-3 shrink-0 relative" style={{ width: 72 }}>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <c.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-white/75" style={{ fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: "10px", maxWidth: 54, fontFamily: "Poppins" }}>
            {c.label}
          </p>
        </div>

        {/* Dotted middle line separator */}
        <div className="absolute left-[72px] top-3 bottom-3 flex flex-col items-center justify-between z-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-[2px] h-[3px] rounded-full bg-white/40" />
          ))}
        </div>

        {/* Right: Content */}
        <div className="flex-1 py-3 px-3.5 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, lineHeight: "18px" }}>
              {c.discount}
            </p>
            <p className="text-white/70" style={{ fontSize: 10, marginTop: 3, lineHeight: "13px" }}>
              {c.condition}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-white/45" />
              <p className="text-white/45" style={{ fontSize: 8, fontWeight: 500 }}>{c.expiry}</p>
            </div>
            <motion.div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px dashed rgba(255,255,255,0.35)" }}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span
                className="text-white"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: 9,
                  letterSpacing: 0.5,
                }}
              >
                {c.code}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Spin Wheel Mini Teaser ─── */
export function SpinWheelTeaser({ link = "/jeux" }: { link?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      onClick={() => navigate(link)}
      className="relative overflow-hidden bg-gradient-to-br from-[#1A1025] via-[#2D1B4E] to-[#4C1D95] rounded-2xl p-4 text-white cursor-pointer"
    >
      {/* Glow accents */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#EC4899]/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-[#FBBF24]/8 translate-y-6 -translate-x-4" />

      <div className="flex items-center gap-3.5 relative">
        {/* Mini SVG wheel */}
        <div className="shrink-0">
          <MiniWheelVisual size={56} />
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
            ROUE DE LA FORTUNE
          </p>
          <p className="text-white/70 mt-0.5" style={{ fontSize: 11 }}>
            1 tour gratuit par jour !
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 bg-white/10 rounded-lg px-2.5 py-1 w-fit">
            <Sparkles className="w-3 h-3 text-[#FBBF24]" />
            <span style={{ fontSize: 9, fontWeight: 700 }}>Gagnez jusqu'à 50 000 FCFA</span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-[#FBBF24]" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Points Fidélité Mini ─── */
export function LoyaltyPointsBadge({
  points = 12450,
  level = "ARGENT",
}: {
  points?: number;
  level?: string;
}) {
  const navigate = useNavigate();
  const progress = Math.min((points / 25000) * 100, 100);

  return (
    <motion.div
      onClick={() => navigate("/vip")}
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
      style={{ background: "linear-gradient(145deg, #FEF3C7, #FFF7ED, #FFFBEB)" }}
    >
      {/* Decorative */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#E8A817]/10" />

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 11, fontWeight: 800, color: "#E8A817", fontFamily: "Poppins" }}>
              {points.toLocaleString()} points
            </p>
            <p style={{ fontSize: 10, color: "#92400E" }}>
              Niveau {level}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#E8A817]/10 flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 text-[#E8A817]" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#E8A817]/15 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #E8A817, #FBBF24)" }}
          />
        </div>
        <p className="text-right mt-1" style={{ fontSize: 8, color: "#B45309" }}>
          {(25000 - points).toLocaleString()} pts avant le niveau OR
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Promo du jour highlight ─── */
export function DailyDealHighlight() {
  const navigate = useNavigate();
  const [sec, setSec] = useState(43218);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return (
    <motion.div
      onClick={() => navigate("/promos")}
      className="relative overflow-hidden bg-gradient-to-br from-[#E11D2E] via-[#DC2626] to-[#FF4757] rounded-2xl p-4 text-white cursor-pointer"
    >
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10" />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-2 right-3 w-8 h-8 rounded-full bg-white/5"
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
              DEAL DU JOUR
            </span>
          </div>
          <div className="flex gap-1">
            {[
              String(h).padStart(2, "0"),
              String(m).padStart(2, "0"),
              String(s).padStart(2, "0"),
            ].map((t, i) => (
              <span
                key={i}
                className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11 }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm">
          <p style={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}>
            Huile de palme 20L à {formatPrice(14500)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="line-through opacity-60" style={{ fontSize: 11 }}>{formatPrice(22000)}</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-lg" style={{ fontSize: 10, fontWeight: 800 }}>-34%</span>
          </div>
        </div>
        <p className="text-white/70 mt-2 flex items-center gap-1" style={{ fontSize: 10 }}>
          <Clock className="w-3 h-3" /> Quantité limitée, Profitez-en vite !
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Section wrapper promo "Cadeaux à gagner" ─── */
export function GiftsToWinSection() {
  const navigate = useNavigate();
  const gifts = [
    {
      title: "iPhone 16 Pro",
      condition: "Commandez +500k FCFA",
      chance: "1/500",
      color: "#0066FF",
      gradientTo: "#3B82F6",
      icon: Star,
    },
    {
      title: "Bon 50 000 FCFA",
      condition: "Parrainez 3 amis",
      chance: "1/50",
      color: "#16A34A",
      gradientTo: "#22C55E",
      icon: Gift,
    },
    {
      title: "1 an livraison free",
      condition: "Niveau VIP OR",
      chance: "1/100",
      color: "#E8A817",
      gradientTo: "#FBBF24",
      icon: Crown,
    },
    {
      title: "Pack Beauté Premium",
      condition: "Achat 3 catégories",
      chance: "1/200",
      color: "#EC4899",
      gradientTo: "#F472B6",
      icon: Sparkles,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center">
            <PartyPopper className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: "#111" }}>
            CADEAUX À GAGNER
          </span>
        </div>
        <button
          onClick={() => navigate("/jeux")}
          className="text-[#EC4899] flex items-center gap-1"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Voir tout <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {gifts.map((g, i) => (
          <motion.div
            key={i}
            onClick={() => navigate("/jeux")}
            className="relative overflow-hidden rounded-2xl bg-white p-3 cursor-pointer"
            style={{ border: `1.5px solid ${g.color}15` }}
          >
            {/* Background accent */}
            <div
              className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-[0.07]"
              style={{ background: g.color }}
            />

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `linear-gradient(145deg, ${g.color}15, ${g.color}08)` }}
            >
              <g.icon className="w-5 h-5" style={{ color: g.color }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#111", fontFamily: "Poppins" }}>
              {g.title}
            </p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>
              {g.condition}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: `${g.color}10` }}>
              <span
                className="px-2 py-0.5 rounded-lg"
                style={{ fontSize: 9, fontWeight: 800, color: g.color, background: `${g.color}10` }}
              >
                Chance: {g.chance}
              </span>
              <ArrowRight className="w-3 h-3" style={{ color: `${g.color}60` }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Floating promo toast-like on page ─── */
export function FloatingPromoTag({
  text,
  color = "#E11D2E",
}: {
  text: string;
  color?: string;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      className="fixed right-3 z-40 flex items-center gap-2 pl-3 pr-2 py-2 rounded-2xl text-white cursor-pointer bottom-[calc(80px+env(safe-area-inset-bottom,0px))] lg:bottom-6"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}DD)` }}
      onClick={() => {
        copyToClipboard("EXTRA10");
        toast.success("Code EXTRA10 copié ! -10% supplémentaire");
      }}
    >
      <Percent className="w-3.5 h-3.5" />
      <Copy className="w-3 h-3 text-white/70" />
      <button
        onClick={(e) => { e.stopPropagation(); setVisible(false); }}
        className="ml-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
        style={{ fontSize: 9 }}
      >
        ×
      </button>
    </motion.div>
  );
}