import { useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useOnPullRefresh } from "../native/RefreshContext";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  Zap,
  UtensilsCrossed,
  GlassWater,
  Sparkles,
  Shirt,
  Smartphone,
  ArrowLeft,
  Hammer,
  Cog,
  Home,
  Car,
  Trophy,
  Baby,
  BookOpen,
  Package,
  Monitor,
  Crown,
  Store,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { allProducts as mockProducts, categories, formatPrice } from "./mock-data";
import { useStorefrontProducts } from "../data/storefront";
import { FlashPromoBanner } from "./promo-widgets";
import { buildCatalogBlocks, CatalogBlock } from "./catalog-interstitials";
import { catalogIdForMainCategory, inferSubcategory, subcategoryCounts } from "../data/product-catalog-link";
import { VERIFIED_SELLER_NAMES, ORIGINS, COLORS, SIZES, BRANDS } from "../data/marketplace";

const categoryIcons: Record<string, LucideIcon> = {
  Smartphone,
  Zap,
  Shirt,
  Sparkles,
  Home,
  Hammer,
  Cog,
  Car,
  Trophy,
  Baby,
  BookOpen,
  Package,
  Monitor,
  Crown,
  UtensilsCrossed,
  GlassWater,
};

const sortOptions = [
  "Pertinence",
  "Prix croissant",
  "Prix décroissant",
  "Meilleures ventes",
  "Mieux notés",
  "Poids croissant",
  "Poids décroissant",
  "Stock décroissant",
  "MOQ croissant",
  "Nouveautés",
  "Nom A → Z",
];

export function ExplorerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("cat") || null);
  const [selectedSub, setSelectedSub] = useState<string | null>(searchParams.get("sub") || null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Pertinence");
  const [showSort, setShowSort] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [originFilter, setOriginFilter] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxWeight, setMaxWeight] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(12);

  useOnPullRefresh(useCallback(async () => {
    setVisibleCount(12);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Catalogue rafraîchi");
  }, []));

  const serverProducts = useStorefrontProducts();
  const allProducts = useMemo(() => {
    if (!serverProducts.length) return mockProducts;
    const ids = new Set(serverProducts.map((p) => p.id));
    return [...serverProducts, ...mockProducts.filter((p) => !ids.has(p.id))];
  }, [serverProducts]);

  const activeCatalogId = catalogIdForMainCategory(selectedCategory);
  const subCounts = activeCatalogId ? subcategoryCounts(allProducts, activeCatalogId, selectedCategory) : null;
  const subOptions = subCounts
    ? Array.from(subCounts.entries()).sort((a, b) => b[1] - a[1])
    : [];

  const filtered = allProducts.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedSub && activeCatalogId) {
      const sub = inferSubcategory(p.name, activeCatalogId, (p as { subcategory?: string }).subcategory);
      const key = sub?.name ?? "Autres";
      // Support pour les nœuds intermédiaires : si selectedSub n'est pas une leaf exacte,
      // on vérifie si le path de la leaf commence par selectedSub (ex: "11.2 Riz" matchera "Riz blanc")
      const exactMatch = key === selectedSub;
      const pathMatch = sub?.path && sub.path.includes(selectedSub);
      if (!exactMatch && !pathMatch) return false;
    }
    if (inStockOnly && !p.inStock) return false;
    if (verifiedOnly && !VERIFIED_SELLER_NAMES.has(p.seller)) return false;
    const pp = p as { origin?: string; color?: string; size?: string; brand?: string; weightKg?: number };
    if (originFilter && pp.origin !== originFilter) return false;
    if (colorFilter && pp.color !== colorFilter) return false;
    if (sizeFilter && pp.size !== sizeFilter) return false;
    if (brandFilter && pp.brand !== brandFilter) return false;
    if (minRating > 0 && p.rating < minRating) return false;
    if (maxWeight && pp.weightKg !== undefined && pp.weightKg > Number(maxWeight)) return false;
    const q = searchParams.get("q");
    if (q) {
      const needle = q.toLowerCase();
      const hay = `${p.name} ${(p as { vendor?: string }).vendor ?? (p as { seller?: string }).seller ?? ""} ${p.category ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ax = a as { weightKg?: number; stockQty?: number };
    const bx = b as { weightKg?: number; stockQty?: number };
    if (sortBy === "Prix croissant") return a.price - b.price;
    if (sortBy === "Prix décroissant") return b.price - a.price;
    if (sortBy === "Mieux notés") return b.rating - a.rating;
    if (sortBy === "Poids croissant") return (ax.weightKg ?? 0) - (bx.weightKg ?? 0);
    if (sortBy === "Poids décroissant") return (bx.weightKg ?? 0) - (ax.weightKg ?? 0);
    if (sortBy === "Stock décroissant") return (bx.stockQty ?? 0) - (ax.stockQty ?? 0);
    if (sortBy === "MOQ croissant") return a.moq - b.moq;
    if (sortBy === "Nouveautés") return b.id - a.id;
    if (sortBy === "Nom A → Z") return a.name.localeCompare(b.name, "fr");
    return 0;
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const blockSignature = [
    selectedCategory ?? "",
    selectedSub ?? "",
    sortBy,
    searchParams.get("q") ?? "",
    String(visible.length),
  ].join("|");
  const blocks = useMemo(
    () => buildCatalogBlocks(visible, blockSignature, { batchSize: 6, pool: sorted }),
    // visible & sorted dérivent de allProducts + filtres ; la signature capture l'état utile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockSignature],
  );

  return (
    <div>
      {/* Alibaba-style header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-1.5 text-[#757575] mb-2" style={{ fontSize: 12 }}>
            <button onClick={() => navigate("/")} className="hover:text-[#FF6A00]">Accueil</button>
            <span>›</span>
            <span className="text-[#222]" style={{ fontWeight: 600 }}>Explorer</span>
            {selectedCategory && (<><span>›</span><span className="text-[#FF6A00]" style={{ fontWeight: 600 }}>{selectedCategory}</span></>)}
          </nav>
          <h1 className="mb-3" style={{ fontWeight: 700, fontSize: 20, color: "#222" }}>
            Explorer le catalogue
          </h1>
          <div className="flex items-stretch gap-0 rounded-lg border-2 border-[#FF6A00] overflow-hidden bg-white max-w-3xl">
            <Search className="self-center ml-3 w-4 h-4 text-[#757575]" />
            <input
              type="text"
              placeholder="Rechercher par produit, catégorie, vendeur..."
              value={searchParams.get("q") || ""}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set("q", e.target.value);
                navigate({ pathname: "/explorer", search: params.toString() });
              }}
              className="flex-1 min-w-0 px-2 py-2.5 outline-none bg-white"
              style={{ fontSize: 14 }}
            />
            <button className="bg-[#FF6A00] hover:bg-[#FF4400] text-white px-5 transition-colors" style={{ fontSize: 14, fontWeight: 600 }}>
              Rechercher
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Categories chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedSub(null); }}
            className={`shrink-0 px-4 py-2 rounded-xl border transition-all ${
              !selectedCategory ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "bg-white text-foreground border-border"
            }`}
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Toutes
          </button>
          {categories.map((cat) => {
            const CatIcon = categoryIcons[cat.icon] ?? Store;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(selectedCategory === cat.name ? null : cat.name); setSelectedSub(null); }}
                className={`shrink-0 px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? "text-white border-transparent"
                    : "bg-white text-foreground border-border"
                }`}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  ...(selectedCategory === cat.name ? { background: cat.color } : {}),
                }}
              >
                <CatIcon className="w-4 h-4" /> {cat.name}
              </button>
            );
          })}
        </div>

        {/* Subcategories chips */}
        {activeCatalogId && subOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mt-1">
            <button
              onClick={() => setSelectedSub(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg border ${
                !selectedSub ? "bg-foreground text-white border-foreground" : "bg-white text-foreground border-border"
              }`}
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Toutes les sous-catégories
            </button>
            {subOptions.map(([name, count]) => (
              <button
                key={name}
                onClick={() => setSelectedSub(selectedSub === name ? null : name)}
                className={`shrink-0 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  selectedSub === name ? "bg-foreground text-white border-foreground" : "bg-white text-foreground border-border"
                }`}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {name}
                <span className={`px-1.5 py-0.5 rounded ${selectedSub === name ? "bg-white/20" : "bg-muted"}`} style={{ fontSize: 10 }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between py-3 border-b border-border mb-4">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            {sorted.length} produit{sorted.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {sortBy} <ChevronDown className="w-4 h-4" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-border z-10 w-52">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSort(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#FFF7ED] flex items-center justify-between"
                      style={{ fontSize: 13 }}
                    >
                      {opt}
                      {sortBy === opt && <Check className="w-4 h-4 text-[#16A34A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6B00] text-white"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtres
            </button>
          </div>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-white rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Filtres avancés</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Prix min (FCFA)</label>
                    <input type="number" placeholder="0" className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Prix max (FCFA)</label>
                    <input type="number" placeholder="1 000 000" className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>MOQ max</label>
                    <input type="number" placeholder="100" className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Localisation</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option>Toutes les villes</option>
                      <option>Cotonou</option>
                      <option>Porto-Novo</option>
                      <option>Parakou</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Origine</label>
                    <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option value="">Toutes</option>
                      {ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Couleur</label>
                    <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option value="">Toutes</option>
                      {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Taille</label>
                    <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option value="">Toutes</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Marque</label>
                    <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option value="">Toutes</option>
                      {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Note min</label>
                    <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }}>
                      <option value={0}>Toutes</option>
                      <option value={3.5}>≥ 3.5 ★</option>
                      <option value={4}>≥ 4.0 ★</option>
                      <option value={4.5}>≥ 4.5 ★</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Poids max (kg)</label>
                    <input type="number" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} placeholder="-" className="w-full mt-1 px-3 py-2 rounded-lg bg-[#F3F4F6] border-none" style={{ fontSize: 13 }} />
                  </div>
                  <div className="col-span-2 md:col-span-2 flex items-end">
                    <button
                      onClick={() => { setOriginFilter(""); setColorFilter(""); setSizeFilter(""); setBrandFilter(""); setMinRating(0); setMaxWeight(""); setInStockOnly(false); setVerifiedOnly(false); }}
                      className="w-full px-3 py-2 rounded-lg bg-foreground text-white"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#16A34A]"
                    />
                    En stock uniquement
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13 }}>
                    <input type="checkbox" className="w-4 h-4 rounded accent-[#16A34A]" />
                    Livraison disponible
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E8A817]"
                    />
                    Vendeurs vérifiés
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flash promo strip */}
        <div className="mb-4">
          <FlashPromoBanner
            text="⚡ FLASH -25% Alimentaire & Boissons"
            subtext="Utilisez le code GROS10, Valable jusqu'à minuit"
            link="/promos"
            color="#FF6A00"
          />
        </div>

        {/* Catalog blocks: grids interleaved with themed rows + ad carousels */}
        {blocks.map((b, i) => (
          <CatalogBlock key={`${b.kind}-${i}`} block={b} />
        ))}

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6 mb-4">
            <button
              onClick={() => setVisibleCount((c) => c + 12)}
              className="px-8 py-3 bg-[#FF6B00] text-white rounded-xl transition-all active:scale-95 hover:bg-[#E65100]"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
            >
              Voir plus de produits ({sorted.length - visibleCount} restants)
            </button>
          </div>
        )}

        {sorted.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Aucun produit trouvé</h3>
            <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
              Essayez d'ajuster vos filtres ou votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}