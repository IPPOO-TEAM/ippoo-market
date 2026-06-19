import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Eye,
  ShoppingCart,
  TrendingUp,
  Star,
  Users,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Flame,
  Tag,
  MessageSquare,
  Crown,
  Zap,
  CalendarDays,
  MapPin,
  Package,
  BadgeCheck,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";

/* ═══════════════════════════════════════════
   MOCK STATS DATA
   ═══════════════════════════════════════════ */

const dailySalesData = [
  { jour: "Lun", ventes: 342, montant: 4250000 },
  { jour: "Mar", ventes: 285, montant: 3680000 },
  { jour: "Mer", ventes: 410, montant: 5120000 },
  { jour: "Jeu", ventes: 378, montant: 4780000 },
  { jour: "Ven", ventes: 520, montant: 6350000 },
  { jour: "Sam", ventes: 680, montant: 8900000 },
  { jour: "Dim", ventes: 425, montant: 5400000 },
];

const hourlySalesData = [
  { heure: "6h", ventes: 12 },
  { heure: "8h", ventes: 45 },
  { heure: "10h", ventes: 89 },
  { heure: "12h", ventes: 120 },
  { heure: "14h", ventes: 95 },
  { heure: "16h", ventes: 110 },
  { heure: "18h", ventes: 78 },
  { heure: "20h", ventes: 42 },
  { heure: "22h", ventes: 15 },
];

const topTrending = [
  { id: 1, name: "Riz Parfumé 25kg", category: "Alimentaire", sales: 2450, trend: +18, color: "#FF6B00" },
  { id: 4, name: "Tissu Wax Hollandais", category: "Textile", sales: 1820, trend: +25, color: "#F0B429" },
  { id: 25, name: "Beurre de Karité 10kg", category: "Beauté", sales: 1340, trend: +32, color: "#EC4899" },
  { id: 6, name: "Câble USB-C x50", category: "Électronique", sales: 980, trend: +12, color: "#3B82F6" },
  { id: 39, name: "Ciment CPA 50kg", category: "Matériaux", sales: 870, trend: +8, color: "#78716C" },
];

const recentReviews = [
  { id: 1, user: "Aïcha B.", rating: 5, text: "Livraison rapide, produit conforme au gros !", date: "Il y a 2h", product: "Riz Parfumé 25kg" },
  { id: 2, user: "Kodjo M.", rating: 4, text: "Bon rapport qualité-prix, vendeur sérieux.", date: "Il y a 5h", product: "Tissu Wax 12 yards" },
  { id: 3, user: "Félicité A.", rating: 5, text: "Commande en gros impeccable. IPPOO CASH très pratique.", date: "Il y a 8h", product: "Savon carton 48pcs" },
  { id: 4, user: "Ibrahim D.", rating: 4, text: "Emballage soigné, merci au vendeur !", date: "Il y a 12h", product: "Huile de coco 500ml x24" },
];

const activePromos = [
  { id: 1, title: "FLASH -25% Alimentaire", type: "flash", remaining: "2h 15m", participants: 1240, color: "#E11D2E" },
  { id: 2, title: "Jour Tokpa, Textile", type: "marché", remaining: "Demain", participants: 890, color: "#F97316" },
  { id: 3, title: "Bonus Doré VIP x2", type: "vip", remaining: "3 jours", participants: 345, color: "#E8A817" },
  { id: 4, title: "Code BIENVENUE -15%", type: "code", remaining: "Permanent", participants: 5670, color: "#16A34A" },
];

const marketSchedule = [
  { name: "Marché Tokpa", city: "Cotonou", hours: "06h–18h", days: "Lun–Sam", status: "open", color: "#E11D2E" },
  { name: "Marché Dantokpa", city: "Cotonou", hours: "05h–19h", days: "Tous les jours", status: "open", color: "#FF6B00" },
  { name: "Marché Missèbo", city: "Cotonou", hours: "07h–17h", days: "Lun–Sam", status: "open", color: "#F0B429" },
  { name: "Marché Arzèkè", city: "Parakou", hours: "06h–16h", days: "Tous les jours", status: "open", color: "#16A34A" },
  { name: "Marché Ouando", city: "Porto-Novo", hours: "06h–17h", days: "Dim–Ven", status: "closed", color: "#3B82F6" },
  { name: "Marché Guéma", city: "Parakou", hours: "06h–15h", days: "Mar, Jeu, Sam", status: "open", color: "#9333EA" },
];

/* ═══════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toLocaleString("fr-FR")}</>;
}

/* ═══════════════════════════════════════════
   STAT CARD (KPI)
   ═══════════════════════════════════════════ */
function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  trend,
  trendLabel,
  color,
  bgGradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  color: string;
  bgGradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border p-4"
      style={{ background: bgGradient || "#fff" }}
    >
      {/* Decorative accent circle */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10"
        style={{ background: color }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend !== undefined && (
            <div
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg"
              style={{
                background: trend >= 0 ? "#16A34A15" : "#EF444415",
                color: trend >= 0 ? "#16A34A" : "#EF4444",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              <ArrowUpRight
                className="w-3 h-3"
                style={{ transform: trend < 0 ? "rotate(90deg)" : "none" }}
              />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p
          style={{
            fontFamily: "Poppins",
            fontWeight: 900,
            fontSize: 22,
            color: color,
            lineHeight: 1.1,
          }}
        >
          <AnimatedNumber value={value} />
          {suffix && <span style={{ fontSize: 13, fontWeight: 700 }}> {suffix}</span>}
        </p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 11, fontWeight: 500 }}>
          {label}
        </p>
        {trendLabel && (
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 9 }}>
            {trendLabel}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN STATS DASHBOARD
   ═══════════════════════════════════════════ */
export function StatsDashboard() {
  const navigate = useNavigate();
  const currentHour = new Date().getHours();

  return (
    <div className="space-y-5">
      {/* ─── Section Header ─── */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 17 }}>
            Tableau de bord IPPOO
          </h2>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            Statistiques en temps réel de la marketplace
          </p>
        </div>
      </div>

      {/* ─── KPI CARDS ROW ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <StatCard
          icon={Eye}
          label="Visites aujourd'hui"
          value={24870}
          trend={12}
          trendLabel="vs hier"
          color="#3B82F6"
        />
        <StatCard
          icon={ShoppingCart}
          label="Achats ce jour"
          value={1842}
          trend={8}
          trendLabel="+148 vs hier"
          color="#16A34A"
        />
        <StatCard
          icon={Package}
          label="Ventes du jour"
          value={3240}
          trend={15}
          trendLabel="38 480 000 FCFA"
          color="#FF6B00"
        />
        <StatCard
          icon={MessageSquare}
          label="Avis déposés"
          value={15620}
          suffix="avis"
          trend={5}
          trendLabel="4.7★ moyenne"
          color="#E8A817"
        />
        <StatCard
          icon={Users}
          label="Abonnés IPPOO"
          value={128450}
          trend={22}
          trendLabel="+2 340 cette semaine"
          color="#EC4899"
        />
      </div>

      {/* ─── CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Daily Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#16A34A]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Ventes quotidiennes
                </h3>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                  Derniers 7 jours
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: "#16A34A" }}>
                3 040
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 9 }}>ventes moy./jour</p>
            </div>
          </div>
          <div style={{ height: 160 }}>
            {/* Pure CSS Bar Chart, Daily Sales */}
            <div className="relative h-full flex flex-col">
              <div className="flex-1 flex gap-1.5 px-1">
                {dailySalesData.map((d) => {
                  const maxVal = Math.max(...dailySalesData.map((x) => x.ventes));
                  const pct = (d.ventes / maxVal) * 100;
                  const isBest = d.ventes === maxVal;
                  return (
                    <div key={d.jour} className="flex-1 flex flex-col items-center" style={{ height: "100%" }}>
                      {/* Value label */}
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: isBest ? 800 : 600,
                          fontFamily: "Poppins",
                          color: isBest ? "#16A34A" : "#9CA3AF",
                          marginBottom: 4,
                          flexShrink: 0,
                        }}
                      >
                        {d.ventes}
                      </span>
                      {/* Bar area */}
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: `${pct}%`,
                            minHeight: 6,
                            background: isBest
                              ? "linear-gradient(to top, #16A34A, #22C55E)"
                              : "linear-gradient(to top, #16A34A40, #16A34A80)",
                            border: isBest ? "none" : "1px solid #16A34A50",
                            borderBottom: "none",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 px-1 mt-1.5 border-t border-[#f0f0f0] pt-1.5">
                {dailySalesData.map((d) => {
                  const maxVal = Math.max(...dailySalesData.map((x) => x.ventes));
                  const isBest = d.ventes === maxVal;
                  return (
                    <div
                      key={d.jour}
                      className="flex-1 text-center"
                      style={{ fontSize: 10, fontWeight: isBest ? 700 : 400, color: isBest ? "#16A34A" : "#9CA3AF" }}
                    >
                      {d.jour}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hourly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Activité par heure
                </h3>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                  Aujourd'hui, pic à 12h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3B82F6]/10">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6" }}>En direct</span>
            </div>
          </div>
          <div style={{ height: 160 }}>
            {/* Pure CSS Bar Chart, Hourly Activity */}
            <div className="relative h-full flex flex-col">
              <div className="flex-1 flex gap-1 px-1">
                {hourlySalesData.map((d) => {
                  const maxVal = Math.max(...hourlySalesData.map((x) => x.ventes));
                  const pct = (d.ventes / maxVal) * 100;
                  const isPeak = d.ventes === maxVal;
                  return (
                    <div key={d.heure} className="flex-1 flex flex-col items-center" style={{ height: "100%" }}>
                      {/* Value label */}
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: isPeak ? 800 : 600,
                          fontFamily: "Poppins",
                          color: isPeak ? "#3B82F6" : "#9CA3AF",
                          marginBottom: 4,
                          flexShrink: 0,
                        }}
                      >
                        {d.ventes}
                      </span>
                      {/* Bar area */}
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: `${pct}%`,
                            minHeight: 6,
                            background: isPeak
                              ? "linear-gradient(to top, #3B82F6, #60A5FA)"
                              : "#3B82F6",
                            opacity: isPeak ? 1 : 0.4 + (pct / 100) * 0.45,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 px-1 mt-1.5 border-t border-[#f0f0f0] pt-1.5">
                {hourlySalesData.map((d) => {
                  const maxVal = Math.max(...hourlySalesData.map((x) => x.ventes));
                  const isPeak = d.ventes === maxVal;
                  return (
                    <div
                      key={d.heure}
                      className="flex-1 text-center"
                      style={{ fontSize: 10, fontWeight: isPeak ? 700 : 400, color: isPeak ? "#3B82F6" : "#9CA3AF" }}
                    >
                      {d.heure}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── TOP TENDANCES + AVIS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Tendances */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E11D2E]/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#E11D2E]" />
              </div>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                Top Tendances
              </h3>
            </div>
            <button
              onClick={() => navigate("/explorer")}
              className="text-[#E11D2E] flex items-center gap-0.5"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {topTrending.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/produit/${item.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF7ED] cursor-pointer transition-colors"
              >
                {/* Rank */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg, #E8A817, #FBBF24)"
                        : i === 1
                        ? "linear-gradient(135deg, #9CA3AF, #D1D5DB)"
                        : i === 2
                        ? "linear-gradient(135deg, #CD7F32, #D4A574)"
                        : `${item.color}15`,
                    color: i < 3 ? "#fff" : item.color,
                  }}
                >
                  <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 11 }}>
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}>
                    {item.name}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {item.category} · {item.sales.toLocaleString("fr-FR")} ventes
                  </p>
                </div>

                <div
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg shrink-0"
                  style={{
                    background: "#16A34A15",
                    color: "#16A34A",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  <TrendingUp className="w-3 h-3" />+{item.trend}%
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Avis récents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8A817]/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#E8A817]" />
              </div>
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Avis récents
                </h3>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                  4.7★ moyenne · 15 620 avis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5"
                  style={{
                    color: s <= 4 ? "#E8A817" : "#E5E7EB",
                    fill: s <= 4 ? "#E8A817" : "none",
                  }}
                />
              ))}
              <span className="ml-1 text-muted-foreground" style={{ fontSize: 10 }}>4.7</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {recentReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="p-3 rounded-xl bg-[#FFF7ED]/50 border border-[#FFF7ED]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
                      <span className="text-white" style={{ fontSize: 9, fontWeight: 800 }}>
                        {review.user.charAt(0)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}>
                      {review.user}
                    </span>
                    <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} className="w-2.5 h-2.5 fill-[#E8A817] text-[#E8A817]" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-2" style={{ fontSize: 11 }}>
                  "{review.text}"
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span style={{ fontSize: 9, color: "#9CA3AF" }}>{review.product}</span>
                  <span style={{ fontSize: 9, color: "#9CA3AF" }}>{review.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── PROMOS ACTIVES + HEURES DE MARCHÉ ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Promos actives */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EC4899]/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-[#EC4899]" />
              </div>
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Promos actives
                </h3>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                  {activePromos.length} promotions en cours
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/promos")}
              className="text-[#EC4899] flex items-center gap-0.5"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              Toutes <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {activePromos.map((promo, i) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                onClick={() => navigate("/promos")}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF7ED] cursor-pointer transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${promo.color}15` }}
                >
                  {promo.type === "flash" && <Zap className="w-4 h-4" style={{ color: promo.color }} />}
                  {promo.type === "marché" && <CalendarDays className="w-4 h-4" style={{ color: promo.color }} />}
                  {promo.type === "vip" && <Crown className="w-4 h-4" style={{ color: promo.color }} />}
                  {promo.type === "code" && <Tag className="w-4 h-4" style={{ color: promo.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}>
                    {promo.title}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {promo.participants.toLocaleString("fr-FR")} participants
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{
                      background: `${promo.color}12`,
                      fontSize: 10,
                      fontWeight: 700,
                      color: promo.color,
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    {promo.remaining}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="mt-3 flex items-center justify-around py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7]">
            {[
              { label: "Flash", value: 3, color: "#E11D2E" },
              { label: "Codes", value: 8, color: "#16A34A" },
              { label: "Marchés", value: 4, color: "#F97316" },
              { label: "VIP", value: 2, color: "#E8A817" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15, color: s.color }}>
                  {s.value}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 9 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Heures de marchés */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-[#F97316]" />
              </div>
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Heures de marchés
                </h3>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                  {currentHour >= 6 && currentHour < 18 ? "Marchés ouverts" : "Marchés fermés"} · {new Date().toLocaleDateString("fr-FR", { weekday: "long" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/marche")}
              className="text-[#F97316] flex items-center gap-0.5"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              Calendrier <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {marketSchedule.map((market, i) => (
              <motion.div
                key={market.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.04 }}
                onClick={() => navigate("/marche")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#FFF7ED] cursor-pointer transition-colors"
              >
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ background: market.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}>
                    {market.name}
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 10 }}>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {market.city}
                    </span>
                    <span>{market.days}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}>
                    {market.hours}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: market.status === "open" ? "#16A34A15" : "#EF444415",
                      color: market.status === "open" ? "#16A34A" : "#EF4444",
                    }}
                  >
                    {market.status === "open" ? "Ouvert" : "Fermé"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── BOTTOM STATS BANNER ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A1025, #2D1B4E, #4C1D95)" }}
      >
        <div className="p-4 sm:p-5">
          <div className="text-center mb-3">
            <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15 }}>
              IPPOO MARKET EN CHIFFRES
            </h3>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Mise à jour en temps réel</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "Produits", value: "48 000+", icon: Package, color: "#FF6B00" },
              { label: "Vendeurs", value: "2 400+", icon: BadgeCheck, color: "#16A34A" },
              { label: "Acheteurs", value: "128K+", icon: Users, color: "#3B82F6" },
              { label: "Avis", value: "15.6K", icon: Star, color: "#E8A817" },
              { label: "Favoris", value: "92K+", icon: Heart, color: "#EC4899" },
              { label: "Villes", value: "12", icon: MapPin, color: "#9333EA" },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2">
                <stat.icon
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: stat.color }}
                />
                <p
                  className="text-white"
                  style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 14 }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}