import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  MapPin,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  ShieldCheck,
  Users,
  ShoppingCart,
  Zap,
  Scale,
  Filter,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Target,
  Trophy,
  Award,
  BookOpen,
  Sparkles,
  Globe,
  Percent,
  Bookmark,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { categories, formatPrice } from "./mock-data";
import { CouponStrip } from "./promo-widgets";
import { blogArticles } from "../data/blog-articles";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import {
  IMG, categoryImages, tabThemes, categoryColors,
  externalStores, storeTypeLabels, zones, quantityModes,
  allComparisons,
  subscribeComparisons,
  readWatchFlag, writeWatchFlag, readBookmarks, writeBookmarks,
  slogans, userProfiles,
  type ComparisonEntry,
} from "./comparateur/data";
import { refreshPublicProducts } from "../data/public-products";

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
type Tab = "comparatif" | "externe" | "selection" | "blog" | "profils";

export function ComparateurPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("Toutes zones");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [quantityMode, setQuantityMode] = useState("gros");
  const openEntry = (entry: ComparisonEntry) => navigate(`/comparateur/produit/${entry.productId}`);
  const [activeTab, setActiveTab] = useState<Tab>("comparatif");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"prixMin" | "prixMoyen" | "economie">("economie");
  const [watching, setWatching] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  useEffect(() => { setWatching(readWatchFlag()); setBookmarks(readBookmarks()); }, []);
  // Force a re-render when public products arrive / change.
  useSyncExternalStore(subscribeComparisons, () => allComparisons.length, () => 0);
  // Pull cross-user published products into the comparator.
  useEffect(() => { refreshPublicProducts().catch(() => undefined); }, []);
  const toggleWatch = () => {
    const next = !watching;
    setWatching(next); writeWatchFlag(next);
    toast.success(next ? "Alertes prix activées" : "Alertes prix désactivées");
  };
  const toggleBookmark = (id: number, name: string) => {
    setBookmarks((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [id, ...prev];
      writeBookmarks(next);
      toast.success(exists ? `${name} retiré des favoris` : `${name} ajouté aux favoris`);
      return next;
    });
  };

  const theme = tabThemes[activeTab];

  const filteredComparisons = useMemo(() => {
    return allComparisons.filter((entry) => {
      const matchCat = selectedCategory === "Toutes" || entry.category === selectedCategory;
      const matchSearch = !searchQuery || entry.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchZone = selectedZone === "Toutes zones" || entry.sellers.some((s) => s.zone === selectedZone);
      return matchCat && matchSearch && matchZone;
    }).sort((a, b) => {
      if (sortBy === "prixMin") return a.prixMin - b.prixMin;
      if (sortBy === "prixMoyen") return a.prixMoyen - b.prixMoyen;
      return b.economieVsExterne - a.economieVsExterne;
    });
  }, [selectedCategory, searchQuery, selectedZone, sortBy, allComparisons.length]);

  const selectionProducts = useMemo(() => filteredComparisons.filter((e) => e.isSelection), [filteredComparisons]);

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "comparatif", label: "Comparatif", icon: Scale },
    { key: "externe", label: "Externe", icon: Globe },
    { key: "selection", label: "Selection", icon: Sparkles },
    { key: "blog", label: "Blog", icon: BookOpen },
    { key: "profils", label: "Profils", icon: Target },
  ];

  const getPriceByMode = (entry: ComparisonEntry) => {
    switch (quantityMode) {
      case "detail": return entry.sellers[0]?.priceDetail || entry.prixMin;
      case "semi": return entry.sellers[0]?.priceSemiGros || entry.prixMin;
      case "gros": return entry.prixMin;
      case "volume": return entry.sellers[0]?.priceVolume || entry.prixMin;
      default: return entry.prixMin;
    }
  };

  return (
    <div className="pb-24 bg-[#FAFAFA] overflow-x-hidden">
      {/* ── STICKY HEADER ── */}
      <div className="sticky top-[60px] z-40 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]/60">
        <div className="px-4 py-2.5 flex items-center gap-3 max-w-6xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>Comparatif des prix</h3>
            <p className="text-muted-foreground" style={{ fontSize: 9 }}>{allComparisons.length} produits . {externalStores.length} enseignes</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-xl hover:bg-[#F3F4F6] transition-colors relative">
            <Filter className="w-5 h-5" />
            {(selectedCategory !== "Toutes" || selectedZone !== "Toutes zones") && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: theme.accent }} />}
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover scale-110" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F172AED, #064E3BD9, #0F172ACC)" }} />
        </div>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: theme.accent }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl bg-[#FBBF24]" />

        <div className="relative z-10 px-4 pt-4 pb-5 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Pill tags */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 700 }}>
                <Scale className="w-3 h-3" /> COMPARATEUR
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800, background: `${theme.accent}40` }}>
                <TrendingDown className="w-3 h-3" /> MEILLEURES OFFRES
              </span>
            </div>

            <div className="sm:flex sm:items-end sm:justify-between sm:gap-8">
              <div>
                <h1 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "28px", letterSpacing: "-0.02em" }}>
                  Le vrai prix du marche
                </h1>
                <p className="text-white/50 mb-3 max-w-sm" style={{ fontSize: 11, lineHeight: 1.5 }}>
                  Comparez IPPOO avec supermarches, hypermarches et marches d'Afrique de l'Ouest.
                </p>
              </div>

              {/* Stats bento, compact */}
              <div className="flex gap-2 mb-2 sm:mb-3 shrink-0">
                {[
                  { value: `${allComparisons.length}`, label: "Produits", bg: "rgba(5,150,105,0.15)", color: "#4ADE80" },
                  { value: `${externalStores.length}`, label: "Enseignes", bg: "rgba(79,70,229,0.15)", color: "#A5B4FC" },
                  { value: "-18%", label: "Eco. moy.", bg: "rgba(217,119,6,0.15)", color: "#FBBF24" },
                ].map((s, i) => (
                  <div key={i} className="flex-1 sm:w-20 rounded-xl p-2 text-center border border-white/5" style={{ background: s.bg }}>
                    <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: s.color }}>{s.value}</p>
                    <p className="text-white/35" style={{ fontSize: 8, fontWeight: 600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input type="text" placeholder="Rechercher un produit, une marque..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-2xl border-none outline-none" style={{ fontSize: 13, fontWeight: 500 }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="sticky top-[108px] z-30 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const TabIcon = tab.icon;
              const t = tabThemes[tab.key];
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="shrink-0 flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all" style={{ background: isActive ? t.gradient : "transparent", color: isActive ? "#fff" : "#9CA3AF", fontSize: 10, fontWeight: isActive ? 800 : 600, fontFamily: "Poppins", minWidth: 60 }}>
                  <TabIcon className="w-3.5 h-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white border-b border-[#E5E7EB]/60">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>ZONE GEOGRAPHIQUE</label>
                <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full mt-1 px-3 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] outline-none" style={{ fontSize: 12 }}>
                  {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>MODE D'ACHAT</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {quantityModes.map((m) => {
                    const MIcon = m.icon;
                    return (
                      <button key={m.key} onClick={() => setQuantityMode(m.key)} className="py-2 rounded-xl text-center transition-all" style={{ background: quantityMode === m.key ? theme.gradient : "#F8FAFC", color: quantityMode === m.key ? "#fff" : "#6B7280", fontSize: 9, fontWeight: 700, border: `1px solid ${quantityMode === m.key ? "transparent" : "#E5E7EB"}` }}>
                        <MIcon className="w-3.5 h-3.5 mx-auto mb-0.5" />{m.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>TRIER PAR</label>
                <div className="flex gap-1 mt-1">
                  {([["prixMin", "Prix min"], ["prixMoyen", "Prix moyen"], ["economie", "Economie"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setSortBy(k)} className="flex-1 py-2 rounded-xl transition-all" style={{ background: sortBy === k ? theme.accent : "#F8FAFC", color: sortBy === k ? "#fff" : "#6B7280", fontSize: 10, fontWeight: 600, border: `1px solid ${sortBy === k ? "transparent" : "#E5E7EB"}` }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-3">

        {/* ═══════════════════════════════════
             TAB: COMPARATIF
           ═══════════════════════════════════ */}
        {activeTab === "comparatif" && (
          <div className="space-y-3">
            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setSelectedCategory("Toutes")} className="shrink-0 px-3.5 py-1.5 rounded-full transition-all" style={{ background: selectedCategory === "Toutes" ? theme.accent : "white", color: selectedCategory === "Toutes" ? "#fff" : "#6B7280", fontSize: 11, fontWeight: 600, border: `1px solid ${selectedCategory === "Toutes" ? "transparent" : "#E5E7EB"}` }}>Toutes</button>
              {categories.map((cat) => {
                const cc = categoryColors[cat.name] || cat.color;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className="shrink-0 px-3.5 py-1.5 rounded-full transition-all" style={{ background: selectedCategory === cat.name ? cc : "white", color: selectedCategory === cat.name ? "#fff" : "#6B7280", fontSize: 11, fontWeight: 600, border: `1px solid ${selectedCategory === cat.name ? "transparent" : "#E5E7EB"}` }}>{cat.name}</button>
                );
              })}
            </div>

            {/* Info bar, compact */}
            <div className="rounded-xl p-2 flex items-center gap-2 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}20` }}>
              <Lightbulb className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              <p style={{ fontSize: 9, color: "#374151" }}>
                Mode <strong>{quantityModes.find((m) => m.key === quantityMode)?.short}</strong>
                {selectedZone !== "Toutes zones" && <> . {selectedZone}</>}
                {" "}. Prix vs enseignes & marches.
              </p>
            </div>

            {/* Count */}
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                {filteredComparisons.length} produit{filteredComparisons.length > 1 ? "s" : ""}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                Trie par {sortBy === "economie" ? "economie" : sortBy === "prixMin" ? "prix min" : "prix moyen"}
              </p>
            </div>

            {/* Cards */}
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
              {filteredComparisons.map((entry, i) => {
                const bestPrice = getPriceByMode(entry);
                const catColor = categoryColors[entry.category] || "#6B7280";
                return (
                  <motion.div key={entry.productId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }} onClick={() => openEntry(entry)} className="bg-white rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border border-[#E5E7EB] hover:border-[#D1D5DB]">
                    {/* Category color top stripe */}
                    <div className="h-[2px]" style={{ background: catColor }} />
                    <div className="flex gap-0">
                      {/* Thumbnail */}
                      <div className="w-[72px] sm:w-24 shrink-0 relative min-h-[90px]">
                        <img src={entry.image} alt={entry.productName} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute top-1 left-1">
                          <span className="px-1 py-px rounded text-white" style={{ fontSize: 7, fontWeight: 700, background: catColor }}>{entry.category}</span>
                        </div>
                        {entry.isSelection && (
                          <div className="absolute bottom-1 left-1">
                            <span className="px-1 py-px rounded bg-[#D97706] text-white flex items-center gap-0.5" style={{ fontSize: 6, fontWeight: 800 }}>
                              <Sparkles className="w-2 h-2" /> TOP
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(entry.productId, entry.productName); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                          title={bookmarks.includes(entry.productId) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Bookmark className="w-2.5 h-2.5" style={{ color: bookmarks.includes(entry.productId) ? "#E11D2E" : "#9CA3AF", fill: bookmarks.includes(entry.productId) ? "#E11D2E" : "transparent" }} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-2 min-w-0">
                        <h4 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, color: "#0F172A" }}>{entry.productName}</h4>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15, color: catColor }}>{formatPrice(bestPrice)}</span>
                          <span className="text-muted-foreground" style={{ fontSize: 8 }}>/{entry.unit}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="px-1.5 py-px rounded-full flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 700, background: `${catColor}10`, color: catColor }}>
                            <Percent className="w-2 h-2" /> -{entry.economieVsExterne}%
                          </span>
                          <span className="flex items-center gap-0.5 px-1 py-px rounded-full" style={{ fontSize: 7, fontWeight: 700, color: entry.evolution7j < 0 ? "#059669" : entry.evolution7j > 0 ? "#EF4444" : "#9CA3AF", background: entry.evolution7j < 0 ? "#ECFDF5" : entry.evolution7j > 0 ? "#FEF2F2" : "#F3F4F6" }}>
                            {entry.evolution7j < 0 ? <TrendingDown className="w-2 h-2" /> : entry.evolution7j > 0 ? <TrendingUp className="w-2 h-2" /> : <Minus className="w-2 h-2" />}
                            {Math.abs(entry.evolution7j)}%
                          </span>
                        </div>

                        {/* Price comparison bar */}
                        <div className="mt-1.5 relative h-1 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(15, 100 - entry.economieVsExterne * 1.8)}%`, background: catColor }} />
                          <div className="absolute inset-y-0 right-0 rounded-full bg-[#EF4444]/25" style={{ width: `${Math.min(50, entry.economieVsExterne * 1.8)}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 7, fontWeight: 700, color: catColor }}>IPPOO</span>
                          <span style={{ fontSize: 7, fontWeight: 700, color: "#EF4444" }}>Enseignes</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredComparisons.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#9CA3AF" }}>Aucun produit trouve</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>Modifiez vos filtres ou votre recherche.</p>
              </div>
            )}

            {/* Category image showcase, compact */}
            {selectedCategory !== "Toutes" && categoryImages[selectedCategory] && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden relative" style={{ height: 80 }}>
                <img src={categoryImages[selectedCategory]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${categoryColors[selectedCategory] || "#0F172A"}CC, ${categoryColors[selectedCategory] || "#0F172A"}60)` }} />
                <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                  <div>
                    <h4 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15 }}>{selectedCategory}</h4>
                    <p className="text-white/60" style={{ fontSize: 10 }}>{filteredComparisons.length} produits . {externalStores.length} enseignes</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Compact CTA bar */}
            <div className="rounded-xl bg-[#0F172A] p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[#FBBF24] truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11, fontStyle: "italic" }}>"{slogans[filteredComparisons.length % slogans.length]}"</p>
                <p className="text-white/40" style={{ fontSize: 9 }}>12 000+ acheteurs actifs</p>
              </div>
              <button onClick={() => navigate("/explorer")} className="px-3 py-2 rounded-lg text-white shrink-0 active:scale-95 transition-transform" style={{ background: theme.accent, fontFamily: "Poppins", fontWeight: 700, fontSize: 10 }}>
                <ShoppingCart className="w-3 h-3 inline mr-1" />Acheter
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
             TAB: EXTERNE
           ═══════════════════════════════════ */}
        {activeTab === "externe" && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}20` }}>
              <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: theme.accent }}>
                <Globe className="w-4 h-4" /> {externalStores.length} enseignes comparees
              </h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>
                Prix suivis en Afrique de l'Ouest, supermarches, hypermarches et marches.
              </p>
            </div>

            {(["supermarche", "hypermarche", "marche"] as const).map((type) => {
              const TypeIcon = storeTypeLabels[type].icon;
              return (
                <div key={type}>
                  <h4 className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}>
                    <TypeIcon className="w-3.5 h-3.5" style={{ color: storeTypeLabels[type].color }} />
                    {type === "supermarche" ? "Supermarches" : type === "hypermarche" ? "Hypermarches" : "Marches traditionnels"}
                  </h4>
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
                    {externalStores.filter((s) => s.type === type).map((store) => {
                      const storeComparisons = allComparisons.filter((c) => c.externalPrices.some((ep) => ep.store.id === store.id));
                      const avgDiff = storeComparisons.length > 0
                        ? Math.round(storeComparisons.reduce((a, c) => { const ep = c.externalPrices.find((ep) => ep.store.id === store.id); return a + (ep ? ((ep.price - c.prixIppoo) / c.prixIppoo) * 100 : 0); }, 0) / storeComparisons.length)
                        : 0;
                      const StoreIcon = store.icon;

                      return (
                        <motion.div key={store.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[#E5E7EB] p-3 hover:border-[#D1D5DB] transition-colors">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${store.color}12` }}>
                              <StoreIcon className="w-4 h-4" style={{ color: store.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>{store.name}</h5>
                              <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 9 }}>
                                <MapPin className="w-2.5 h-2.5" /> {store.location}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 14, color: "#EF4444" }}>+{avgDiff}%</p>
                              <p className="text-muted-foreground" style={{ fontSize: 7 }}>vs IPPOO</p>
                            </div>
                          </div>

                          {/* Bar */}
                          <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden flex mb-1">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(20, 100 - avgDiff)}%`, background: theme.accent }} />
                            <div className="h-full rounded-full bg-[#EF4444]/40" style={{ width: `${Math.min(80, avgDiff)}%` }} />
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 700, color: theme.accent }}>
                              <CheckCircle2 className="w-2.5 h-2.5" /> IPPOO -cher
                            </span>
                            <span className="text-muted-foreground" style={{ fontSize: 8 }}>{storeComparisons.length} prod.</span>
                          </div>

                          {/* Top 3 products */}
                          <div className="space-y-1">
                            {storeComparisons
                              .map((c) => { const ep = c.externalPrices.find((ep) => ep.store.id === store.id); return { ...c, extPrice: ep?.price || 0, diff: ep ? Math.round(((ep.price - c.prixIppoo) / ep.price) * 100) : 0 }; })
                              .sort((a, b) => b.diff - a.diff).slice(0, 3)
                              .map((item) => (
                                <div key={item.productId} onClick={() => openEntry(item)} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-[#F8FAFC] transition-colors" style={{ background: `${theme.accent}05` }}>
                                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0"><img src={item.image} alt="" className="w-full h-full object-cover" /></div>
                                  <span className="flex-1 truncate" style={{ fontSize: 10, fontWeight: 600 }}>{item.productName}</span>
                                  <div className="text-right shrink-0">
                                    <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>{formatPrice(item.prixIppoo)}</span>
                                    <span className="mx-1 text-muted-foreground" style={{ fontSize: 8 }}>vs</span>
                                    <span className="line-through text-muted-foreground" style={{ fontSize: 9 }}>{formatPrice(item.extPrice)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Summary CTA, compact */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: theme.gradient }}>
              <Trophy className="w-8 h-8 text-white/80 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 13 }}>IPPOO, meilleur allie prix</h4>
                <p className="text-white/60" style={{ fontSize: 9 }}>-18% vs supermarches . -12% vs marches</p>
              </div>
              <button onClick={() => setActiveTab("comparatif")} className="bg-white px-3 py-2 rounded-lg shrink-0 active:scale-95 transition-transform" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 10, color: theme.accent }}>
                Comparer <ArrowRight className="inline w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
             TAB: SELECTION IPPOO
           ═══════════════════════════════════ */}
        {activeTab === "selection" && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}20` }}>
              <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: theme.accent }}>
                <Sparkles className="w-4 h-4" /> Notre selection
              </h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>
                Meilleurs rapports qualite-prix selectionnes par IPPOO.
              </p>
            </div>

            {/* Criteria, inline */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {[
                { icon: Award, label: "Prix garanti", color: "#059669" },
                { icon: BadgeCheck, label: "Verifies", color: "#4F46E5" },
                { icon: TrendingDown, label: "En baisse", color: "#D97706" },
                { icon: Users, label: "Demande", color: "#E11D68" },
              ].map((c, i) => {
                const CIcon = c.icon;
                return (
                  <div key={i} className="shrink-0 flex items-center gap-1 px-2 py-1 bg-white rounded-full border border-[#E5E7EB]">
                    <CIcon className="w-3 h-3" style={{ color: c.color }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: "#374151" }}>{c.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Selection grid */}
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
              {selectionProducts.map((entry, i) => {
                const catColor = categoryColors[entry.category] || "#6B7280";
                return (
                  <motion.div key={entry.productId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => openEntry(entry)} className="bg-white rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border" style={{ borderColor: `${theme.accent}25` }}>
                    <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${catColor}, ${theme.accent})` }} />
                    <div className="flex gap-0">
                      <div className="w-20 sm:w-24 shrink-0 relative min-h-[80px]">
                        <img src={entry.image} alt={entry.productName} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute top-1 left-1">
                          <span className="px-1.5 py-px rounded text-white flex items-center gap-0.5" style={{ fontSize: 7, fontWeight: 800, background: theme.accent }}>
                            <Sparkles className="w-2 h-2" /> TOP
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-2 min-w-0">
                        <h4 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, color: "#0F172A" }}>{entry.productName}</h4>
                        <p className="text-muted-foreground" style={{ fontSize: 8 }}>{entry.category} . {entry.sellers.length} vendeurs</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15, color: catColor }}>{formatPrice(getPriceByMode(entry))}</span>
                          <span className="text-muted-foreground" style={{ fontSize: 8 }}>/{entry.unit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-px rounded-full" style={{ fontSize: 8, fontWeight: 700, background: `${catColor}10`, color: catColor }}>-{entry.economieVsExterne}%</span>
                          {entry.evolution7j < 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 600 }}>
                              <TrendingDown className="w-2.5 h-2.5" /> En baisse
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* How we select, compact */}
            <div className="rounded-xl p-3 flex items-start gap-2.5 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}15` }}>
              <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.accent }} />
              <div>
                <h4 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11, color: "#92400E" }}>Comment on selectionne ?</h4>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10, lineHeight: 1.4 }}>
                  Analyse prix, fiabilite vendeurs, tendances et ecart enseignes, seuls les meilleurs y figurent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
             TAB: BLOG (with navigation to dedicated pages)
           ═══════════════════════════════════ */}
        {activeTab === "blog" && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}20` }}>
              <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: theme.accent }}>
                <BookOpen className="w-4 h-4" /> Blog & Documentation
              </h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>
                Guides, analyses et conseils pour comprendre les prix.
              </p>
            </div>

            {/* Featured articles, compact */}
            <div>
              <h4 className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}>
                <Zap className="w-3.5 h-3.5" style={{ color: theme.accent }} /> A la une
              </h4>
              <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
                {blogArticles.filter((a) => a.featured).map((article, i) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => navigate(`/comparateur/article/${article.id}`)} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform hover:border-[#D1D5DB] group">
                    <div className="relative h-32 overflow-hidden">
                      <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, background: article.color }}>{article.category}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, lineHeight: "17px" }}>{article.title}</h4>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-muted-foreground line-clamp-1 mb-1.5" style={{ fontSize: 10, lineHeight: "14px" }}>{article.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 9 }}>
                          <span>{article.date}</span>
                          <span>{article.readTime}</span>
                        </div>
                        <span className="flex items-center gap-0.5" style={{ fontSize: 9, fontWeight: 700, color: theme.accent }}>
                          Lire <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* All articles */}
            <div>
              <h4 className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}>
                <BookOpen className="w-3.5 h-3.5" style={{ color: theme.accent }} /> Tous les articles
              </h4>
              <div className="space-y-1.5 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
                {blogArticles.filter((a) => !a.featured).map((article, i) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => navigate(`/comparateur/article/${article.id}`)} className="bg-white rounded-xl border border-[#E5E7EB] p-2 flex gap-2.5 cursor-pointer active:scale-[0.98] transition-transform hover:border-[#D1D5DB]">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <img src={article.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="px-1 py-0 rounded inline-block" style={{ fontSize: 7, fontWeight: 700, color: article.color, background: `${article.color}15` }}>{article.category}</span>
                      <h5 className="truncate" style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{article.title}</h5>
                      <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 8 }}>
                        <span>{article.date}</span><span>.</span><span>{article.readTime}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 self-center" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Newsletter CTA, compact */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: theme.gradient }}>
              <BookOpen className="w-7 h-7 text-white/80 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 12 }}>Restez informe</h4>
                <p className="text-white/60" style={{ fontSize: 9 }}>Alertes prix et guides dans vos notifications.</p>
              </div>
              <button onClick={toggleWatch} className="bg-white px-3 py-2 rounded-lg shrink-0 active:scale-95 transition-transform" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 10, color: theme.accent }}>
                {watching ? "Activé ✓" : "Activer"}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
             TAB: PROFILS
           ═══════════════════════════════════ */}
        {activeTab === "profils" && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 border" style={{ background: theme.accentLight, borderColor: `${theme.accent}20` }}>
              <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: theme.accent }}>
                <Target className="w-4 h-4" /> Le bon comparatif selon vous
              </h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>
                Comparez sur des bases coherentes selon votre activite.
              </p>
            </div>

            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
              {userProfiles.map((profile, i) => {
                const PIcon = profile.icon;
                return (
                  <motion.div key={profile.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#D1D5DB] transition-colors">
                    <div className="h-[2px]" style={{ background: profile.color }} />
                    <div className="p-3">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${profile.color}12` }}>
                          <PIcon className="w-4 h-4" style={{ color: profile.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>{profile.label}</h4>
                          <p className="text-muted-foreground" style={{ fontSize: 9 }}>{profile.desc}</p>
                        </div>
                      </div>
                      <div className="rounded-lg p-2 flex items-start gap-1.5 border border-[#E5E7EB]/60" style={{ background: `${profile.color}05` }}>
                        <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: profile.color }} />
                        <p style={{ fontSize: 10, lineHeight: "14px", color: "#374151" }}>{profile.tip}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 600 }}>Mode :</span>
                        <button onClick={() => { setQuantityMode(profile.mode); setActiveTab("comparatif"); toast.success(`Mode ${quantityModes.find((m) => m.key === profile.mode)?.label} active`); }} className="px-2.5 py-1 rounded-lg text-white flex items-center gap-1 active:scale-95 transition-transform" style={{ background: profile.color, fontSize: 9, fontWeight: 700 }}>
                          {quantityModes.find((m) => m.key === profile.mode)?.short} <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Guarantees, compact */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
              <h4 className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11 }}>
                <ShieldCheck className="w-4 h-4" style={{ color: theme.accent }} /> La difference IPPOO
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {[
                  "Bases identiques (zone, qte)",
                  "Detail / semi-gros / gros",
                  "Enseignes & marches externes",
                  "Tendances en temps reel",
                  "Alerte ecart > 15%",
                  "Vendeurs verifies",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: theme.accentLight }}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: theme.accent }} />
                    <span style={{ fontSize: 9, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MARKET GALLERY, compact ── */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 mb-2">
          {[IMG.womanVendor, IMG.groceryStore, IMG.textileMarket, IMG.entrepreneur].map((img, i) => (
            <div key={i} className="rounded-lg overflow-hidden relative" style={{ height: 50 }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* ── SUBSCRIBE BANNER, compact ── */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E5E7EB] bg-white mb-2">
          <Bell className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11 }}>Alertes prix</p>
            <p className="text-muted-foreground" style={{ fontSize: 9 }}>Prix en baisse ? On vous previent.</p>
          </div>
          <button onClick={toggleWatch} className="px-2.5 py-1.5 rounded-lg text-white shrink-0 active:scale-95 transition-transform" style={{ background: watching ? "#16A34A" : theme.accent, fontSize: 9, fontWeight: 700 }}>
            {watching ? "Abonné ✓" : "S'abonner"}
          </button>
        </div>

        {/* ── COUPON ── */}
        <div>
          <CouponStrip code="COMPARE5" label="1er comparatif" discount="-5% sur le meilleur prix trouve" condition="Valable sur votre 1ere commande passee depuis le comparateur" color="#0F172A" expiry="Offre permanente" />
        </div>
      </div>

    </div>
  );
}
