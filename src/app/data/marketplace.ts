// Marketplace IPPOO : vendeurs → boutiques → produits.
// Règles d'intégrité :
//  - chaque produit appartient à une boutique (shopId)
//  - chaque boutique appartient à un vendeur (vendorId)
//  - une boutique = UNE et une seule niche (catalogId)
//  - un vendeur peut avoir plusieurs boutiques
//  - chaque image produit est unique (seed picsum déterministe sur l'id)

import { CATALOG, CatalogItem } from "./catalog";
import { MAIN_CATEGORY_TO_CATALOG_ID } from "./product-catalog-link";

export type Vendor = {
  id: string;
  name: string;
  city: string;
  rating: number;
  verified: boolean;
  joined: string;
};

export type Shop = {
  id: string;
  vendorId: string;
  name: string;
  niche: string;        // catalog category id (UNE seule niche)
  nicheName: string;    // libellé de la niche
  city: string;
  rating: number;
  verified: boolean;
};

export type MarketplaceProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  moq: number;
  unit: string;
  seller: string;       // shop.name (compatibilité avec UI existante)
  rating: number;
  category: string;     // libellé court (mock-data)
  inStock: boolean;
  paliers: { qty: number; price: number }[];
  shopId: string;
  vendorId: string;
  catalogId: string;
  subcategory: string;
  subcategoryPath: string;
  origin: string;
  color: string;
  size: string;
  weightKg: number;
  brand: string;
  stockQty: number;
  reference: string;
};

export const VENDORS: Vendor[] = [
  { id: "v-ahouandjinou", name: "Ets Ahouandjinou", city: "Cotonou", rating: 4.8, verified: true, joined: "2019" },
  { id: "v-tokpa", name: "Tokpa Holding", city: "Cotonou", rating: 4.9, verified: true, joined: "2017" },
  { id: "v-proclean", name: "ProClean SARL", city: "Porto-Novo", rating: 4.5, verified: true, joined: "2020" },
  { id: "v-techgros", name: "TechGros Bénin", city: "Cotonou", rating: 4.7, verified: true, joined: "2018" },
  { id: "v-sojagold", name: "Soja Gold Bénin", city: "Parakou", rating: 4.6, verified: true, joined: "2018" },
  { id: "v-importceres", name: "Import Céréales Plus", city: "Cotonou", rating: 4.7, verified: true, joined: "2016" },
  { id: "v-bati", name: "Bati Plus Africa", city: "Cotonou", rating: 4.6, verified: true, joined: "2015" },
  { id: "v-glamour", name: "Glamour Distribution", city: "Cotonou", rating: 4.7, verified: true, joined: "2019" },
  { id: "v-koudjo", name: "Koudjo Frères", city: "Bohicon", rating: 4.4, verified: false, joined: "2021" },
  { id: "v-houenou", name: "Houénou Group", city: "Abomey-Calavi", rating: 4.5, verified: true, joined: "2017" },
  { id: "v-zinsou", name: "Zinsou Trading", city: "Cotonou", rating: 4.6, verified: true, joined: "2018" },
  { id: "v-adjovi", name: "Adjovi Services", city: "Porto-Novo", rating: 4.3, verified: false, joined: "2022" },
  // 25 vendeurs supplémentaires pour atteindre 37 total
  { id: "v-agbodjan", name: "Agbodjan Import-Export", city: "Cotonou", rating: 4.7, verified: true, joined: "2016" },
  { id: "v-dossou", name: "Dossou & Fils", city: "Parakou", rating: 4.5, verified: true, joined: "2019" },
  { id: "v-soglo", name: "Soglo Distribution", city: "Cotonou", rating: 4.8, verified: true, joined: "2015" },
  { id: "v-akpaki", name: "Akpaki Enterprises", city: "Porto-Novo", rating: 4.4, verified: false, joined: "2021" },
  { id: "v-mama-benin", name: "Mama Bénin SARL", city: "Cotonou", rating: 4.9, verified: true, joined: "2014" },
  { id: "v-yehouessi", name: "Yehouessi Trading", city: "Bohicon", rating: 4.3, verified: false, joined: "2022" },
  { id: "v-afrique-ouest", name: "Afrique Ouest Commerce", city: "Cotonou", rating: 4.6, verified: true, joined: "2017" },
  { id: "v-atlantique", name: "Atlantique Négoce", city: "Cotonou", rating: 4.7, verified: true, joined: "2016" },
  { id: "v-benin-market", name: "Bénin Market Plus", city: "Parakou", rating: 4.5, verified: true, joined: "2018" },
  { id: "v-golden-trade", name: "Golden Trade", city: "Cotonou", rating: 4.8, verified: true, joined: "2015" },
  { id: "v-sahel", name: "Sahel Distribution", city: "Malanville", rating: 4.2, verified: false, joined: "2023" },
  { id: "v-kotonu", name: "Kotonu Wholesale", city: "Cotonou", rating: 4.6, verified: true, joined: "2017" },
  { id: "v-african-link", name: "African Link SARL", city: "Cotonou", rating: 4.7, verified: true, joined: "2016" },
  { id: "v-west-trade", name: "West Trade Partners", city: "Porto-Novo", rating: 4.5, verified: true, joined: "2018" },
  { id: "v-benin-express", name: "Bénin Express", city: "Cotonou", rating: 4.8, verified: true, joined: "2015" },
  { id: "v-tropical", name: "Tropical Goods", city: "Parakou", rating: 4.4, verified: false, joined: "2020" },
  { id: "v-excellence", name: "Excellence Distribution", city: "Cotonou", rating: 4.9, verified: true, joined: "2014" },
  { id: "v-meridien", name: "Méridien Commerce", city: "Cotonou", rating: 4.6, verified: true, joined: "2017" },
  { id: "v-oueme", name: "Ouémé Trading", city: "Porto-Novo", rating: 4.5, verified: true, joined: "2019" },
  { id: "v-alibori", name: "Alibori Négoce", city: "Kandi", rating: 4.3, verified: false, joined: "2022" },
  { id: "v-zou", name: "Zou Distribution", city: "Abomey", rating: 4.4, verified: false, joined: "2021" },
  { id: "v-atlantique-sud", name: "Atlantique Sud", city: "Ouidah", rating: 4.6, verified: true, joined: "2018" },
  { id: "v-benin-first", name: "Bénin First Trading", city: "Cotonou", rating: 4.8, verified: true, joined: "2015" },
  { id: "v-couffo", name: "Couffo Commerce", city: "Aplahoué", rating: 4.2, verified: false, joined: "2023" },
  { id: "v-mono", name: "Mono Distribution", city: "Lokossa", rating: 4.5, verified: true, joined: "2019" },
];

// Une boutique par niche (catalog id), parfois plusieurs boutiques pour la même niche
// pour répartir la charge ; mais chaque boutique reste mono-niche.
export const SHOPS: Shop[] = [
  // Alimentation (niche très large → plusieurs boutiques)
  { id: "s-ahouandjinou-vivrier", vendorId: "v-ahouandjinou", name: "Ahouandjinou Vivrier", niche: "alimentation", nicheName: "Alimentation & Supermarché", city: "Cotonou", rating: 4.8, verified: true },
  { id: "s-sojagold-huiles", vendorId: "v-sojagold", name: "Soja Gold Huiles", niche: "alimentation", nicheName: "Alimentation & Supermarché", city: "Parakou", rating: 4.6, verified: true },
  { id: "s-importceres-cereales", vendorId: "v-importceres", name: "Import Céréales Plus", niche: "alimentation", nicheName: "Alimentation & Supermarché", city: "Cotonou", rating: 4.7, verified: true },
  { id: "s-koudjo-frais", vendorId: "v-koudjo", name: "Koudjo Marché Frais", niche: "alimentation", nicheName: "Alimentation & Supermarché", city: "Bohicon", rating: 4.4, verified: false },

  // Téléphonie
  { id: "s-techgros-mobile", vendorId: "v-techgros", name: "TechGros Mobile", niche: "telephonie", nicheName: "Téléphonie & Objets connectés", city: "Cotonou", rating: 4.7, verified: true },
  { id: "s-zinsou-phones", vendorId: "v-zinsou", name: "Zinsou Phones Pro", niche: "telephonie", nicheName: "Téléphonie & Objets connectés", city: "Cotonou", rating: 4.6, verified: true },

  // Informatique
  { id: "s-techgros-it", vendorId: "v-techgros", name: "TechGros Informatique", niche: "informatique", nicheName: "Informatique & High-Tech", city: "Cotonou", rating: 4.7, verified: true },

  // Électronique multimédia
  { id: "s-zinsou-electro", vendorId: "v-zinsou", name: "Zinsou Électronique", niche: "electronique", nicheName: "Électronique & Multimédia", city: "Cotonou", rating: 4.6, verified: true },

  // Électroménager
  { id: "s-houenou-electromenager", vendorId: "v-houenou", name: "Houénou Électroménager", niche: "electromenager", nicheName: "Électroménager & Maison", city: "Abomey-Calavi", rating: 4.5, verified: true },

  // Mode Femme
  { id: "s-tokpa-femme", vendorId: "v-tokpa", name: "Tokpa Mode Femme", niche: "mode-femme", nicheName: "Mode Femme", city: "Cotonou", rating: 4.9, verified: true },
  { id: "s-glamour-femme", vendorId: "v-glamour", name: "Glamour Femme", niche: "mode-femme", nicheName: "Mode Femme", city: "Cotonou", rating: 4.7, verified: true },

  // Mode Homme
  { id: "s-tokpa-homme", vendorId: "v-tokpa", name: "Tokpa Mode Homme", niche: "mode-homme", nicheName: "Mode Homme", city: "Cotonou", rating: 4.8, verified: true },

  // Enfants & Bébé
  { id: "s-houenou-enfants", vendorId: "v-houenou", name: "Houénou Bébé & Enfant", niche: "enfants-bebe", nicheName: "Enfants & Bébé", city: "Abomey-Calavi", rating: 4.5, verified: true },

  // Beauté
  { id: "s-glamour-beaute", vendorId: "v-glamour", name: "Glamour Cosmétique", niche: "beaute", nicheName: "Beauté & Cosmétique", city: "Cotonou", rating: 4.7, verified: true },

  // Santé
  { id: "s-proclean-sante", vendorId: "v-proclean", name: "ProClean Santé", niche: "sante", nicheName: "Santé & Hygiène", city: "Porto-Novo", rating: 4.5, verified: true },

  // Maison & Déco
  { id: "s-houenou-deco", vendorId: "v-houenou", name: "Houénou Décoration", niche: "maison-deco", nicheName: "Maison & Décoration", city: "Abomey-Calavi", rating: 4.5, verified: true },

  // Sport
  { id: "s-tokpa-sport", vendorId: "v-tokpa", name: "Tokpa Sport", niche: "sport", nicheName: "Sport & Loisirs", city: "Cotonou", rating: 4.6, verified: true },

  // Gaming
  { id: "s-techgros-gaming", vendorId: "v-techgros", name: "TechGros Gaming", niche: "gaming", nicheName: "Gaming & Loisirs numériques", city: "Cotonou", rating: 4.7, verified: true },

  // Auto & Moto
  { id: "s-zinsou-auto", vendorId: "v-zinsou", name: "Zinsou Auto-Moto", niche: "auto-moto", nicheName: "Auto & Moto", city: "Cotonou", rating: 4.6, verified: true },

  // Bricolage & Construction
  { id: "s-bati-bricolage", vendorId: "v-bati", name: "Bati Plus Bricolage", niche: "bricolage", nicheName: "Bricolage & Construction", city: "Cotonou", rating: 4.6, verified: true },

  // Librairie
  { id: "s-adjovi-librairie", vendorId: "v-adjovi", name: "Adjovi Librairie", niche: "librairie", nicheName: "Librairie & Papeterie", city: "Porto-Novo", rating: 4.3, verified: false },

  // Musique
  { id: "s-glamour-musique", vendorId: "v-glamour", name: "Glamour Musique", niche: "musique", nicheName: "Musique & Instruments", city: "Cotonou", rating: 4.5, verified: true },

  // Voyage
  { id: "s-tokpa-voyage", vendorId: "v-tokpa", name: "Tokpa Bagagerie", niche: "voyage", nicheName: "Voyage & Bagagerie", city: "Cotonou", rating: 4.7, verified: true },

  // Services
  { id: "s-adjovi-services", vendorId: "v-adjovi", name: "Adjovi Services Pro", niche: "services", nicheName: "Services", city: "Porto-Novo", rating: 4.3, verified: false },

  // Artisanat local
  { id: "s-ahouandjinou-artisanat", vendorId: "v-ahouandjinou", name: "Ahouandjinou Artisanat", niche: "artisanat", nicheName: "Produits locaux & artisanat", city: "Cotonou", rating: 4.7, verified: true },

  // Boutiques supplémentaires utilisant les nouveaux vendeurs
  { id: "s-soglo-alim", vendorId: "v-soglo", name: "Soglo Alimentaire", niche: "alimentation", nicheName: "Alimentation & Supermarché", city: "Cotonou", rating: 4.8, verified: true },
  { id: "s-golden-trade-textile", vendorId: "v-golden-trade", name: "Golden Trade Textile", niche: "mode-femme", nicheName: "Mode Femme", city: "Cotonou", rating: 4.8, verified: true },
  { id: "s-afrique-ouest-tech", vendorId: "v-afrique-ouest", name: "Afrique Ouest Tech", niche: "informatique", nicheName: "Informatique & High-Tech", city: "Cotonou", rating: 4.6, verified: true },
  { id: "s-atlantique-elec", vendorId: "v-atlantique", name: "Atlantique Électronique", niche: "electronique", nicheName: "Électronique & Multimédia", city: "Cotonou", rating: 4.7, verified: true },
  { id: "s-benin-express-sport", vendorId: "v-benin-express", name: "Bénin Express Sport", niche: "sport", nicheName: "Sport & Loisirs", city: "Cotonou", rating: 4.8, verified: true },
  { id: "s-kotonu-hygiene", vendorId: "v-kotonu", name: "Kotonu Hygiène", niche: "sante", nicheName: "Santé & Hygiène", city: "Cotonou", rating: 4.6, verified: true },
  { id: "s-meridien-maison", vendorId: "v-meridien", name: "Méridien Maison", niche: "maison-deco", nicheName: "Maison & Décoration", city: "Cotonou", rating: 4.6, verified: true },
  { id: "s-benin-first-btp", vendorId: "v-benin-first", name: "Bénin First BTP", niche: "bricolage", nicheName: "Bricolage & Outils", city: "Cotonou", rating: 4.8, verified: true },
  { id: "s-west-trade-auto", vendorId: "v-west-trade", name: "West Trade Auto", niche: "auto-moto", nicheName: "Auto & Moto", city: "Porto-Novo", rating: 4.5, verified: true },
  { id: "s-african-link-phone", vendorId: "v-african-link", name: "African Link Mobile", niche: "telephonie", nicheName: "Téléphonie & Objets connectés", city: "Cotonou", rating: 4.7, verified: true },
  { id: "s-dossou-beaute", vendorId: "v-dossou", name: "Dossou Cosmétiques", niche: "beaute", nicheName: "Beauté & Cosmétique", city: "Parakou", rating: 4.5, verified: true },
  { id: "s-benin-market-enfants", vendorId: "v-benin-market", name: "Bénin Market Kids", niche: "enfants-bebe", nicheName: "Enfants & Bébé", city: "Parakou", rating: 4.5, verified: true },
];

// ─── Génération automatique d'un produit par feuille du catalogue ───

const UNITS = ["unités", "cartons", "sacs", "lots", "pièces", "kg", "litres"];

// Dimensions de variantes (filtres et tris additionnels par sous-catégorie)
export const ORIGINS = ["Bénin", "Côte d'Ivoire", "Nigeria", "Ghana", "Togo", "Sénégal", "Chine", "Inde", "Turquie", "France"];
export const COLORS = ["Rouge", "Bleu", "Noir", "Blanc", "Vert", "Jaune", "Gris", "Beige", "Multicolore", "Marron"];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Standard", "Unique"];
export const BRANDS = ["IPPOO Pro", "Local Premium", "Star Quality", "EcoLine", "Afro+", "MaxValue", "FirstChoice", "Prestige"];
export const WEIGHTS_KG = [0.25, 0.5, 1, 2, 5, 10, 15, 25, 50];

const VARIANTS_PER_LEAF = 20;

import { CATEGORY_IMAGE_POOLS, LEAF_IMAGE_POOLS } from "./marketplace-images";

// Hash déterministe simple
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function collectLeaves(
  items: CatalogItem[],
  trail: string[],
  out: { path: string[]; name: string; image?: string }[],
  inheritedImage?: string,
) {
  for (const it of items) {
    const img = it.image ?? inheritedImage;
    if (it.children?.length) collectLeaves(it.children, [...trail, it.name], out, img);
    else out.push({ path: [...trail, it.name], name: it.name, image: img });
  }
}

const CATEGORY_NAME_FOR_CATALOG: Record<string, string> = {
  alimentation: "Alimentaire",
  telephonie: "Électronique",
  informatique: "Équipements",
  electronique: "Électronique",
  electromenager: "Maison",
  "mode-femme": "Textile",
  "mode-homme": "Textile",
  "enfants-bebe": "Bébé/Enfant",
  beaute: "Beauté",
  sante: "Hygiène",
  "maison-deco": "Maison",
  sport: "Sport",
  gaming: "Électronique",
  "auto-moto": "Auto/Moto",
  bricolage: "BTP",
  librairie: "Fournitures",
  musique: "Luxe",
  voyage: "Luxe",
  services: "Services",
  artisanat: "Luxe",
};

// Validate that catalog ids in MAIN_CATEGORY_TO_CATALOG_ID and CATEGORY_NAME_FOR_CATALOG are aligned with CATALOG ids.
const KNOWN_CATALOG_IDS = new Set(CATALOG.map((c) => c.id));
for (const id of Object.keys(CATEGORY_NAME_FOR_CATALOG)) {
  if (!KNOWN_CATALOG_IDS.has(id)) console.warn(`[marketplace] unknown catalog id: ${id}`);
}
for (const id of Object.values(MAIN_CATEGORY_TO_CATALOG_ID)) {
  if (!KNOWN_CATALOG_IDS.has(id)) console.warn(`[marketplace] unknown catalog id in MAIN_CATEGORY_TO_CATALOG_ID: ${id}`);
}

// Override la catégorie principale en fonction de la branche du catalog
// (ex: feuilles sous "11.6 Boissons" → "Boissons" au lieu de "Alimentaire").
function resolveProductCategory(catId: string, leafPath: string[]): string {
  const pathStr = leafPath.join(" › ").toLowerCase();
  if (catId === "alimentation") {
    if (pathStr.includes("boisson") || pathStr.includes("jus") || pathStr.includes("eau")) return "Boissons";
  }
  if (catId === "sante" || catId === "beaute") {
    // Beauté reste Beauté, Santé reste Hygiène
  }
  if (catId === "bricolage") {
    if (pathStr.includes("industriel") || pathStr.includes("machine") || pathStr.includes("équipement")) return "Industriel";
  }
  if (catId === "artisanat" || catId === "musique") return "Luxe";
  return CATEGORY_NAME_FOR_CATALOG[catId] ?? "Services";
}

const PRODUCT_ID_START = 10_000;

function buildProducts(): MarketplaceProduct[] {
  const out: MarketplaceProduct[] = [];
  let nextId = PRODUCT_ID_START;

  for (const cat of CATALOG) {
    const leaves: { path: string[]; name: string; image?: string }[] = [];
    collectLeaves(cat.children, [cat.name], leaves, cat.image);
    const shopsForNiche = SHOPS.filter((s) => s.niche === cat.id);
    if (shopsForNiche.length === 0) continue;

    leaves.forEach((leaf, leafIdx) => {
      for (let v = 0; v < VARIANTS_PER_LEAF; v++) {
        const shop = shopsForNiche[(leafIdx + v) % shopsForNiche.length];
        const seed = `ippoo-${cat.id}-${slugify(leaf.name)}-${leafIdx}-v${v}`;
        const h = hash(seed);
        const origin = ORIGINS[(h + v) % ORIGINS.length];
        const color = COLORS[(h + v * 3) % COLORS.length];
        const size = SIZES[(h + v * 5) % SIZES.length];
        const brand = BRANDS[(h + v * 7) % BRANDS.length];
        const weightKg = WEIGHTS_KG[(h + v * 11) % WEIGHTS_KG.length];
        const basePrice = 1200 + ((h + v * 137) % 200) * 200; // 1 200 → 41 000 FCFA
        const moq = [1, 5, 10, 12, 20, 24, 48, 100][(h + v) % 8];
        const unit = UNITS[(h + v * 2) % UNITS.length];
        const rating = Math.round((3.6 + (((h + v * 13) % 14) / 10)) * 10) / 10; // 3.6 → 4.9
        const stockQty = ((h + v * 19) % 480) + 20;
        const id = nextId++;
        const catCode = cat.id.slice(0, 3).toUpperCase();
        const shopCode = shop.id.replace(/^s-/, "").split("-").map((s) => s.slice(0, 2).toUpperCase()).join("");
        const reference = `IPP-${catCode}-${shopCode}-${String(id).padStart(6, "0")}`;
        const variantTag =
          v === 0
            ? `Lot ${moq} ${unit}`
            : `${brand} · ${color} · ${size} · ${weightKg}kg`;
        const name = `${leaf.name} — ${variantTag}`;
        // Priorité : (1) image curatée par leaf, (2) image sémantique du
        // nœud catalogue (issue du dictionnaire mots-clés), (3) pool générique
        // de la catégorie. On élimine picsum.photos qui renvoyait des paysages
        // aléatoires sans rapport (montagnes, plages…) pour des produits comme
        // "Tomates fraîches".
        const poolImage = LEAF_IMAGE_POOLS[leaf.name]?.[v];
        const catPool = CATEGORY_IMAGE_POOLS[cat.id];
        const catalogFallback = leaf.image ?? cat.image;
        const image = poolImage
          ?? catalogFallback
          ?? (catPool && catPool.length > 0 ? catPool[(h + v) % catPool.length] : "");
        out.push({
          id,
          name,
          image,
          price: basePrice,
          moq,
          unit,
          seller: shop.name,
          rating,
          category: resolveProductCategory(cat.id, leaf.path),
          inStock: stockQty > 30,
          paliers: [
            { qty: moq, price: basePrice },
            { qty: moq * 4, price: Math.round(basePrice * 0.92) },
            { qty: moq * 10, price: Math.round(basePrice * 0.85) },
          ],
          shopId: shop.id,
          vendorId: shop.vendorId,
          catalogId: cat.id,
          subcategory: leaf.name,
          subcategoryPath: leaf.path.join(" › "),
          origin,
          color,
          size,
          weightKg,
          brand,
          stockQty,
          reference,
        });
      }
    });
  }
  return out;
}

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = buildProducts();

export function findShop(id: string): Shop | undefined {
  return SHOPS.find((s) => s.id === id);
}

export function findVendor(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}

export function shopsForVendor(vendorId: string): Shop[] {
  return SHOPS.filter((s) => s.vendorId === vendorId);
}

export function shopsForNiche(catalogId: string): Shop[] {
  return SHOPS.filter((s) => s.niche === catalogId);
}

// Nom de boutique → vendeur vérifié ? Permet à l'UI (Explorer) de filtrer
// les produits par fiabilité du vendeur, y compris les produits curés
// dont le seul lien est le `seller` (texte).
export const VERIFIED_SELLER_NAMES: Set<string> = (() => {
  const verifiedVendorIds = new Set(VENDORS.filter((v) => v.verified).map((v) => v.id));
  const set = new Set<string>();
  for (const s of SHOPS) {
    if (s.verified && verifiedVendorIds.has(s.vendorId)) set.add(s.name);
  }
  // Vendeurs historiques connus comme vérifiés
  ["Ets Ahouandjinou", "Tokpa Textiles", "ProClean SARL", "TechGros Bénin", "Soja Gold Bénin", "Import Céréales Plus"].forEach((n) => set.add(n));
  return set;
})();
