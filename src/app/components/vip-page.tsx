import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Crown, Star, Gift, ShieldCheck, Truck, Zap, Trophy, ChevronRight, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { PaymentDialog } from "../payments/PaymentDialog";
import { Subscription } from "../payments/store";
import { useAdminSettings } from "../admin/settings-store";

type Plan = { id: string; label: string; period: string; price: number; perMonth: number; saving?: string; highlight?: boolean };

const PLANS: Plan[] = [
  { id: "monthly", label: "Mensuel", period: "/ mois", price: 1500, perMonth: 1500 },
  { id: "quarterly", label: "Trimestriel", period: "/ 3 mois", price: 4000, perMonth: 1334, saving: "Économisez 500 FCFA", highlight: true },
  { id: "yearly", label: "Annuel", period: "/ an", price: 15000, perMonth: 1250, saving: "Économisez 3 000 FCFA" },
];

export function VipPage() {
  const navigate = useNavigate();
  const settings = useAdminSettings();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const currentLevel = "BRONZE";
  const currentPoints = 0;
  const nextLevelPoints = 25000;
  const progress = (currentPoints / nextLevelPoints) * 100;

  const levels = [
    { name: "BRONZE", min: 0, color: "#B8733A", benefits: ["5% cashback", "Support standard", "Accès catalogue"] },
    { name: "ARGENT", min: 25000, color: "#A8A9AD", benefits: ["8% cashback", "Support prioritaire", "Jours de marché exclusifs", "Crédit facilité"] },
    { name: "OR", min: 75000, color: "#F0B429", benefits: ["12% cashback", "Support VIP dédié", "Accès anticipé Flash", "Crédit premium", "Livraison prioritaire", "Invitations événements"] },
  ];

  const currentLevelData = levels.find((l) => l.name === currentLevel)!;

  return (
    <div>
      <div className="bg-gradient-to-r from-[#F0B429] to-[#FF8C00] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
            <Crown className="w-6 h-6" /> PROGRAMME VIP
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>Statut, avantages et récompenses exclusives</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Current status */}
        <div className="bg-gradient-to-br from-[#F0B429] to-[#FF8C00] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <p className="text-white/70" style={{ fontSize: 12 }}>Votre statut</p>
              <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24 }}>{currentLevel}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <div className="flex justify-between mb-2">
              <span style={{ fontSize: 12 }}><AnimatedNumber value={currentPoints} format={(n) => formatPrice(n)} /> points</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Objectif OR : <AnimatedNumber value={nextLevelPoints} format={(n) => formatPrice(n)} /></span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-white/70 mt-2" style={{ fontSize: 11 }}>
              <AnimatedNumber value={nextLevelPoints - currentPoints} format={(n) => formatPrice(n)} /> points restants pour passer OR
            </p>
          </div>
        </div>

        {/* Subscription plans */}
        <section>
          <h2 className="mb-1 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>
            <Sparkles className="w-5 h-5 text-[#F0B429]" /> Abonnement VIP
          </h2>
          <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
            Débloquez tous les avantages dès aujourd'hui, sans attendre les points.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-4 bg-white ${p.highlight ? "border-[#F0B429] ring-2 ring-[#F0B429]/30" : "border-border"}`}
              >
                {p.highlight && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-[#F0B429] text-white" style={{ fontSize: 10, fontWeight: 800 }}>
                    POPULAIRE
                  </span>
                )}
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{p.label}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, color: "#E11D2E" }}>{formatPrice(p.price)}</span>
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>FCFA {p.period}</span>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  Soit {formatPrice(p.perMonth)} FCFA / mois
                </p>
                {p.saving && (
                  <p className="text-[#16A34A] mt-1" style={{ fontSize: 11, fontWeight: 700 }}>{p.saving}</p>
                )}
                <ul className="mt-3 space-y-1.5">
                  {["Cashback OR (12 %)", "Support VIP dédié", "Livraison prioritaire", "Accès anticipé Flash"].map((b) => (
                    <li key={b} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> {b}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={settings.maintenance}
                  onClick={() => settings.maintenance ? toast.error("Abonnements suspendus pour maintenance") : setSelectedPlan(p)}
                  className={`w-full mt-4 py-2.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed ${p.highlight ? "bg-[#F0B429] text-white" : "bg-[#1A1A2E] text-white"}`}
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  {settings.maintenance ? "Maintenance" : "S'abonner"}
                </button>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3" style={{ fontSize: 11 }}>
            Renouvellement automatique. Annulable à tout moment depuis Paramètres.
          </p>
        </section>

        {/* Levels */}
        <section>
          <h2 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Niveaux VIP</h2>
          <div className="space-y-3">
            {levels.map((level) => (
              <div key={level.name} className={`rounded-2xl border p-4 ${level.name === currentLevel ? "border-[#F0B429] bg-[#FFFBEB]" : "border-border bg-white"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" style={{ color: level.color }} />
                    <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: level.color }}>{level.name}</span>
                    {level.name === currentLevel && (
                      <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: 9, fontWeight: 700, background: level.color }}>
                        ACTUEL
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>Dès {formatPrice(level.min)} pts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {level.benefits.map((b, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white border border-border flex items-center gap-1" style={{ fontSize: 11 }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: level.color }} /> {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to earn points */}
        <section>
          <h2 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Comment gagner des points</h2>
          <div className="space-y-2">
            {[
              { icon: Zap, label: "Chaque commande", desc: "1 point / 100 FCFA dépensés", color: "#E11D2E" },
              { icon: Star, label: "Avis et notes", desc: "50 points par avis laissé", color: "#F0B429" },
              { icon: Gift, label: "Parrainage", desc: "500 points par filleul actif", color: "#F0278E" },
              { icon: ShieldCheck, label: "Vérification KYC/KYB", desc: "1 000 points bonus", color: "#00B341" },
              { icon: Trophy, label: "Concours mensuel", desc: "Jusqu'à 10 000 points", color: "#FF6B00" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Concours */}
        <section className="bg-gradient-to-br from-[#FF6A00] to-[#FF4400] rounded-2xl p-5 text-white">
          <h2 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>
            <Trophy className="w-5 h-5" /> Concours du mois
          </h2>
          <p className="text-white/80 mb-4" style={{ fontSize: 13 }}>
            Top acheteur Mars 2026 : le meilleur volume gagne un bon de 100 000 FCFA + accès VIP Or !
          </p>
          <div className="space-y-2">
            {[
              { rank: 1, name: "Koffi M.", amount: "1 250 000 FCFA" },
              { rank: 2, name: "Aminata D.", amount: "980 000 FCFA" },
              { rank: 3, name: "Ibrahim K.", amount: "750 000 FCFA" },
            ].map((p) => (
              <div key={p.rank} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center" style={{ fontSize: 11, fontWeight: 800 }}>{p.rank}</span>
                <span className="flex-1" style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{p.amount}</span>
              </div>
            ))}
          </div>
        </section>

        <button onClick={() => navigate("/explorer")} className="w-full py-3 bg-[#F0B429] text-white rounded-xl" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          <Zap className="inline w-4 h-4 mr-1" /> Acheter pour gagner des points
        </button>
      </div>

      {selectedPlan && (
        <PaymentDialog
          open={true}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setSelectedPlan(null);
            navigate("/profil");
          }}
          subscription={{
            planId: selectedPlan.id as Subscription["planId"],
            label: selectedPlan.label,
            price: selectedPlan.price,
          }}
          payInputBase={{
            items: [{
              id: `vip-${selectedPlan.id}`,
              name: `Abonnement VIP ${selectedPlan.label}`,
              price: selectedPlan.price,
              quantity: 1,
              seller: "IPPOO Market",
            }],
            subtotal: selectedPlan.price,
            shipping: 0,
            discount: 0,
            total: selectedPlan.price,
            address: { name: "Abonnement VIP", phone: "", city: "", line: "Service numérique" },
            shippingMode: "std",
          }}
        />
      )}
    </div>
  );
}