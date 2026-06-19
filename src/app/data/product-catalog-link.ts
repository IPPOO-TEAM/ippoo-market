// Pont entre les produits mock-data (catégories courtes) et la taxonomie complète.
import { CATALOG, CatalogCategory, CatalogItem } from "./catalog";

export const MAIN_CATEGORY_TO_CATALOG_ID: Record<string, string> = {
  Alimentaire: "alimentation",
  Boissons: "alimentation",
  Hygiène: "sante",
  Textile: "mode-femme",
  Électronique: "electronique",
  BTP: "bricolage",
  Beauté: "beaute",
  Fournitures: "librairie",
  "Auto/Moto": "auto-moto",
  "Bébé/Enfant": "enfants-bebe",
  Équipements: "informatique",
  Industriel: "bricolage",
  Maison: "maison-deco",
  Sport: "sport",
  Luxe: "beaute",
  Services: "services",
};

export function catalogIdForMainCategory(name?: string | null): string | undefined {
  if (!name) return undefined;
  return MAIN_CATEGORY_TO_CATALOG_ID[name];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectLeaves(items: CatalogItem[], out: { path: string; name: string }[], trail: string[] = []) {
  for (const it of items) {
    if (it.children?.length) collectLeaves(it.children, out, [...trail, it.name]);
    else out.push({ path: [...trail, it.name].join(" › "), name: it.name });
  }
}

const LEAVES_BY_CATEGORY = new Map<string, { path: string; name: string }[]>();
for (const cat of CATALOG) {
  const out: { path: string; name: string }[] = [];
  collectLeaves(cat.children, out);
  LEAVES_BY_CATEGORY.set(cat.id, out);
}

const KEYWORDS: Record<string, string[]> = {
  Riz: ["riz parfumé", "riz basmati", "riz blanc"],
  "Huiles & matières grasses": ["huile"],
  "Conserves & produits longue durée": ["concentré", "tomate en boite", "tomate boite"],
  "Farines (maïs, blé, manioc, igname)": ["farine"],
  Sucre: [],
  "Laits concentrés": ["lait en poudre", "lait"],
  "Pâtes alimentaires": ["pates", "spaghetti", "macaroni"],
  "Eaux minérales": ["eau minerale"],
  "Jus de fruits mixtes": ["jus de fruits"],
  "Boissons locales traditionnelles": ["sodabi", "bissap"],
  "Thés & infusions": ["the vert", "the "],
  Savon: ["savon"],
  Lessive: ["detergent", "lessive"],
  "Produits hygiène": ["papier toilette"],
  "Eau de javel": ["javel"],
  "Dentifrice & brosses": ["dentifrice"],
  "Nettoyants multi-usages": ["serpilliere", "microfibre"],
  "Crèmes visage": ["creme corporelle", "creme"],
  "Huiles naturelles": ["huile de coco", "huile vierge"],
  Maquillage: ["vernis", "rouge a levres"],
  "Pagnes & tissus": ["tissu wax", "bazin", "kente", "pagne", "friperie"],
  "T-shirts": ["t-shirt", "tshirt"],
  Rideaux: ["draps", "drap"],
  "Câbles USB / Type-C / Lightning": ["cable usb"],
  "Écouteurs & casques": ["ecouteurs", "casque"],
  "Coques & protections": ["coque"],
  "Chargeurs & adaptateurs": ["chargeur"],
  "Ampoules": ["ampoule"],
  Powerbanks: ["power bank", "powerbank"],
  "Ciment & matériaux": ["ciment", "fer a beton", "tole", "carreaux"],
  Peinture: ["peinture"],
  "Outils manuels": ["groupe electrogene", "poste a souder", "moulin", "pompe", "machine a coudre"],
  "Tubercules (igname, manioc)": ["igname", "manioc", "gari"],
  "Haricots & légumineuses": ["haricot", "soja", "arachide"],
  "Mil & sorgho": ["mais seche", "mais"],
};

export type LeafRef = { path: string; name: string };

export function inferSubcategory(productName: string, categoryId?: string, explicit?: string): LeafRef | undefined {
  if (!categoryId) return undefined;
  const leaves = LEAVES_BY_CATEGORY.get(categoryId);
  if (!leaves) return undefined;
  if (explicit) {
    const direct = leaves.find((l) => l.name === explicit);
    if (direct) return direct;
  }
  const n = normalize(productName);

  for (const [leafName, kws] of Object.entries(KEYWORDS)) {
    const leaf = leaves.find((l) => l.name === leafName);
    if (!leaf) continue;
    if (kws.some((k) => n.includes(normalize(k)))) return leaf;
  }
  for (const leaf of leaves) {
    if (n.includes(normalize(leaf.name))) return leaf;
  }
  return undefined;
}

type Product = { id: number | string; name: string; category?: string; subcategory?: string; catalogId?: string };

export function subcategoryCounts<T extends Product>(products: T[], catalogId: string, mainCategory?: string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of products) {
    const mapped = p.catalogId ?? catalogIdForMainCategory(p.category);
    if (mapped !== catalogId) continue;
    if (mainCategory && p.category !== mainCategory) continue;
    const sub = inferSubcategory(p.name, catalogId, p.subcategory);
    const key = sub?.name ?? "Autres";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function listSubcategoryOptions(catalogId: string): LeafRef[] {
  return LEAVES_BY_CATEGORY.get(catalogId) ?? [];
}

export function findCategoryById(id: string): CatalogCategory | undefined {
  return CATALOG.find((c) => c.id === id);
}
