import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Gift,
  Star,
  Ticket,
  Clock,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Coins,
  Truck,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { FortuneWheelFull } from "./fortune-wheel";

export function JeuxPage() {
  const navigate = useNavigate();
  const [scratchRevealed, setScratchRevealed] = useState<number[]>([]);

  const scratchCards = [
    { id: 1, prize: "1 000 FCFA", color: "#E11D2E", icon: Coins },
    { id: 2, prize: "Livraison offerte", color: "#16A34A", icon: Truck },
    { id: 3, prize: "500 Points", color: "#E8A817", icon: Star },
    { id: 4, prize: "2 000 FCFA", color: "#F97316", icon: Coins },
    { id: 5, prize: "Réessayez", color: "#6B7280", icon: RotateCcw },
    { id: 6, prize: "5 000 FCFA", color: "#EC4899", icon: Coins },
  ];

  return (
    <div className="font-[Inter,sans-serif]">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#1A1025] via-[#2D1B4E] to-[#4C1D95] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#F97316] flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-white flex items-center gap-2"
                style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}
              >
                JEUX & CADEAUX
              </h1>
              <p className="text-white/60" style={{ fontSize: 12 }}>
                Roue de la fortune, grattage, cartes cadeaux
              </p>
            </div>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-3 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {[
              { label: "Gains ce mois", value: "7 500 FCFA", color: "#16A34A", icon: Coins },
              { label: "Prochain tirage", value: "2h 15m", color: "#EC4899", icon: Clock },
              { label: "Cartes restantes", value: `${6 - scratchRevealed.length}`, color: "#F97316", icon: Ticket },
            ].map((stat, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <div>
                  <p className="text-white/50" style={{ fontSize: 9 }}>{stat.label}</p>
                  <p className="text-white" style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* ─── ROUE DE LA FORTUNE ─── */}
        <FortuneWheelFull id="jeux" size={310} showLegend showStats />

        {/* ─── CARTES À GRATTER ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#F97316] flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Cartes à gratter</h2>
            </div>
            <span
              className="px-2.5 py-1 rounded-full bg-[#F97316]/10"
              style={{ fontSize: 10, fontWeight: 700, color: "#F97316" }}
            >
              {6 - scratchRevealed.length} restantes
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {scratchCards.map((card) => {
              const revealed = scratchRevealed.includes(card.id);
              const CardIcon = card.icon;
              return (
                <motion.button
                  key={card.id}
                  onClick={() => {
                    if (!revealed) {
                      setScratchRevealed((p) => [...p, card.id]);
                      if (card.prize !== "Réessayez") toast.success(`Gagné : ${card.prize} !`);
                      else toast.info("Pas de chance !");
                    }
                  }}
                  className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden relative"
                  style={{
                    background: revealed
                      ? `linear-gradient(145deg, ${card.color}10, ${card.color}05)`
                      : `linear-gradient(145deg, ${card.color}, ${card.color}CC)`,
                    border: revealed ? `1.5px solid ${card.color}20` : "1.5px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {revealed ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-center p-2"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5"
                        style={{ background: `${card.color}15` }}
                      >
                        <CardIcon className="w-5 h-5" style={{ color: card.color }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: card.color, fontFamily: "Poppins" }}>
                        {card.prize}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center text-white relative">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 4px)",
                        }}
                      />
                      <div className="relative">
                        <Gift className="w-7 h-7 mx-auto mb-1.5" />
                        <p style={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}>Gratter</p>
                        <p className="text-white/50 mt-0.5" style={{ fontSize: 8 }}>Appuyez pour révéler</p>
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ─── CARTES CADEAUX ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#9333EA] flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Cartes cadeaux</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 5000, color: "#E11D2E", gradientTo: "#FF4757" },
              { value: 10000, color: "#F97316", gradientTo: "#FBBF24" },
              { value: 25000, color: "#E8A817", gradientTo: "#F0B429" },
              { value: 50000, color: "#16A34A", gradientTo: "#22C55E" },
            ].map((card) => (
              <motion.button
                key={card.value}
                onClick={() =>
                  toast.success(`Carte cadeau ${formatPrice(card.value)} ajoutée au panier !`)
                }
                className="relative overflow-hidden rounded-2xl p-5 text-white text-center"
                style={{ background: `linear-gradient(145deg, ${card.color}, ${card.gradientTo})` }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-2.5">
                    <Gift className="w-6 h-6" />
                  </div>
                  <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20 }}>
                    <AnimatedNumber value={card.value} format={(n) => formatPrice(n)} />
                  </p>
                  <p className="text-white/70 mt-1" style={{ fontSize: 11 }}>
                    Carte cadeau IPPOO
                  </p>
                  <div className="mt-2.5 flex items-center justify-center gap-1 bg-white/15 rounded-xl px-3 py-1.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Acheter</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ─── HISTORIQUE GAINS ─── */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8A817] to-[#FBBF24] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Mes gains récents</h2>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Roue - Cashback", value: "5 000 FCFA", date: "05 Mars 2026", color: "#16A34A", icon: Coins },
              { label: "Grattage - Points fidélité", value: "500 Points", date: "03 Mars 2026", color: "#E8A817", icon: Star },
              { label: "Concours Top Acheteur", value: "Bon 10 000 FCFA", date: "01 Mars 2026", color: "#E11D2E", icon: Trophy },
              { label: "Roue - Livraison offerte", value: "Livraison gratuite", date: "28 Fév 2026", color: "#3B82F6", icon: Truck },
            ].map((gain, i) => {
              const GainIcon = gain.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(145deg, ${gain.color}15, ${gain.color}08)` }}
                  >
                    <GainIcon className="w-5 h-5" style={{ color: gain.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}>
                      {gain.label}
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{gain.date}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-xl shrink-0"
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 800,
                      fontSize: 12,
                      color: gain.color,
                      background: `${gain.color}10`,
                    }}
                  >
                    {gain.value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
