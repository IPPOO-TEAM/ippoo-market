import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { WhatsAppIcon } from "./icons/whatsapp-icon";
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, Search,
  MapPin, Clock, AlertCircle, CheckCircle2, Package, ChevronRight,
  Bell, ArrowUpRight, ArrowDownRight, Minus, Download, Eye,
  Zap, Star, Layers, Shield, Target, Filter, RefreshCw,
  ChevronDown, FileText, Share2, Bookmark, BookmarkCheck,
  Activity, PieChart, Table2, Info, Settings, X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, categories as appCategories } from "./mock-data";
import { blogArticles } from "../data/blog-articles";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
} from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";
import {
  P, PL, PD, RED, GREEN, GOLD, BLUE, ORANGE,
  IMG_HERO,
  cotations, cotationCategories,
  defaultAlerts,
  dispoStyle, trendColor, trendIcon, formatVar, dayLabels,
  MiniSparkline,
  type Tab, type Cotation, type Alert,
} from "./cotation/data";

export function CotationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedCat, setSelectedCat] = useState("Tous");
  const [searchQ, setSearchQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "prix" | "variation">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (typeof window === "undefined") return defaultAlerts;
    try {
      const raw = scopedGetItem("ippoo:cotation-alerts");
      return raw ? JSON.parse(raw) : defaultAlerts;
    } catch { return defaultAlerts; }
  });
  const [bookmarked, setBookmarked] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = scopedGetItem("ippoo:cotation-bookmarks");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  useEffect(() => {
    scopedSetItem("ippoo:cotation-bookmarks", JSON.stringify(bookmarked));
  }, [bookmarked]);
  useEffect(() => {
    scopedSetItem("ippoo:cotation-alerts", JSON.stringify(alerts));
  }, [alerts]);
  const [period, setPeriod] = useState<"24h" | "7j" | "30j">("7j");
  const [alertModal, setAlertModal] = useState<{ product: string } | null>(null);
  const [alertDraft, setAlertDraft] = useState<{ seuil: string; type: "hausse" | "baisse" | "both"; channel: string }>({ seuil: "5", type: "both", channel: "Push" });
  const [lastRefresh, setLastRefresh] = useState<Date>(() => new Date());
  const [channels, setChannels] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { SMS: true, Email: true, Push: true, WhatsApp: false };
    try {
      const raw = scopedGetItem("ippoo:cotation-channels");
      return raw ? JSON.parse(raw) : { SMS: true, Email: true, Push: true, WhatsApp: false };
    } catch { return { SMS: true, Email: true, Push: true, WhatsApp: false }; }
  });
  useEffect(() => {
    scopedSetItem("ippoo:cotation-channels", JSON.stringify(channels));
  }, [channels]);

  const exportCSV = (rows: Cotation[]) => {
    const header = ["Produit", "Catégorie", "Unité", "Prix gros (FCFA)", "Prix détail (FCFA)", "Variation 24h (%)", "Variation 7j (%)", "Variation 30j (%)", "Volume", "Disponibilité", "Zone", "Fournisseur", "MAJ"];
    const lines = rows.map((c) => [c.name, c.category, c.unit, c.prixGros, c.prixDetail, c.variation24h, c.variation7j, c.variation30j, c.volume, c.dispo, c.zone, c.fournisseur, c.lastUpdate].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cotation-ippoo-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`CSV exporté (${rows.length} lignes)`);
  };
  const refresh = () => { setLastRefresh(new Date()); toast.success("Données rafraîchies"); };
  const shareCotation = async (c: Cotation) => {
    const text = `${c.name} · ${c.prixGros.toLocaleString("fr-FR")} FCFA/${c.unit} (var 7j ${c.variation7j > 0 ? "+" : ""}${c.variation7j}%) - IPPOO`;
    const url = `${window.location.origin}/cotation?id=${c.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: c.name, text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Lien copié dans le presse-papier");
    } catch { toast.error("Partage indisponible"); }
  };

  const submitNewAlert = () => {
    if (!alertModal) return;
    const product = alertModal.product.trim();
    if (!product) { toast.error("Indiquez un produit"); return; }
    const seuilNum = parseFloat(alertDraft.seuil);
    if (!seuilNum || seuilNum <= 0) { toast.error("Seuil invalide"); return; }
    const newAlert: Alert = {
      id: Date.now(),
      product,
      seuil: `±${seuilNum}%`,
      type: alertDraft.type,
      active: true,
      channel: alertDraft.channel,
    };
    setAlerts((prev: Alert[]) => [newAlert, ...prev]);
    setAlertModal(null);
    setAlertDraft({ seuil: "5", type: "both", channel: "Push" });
    toast.success(`Alerte créée pour ${product}`);
  };

  const filtered = useMemo(() => {
    let r = cotations
      .filter(c => selectedCat === "Tous" || c.category === selectedCat)
      .filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()));
    if (sortBy === "name") r = r.sort((a, b) => sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    if (sortBy === "prix") r = r.sort((a, b) => sortDir === "asc" ? a.prixGros - b.prixGros : b.prixGros - a.prixGros);
    if (sortBy === "variation") r = r.sort((a, b) => sortDir === "asc" ? a.variation7j - b.variation7j : b.variation7j - a.variation7j);
    return r;
  }, [selectedCat, searchQ, sortBy, sortDir]);

  const selectedCotation = selectedId ? cotations.find(c => c.id === selectedId) : null;

  // Stats
  const totalCotations = cotations.length;
  const hausse = cotations.filter(c => c.variation7j > 0).length;
  const baisse = cotations.filter(c => c.variation7j < 0).length;
  const stable = cotations.filter(c => c.variation7j === 0).length;
  const avgVariation = (cotations.reduce((s, c) => s + c.variation7j, 0) / totalCotations).toFixed(1);

  // Top movers
  const topHausse = [...cotations].sort((a, b) => b.variation7j - a.variation7j).slice(0, 5);
  const topBaisse = [...cotations].sort((a, b) => a.variation7j - b.variation7j).slice(0, 5);

  // Category stats
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; avgVar: number; totalVol: number }>();
    cotations.forEach(c => {
      const prev = map.get(c.category) || { count: 0, avgVar: 0, totalVol: 0 };
      map.set(c.category, {
        count: prev.count + 1,
        avgVar: prev.avgVar + c.variation7j,
        totalVol: prev.totalVol + c.volume,
      });
    });
    return Array.from(map.entries()).map(([cat, s]) => ({
      category: cat,
      count: s.count,
      avgVar: +(s.avgVar / s.count).toFixed(1),
      totalVol: s.totalVol,
    })).sort((a, b) => b.totalVol - a.totalVol);
  }, []);

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: Activity },
    { key: "categories", label: "Catégories", icon: PieChart },
    { key: "tableau", label: "Tableau", icon: Table2 },
    { key: "detail", label: "Fiche", icon: Eye },
    { key: "analyse", label: "Analyse", icon: BarChart3 },
    { key: "alertes", label: "Alertes", icon: Bell },
  ];

  const toggleBookmark = (id: number) => {
    setBookmarked(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    toast.success(bookmarked.includes(id) ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const getVariation = (c: Cotation) => period === "24h" ? c.variation24h : period === "7j" ? c.variation7j : c.variation30j;

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FFF7ED" }}>
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <BarChart3 className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Cotation des Prix</h1>
          <p style={{ fontSize: 10, color: "#6B7280" }}>Observatoire temps réel · {totalCotations} produits cotés</p>
        </div>
        <button onClick={() => exportCSV(cotations)} className="p-2 rounded-lg hover:bg-gray-100" title="Exporter CSV">
          <Download className="w-4.5 h-4.5 text-gray-500" />
        </button>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100" title={`MAJ ${lastRefresh.toLocaleTimeString("fr-FR")}`}>
          <RefreshCw className="w-4.5 h-4.5 text-gray-500" />
        </button>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ height: 130 }}>
        <ImageWithFallback src={IMG_HERO} alt="Cotation" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.9), rgba(6,95,70,0.8))" }} />
        <div className="absolute inset-0 flex items-center px-4">
          <div className="flex-1">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#FFF", lineHeight: 1.15 }}>
              Suivez le marché<br />en temps réel
            </p>
            <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
              Prix source · Gros · Détail, 16 catégories
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#FFF" }}>{hausse}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>En hausse</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#FFF" }}>{baisse}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>En baisse</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0"
              style={{ fontSize: 12, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#6B7280" }}
            >
              <TI className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-3">

        {/* ════════════════════════════════════════════
            TAB 1: VUE D'ENSEMBLE
           ════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Cotés", value: totalCotations, color: P },
                { label: "Hausse", value: hausse, color: RED },
                { label: "Baisse", value: baisse, color: GREEN },
                { label: "Stable", value: stable, color: "#9CA3AF" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-2.5 text-center">
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Variation moyenne */}
            <div className="bg-white rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
                <Activity className="w-5 h-5" style={{ color: P }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Variation moyenne (7j)</p>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: Number(avgVariation) > 0 ? RED : Number(avgVariation) < 0 ? GREEN : "#9CA3AF" }}>
                  {Number(avgVariation) > 0 ? "+" : ""}{avgVariation}%
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>Dernière MàJ</p>
                <p style={{ fontSize: 12, fontWeight: 700 }}>12/03 11:30</p>
              </div>
            </div>

            {/* Top Hausses */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: RED }} />
                <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Plus fortes hausses (7j)</h3>
              </div>
              <div className="space-y-2">
                {topHausse.map((c, i) => {
                  const VIcon = trendIcon(c.variation7j);
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedId(c.id); setActiveTab("detail"); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left"
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${RED}15`, fontSize: 10, fontWeight: 800, color: RED }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{c.category}</span>
                      </div>
                      <MiniSparkline data={c.history} color={RED} />
                      <div className="flex items-center gap-0.5 shrink-0">
                        <VIcon className="w-3.5 h-3.5" style={{ color: RED }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: RED }}>{formatVar(c.variation7j)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Baisses */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4" style={{ color: GREEN }} />
                <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Plus fortes baisses (7j)</h3>
              </div>
              <div className="space-y-2">
                {topBaisse.map((c, i) => {
                  const VIcon = trendIcon(c.variation7j);
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedId(c.id); setActiveTab("detail"); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left"
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${GREEN}15`, fontSize: 10, fontWeight: 800, color: GREEN }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{c.category}</span>
                      </div>
                      <MiniSparkline data={c.history} color={GREEN} />
                      <div className="flex items-center gap-0.5 shrink-0">
                        <VIcon className="w-3.5 h-3.5" style={{ color: GREEN }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{formatVar(c.variation7j)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alertes récentes */}
            <div className="bg-gradient-to-r from-[#E11D2E]/5 to-[#F97316]/5 rounded-2xl p-4 border border-[#E11D2E]/15">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" style={{ color: RED }} />
                <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Alertes importantes</h3>
              </div>
              <div className="space-y-2">
                {[
                  { text: "Tomate concentrée : +8.2% en 7j, pénurie saisonnière", color: RED },
                  { text: "Tôle ondulée : +4.5% en 7j, coûts matière première", color: RED },
                  { text: "Beurre de karité : -4.3%, abondance saisonnière", color: GREEN },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/80">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                    <p style={{ fontSize: 12, color: "#374151" }}>{a.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Blog & Articles liés */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <FileText className="w-4 h-4" style={{ color: "#7C3AED" }} /> Articles & Analyses
                </h3>
                <button onClick={() => navigate("/blog")} className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED" }}>
                  Tout le blog <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {blogArticles.filter(a => ["Cotation", "Analyse marche"].includes(a.category)).slice(0, 4).map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/blog/article/${a.id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left"
                  >
                    <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0">
                      <ImageWithFallback src={a.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-gray-400" style={{ fontSize: 10 }}>
                        <span className="px-1.5 py-0 rounded" style={{ fontSize: 8, fontWeight: 700, color: a.color, background: `${a.color}12` }}>{a.category}</span>
                        <span>{a.readTime}</span>
                        <span>{a.views?.toLocaleString()} vues</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white rounded-xl p-3.5">
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>Sources des données</p>
              <div className="space-y-1.5">
                {[
                  { text: "Déclaratif fournisseur vérifié IPPOO", icon: CheckCircle2, color: GREEN },
                  { text: "Collecte terrain (agents marché)", icon: MapPin, color: BLUE },
                  { text: "Données non vérifiées signalées", icon: AlertCircle, color: GOLD },
                  { text: "Mise à jour : temps réel / quotidienne", icon: Clock, color: P },
                ].map((s, i) => {
                  const SI = s.icon;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <SI className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <span style={{ fontSize: 11, color: "#374151" }}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════
            TAB 2: PAR CATÉGORIE
           ════════════════════════════════════════════ */}
        {activeTab === "categories" && (
          <>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Cotation par catégorie</p>
            <div className="space-y-2.5">
              {categoryStats.map((cs, i) => {
                const isUp = cs.avgVar > 0;
                const isDown = cs.avgVar < 0;
                const catColor = appCategories.find(ac => ac.name === cs.category)?.color || P;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedCat(cs.category); setActiveTab("tableau"); }}
                    className="w-full bg-white rounded-xl p-3.5 text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${catColor}15` }}>
                      <Layers className="w-5 h-5" style={{ color: catColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{cs.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{cs.count} produits</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Vol: {cs.totalVol.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-0.5 justify-end">
                        {isUp && <ArrowUpRight className="w-3.5 h-3.5" style={{ color: RED }} />}
                        {isDown && <ArrowDownRight className="w-3.5 h-3.5" style={{ color: GREEN }} />}
                        {!isUp && !isDown && <Minus className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
                        <span style={{ fontSize: 14, fontWeight: 800, color: trendColor(cs.avgVar) }}>
                          {formatVar(cs.avgVar)}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>moy. 7j</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Volume chart */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Volume par catégorie</h3>
              <div style={{ width: "100%", height: 192 }}>
                <ResponsiveContainer width="100%" height={192} minWidth={0}>
                  <BarChart data={categoryStats.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={85} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    <Bar dataKey="totalVol" fill={P} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════
            TAB 3: TABLEAU COMPLET
           ════════════════════════════════════════════ */}
        {activeTab === "tableau" && (
          <>
            {/* Search & filters */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                style={{ fontSize: 13 }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {cotationCategories.map(c => (
                <button
                  key={c} onClick={() => setSelectedCat(c)}
                  className="px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0"
                  style={{
                    fontSize: 11, fontWeight: selectedCat === c ? 700 : 500,
                    background: selectedCat === c ? `${P}12` : "#FFF",
                    color: selectedCat === c ? P : "#6B7280",
                    border: selectedCat === c ? `2px solid ${P}` : "1px solid #E5E7EB",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <div className="flex items-center justify-between">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{filtered.length} produits</p>
              <div className="flex gap-1">
                {(["24h", "7j", "30j"] as const).map(p => (
                  <button
                    key={p} onClick={() => setPeriod(p)}
                    className="px-2.5 py-1 rounded-lg"
                    style={{ fontSize: 11, fontWeight: period === p ? 700 : 500, background: period === p ? P : "transparent", color: period === p ? "#FFF" : "#6B7280" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort bar */}
            <div className="flex items-center gap-1 bg-[#1A1A2E] rounded-t-xl px-3 py-2 text-white">
              <button onClick={() => toggleSort("name")} className="flex-1 flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 700 }}>
                Produit {sortBy === "name" && <ChevronDown className={`w-3 h-3 ${sortDir === "desc" ? "rotate-180" : ""}`} />}
              </button>
              <button onClick={() => toggleSort("prix")} className="w-20 text-right flex items-center justify-end gap-0.5" style={{ fontSize: 10, fontWeight: 700 }}>
                Gros {sortBy === "prix" && <ChevronDown className={`w-3 h-3 ${sortDir === "desc" ? "rotate-180" : ""}`} />}
              </button>
              <button onClick={() => toggleSort("variation")} className="w-16 text-right flex items-center justify-end gap-0.5" style={{ fontSize: 10, fontWeight: 700 }}>
                Var. {sortBy === "variation" && <ChevronDown className={`w-3 h-3 ${sortDir === "desc" ? "rotate-180" : ""}`} />}
              </button>
              <span className="w-[52px] text-right" style={{ fontSize: 10, fontWeight: 700 }}>Trend</span>
            </div>

            {/* Table rows */}
            <div className="space-y-0 -mt-3">
              {filtered.map((c, i) => {
                const v = getVariation(c);
                const VIcon = trendIcon(v);
                const ds = dispoStyle(c.dispo);
                const isBm = bookmarked.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); setActiveTab("detail"); }}
                    className={`w-full flex items-center gap-2 px-3 py-3 text-left border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</p>
                        {c.verified && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: GREEN }} />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-1.5 py-0 rounded" style={{ fontSize: 9, fontWeight: 600, color: ds.color, background: ds.bg }}>{ds.label}</span>
                        <span style={{ fontSize: 9, color: "#9CA3AF" }}>{c.unit}</span>
                      </div>
                    </div>
                    <span className="w-20 text-right shrink-0" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: P }}>
                      {formatPrice(c.prixGros)}
                    </span>
                    <span className="w-14 text-right shrink-0 flex items-center justify-end gap-0.5">
                      <VIcon className="w-3 h-3" style={{ color: trendColor(v) }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: trendColor(v) }}>{formatVar(v)}</span>
                    </span>
                    <div className="w-[52px] flex justify-end shrink-0">
                      <MiniSparkline data={c.history} color={trendColor(v)} w={48} h={20} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Export */}
            <div className="flex gap-2 mt-2">
              {[
                { label: "CSV", icon: Download },
                { label: "Excel", icon: FileText },
                { label: "PDF", icon: FileText },
              ].map((e, i) => {
                const EI = e.icon;
                return (
                  <button
                    key={i}
                    onClick={() => { if (e.label === "CSV") exportCSV(filtered); else toast.info(`Export ${e.label} bientôt disponible - utilisez CSV pour l'instant`); }}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-border flex items-center justify-center gap-1.5"
                    style={{ fontSize: 12, fontWeight: 700, color: P }}
                  >
                    <EI className="w-3.5 h-3.5" /> {e.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════
            TAB 4: FICHE DÉTAILLÉE
           ════════════════════════════════════════════ */}
        {activeTab === "detail" && (
          <>
            {!selectedCotation ? (
              <div className="bg-white rounded-2xl p-6 text-center">
                <Eye className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Sélectionnez un produit</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                  Cliquez sur un produit dans Vue d'ensemble ou Tableau pour voir sa fiche détaillée.
                </p>
                <div className="mt-4 space-y-1.5">
                  {cotations.slice(0, 6).map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-left"
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: P }}>{formatPrice(c.prixGros)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>{selectedCotation.name}</h3>
                      {selectedCotation.verified && <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />}
                    </div>
                    <button onClick={() => toggleBookmark(selectedCotation.id)}>
                      {bookmarked.includes(selectedCotation.id) ? (
                        <BookmarkCheck className="w-5 h-5" style={{ color: GOLD }} />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg" style={{ fontSize: 11, fontWeight: 600, background: `${P}12`, color: P }}>{selectedCotation.category}</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{selectedCotation.unit}</span>
                    <span className="px-2 py-0.5 rounded" style={{ fontSize: 10, fontWeight: 700, ...(() => { const ds = dispoStyle(selectedCotation.dispo); return { color: ds.color, background: ds.bg }; })() }}>
                      {dispoStyle(selectedCotation.dispo).label}
                    </span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{selectedCotation.grade}</span>
                  </div>

                  {/* Price grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Prix Source", prix: selectedCotation.prixSource, color: BLUE },
                      { label: "Prix Gros", prix: selectedCotation.prixGros, color: P },
                      { label: "Prix Détail", prix: selectedCotation.prixDetail, color: GOLD },
                    ].map((p, i) => (
                      <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: `${p.color}08` }}>
                        <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{p.label}</p>
                        <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: p.color }}>{formatPrice(p.prix)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Marges */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg p-2 bg-[#F9FAFB] text-center">
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>Marge Gros</p>
                      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: GREEN }}>
                        +{((selectedCotation.prixGros - selectedCotation.prixSource) / selectedCotation.prixSource * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="rounded-lg p-2 bg-[#F9FAFB] text-center">
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>Marge Détail</p>
                      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: ORANGE }}>
                        +{((selectedCotation.prixDetail - selectedCotation.prixGros) / selectedCotation.prixGros * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Variations */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "24h", val: selectedCotation.variation24h },
                      { label: "7 jours", val: selectedCotation.variation7j },
                      { label: "30 jours", val: selectedCotation.variation30j },
                    ].map((v, i) => {
                      const VI = trendIcon(v.val);
                      return (
                        <div key={i} className="rounded-xl p-2.5 text-center bg-[#F9FAFB]">
                          <p style={{ fontSize: 10, color: "#9CA3AF" }}>{v.label}</p>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <VI className="w-3.5 h-3.5" style={{ color: trendColor(v.val) }} />
                            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: trendColor(v.val) }}>
                              {formatVar(v.val)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 7j */}
                <div className="bg-white rounded-2xl p-4">
                  <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                    <BarChart3 className="w-4 h-4" style={{ color: P }} /> Évolution 7 jours
                  </h4>
                  <div style={{ width: "100%", height: 192 }}>
                    <ResponsiveContainer width="100%" height={192} minWidth={0}>
                      <AreaChart data={selectedCotation.history.map((v, i) => ({ day: dayLabels[i], prix: v }))}>
                        <defs>
                          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={P} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={P} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatPrice(v)} />
                        <Area type="monotone" dataKey="prix" stroke={P} fill="url(#gradArea)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Info table */}
                <div className="bg-white rounded-2xl p-4">
                  <h4 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Informations</h4>
                  <div className="space-y-0">
                    {[
                      { label: "Zone", value: selectedCotation.zone },
                      { label: "Grade", value: selectedCotation.grade },
                      { label: "Volume (demande)", value: selectedCotation.volume.toLocaleString() + " unités" },
                      { label: "Fournisseur", value: selectedCotation.fournisseur },
                      { label: "Dernière MàJ", value: selectedCotation.lastUpdate },
                      { label: "Vérifié IPPOO", value: selectedCotation.verified ? "Oui ✓" : "En attente" },
                    ].map((r, i) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2.5 ${i % 2 === 0 ? "bg-[#F9FAFB]" : ""}`}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{r.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAlertModal({ product: selectedCotation.name })}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-border flex items-center justify-center gap-1.5"
                    style={{ fontSize: 12, fontWeight: 700, color: GOLD }}
                  >
                    <Bell className="w-4 h-4" /> Créer une alerte
                  </button>
                  <button
                    onClick={() => shareCotation(selectedCotation)}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-border flex items-center justify-center gap-1.5"
                    style={{ fontSize: 12, fontWeight: 700, color: BLUE }}
                  >
                    <Share2 className="w-4 h-4" /> Partager
                  </button>
                </div>

                {/* Nav buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const idx = cotations.findIndex(c => c.id === selectedCotation.id);
                      if (idx > 0) setSelectedId(cotations[idx - 1].id);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#F3F4F6] flex items-center justify-center gap-1"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Précédent
                  </button>
                  <button
                    onClick={() => {
                      const idx = cotations.findIndex(c => c.id === selectedCotation.id);
                      if (idx < cotations.length - 1) setSelectedId(cotations[idx + 1].id);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#F3F4F6] flex items-center justify-center gap-1"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    Suivant <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════
            TAB 5: ANALYSE
           ════════════════════════════════════════════ */}
        {activeTab === "analyse" && (
          <>
            {/* Fluctuations significatives */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Activity className="w-4 h-4" style={{ color: P }} /> Fluctuations significatives (7j)
              </h3>
              <div className="space-y-2">
                {[...cotations].sort((a, b) => Math.abs(b.variation7j) - Math.abs(a.variation7j)).slice(0, 8).map(c => {
                  const isUp = c.variation7j > 0;
                  return (
                    <div key={c.id} className="rounded-xl p-3" style={{ borderLeft: `4px solid ${isUp ? RED : GREEN}`, background: "#FAFAFA" }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</p>
                        <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: trendColor(c.variation7j) }}>
                          {formatVar(c.variation7j)}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{c.category} · {c.zone}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison chart */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <BarChart3 className="w-4 h-4" style={{ color: P }} /> Comparaison des prix (Top 8)
              </h3>
              <div style={{ width: "100%", height: 208 }}>
                <ResponsiveContainer width="100%" height={208} minWidth={0}>
                  <BarChart data={cotations.slice(0, 8).map(c => ({
                    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
                    Source: c.prixSource,
                    Gros: c.prixGros,
                    Détail: c.prixDetail,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatPrice(v)} />
                    <Bar dataKey="Source" fill={BLUE} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Gros" fill={P} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Détail" fill={GOLD} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                {[
                  { label: "Source", color: BLUE },
                  { label: "Gros", color: P },
                  { label: "Détail", color: GOLD },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend lines */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <TrendingUp className="w-4 h-4" style={{ color: P }} /> Tendances 7 jours (sélection)
              </h3>
              <div style={{ width: "100%", height: 192 }}>
                <ResponsiveContainer width="100%" height={192} minWidth={0}>
                  <LineChart data={dayLabels.map((day, i) => ({
                    day,
                    "Riz": cotations[0].history[i],
                    "Huile palme": cotations[1].history[i],
                    "Ciment": cotations[12].history[i],
                    "Tomate": cotations[3].history[i],
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatPrice(v)} />
                    <Line type="monotone" dataKey="Riz" stroke={GREEN} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Huile palme" stroke={RED} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Ciment" stroke={ORANGE} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Tomate" stroke={BLUE} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {[
                  { label: "Riz", color: GREEN },
                  { label: "Huile palme", color: RED },
                  { label: "Ciment", color: ORANGE },
                  { label: "Tomate", color: BLUE },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-3 h-1.5 rounded" style={{ background: l.color }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Indices */}
            <div className="bg-gradient-to-r from-[#0D9488]/10 to-[#065F46]/10 rounded-2xl p-4 border border-[#0D9488]/15">
              <h3 className="mb-2 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Target className="w-4 h-4" style={{ color: P }} /> Indicateurs statistiques
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Indice IPPOO Alimentaire", value: "104.2", delta: "+1.3%" },
                  { label: "Indice IPPOO Construction", value: "108.7", delta: "+3.8%" },
                  { label: "Volatilité moyenne", value: "3.2%", delta: "Modérée" },
                  { label: "Produits suivis", value: totalCotations.toString(), delta: "16 catégories" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3">
                    <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{s.label}</p>
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: P }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{s.delta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="rounded-xl p-3" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                Les variations alimentent automatiquement la page <span style={{ fontWeight: 700 }}>Promos</span>, déclenchent des ajustements de prix sur le catalogue, et les baisses génèrent des <span style={{ fontWeight: 700, color: GREEN }}>promos d'abondance</span> sur IPPOO Market.
              </p>
            </div>

            {/* Articles d'analyse */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <FileText className="w-4 h-4" style={{ color: "#7C3AED" }} /> Analyses détaillées
                </h3>
                <button onClick={() => navigate("/blog")} className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED" }}>
                  Blog <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {blogArticles.filter(a => ["Cotation", "Analyse marche", "Logistique"].includes(a.category)).slice(0, 3).map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/blog/article/${a.id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left"
                  >
                    <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0">
                      <ImageWithFallback src={a.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</p>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{a.readTime} · {a.views?.toLocaleString()} vues</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════
            TAB 6: ALERTES
           ════════════════════════════════════════════ */}
        {activeTab === "alertes" && (
          <>
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Alertes de variation</h3>
                <span className="px-2.5 py-0.5 rounded-lg" style={{ fontSize: 11, fontWeight: 700, color: P, background: `${P}12` }}>
                  {alerts.filter(a => a.active).length} actives
                </span>
              </div>
              <p className="mb-3" style={{ fontSize: 12, color: "#6B7280" }}>
                Recevez une notification quand un prix dépasse un seuil défini.
              </p>

              <div className="space-y-2.5">
                {alerts.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB]">
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{a.product}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: 11, color: "#6B7280" }}>Seuil : {a.seuil}</span>
                        <span className="px-1.5 py-0 rounded" style={{ fontSize: 9, fontWeight: 600, color: a.type === "hausse" ? RED : a.type === "baisse" ? GREEN : ORANGE, background: a.type === "hausse" ? `${RED}10` : a.type === "baisse" ? `${GREEN}10` : `${ORANGE}10` }}>
                          {a.type === "both" ? "↑↓" : a.type === "hausse" ? "↑" : "↓"}
                        </span>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{a.channel}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAlerts(prev => prev.map(al => al.id === a.id ? { ...al, active: !al.active } : al));
                        toast.success(`Alerte "${a.product}" ${!a.active ? "activée" : "désactivée"}`);
                      }}
                      className="w-11 h-6 rounded-full flex items-center px-0.5 shrink-0"
                      style={{ background: a.active ? GREEN : "#D1D5DB" }}
                    >
                      <div className="w-5 h-5 rounded-full bg-white" style={{ marginLeft: a.active ? 18 : 0 }} />
                    </button>
                    <button
                      onClick={() => { setAlerts(prev => prev.filter(al => al.id !== a.id)); toast.success(`Alerte "${a.product}" supprimée`); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add alert */}
            <button
              onClick={() => setAlertModal({ product: "" })}
              className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: P, color: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              <Bell className="w-4 h-4" /> Ajouter une alerte prix
            </button>

            {/* Notification channels */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Canaux de notification</h3>
              <div className="space-y-2">
                {[
                  { label: "SMS", desc: "Recevoir par message texte", color: BLUE },
                  { label: "Email", desc: "Recevoir par email", color: P },
                  { label: "Push", desc: "Notification dans l'app", color: ORANGE },
                  { label: "WhatsApp", desc: "Recevoir via WhatsApp", color: "#25D366" },
                ].map((ch) => {
                  const isOn = !!channels[ch.label];
                  return (
                    <div key={ch.label} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAFB]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ch.color}15` }}>
                          {ch.label === "WhatsApp"
                            ? <WhatsAppIcon size={18} />
                            : <Bell className="w-4 h-4" style={{ color: ch.color }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{ch.label}</p>
                          <p style={{ fontSize: 10, color: "#9CA3AF" }}>{ch.desc}</p>
                        </div>
                      </div>
                      <div
                        onClick={() => { setChannels((prev) => ({ ...prev, [ch.label]: !prev[ch.label] })); toast.success(`Canal ${ch.label} ${!isOn ? "activé" : "désactivé"}`); }}
                        className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors"
                        style={{ background: isOn ? GREEN : "#D1D5DB" }}
                      >
                        <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ marginLeft: isOn ? 16 : 0 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source data */}
            <div className="bg-white rounded-xl p-3.5">
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Source des données</p>
              <div className="space-y-2">
                {[
                  { text: "Déclaratif fournisseur vérifié IPPOO", icon: CheckCircle2, color: GREEN },
                  { text: "Collecte marché terrain (agents)", icon: MapPin, color: BLUE },
                  { text: "Données non vérifiées signalées", icon: AlertCircle, color: GOLD },
                  { text: "Mise à jour : temps réel / quotidienne", icon: Clock, color: P },
                ].map((s, i) => {
                  const SI = s.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <SI className="w-4 h-4" style={{ color: s.color }} />
                      <span style={{ fontSize: 12, color: "#374151" }}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin preview */}
            <div className="bg-gradient-to-r from-[#1A1A2E] to-[#2D2B55] rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-white/80" />
                <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Administration</h3>
              </div>
              <p className="text-white/70 mb-3" style={{ fontSize: 12 }}>
                Espace réservé aux administrateurs pour gérer les cotations.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Ajouter une valeur",
                  "Importer données (Excel)",
                  "Mise à jour manuelle",
                  "Gestion des rôles",
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => toast.info(`${item} - réservé aux administrateurs IPPOO`)}
                    className="py-2 rounded-lg bg-white/10 text-white/90 text-center"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {alertModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setAlertModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5" style={{ color: GOLD }} />
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Nouvelle alerte prix</h3>
            </div>
            <p className="text-muted-foreground mb-4" style={{ fontSize: 12 }}>
              Soyez notifié dès que le prix de référence franchit votre seuil.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Produit</label>
                <input
                  type="text"
                  value={alertModal.product}
                  onChange={(e) => setAlertModal({ product: e.target.value })}
                  placeholder="Ex: Riz Parfumé Thai"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Seuil (%)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={alertDraft.seuil}
                    onChange={(e) => setAlertDraft({ ...alertDraft, seuil: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Sens</label>
                  <select
                    value={alertDraft.type}
                    onChange={(e) => setAlertDraft({ ...alertDraft, type: e.target.value as "hausse" | "baisse" | "both" })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                    style={{ fontSize: 13 }}
                  >
                    <option value="both">Hausse & Baisse</option>
                    <option value="hausse">Hausse uniquement</option>
                    <option value="baisse">Baisse uniquement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Canal de notification</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Push", "SMS", "WhatsApp", "Email"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setAlertDraft({ ...alertDraft, channel: c })}
                      className="py-2 rounded-xl border"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: alertDraft.channel === c ? `${GOLD}15` : "#FFF",
                        borderColor: alertDraft.channel === c ? GOLD : "#E5E7EB",
                        color: alertDraft.channel === c ? GOLD : "#374151",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAlertModal(null)} className="flex-1 py-2.5 rounded-xl border border-border" style={{ fontWeight: 600, fontSize: 13 }}>
                Annuler
              </button>
              <button onClick={submitNewAlert} className="flex-1 py-2.5 rounded-xl text-white" style={{ background: GOLD, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                Créer l'alerte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
