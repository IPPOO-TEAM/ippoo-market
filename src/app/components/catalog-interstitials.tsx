import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Flame, Sparkles, Compass, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "./product-card";
import adImgKitchen from "../../imports/photo_3_2026-05-18_23-15-52-1.jpg";
import adImgJewelryTray from "../../imports/photo_5_2026-05-18_23-15-52-1.jpg";
import adImgSneakersPink from "../../imports/photo_8_2026-05-18_23-15-52-1.jpg";
import adImgGoldBracelets from "../../imports/photo_10_2026-05-18_23-15-52-1.jpg";
import adImgDunkOrange from "../../imports/photo_13_2026-05-18_23-15-52-1.jpg";
import adImgSneakersGreen from "../../imports/photo_15_2026-05-18_23-15-52-1.jpg";
import adImgBoutique from "../../imports/photo_21_2026-05-18_23-15-52.jpg";

type Product = Parameters<typeof ProductCard>[0];

type ThemeKey = "dontmiss" | "foryou" | "inspirations" | "personalized";

const THEMES: Record<ThemeKey, {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
  link: string;
}> = {
  dontmiss: {
    title: "Ne les manquez pas",
    subtitle: "Stocks limités, prix grossiste",
    icon: Flame,
    accent: "#E11D2E",
    bg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    link: "/explorer",
  },
  foryou: {
    title: "Sélection pour vous",
    subtitle: "D'après vos catégories préférées",
    icon: Sparkles,
    accent: "#7C3AED",
    bg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    link: "/explorer",
  },
  inspirations: {
    title: "Inspirations",
    subtitle: "Idées de mise en rayon et tendances",
    icon: Compass,
    accent: "#0EA5E9",
    bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
    link: "/explorer",
  },
  personalized: {
    title: "Sélection personnalisée",
    subtitle: "Recommandé selon votre activité",
    icon: Wand2,
    accent: "#16A34A",
    bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    link: "/explorer",
  },
};

/* ────────────────────────────────────────────
   Rayon thématique horizontal scrollable
   (séparateur visuel, comme une section)
   ──────────────────────────────────────────── */
export function ThemedProductRow({
  theme,
  products,
}: {
  theme: ThemeKey;
  products: Product[];
}) {
  const navigate = useNavigate();
  const t = THEMES[theme];
  const Icon = t.icon;
  if (products.length === 0) return null;
  return (
    <section
      className="rounded-2xl border border-border p-3 sm:p-4 my-4"
      style={{ background: t.bg }}
    >
      <header className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: t.accent }}
          >
            <Icon className="w-4.5 h-4.5 text-white" />
          </span>
          <div className="min-w-0">
            <h3
              className="truncate"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#111827" }}
            >
              {t.title}
            </h3>
            <p className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              {t.subtitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(t.link)}
          className="shrink-0 inline-flex items-center gap-0.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
          style={{ fontSize: 12, fontWeight: 700, color: t.accent }}
        >
          Voir tout <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>
      <div
        className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {products.map((p) => (
          <div
            key={`${theme}-${p.id}`}
            className="snap-start shrink-0"
            style={{ width: 168 }}
          >
            <ProductCard {...p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   Tuile publicitaire intégrée à la grille
   (col-span-2 — occupe l'emplacement de 2 produits)
   ──────────────────────────────────────────── */
export type AdSlide = {
  title: string;
  subtitle: string;
  cta: string;
  bg: string; // tailwind gradient classes, e.g. "from-[#FF6A00] to-[#FF4400]"
  link: string;
  badge?: string;
  image?: string;
  imageAlt?: string;
};

const DEFAULT_AD_SLIDES: AdSlide[] = [
  {
    // photo_3 — petit électroménager argenté/noir sur plan de travail bois
    title: "ÉQUIPEZ VOTRE CUISINE PRO",
    subtitle: "Mixeurs, cafetières, grille-pain — tarifs grossistes garantis",
    cta: "Voir le rayon",
    bg: "from-[#0F172A] to-[#334155]",
    link: "/explorer?cat=Maison",
    badge: "Électroménager",
    image: adImgKitchen,
    imageAlt: "Petit électroménager de cuisine en inox",
  },
  {
    // photo_5 — bijouterie luxe sur satin doré
    title: "COLLECTION OR & FINESSE",
    subtitle: "Colliers, bagues et bracelets — directement importateur",
    cta: "Découvrir",
    bg: "from-[#78350F] to-[#B45309]",
    link: "/explorer?cat=Bijoux",
    badge: "Luxe",
    image: adImgJewelryTray,
    imageAlt: "Bijoux dorés sur tissu de satin",
  },
  {
    // photo_8 — sneakers New Balance roses sur marbre, ambiance féminine
    title: "SNEAKERS LIFESTYLE FEMME",
    subtitle: "Modèles tendance, prix de gros dès 6 paires",
    cta: "Je shoppe",
    bg: "from-[#9F1239] to-[#BE185D]",
    link: "/explorer?cat=Mode",
    badge: "Tendance",
    image: adImgSneakersPink,
    imageAlt: "Sneakers New Balance roses sur sol en marbre",
  },
  {
    // photo_10 — étalage de bracelets en or massif
    title: "BRACELETS OR — STOCK BOUTIQUE",
    subtitle: "Réassort vendeurs : modèles plaqués & massifs disponibles",
    cta: "Voir les lots",
    bg: "from-[#7C2D12] to-[#92400E]",
    link: "/explorer?cat=Bijoux",
    badge: "Réassort",
    image: adImgGoldBracelets,
    imageAlt: "Bracelets en or exposés en boutique",
  },
  {
    // photo_13 — Nike Dunk Low orange sur fond orange vif
    title: "SNEAKERS STREET — ARRIVAGE",
    subtitle: "Modèles Dunk, Air & Co. en quantité — prix dégressif",
    cta: "J'en profite",
    bg: "from-[#EA580C] to-[#C2410C]",
    link: "/explorer?cat=Mode",
    badge: "Arrivage",
    image: adImgDunkOrange,
    imageAlt: "Sneakers Nike Dunk Low orange et blanches",
  },
  {
    // photo_15 — sneakers New Balance vert/bleu/jaune, ton studio doux
    title: "RUNNING & URBAN MIX",
    subtitle: "Coloris exclusifs — idéal pour boutiques multimarques",
    cta: "Commander",
    bg: "from-[#166534] to-[#1E40AF]",
    link: "/explorer?cat=Mode",
    badge: "Exclu",
    image: adImgSneakersGreen,
    imageAlt: "Sneakers New Balance vertes et bleues",
  },
  {
    // photo_21 — boutique prêt-à-porter, rack coloré + étagère chaussures
    title: "RÉASSORT BOUTIQUE PRÊT-À-PORTER",
    subtitle: "Chemises, robes et chaussures — lots mixtes pour revendeurs",
    cta: "Voir les lots",
    bg: "from-[#1E3A8A] to-[#312E81]",
    link: "/explorer?cat=Mode",
    badge: "Revendeurs",
    image: adImgBoutique,
    imageAlt: "Boutique de prêt-à-porter avec rack de chemises colorées",
  },
];

export function AdTile({
  slides = DEFAULT_AD_SLIDES,
  intervalMs = 4500,
  seed = 0,
}: {
  slides?: AdSlide[];
  intervalMs?: number;
  seed?: number;
}) {
  const navigate = useNavigate();
  const ordered = useMemo(() => {
    if (slides.length <= 1) return slides;
    const start = ((seed % slides.length) + slides.length) % slides.length;
    return [...slides.slice(start), ...slides.slice(0, start)];
  }, [slides, seed]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (ordered.length <= 1) return;
    const id = setInterval(() => setI((x) => (x + 1) % ordered.length), intervalMs);
    return () => clearInterval(id);
  }, [ordered.length, intervalMs]);
  const slide = ordered[i];
  return (
    <div className="col-span-2 rounded-2xl overflow-hidden border border-border bg-white relative h-full min-h-[200px]">
      <AnimatePresence mode="wait">
        <motion.button
          key={i}
          onClick={() => navigate(slide.link)}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 w-full h-full text-left flex"
        >
          {/* Image (droite) */}
          {slide.image && (
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.imageAlt ?? ""}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}
          {/* Voile dégradé gauche → transparent droite pour lisibilité du texte */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${slide.bg}`}
            style={{ opacity: slide.image ? 0.78 : 1, mixBlendMode: "multiply" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* Contenu */}
          <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 w-full">
            <div className="min-w-0 max-w-[70%]">
              {slide.badge && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full bg-white/25 backdrop-blur text-white mb-1.5"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}
                >
                  {slide.badge.toUpperCase()}
                </span>
              )}
              <h3
                className="text-white"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 900,
                  fontSize: 16,
                  lineHeight: 1.15,
                  textShadow: "0 1px 8px rgba(0,0,0,0.35)",
                }}
              >
                {slide.title}
              </h3>
              <p
                className="text-white/95 mt-1 line-clamp-2"
                style={{ fontSize: 11.5, textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}
              >
                {slide.subtitle}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white shadow-sm"
                style={{ fontSize: 11.5, fontWeight: 800, color: "#111827" }}
              >
                {slide.cta} <ChevronRight className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center gap-1">
                {ordered.map((_, idx) => (
                  <span
                    key={idx}
                    className="rounded-full transition-all"
                    style={{
                      width: idx === i ? 16 : 5,
                      height: 5,
                      background: idx === i ? "#FFFFFF" : "rgba(255,255,255,.55)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────
   Mélangeur déterministe (PRNG depuis une seed stable)
   ──────────────────────────────────────────── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type GridItem =
  | { kind: "product"; product: Product }
  | { kind: "ad"; seed: number };

export type CatalogBlock =
  | { kind: "grid"; items: GridItem[] }
  | { kind: "themed"; theme: ThemeKey; products: Product[] };

/**
 * Construit la séquence de blocs : grilles de produits (avec pubs
 * intégrées dans les cellules) entrecoupées de rayons thématiques.
 * Pseudo-aléatoire mais stable pour une signature donnée.
 */
export function buildCatalogBlocks(
  products: Product[],
  signature: string,
  opts: { batchSize?: number; pool?: Product[] } = {},
): CatalogBlock[] {
  const batchSize = opts.batchSize ?? 6;
  const pool = opts.pool && opts.pool.length > 0 ? opts.pool : products;
  if (products.length === 0) return [];

  const rand = mulberry32(hashString(signature || "catalog"));
  const themes: ThemeKey[] = ["dontmiss", "foryou", "inspirations", "personalized"];
  for (let i = themes.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [themes[i], themes[j]] = [themes[j], themes[i]];
  }

  const pickThemed = (idx: number): CatalogBlock => {
    const theme = themes[idx % themes.length];
    const count = Math.min(pool.length, 6 + Math.floor(rand() * 3));
    const start = Math.floor(rand() * Math.max(1, pool.length - count));
    return { kind: "themed", theme, products: pool.slice(start, start + count) };
  };

  const blocks: CatalogBlock[] = [];
  let themedIdx = 0;
  let cursor = 0;
  let batchIdx = 0;

  while (cursor < products.length) {
    const slice = products.slice(cursor, cursor + batchSize);
    cursor += slice.length;

    // Insertion d'une tuile pub dans environ 60% des grilles, sauf la 1re.
    const items: GridItem[] = slice.map((p) => ({ kind: "product" as const, product: p }));
    if (batchIdx > 0 && slice.length >= 3 && rand() < 0.6) {
      // Position d'insertion : entre 1 et items.length-1, sur un index pair pour
      // éviter de casser l'alignement 2-cols sur mobile (l'ad occupe 2 cellules).
      const candidates: number[] = [];
      for (let k = 2; k < items.length; k += 2) candidates.push(k);
      const at = candidates.length > 0 ? candidates[Math.floor(rand() * candidates.length)] : items.length;
      items.splice(at, 0, { kind: "ad", seed: Math.floor(rand() * 1_000_000) });
    }
    blocks.push({ kind: "grid", items });

    if (cursor >= products.length) break;
    batchIdx++;

    // Entre deux grilles : un rayon thématique toutes les 2 grilles environ.
    if (batchIdx % 2 === 0 || rand() < 0.4) {
      blocks.push(pickThemed(themedIdx++));
    }
  }
  return blocks;
}

export function CatalogBlock({ block }: { block: CatalogBlock }) {
  if (block.kind === "themed") {
    return <ThemedProductRow theme={block.theme} products={block.products} />;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 auto-rows-fr">
      {block.items.map((it, idx) =>
        it.kind === "product" ? (
          <ProductCard key={`p-${it.product.id}`} {...it.product} />
        ) : (
          <AdTile key={`ad-${idx}-${it.seed}`} seed={it.seed} />
        ),
      )}
    </div>
  );
}
