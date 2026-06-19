import type React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  ArrowLeft,
  Tag,
  Sparkles,
  Layers,
  TrendingUp,
  Package,
  X,
} from "lucide-react";
import { CATALOG, CatalogCategory, CatalogItem, categoryItemCount } from "../data/catalog";
import { allProducts } from "./mock-data";
import { catalogIdForMainCategory, inferSubcategory } from "../data/product-catalog-link";
import { CategoryIcon } from "./category-icon";

const PRODUCTS_BY_CATALOG_ID = (() => {
  const m = new Map<string, number>();
  for (const p of allProducts) {
    const id = (p as { catalogId?: string }).catalogId ?? catalogIdForMainCategory(p.category);
    if (!id) continue;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
})();

const PRODUCTS_BY_LEAF = (() => {
  const m = new Map<string, Map<string, number>>();
  for (const p of allProducts) {
    const id = (p as { catalogId?: string }).catalogId ?? catalogIdForMainCategory(p.category);
    if (!id) continue;
    const sub = inferSubcategory(p.name, id, (p as { subcategory?: string }).subcategory)?.name ?? "Autres";
    if (!m.has(id)) m.set(id, new Map());
    const bucket = m.get(id)!;
    bucket.set(sub, (bucket.get(sub) ?? 0) + 1);
  }
  return m;
})();

const TOTAL_PRODUCTS = Array.from(PRODUCTS_BY_CATALOG_ID.values()).reduce((a, b) => a + b, 0);
const TOTAL_LEAVES = CATALOG.reduce((acc, c) => acc + categoryItemCount(c), 0);

function lighten(hex: string, percent: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * percent);
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function matchesQuery(item: CatalogItem, q: string): boolean {
  if (!q) return true;
  if (item.name.toLowerCase().includes(q)) return true;
  return !!item.children?.some((c) => matchesQuery(c, q));
}

function filterItems(items: CatalogItem[], q: string): CatalogItem[] {
  if (!q) return items;
  return items
    .filter((i) => matchesQuery(i, q))
    .map((i) => ({ ...i, children: i.children ? filterItems(i.children, q) : undefined }));
}

function ItemNode({
  item, path, depth, onPick, leafCounts,
}: {
  item: CatalogItem;
  path: string;
  depth: number;
  onPick: (path: string) => void;
  leafCounts?: Map<string, number>;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = !!item.children?.length;
  const fullPath = `${path} › ${item.name}`;
  const count = leafCounts?.get(item.name) ?? 0;

  if (!hasChildren) {
    return (
      <button
        onClick={() => onPick(fullPath)}
        className="group w-full flex items-center gap-2 py-2 pr-3 rounded-xl hover:bg-[#FFF7ED] active:bg-[#FFE9D6] text-left transition-colors"
        style={{ paddingLeft: `${depth * 14 + 10}px`, fontSize: 13 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]/40 group-hover:bg-[#FF6A00] transition-colors shrink-0" />
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
        ) : (
          <Tag className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#FF6A00] shrink-0" strokeWidth={2.2} />
        )}
        <span className="flex-1 truncate">{item.name}</span>
        {count > 0 ? (
          <span
            className="px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A]"
            style={{ fontSize: 10, fontWeight: 800 }}
          >
            {count}
          </span>
        ) : null}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2 pr-3 rounded-xl hover:bg-muted text-left transition-colors"
        style={{ paddingLeft: `${depth * 14 + 10}px`, fontSize: 13, fontWeight: 700 }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.span>
        {item.image && (
          <img src={item.image} alt="" loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
        )}
        <span className="flex-1 truncate">{item.name}</span>
        <span
          className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          {item.children!.length}
        </span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {item.children!.map((c, i) => (
            <ItemNode
              key={`${c.name}-${i}`}
              item={c}
              path={fullPath}
              depth={depth + 1}
              onPick={onPick}
              leafCounts={leafCounts}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function StatChip({ Icon, label, value, tone = "neutral" }: { Icon: typeof Layers; label: string; value: string | number; tone?: "neutral" | "warm" | "cool" }) {
  const palette = {
    neutral: { bg: "#F4F5F7", fg: "#1F2937" },
    warm:    { bg: "#FFF1E0", fg: "#9A3412" },
    cool:    { bg: "#E0F2FE", fg: "#075985" },
  }[tone];
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: palette.bg, color: palette.fg, fontSize: 11, fontWeight: 700 }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      <span>{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

export function CataloguePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const [query, setQuery] = useState("");
  const active = useMemo<CatalogCategory | undefined>(
    () => CATALOG.find((c) => c.id === activeId),
    [activeId],
  );

  const q = query.trim().toLowerCase();
  const filteredCats = useMemo(() => {
    if (!q) return CATALOG;
    return CATALOG.filter(
      (c) => c.name.toLowerCase().includes(q) || c.children.some((i) => matchesQuery(i, q)),
    );
  }, [q]);

  const onPickLeaf = (path: string) => {
    navigate(`/explorer?q=${encodeURIComponent(path.split("›").pop()!.trim())}`);
  };

  /* ───────────── Vue Catégorie active ───────────── */
  if (active) {
    const items = q ? filterItems(active.children, q) : active.children;
    const grad = `linear-gradient(135deg, ${active.color} 0%, ${lighten(active.color, 0.35)} 100%)`;
    const productCount = PRODUCTS_BY_CATALOG_ID.get(active.id) ?? 0;

    return (
      <div className="max-w-5xl mx-auto p-4 pb-24">
        <nav className="flex items-center gap-1.5 mb-3 text-muted-foreground" style={{ fontSize: 12 }}>
          <button onClick={() => setParams({})} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Catalogue
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="truncate" style={{ fontWeight: 700, color: active.color }}>{active.name}</span>
        </nav>

        <div className="bg-white border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${active.color}15` }}>
            <CategoryIcon name={active.icon} className="w-7 h-7" strokeWidth={2} style={{ color: active.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[#757575]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
              CATÉGORIE · {active.code}
            </p>
            <h2 className="truncate" style={{ fontWeight: 700, fontSize: 18, color: "#222" }}>
              {active.name}
            </h2>
            <div className="flex flex-wrap gap-3 mt-1 text-[#757575]" style={{ fontSize: 12 }}>
              <span>{categoryItemCount(active)} sous-rubriques</span>
              <span>·</span>
              <span><span className="text-[#FF6A00]" style={{ fontWeight: 700 }}>{productCount}</span> produits</span>
            </div>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans cette catégorie…"
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-white outline-none focus:border-[#FF6A00] transition-colors shadow-sm"
            style={{ fontSize: 13 }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Effacer"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!q && (
          <div className="mb-4">
            <p className="text-[#757575] mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Parcourir par rubrique
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {active.children.map((s, i) => {
                const leafCount = PRODUCTS_BY_LEAF.get(active.id)?.get(s.name) ?? 0;
                return (
                  <button
                    key={`${s.name}-${i}`}
                    onClick={() => onPickLeaf(`${active.name} › ${s.name}`)}
                    className="group bg-white border border-border rounded-lg overflow-hidden hover:border-[#FF6A00] hover:shadow-sm transition-all text-left"
                  >
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {s.image && (
                        <img
                          src={s.image}
                          alt={s.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      {leafCount > 0 && (
                        <span
                          className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[#16A34A] backdrop-blur"
                          style={{ fontSize: 9, fontWeight: 800 }}
                        >
                          {leafCount}
                        </span>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[#222] group-hover:text-[#FF6A00] transition-colors" style={{ fontSize: 11, fontWeight: 600 }}>
                        {s.name}
                      </p>
                      {s.children && (
                        <p className="text-[#757575]" style={{ fontSize: 9 }}>
                          {s.children.length} items
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl p-2 shadow-sm">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground" style={{ fontSize: 13 }}>Aucun résultat dans cette catégorie.</p>
            </div>
          ) : (
            items.map((it, i) => (
              <ItemNode
                key={`${it.name}-${i}`}
                item={it}
                path={active.name}
                depth={0}
                onPick={onPickLeaf}
                leafCounts={PRODUCTS_BY_LEAF.get(active.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  /* ───────────── Vue Liste des méga-catégories ───────────── */
  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      {/* Alibaba-style header */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <nav className="flex items-center gap-1.5 text-[#757575] mb-2" style={{ fontSize: 12 }}>
          <button onClick={() => navigate("/")} className="hover:text-[#FF6A00]">Accueil</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#222]" style={{ fontWeight: 600 }}>Toutes les catégories</span>
        </nav>
        <h1 style={{ fontWeight: 700, fontSize: 20, color: "#222" }}>Toutes les catégories</h1>
        <p className="text-[#757575] mt-0.5" style={{ fontSize: 12 }}>
          {CATALOG.length} catégories · {TOTAL_LEAVES.toLocaleString("fr-FR")} sous-rubriques · {TOTAL_PRODUCTS.toLocaleString("fr-FR")} produits
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une catégorie, sous-rubrique ou produit…"
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-white outline-none focus:border-[#FF6A00] transition-colors shadow-sm"
          style={{ fontSize: 13 }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Effacer"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <StatChip Icon={Layers} label="catégories" value={filteredCats.length} />
        <StatChip Icon={Package} label="produits" value={TOTAL_PRODUCTS.toLocaleString("fr-FR")} tone="warm" />
        <StatChip Icon={Sparkles} label="sous-rubriques" value={TOTAL_LEAVES.toLocaleString("fr-FR")} tone="cool" />
      </div>

      {/* Grid */}
      {filteredCats.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Aucune catégorie trouvée</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Essayez un autre mot-clé.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {filteredCats.map((c) => {
            const productCount = PRODUCTS_BY_CATALOG_ID.get(c.id) ?? 0;
            const previews = c.children.slice(0, 3);
            return (
              <motion.button
                key={c.id}
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setParams({ c: c.id })}
                className="group relative text-left bg-white border border-border rounded-lg overflow-hidden transition-colors hover:border-[#FF6A00] hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="truncate" style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</p>
                    <p className="opacity-90" style={{ fontSize: 10 }}>
                      <span style={{ fontWeight: 700 }}>{productCount}</span> produits · {c.children.length} rubriques
                    </p>
                  </div>
                </div>
                <ul className="p-2.5 space-y-0.5">
                  {previews.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5 truncate text-[#757575] group-hover:text-[#FF6A00] transition-colors" style={{ fontSize: 11 }}>
                      {s.image && (
                        <img src={s.image} alt="" loading="lazy" className="w-4 h-4 rounded object-cover shrink-0 border border-border" />
                      )}
                      <span className="truncate">› {s.name}</span>
                    </li>
                  ))}
                  {c.children.length > 3 && (
                    <li className="text-[#FF6A00]" style={{ fontSize: 11, fontWeight: 600 }}>
                      + {c.children.length - 3} autres
                    </li>
                  )}
                </ul>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
