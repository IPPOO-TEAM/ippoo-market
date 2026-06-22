import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Users, UserCheck, BarChart3, TrendingUp, ChevronRight, ChevronDown,
  Phone, Mail, MapPin, Calendar, Clock, Star, Target, Award,
  FileText, Download, Eye, Shield, Bell, Search, Filter,
  CheckCircle2, AlertCircle, XCircle, Activity, Briefcase, Hash,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AnimatedNumber } from "./animated-number";

const NAVY = "#0F172A";
const A1 = "#3B82F6";
const A2 = "#16A34A";
const RED = "#E11D2E";
const GOLD = "#E8A817";
const ORANGE = "#F97316";
const PURPLE = "#7C3AED";
const PINK = "#EC4899";
const TEAL = "#0D9488";

const IMG_HERO = "https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYnVzaW5lc3MlMjB0ZWFtJTIwc2FsZXMlMjBtZWV0aW5nJTIwQ1JNfGVufDF8fHx8MTc3MzMzMDQyM3ww&ixlib=rb-4.1.0&q=80&w=1080";

type Tab = "dashboard" | "agents" | "pipeline" | "journal";

// Nouveau compte : aucune équipe commerciale ni historique commercial.
// Les listes se remplissent au fur et à mesure que l'organisation ajoute
// ses agents, qualifie ses prospects et enregistre ses interactions.
type Agent = {
  id: number; name: string; zone: string; clients: number; actifs: number;
  ca: number; taux: number; avatar: string; color: string; rank: number;
  phone: string; email: string; lastActive: string;
};
const agents: Agent[] = [];

const pipelineStages = [
  { name: "Prospects", count: 0, color: "#9CA3AF", icon: Users },
  { name: "Contactés", count: 0, color: A1, icon: Phone },
  { name: "Qualifiés", count: 0, color: ORANGE, icon: CheckCircle2 },
  { name: "Actifs", count: 0, color: A2, icon: UserCheck },
  { name: "Inactifs", count: 0, color: RED, icon: XCircle },
];

type Activity = { agent: string; action: string; client: string; time: string; icon: LucideIcon; color: string };
const recentActivity: Activity[] = [];

const kpis: { label: string; value: React.ReactNode; sub: string; icon: LucideIcon; color: string; bg: string }[] = [
  { label: "Clients totaux", value: <AnimatedNumber value={0} />, sub: "-", icon: Users, color: A1, bg: "#EFF6FF" },
  { label: "Clients actifs", value: <AnimatedNumber value={0} />, sub: "-", icon: UserCheck, color: A2, bg: "#F0FDF4" },
  { label: "CA mensuel", value: <><AnimatedNumber value={0} decimals={1} />M</>, sub: "-", icon: TrendingUp, color: GOLD, bg: "#FFFBEB" },
  { label: "Taux conv.", value: <AnimatedNumber value={0} suffix="%" />, sub: "Objectif : 80%", icon: Target, color: ORANGE, bg: "#FFF7ED" },
];

const monthlyPerf: { m: string; ca: number; pct: number }[] = [];

// ─── Reusable section title ───
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>{children}</p>
      {action}
    </div>
  );
}

export function CrmPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterZone, setFilterZone] = useState("Toutes");

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { key: "agents", label: "Équipe", icon: Users },
    { key: "pipeline", label: "Pipeline", icon: Target },
    { key: "journal", label: "Activité", icon: Activity },
  ];

  const zones = ["Toutes", ...Array.from(new Set(agents.map(a => a.zone)))];
  const filteredAgents = agents
    .filter(a => filterZone === "Toutes" || a.zone === filterZone)
    .filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalClients = agents.reduce((s, a) => s + a.clients, 0);
  const totalCA = agents.reduce((s, a) => s + a.ca, 0);

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F8FAFC" }}>
      {/* ═══ STICKY HEADER ═══ */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${A1}12` }}>
            <BarChart3 className="w-[18px] h-[18px]" style={{ color: A1 }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>CRM Commercial</h1>
            <p className="hidden sm:block" style={{ fontSize: 11, color: "#94A3B8" }}>Suivi des chargés de clientèle</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => toast.success("Rapport exporté (CSV)")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 border border-gray-200" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button onClick={() => toast.success("Rapport exporté")} className="sm:hidden p-2 rounded-xl hover:bg-gray-100">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative overflow-hidden" style={{ minHeight: 150 }}>
        <ImageWithFallback src={IMG_HERO} alt="CRM" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(59,130,246,0.78))" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#FFF", lineHeight: 1.15 }}>
              Pilotez votre<br className="sm:hidden" /> force commerciale
            </p>
            <p className="mt-1.5 max-w-md" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
              Performance, traçabilité et attribution automatique de chaque action commerciale
            </p>
          </div>
          {/* Hero quick stats */}
          <div className="flex gap-3 sm:gap-4">
            {([
              { v: <AnimatedNumber value={agents.length} />, l: "Agents", color: "#60A5FA" },
              { v: <AnimatedNumber value={totalClients} />, l: "Clients", color: "#34D399" },
              { v: <><AnimatedNumber value={Math.round(totalCA / 1000000)} />M</>, l: "CA total", color: "#FBBF24" },
            ] as { v: React.ReactNode; l: string; color: string }[]).map((s, i) => (
              <div key={i} className="text-center px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)" }}>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: s.color }}>{s.v}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {tabs.map(tab => {
            const TI = tab.icon;
            const on = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0 border"
                style={{
                  fontSize: 13,
                  fontFamily: "Poppins",
                  fontWeight: on ? 700 : 500,
                  background: on ? A1 : "#FFF",
                  color: on ? "#FFF" : "#64748B",
                  borderColor: on ? A1 : "#E2E8F0",
                }}
              >
                <TI className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-5xl mx-auto px-4 mt-4">

        {/* ───── DASHBOARD ───── */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* KPIs, 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map((k, i) => {
                const KI = k.icon;
                return (
                  <div key={i} className="rounded-2xl p-4 border border-gray-100" style={{ background: "#FFF" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                        <KI className="w-[18px] h-[18px]" style={{ color: k.color }} />
                      </div>
                      <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: 10, fontWeight: 600, color: A2, background: "#F0FDF4" }}>
                        {k.sub}
                      </span>
                    </div>
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: NAVY, lineHeight: 1 }}>{k.value}</p>
                    <p className="mt-0.5" style={{ fontSize: 12, color: "#94A3B8" }}>{k.label}</p>
                  </div>
                );
              })}
            </div>

            {/* 2-column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly CA */}
              <div className="rounded-2xl p-4 border border-gray-100 bg-white">
                <SectionTitle>CA mensuel (FCFA)</SectionTitle>
                {monthlyPerf.length === 0 && (
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>Aucun historique de chiffre d'affaires pour le moment.</p>
                )}
                <div className="space-y-2.5">
                  {monthlyPerf.map(r => {
                    const isCurrent = r.m === "Mar";
                    return (
                      <div key={r.m} className="flex items-center gap-2.5">
                        <span className="shrink-0" style={{ fontSize: 12, color: isCurrent ? NAVY : "#94A3B8", fontWeight: isCurrent ? 700 : 400, width: 30, textAlign: "right" }}>{r.m}</span>
                        <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-lg flex items-center justify-end pr-2" style={{ width: `${r.pct}%`, background: isCurrent ? `linear-gradient(90deg, ${A1}, #818CF8)` : `linear-gradient(90deg, ${A1}60, ${A1}30)` }}>
                            {r.pct > 40 && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? "#FFF" : "#64748B" }}>{formatPrice(r.ca)}</span>
                            )}
                          </div>
                        </div>
                        {r.pct <= 40 && (
                          <span className="shrink-0" style={{ fontSize: 10, fontWeight: 600, color: "#64748B", minWidth: 52, textAlign: "right" }}>{formatPrice(r.ca)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top agents */}
              <div className="rounded-2xl p-4 border border-gray-100 bg-white">
                <SectionTitle action={
                  <button onClick={() => setActiveTab("agents")} className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: A1 }}>
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                }>
                  Top agents du mois
                </SectionTitle>
                <div className="space-y-1">
                  {agents.slice(0, 4).map((a, i) => {
                    const medals = [GOLD, "#94A3B8", "#CD7F32", "#CBD5E1"];
                    return (
                      <div key={a.id} className="flex items-center gap-3 py-2.5 rounded-xl px-2 hover:bg-gray-50">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: a.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                            {a.avatar}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-white border border-gray-100">
                            <Award className="w-3 h-3" style={{ color: medals[i] || "#CBD5E1" }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: NAVY }}>{a.name}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8" }}>{a.zone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>{formatPrice(a.ca)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                              <div className="h-full rounded-full" style={{ width: `${a.taux}%`, background: a.taux >= 85 ? A2 : a.taux >= 80 ? A1 : ORANGE }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>{a.taux}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pipeline summary */}
            <div className="rounded-2xl p-4 border border-gray-100 bg-white">
              <SectionTitle action={
                <button onClick={() => setActiveTab("pipeline")} className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: A1 }}>
                  Détails <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }>
                Pipeline commercial
              </SectionTitle>
              {/* Funnel visualization */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {pipelineStages.map((s, i) => {
                  const SI = s.icon;
                  return (
                    <div key={s.name} className="text-center">
                      <div className="rounded-2xl p-2.5 sm:p-3 mx-auto border" style={{ background: `${s.color}08`, borderColor: `${s.color}20` }}>
                        <SI className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color: s.color }} />
                        <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: s.color, lineHeight: 1 }}>{s.count}</p>
                      </div>
                      <p className="mt-1.5" style={{ fontSize: 10, color: "#64748B", lineHeight: 1.2 }}>{s.name}</p>
                      {i < pipelineStages.length - 1 && (
                        <div className="hidden sm:block absolute" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Connected bar */}
              <div className="mt-3 flex h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                {pipelineStages.map(s => {
                  const total = pipelineStages.reduce((a, b) => a + b.count, 0);
                  const w = total > 0 ? (s.count / total) * 100 : 0;
                  return (
                    <div key={s.name} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${w}%`, background: s.color }} />
                  );
                })}
              </div>
            </div>

            {/* Sécurité / RBAC */}
            <div className="rounded-2xl p-4 border border-gray-100 bg-white flex gap-3.5" style={{ borderLeftWidth: 4, borderLeftColor: A1 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${A1}10` }}>
                <Shield className="w-5 h-5" style={{ color: A1 }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Séparation des données</p>
                <p className="mt-1" style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: NAVY }}>Vue équipe :</span> stats commerciales, conversions, activités.
                  <br/>
                  <span style={{ fontWeight: 600, color: NAVY }}>Vue admin :</span> rémunérations, commissions, paiements, accès protégé RBAC + 2FA.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ───── AGENTS ───── */}
        {activeTab === "agents" && (
          <div className="space-y-4">
            {/* Search + Filter row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un agent..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none bg-white"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:pb-0">
                {zones.map(z => (
                  <button
                    key={z}
                    onClick={() => setFilterZone(z)}
                    className="px-3 py-2 rounded-xl whitespace-nowrap shrink-0 border"
                    style={{
                      fontSize: 12,
                      fontWeight: filterZone === z ? 700 : 500,
                      background: filterZone === z ? `${A1}10` : "#FFF",
                      color: filterZone === z ? A1 : "#64748B",
                      borderColor: filterZone === z ? A1 : "#E2E8F0",
                    }}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary bar */}
            <div className="rounded-xl p-3 flex items-center justify-between border border-gray-100 bg-white">
              <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{filteredAgents.length} agent{filteredAgents.length > 1 ? "s" : ""}</span>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  Total CA : <span style={{ fontWeight: 700, color: NAVY }}>{formatPrice(filteredAgents.reduce((s, a) => s + a.ca, 0))}</span>
                </span>
              </div>
            </div>

            {filteredAgents.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-white">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Aucun agent enregistré</p>
                <p className="mt-1" style={{ fontSize: 12, color: "#94A3B8" }}>Ajoutez vos chargés de clientèle pour démarrer le suivi.</p>
              </div>
            )}
            {/* Agent cards, stack mobile, grid desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAgents.map(a => {
                const isOpen = selectedAgent === a.id;
                return (
                  <div key={a.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    {/* Card header */}
                    <button
                      onClick={() => setSelectedAgent(isOpen ? null : a.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50"
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: a.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                          {a.avatar}
                        </div>
                        {a.rank <= 3 && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: GOLD, fontSize: 10, fontWeight: 800 }}>
                            {a.rank}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>{a.name}</p>
                          <span className="px-1.5 py-0.5 rounded-md shrink-0" style={{ fontSize: 10, fontWeight: 700, color: a.rank <= 3 ? GOLD : "#94A3B8", background: a.rank <= 3 ? `${GOLD}15` : "#F1F5F9" }}>
                            #{a.rank}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 shrink-0" style={{ color: "#94A3B8" }} />
                          <span style={{ fontSize: 12, color: "#64748B" }}>{a.zone}</span>
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#D1D5DB" }} />
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>{a.lastActive}</span>
                        </div>
                      </div>
                      <ChevronDown
                        className="w-4 h-4 shrink-0"
                        style={{ color: "#94A3B8", transform: isOpen ? "rotate(180deg)" : "none" }}
                      />
                    </button>

                    {/* Compact stats row (always visible) */}
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${A1}06` }}>
                        <Users className="w-3 h-3" style={{ color: A1 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: A1 }}>{a.clients}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8" }}>clients</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${A2}06` }}>
                        <UserCheck className="w-3 h-3" style={{ color: A2 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: A2 }}>{a.actifs}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8" }}>actifs</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${GOLD}06` }}>
                        <TrendingUp className="w-3 h-3" style={{ color: GOLD }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{a.taux}%</span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-gray-100 p-4 space-y-3" style={{ background: "#FAFBFC" }}>
                        {/* CA & conversion */}
                        <div className="rounded-xl p-3 bg-white border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span style={{ fontSize: 12, color: "#64748B" }}>Chiffre d'affaires</span>
                            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: NAVY }}>{formatPrice(a.ca)}</span>
                          </div>
                          {(() => {
                            const maxCa = Math.max(1, ...agents.map((x) => x.ca));
                            return (
                              <>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                                  <div className="h-full rounded-full" style={{ width: `${(a.ca / maxCa) * 100}%`, background: `linear-gradient(90deg, ${a.color}, ${a.color}80)` }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span style={{ fontSize: 10, color: "#94A3B8" }}>0</span>
                                  <span style={{ fontSize: 10, color: "#94A3B8" }}>Max : {formatPrice(maxCa)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100">
                            <Phone className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                            <span style={{ fontSize: 12, color: "#374151" }}>{a.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100">
                            <Mail className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                            <span className="truncate" style={{ fontSize: 12, color: "#374151" }}>{a.email}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => toast.info(`Fiche complète de ${a.name}`)}
                            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border"
                            style={{ borderColor: A1, fontSize: 12, fontWeight: 700, color: A1 }}
                          >
                            <Eye className="w-4 h-4" /> Fiche détaillée
                          </button>
                          <button
                            onClick={() => toast.success("Export PDF généré")}
                            className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-gray-200"
                            style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───── PIPELINE ───── */}
        {activeTab === "pipeline" && (
          <div className="space-y-4">
            {/* Visual funnel */}
            <div className="rounded-2xl p-4 sm:p-5 border border-gray-100 bg-white">
              <SectionTitle>Pipeline de conversion</SectionTitle>
              <div className="space-y-3.5">
                {pipelineStages.map((s, idx) => {
                  const SI = s.icon;
                  const total = pipelineStages.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  const maxCount = Math.max(...pipelineStages.map(p => p.count));
                  const barMax = maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0;
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                            <SI className="w-3.5 h-3.5" style={{ color: s.color }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: s.color }}>{s.count}</span>
                          <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 600, color: "#64748B", background: "#F1F5F9" }}>{Number.isFinite(pct) ? pct : 0}%</span>
                        </div>
                      </div>
                      <div className="h-4 rounded-lg overflow-hidden" style={{ background: "#F1F5F9" }}>
                        <div className="h-full rounded-lg" style={{ width: `${barMax}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2-column on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Attribution rules */}
              <div className="rounded-2xl p-4 border border-gray-100 bg-white">
                <SectionTitle>Règles d'attribution</SectionTitle>
                <div className="space-y-2">
                  {[
                    { rule: "Le créateur du compte client est l'attributaire par défaut", icon: UserCheck, color: A2 },
                    { rule: "Code de parrainage = attribution automatique à l'agent", icon: Target, color: A1 },
                    { rule: "Réattribution possible sur validation superviseur", icon: Shield, color: ORANGE },
                    { rule: "Historique non modifiable (audit trail)", icon: FileText, color: PURPLE },
                  ].map((r, i) => {
                    const RI = r.icon;
                    return (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${r.color}10` }}>
                          <RI className="w-3.5 h-3.5" style={{ color: r.color }} />
                        </div>
                        <p className="flex-1" style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{r.rule}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-2xl p-4 border border-gray-100 bg-white" style={{ borderLeftWidth: 4, borderLeftColor: GOLD }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}12` }}>
                    <Bell className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Alertes automatiques</p>
                </div>
                <div className="space-y-2">
                  {[
                    "Commande d'un client attribué",
                    "Renouvellement d'abonnement",
                    "Client inactif depuis 30 jours",
                    "Nouveau prospect via lien parrainage",
                  ].map((n, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: "#FAFBFC" }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: A2 }} />
                      <span style={{ fontSize: 12, color: "#374151" }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── JOURNAL ───── */}
        {activeTab === "journal" && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>Journal d'activité</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white" style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                  <Filter className="w-3.5 h-3.5" /> Filtrer
                </button>
                <button onClick={() => toast.success("Export CSV")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white" style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => toast.success("Export PDF")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white" style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              {recentActivity.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Aucune activité enregistrée</p>
                  <p className="mt-1" style={{ fontSize: 12, color: "#94A3B8" }}>Les actions de vos agents s'afficheront ici dès qu'elles seront enregistrées.</p>
                </div>
              )}
              {recentActivity.map((a, i) => {
                const AI = a.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/50 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${a.color}10` }}>
                        <AI className="w-4 h-4" style={{ color: a.color }} />
                      </div>
                      {/* Timeline connector */}
                      {i < recentActivity.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-3" style={{ background: "#E2E8F0" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: NAVY, lineHeight: 1.3 }}>
                        <span style={{ fontWeight: 700 }}>{a.agent}</span>
                        <span style={{ color: "#64748B" }}>, {a.action}</span>
                      </p>
                      <p className="mt-0.5 truncate" style={{ fontSize: 12, color: "#94A3B8" }}>{a.client}</p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md" style={{ fontSize: 10, color: "#94A3B8", background: "#F8FAFC", whiteSpace: "nowrap" }}>
                      {a.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
