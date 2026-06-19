import { useMemo, useState } from "react";
import { ensureAccountId } from "../auth/account-id";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Users, Gift, Share2, Copy, QrCode, TrendingUp,
  CheckCircle2, Clock, Wallet, ChevronRight, Star, Shield,
  Award, Zap, BarChart3, DollarSign, AlertTriangle, Link2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const P = "#7C3AED";
const PL = "#F5F3FF";
const A1 = "#16A34A";
const A2 = "#E8A817";
const RED = "#E11D2E";
const BLUE = "#3B82F6";

const IMG = {
  hero: "https://images.unsplash.com/photo-1697125045982-0d703bc35e96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWZlcnJhbCUyMHJld2FyZCUyMHByb2dyYW0lMjBkaWdpdGFsfGVufDF8fHx8MTc3MzMzMDQyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
};

type Tab = "overview" | "liens" | "gains" | "regles";

// Nouveau compte : aucun filleul, aucun gain. Les compteurs et listes se
// remplissent dès qu'une inscription via le lien de parrainage est validée.
const baseStats = {
  totalFilleuls: 0,
  filleulsActifs: 0,
  gainsCumules: 0,
  gainsEnAttente: 0,
  gainsPayes: 0,
  tauxConversion: 0,
};

type Filleul = { name: string; date: string; status: string; ca: number; commission: number; color: string };
const filleuls: Filleul[] = [];

const commissionRules = [
  { title: "% du CA filleul", desc: "5% du chiffre d'affaires généré par chaque client parrainé", icon: DollarSign, color: A1 },
  { title: "Bonus par abonnement", desc: "2 500 FCFA par nouvel abonnement premium parrainé", icon: Star, color: A2 },
  { title: "Palier volume", desc: "+2% bonus au-delà de 10 filleuls actifs dans le mois", icon: TrendingUp, color: P },
  { title: "Durée de commission", desc: "Commissions versées pendant 6 mois après acquisition", icon: Clock, color: BLUE },
  { title: "Commission sur marge", desc: "Option disponible : calcul sur la marge plutôt que le CA", icon: BarChart3, color: "#F97316" },
  { title: "Multi-profils", desc: "Parrainez clients, fournisseurs, abonnés ou autres chargés", icon: Users, color: "#EC4899" },
];

type Gain = { period: string; amount: number; status: string; color: string };
const gainHistory: Gain[] = [];

export function ParrainagePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const myStats = useMemo(() => {
    const id = ensureAccountId().id;
    const suffix = id.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase() || "NEW";
    const origin = typeof window !== "undefined" ? window.location.origin.replace(/^https?:\/\//, "") : "ippoo.market";
    return { ...baseStats, code: `IPPOO-${suffix}`, lien: `${origin}/inscription?ref=${suffix}` };
  }, []);

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { key: "liens", label: "Mes liens", icon: Link2 },
    { key: "gains", label: "Mes gains", icon: Wallet },
    { key: "regles", label: "Règles", icon: Shield },
  ];

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <Gift className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Parrainage & Commissions</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        <ImageWithFallback src={IMG.hero} alt="Parrainage" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.88), rgba(236,72,153,0.7))" }} />
        <div className="absolute inset-0 flex items-center p-4">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#FFF", lineHeight: 1.15 }}>Parrainez, gagnez<br/>automatiquement</p>
            <p className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Chaque client amené vous rapporte, traçabilité totale</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#6B7280" }}>
              <TI className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-3.5">

        {/* ═══════ OVERVIEW ═══════ */}
        {activeTab === "overview" && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
                <Users className="w-5 h-5 mb-1.5" style={{ color: P }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: P }}><AnimatedNumber value={myStats.totalFilleuls} /></p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>Filleuls</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}><AnimatedNumber value={myStats.filleulsActifs} /> actifs</p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
                <TrendingUp className="w-5 h-5 mb-1.5" style={{ color: A1 }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: A1 }}><AnimatedNumber value={myStats.gainsCumules} format={(n) => formatPrice(n)} /></p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>Gains cumulés</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}><AnimatedNumber value={myStats.tauxConversion} suffix="%" /> conv.</p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
                <Clock className="w-5 h-5 mb-1.5" style={{ color: "#F97316" }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#F97316" }}><AnimatedNumber value={myStats.gainsEnAttente} format={(n) => formatPrice(n)} /></p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>En attente</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Validation en cours</p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
                <CheckCircle2 className="w-5 h-5 mb-1.5" style={{ color: A2 }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: A2 }}><AnimatedNumber value={myStats.gainsPayes} format={(n) => formatPrice(n)} /></p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>Déjà payés</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>IPPOO CASH</p>
              </div>
            </div>

            {/* Share box */}
            <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${P}, #EC4899)` }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#FFF" }}>Partagez & gagnez</p>
              <div className="rounded-lg p-3 mb-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Votre code</p>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#FFF", letterSpacing: 1.5 }}>{myStats.code}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(myStats.code); toast.success("Code copié !"); }} className="flex-1 py-2 rounded-lg bg-white/20 flex items-center justify-center gap-1 text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                  <Copy className="w-3.5 h-3.5" /> Copier
                </button>
                <button onClick={() => toast.success("Lien partagé !")} className="flex-1 py-2 rounded-lg bg-white/20 flex items-center justify-center gap-1 text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                  <Share2 className="w-3.5 h-3.5" /> Partager
                </button>
                <button onClick={() => toast.info("QR Code généré")} className="py-2 px-3 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filleuls list */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#FFF" }}>
              <p className="px-3.5 pt-3 pb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Mes filleuls récents</p>
              {filleuls.length === 0 && (
                <p className="px-3.5 pb-4" style={{ fontSize: 12, color: "#9CA3AF" }}>Aucun filleul pour le moment. Partagez votre lien pour démarrer.</p>
              )}
              {filleuls.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${f.color}12`, border: `2px solid ${f.color}` }}>
                    <Users className="w-4 h-4" style={{ color: f.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>{f.date}</p>
                  </div>
                  <div className="text-right">
                    {f.commission > 0 && <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: A1 }}>+{formatPrice(f.commission)}</p>}
                    <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: f.color }}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════ LIENS ═══════ */}
        {activeTab === "liens" && (
          <>
            <div className="rounded-xl p-3.5" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                Chaque <span style={{ fontWeight: 700 }}>lien ou code</span> est unique et rattache automatiquement le nouveau client à votre compte. Utilisable sur le web, terrain, WhatsApp ou événements.
              </p>
            </div>

            {/* Web link */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Lien web</p>
              <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#F3F4F6" }}>
                <Link2 className="w-4 h-4 shrink-0" style={{ color: P }} />
                <span className="flex-1 truncate" style={{ fontSize: 13, color: "#374151" }}>{myStats.lien}</span>
                <button onClick={() => { navigator.clipboard?.writeText(myStats.lien); toast.success("Lien copié !"); }} className="px-2.5 py-1 rounded-md" style={{ background: P, fontSize: 11, fontWeight: 700, color: "#FFF" }}>
                  Copier
                </button>
              </div>
            </div>

            {/* Code terrain */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Code terrain</p>
              <div className="flex items-center justify-center p-4 rounded-lg" style={{ background: `${P}08` }}>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 28, color: P, letterSpacing: 3 }}>{myStats.code}</p>
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 12, color: "#6B7280" }}>Le client entre ce code à l'inscription ou à la 1ère commande</p>
            </div>

            {/* QR */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>QR Code</p>
              <div className="flex items-center justify-center p-6 rounded-lg" style={{ background: "#F3F4F6" }}>
                <div className="w-32 h-32 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center">
                  <QrCode className="w-16 h-16" style={{ color: P }} />
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => toast.success("QR téléchargé")} className="flex-1 py-2 rounded-lg" style={{ background: P, fontSize: 12, fontWeight: 700, color: "#FFF" }}>Télécharger</button>
                <button onClick={() => toast.success("QR partagé")} className="flex-1 py-2 rounded-lg border" style={{ borderColor: P, fontSize: 12, fontWeight: 700, color: P }}>Partager</button>
              </div>
            </div>

            {/* Channels */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Canaux d'acquisition</p>
              {["Web (lien)", "Terrain (code)", "WhatsApp", "Événement", "Appel téléphonique"].map((c, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <CheckCircle2 className="w-4 h-4" style={{ color: A1 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{c}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════ GAINS ═══════ */}
        {activeTab === "gains" && (
          <>
            {/* Solde */}
            <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${A1}, #059669)` }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Solde disponible</p>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 28, color: "#FFF" }}><AnimatedNumber value={myStats.gainsPayes} format={(n) => formatPrice(n)} /></p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toast.success("Transfert vers IPPOO CASH")} className="flex-1 py-2 rounded-lg bg-white/20 text-white flex items-center justify-center gap-1" style={{ fontSize: 12, fontWeight: 700 }}>
                  <Wallet className="w-3.5 h-3.5" /> Vers IPPOO CASH
                </button>
                <button onClick={() => toast.info("Retrait, à venir")} className="flex-1 py-2 rounded-lg bg-white/20 text-white flex items-center justify-center gap-1" style={{ fontSize: 12, fontWeight: 700 }}>
                  <DollarSign className="w-3.5 h-3.5" /> Retirer
                </button>
              </div>
            </div>

            {/* History */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#FFF" }}>
              <p className="px-3.5 pt-3 pb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Historique des gains</p>
              {gainHistory.length === 0 && (
                <p className="px-3.5 pb-4" style={{ fontSize: 12, color: "#9CA3AF" }}>Aucun gain à afficher. Vos premières commissions apparaîtront ici.</p>
              )}
              {gainHistory.map((g, i) => (
                <div key={i} className={`flex items-center justify-between px-3.5 py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{g.period}</p>
                    <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: g.color }}>{g.status}</span>
                  </div>
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: g.status === "payé" ? A1 : "#F97316" }}>+{formatPrice(g.amount)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════ RULES ═══════ */}
        {activeTab === "regles" && (
          <>
            <div className="space-y-2.5">
              {commissionRules.map((r, i) => {
                const RI = r.icon;
                return (
                  <div key={i} className="rounded-xl p-3.5 flex gap-3" style={{ background: "#FFF", borderLeft: `4px solid ${r.color}` }}>
                    <RI className="w-5 h-5 shrink-0 mt-0.5" style={{ color: r.color }} />
                    <div>
                      <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{r.title}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Validation */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Validation des commissions</p>
              <div className="space-y-2">
                {[
                  { text: "Paiement confirmé par le client", icon: CheckCircle2, color: A1 },
                  { text: "Livraison effectuée avec succès", icon: CheckCircle2, color: A1 },
                  { text: "Délai de rétractation écoulé (7j)", icon: Clock, color: "#F97316" },
                  { text: "Commission créditée automatiquement", icon: Wallet, color: P },
                ].map((v, i) => {
                  const VI = v.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <VI className="w-4 h-4" style={{ color: v.color }} />
                      <span style={{ fontSize: 12, color: "#374151" }}>{v.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anti-fraude */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF", borderLeft: `4px solid ${RED}` }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: RED }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>Anti-fraude</p>
              </div>
              <div className="space-y-1.5">
                {["Détection auto-parrainage", "Blocage doublons & comptes suspects", "Vérification IP & appareil", "Audit trail non modifiable"].map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" style={{ color: RED }} />
                    <span style={{ fontSize: 12, color: "#374151" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
