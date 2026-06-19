import { IMAGES } from "../mock-data";
import { CATALOG as CATEGORIES } from "../../data/catalog";
import { isSeller, type UserProfile } from "../../auth/user-profile";
import type { PublicVendor } from "../../data/public-vendors";
import { resolveShopVisuals } from "../../data/shop-resolver";
import { slugifyShopName } from "../../data/shop-assets";

/* ═══════════════════════════════════════════
   EXTRA IMAGES
   ═══════════════════════════════════════════ */
/* Per-niche cover image pools — each niche gets multiple unique URLs so no two
   vendors in the same niche share the same cover. */
/* PRODUITS UNIQUEMENT — chaque URL n'apparaît qu'une seule fois sur toute la
   plateforme. Aucune photo de personne, de paysage ou de scène. */
const u = (id: string) => `https://images.unsplash.com/${id}?w=1080&q=80&auto=format&fit=crop`;
export const NICHE_COVERS: Record<string, string[]> = {
  alimentation: [
    u("photo-1612966893103-790e549a2ab1"),
    u("photo-1587682725980-b9ac16626266"),
    u("photo-1646953568310-8def6eb5a317"),
    u("photo-1708514193930-2977def8669a"),
    u("photo-1686772665578-f76970e7646b"),
    u("photo-1612966927965-8e15595f3bd4"),
  ],
  beaute: [
    u("photo-1596462502278-27bfdc403348"),
    u("photo-1643168186368-c42359c82573"),
    u("photo-1602532381225-eec578361933"),
    u("photo-1653784097013-786a8965ea3b"),
    u("photo-1701271482230-5ecaec3cd3e1"),
  ],
  sante: [
    u("photo-1544991875-5dc1b05f607d"),
    u("photo-1631669969504-f35518bf96ba"),
    u("photo-1544991936-9464fa9919d2"),
    u("photo-1588802060188-ee08afc87823"),
    u("photo-1696861286643-341a8d7a79e9"),
  ],
  "maison-deco": [
    u("photo-1730597363352-0a8fe6eb5d12"),
    u("photo-1762215361982-1050c1079875"),
    u("photo-1777499455310-80354aa1021f"),
    u("photo-1764025851315-8fedc89f43c0"),
    u("photo-1769888596701-c0fbc9bc71e5"),
  ],
  telephonie: [
    u("photo-1557767382-97b28f5488e7"),
    u("photo-1566793474285-2decf0fc182a"),
    u("photo-1677145503731-87bfe49e5c67"),
    u("photo-1515940175183-6798529cb860"),
    u("photo-1565536421961-1f165e0c981e"),
  ],
  electromenager: [
    u("photo-1654064754916-e3edeb09c042"),
    u("photo-1725901724801-5640dfe632d4"),
    u("photo-1597439651585-2f5b7e314e8f"),
    u("photo-1676951010467-6ff6e7db2a81"),
    u("photo-1725419281142-3f89b330b907"),
  ],
  electronique: [
    u("photo-1615655406736-b37c4fabf923"),
    u("photo-1468495244123-6c6c332eeece"),
    u("photo-1595303526913-c7037797ebe7"),
    u("photo-1515940279136-2f419eea8051"),
    u("photo-1636115305669-9096bffe87fd"),
  ],
  "mode-femme": [
    u("photo-1602532360508-595f449c7c55"),
    u("photo-1595909315417-2edd382a56dc"),
    u("photo-1602558618194-3037081afe0d"),
    u("photo-1643168343279-3f93c2e592ef"),
    u("photo-1602532386405-9f3cce79a00b"),
  ],
  "mode-homme": [
    u("photo-1479064555552-3ef4979f8908"),
    u("photo-1594938261770-81f2f4804a01"),
    u("photo-1592876569776-12718fae30f1"),
    u("photo-1521330784804-5f69f8a17b1d"),
    u("photo-1602810319428-019690571b5b"),
  ],
  bricolage: [
    u("photo-1581783898377-1c85bf937427"),
    u("photo-1606676539940-12768ce0e762"),
    u("photo-1518709414768-a88981a4515d"),
    u("photo-1503789146722-cf137a3c0fea"),
    u("photo-1668874184010-87aa286683dd"),
    u("photo-1671803845754-d159c3f3e3d4"),
  ],
  librairie: [
    u("photo-1522836924445-4478bdeb860c"),
    u("photo-1531346644014-cde582069e71"),
    u("photo-1518226203301-8e7f833c6a94"),
    u("photo-1636014724389-270c4e9c0100"),
    u("photo-1531346618680-ab17d6dcd07c"),
  ],
  "auto-moto": [
    u("photo-1571335746824-742511d49bce"),
    u("photo-1578844251758-2f71da64c96f"),
    u("photo-1601411101851-ea0e07766235"),
    u("photo-1590227763209-821c686b932f"),
    u("photo-1645420526410-66448b1ee37c"),
  ],
  "enfants-bebe": [
    u("photo-1545558014-8692077e9b5c"),
    u("photo-1741389544696-0750a7ac6bbb"),
    u("photo-1602507007739-74db4eccac5c"),
    u("photo-1655087751207-1020c89f7eee"),
    u("photo-1633104318039-e41a8acc000a"),
  ],
  artisanat: [
    u("photo-1596626417050-39c7f6ddd2c9"),
    u("photo-1759316777881-24c0b09c3a63"),
    u("photo-1773609688893-8021430a2968"),
    u("photo-1654064756026-c04ed4594825"),
  ],
};

/* EXTRA — produits uniquement, jamais réutilisés ailleurs. */
const EXTRA = {
  spice: u("photo-1633536705119-bcc37bf6c84e"),
  construction: u("photo-1622044939413-0b829c342434"),
  hairBeauty: u("photo-1536096066796-2e5f40d55fa0"),
  beverages: u("photo-1659456553707-14712bb27032"),
  phoneShop: u("photo-1619955723484-5c08bc9cd06f"),
  fashion: u("photo-1593030860365-e175b8215a95"),
  grain: u("photo-1631173716529-fd1696a807b0"),
  farmer: u("photo-1441035844538-e2ce7dba066b"),
  stationery: u("photo-1580567754748-e77fff0a7e3e"),
  pharmacy: u("photo-1601302030807-8cfadb191a24"),
  autoParts: u("photo-1666554498255-5250121b4865"),
  gifts: u("photo-1739169585911-1ad4376bf85e"),
  cookware: u("photo-1771967525910-dff5b7dc5e57"),
  shoes: u("photo-1777987601677-3059be0e1388"),
};

/* ═══════════════════════════════════════════════════════
   NICHE CATEGORIES, Alignées sur data/catalog.ts
   Les 20 catégories officielles IPPOO Market
   ═══════════════════════════════════════════════════════ */
export type NicheCategory = { key: string; label: string; icon: string; color: string };
export const nicheCategories: NicheCategory[] = [
  { key: "Tous", label: "Tous", icon: "Store", color: "#1A1A2E" },
  ...CATEGORIES.map((c) => ({ key: c.id, label: c.name, icon: c.icon, color: c.color })),
];
export const categoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.name ?? id;

export type Vendor = {
  id: number;
  name: string;
  avatar: string;
  cover: string;
  category: string;
  rating: number;
  orders: number;
  deliveryRate: number;
  badge: string;
  location: string;
  niche: string;
  description: string;
  subcategories: string[];
  shopStatus?: "open" | "vacation" | "closed";
  slug?: string;
};

/* ═══════════════════════════════════════════════════════════════
   ALL VENDORS, 36 boutiques couvrant les 10 catégories + vivrier
   ═══════════════════════════════════════════════════════════════ */
const VENDOR_SEED: Array<Omit<Vendor, "category"> & { niche: string }> = [
  // Alimentation & Supermarché
  { id: 1, name: "Ets Ahouandjinou", avatar: IMAGES.entrepreneur, cover: IMAGES.market, rating: 4.8, orders: 1250, deliveryRate: 98, badge: "VIP", location: "Cotonou", niche: "alimentation", description: "Grossiste riz, pâtes, farine, sucre et huiles alimentaires", subcategories: ["Produits secs", "Huiles", "Sucre"] },
  { id: 2, name: "Mama Délices SARL", avatar: IMAGES.grocery, cover: IMAGES.grocery, rating: 4.7, orders: 920, deliveryRate: 96, badge: "VIP", location: "Porto-Novo", niche: "alimentation", description: "Conserves, sauces, confitures et produits transformés en gros", subcategories: ["Conserves", "Sauces", "Snacks"] },
  { id: 3, name: "Saveurs du Bénin", avatar: EXTRA.spice, cover: EXTRA.spice, rating: 4.5, orders: 640, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou", niche: "alimentation", description: "Épices, condiments et ingrédients pour boulangerie-pâtisserie", subcategories: ["Épices", "Condiments", "Boulangerie"] },
  { id: 4, name: "BoissonsPlus Bénin", avatar: EXTRA.beverages, cover: EXTRA.beverages, rating: 4.6, orders: 780, deliveryRate: 94, badge: "TOP", location: "Cotonou", niche: "alimentation", description: "Grossiste jus de fruits, sodas, eaux minérales et boissons énergétiques", subcategories: ["Jus", "Sodas", "Eaux"] },
  { id: 5, name: "Kérékou Import-Export", avatar: IMAGES.warehouse, cover: IMAGES.warehouse, rating: 4.6, orders: 780, deliveryRate: 94, badge: "TOP", location: "Cotonou", niche: "alimentation", description: "Import riz thaï, sucre, farine spéciale et huile en vrac", subcategories: ["Import", "Riz", "Farine"] },

  // Beauté & Cosmétique
  { id: 6, name: "Beauty Queen Cosmetics", avatar: IMAGES.cosmetics, cover: EXTRA.hairBeauty, rating: 4.4, orders: 380, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou", niche: "beaute", description: "Crèmes, maquillage, huiles naturelles et cosmétiques en gros", subcategories: ["Cosmétiques", "Maquillage", "Huiles"] },
  { id: 7, name: "NaturelAfro", avatar: EXTRA.hairBeauty, cover: IMAGES.cosmetics, rating: 4.7, orders: 690, deliveryRate: 96, badge: "VIP", location: "Cotonou", niche: "beaute", description: "Shampoings, soins capillaires naturels et accessoires beauté", subcategories: ["Soins capillaires", "Shampoings", "Accessoires"] },
  { id: 9, name: "Glamour Abidjan-Cotonou", avatar: IMAGES.cosmetics, cover: EXTRA.hairBeauty, rating: 4.2, orders: 290, deliveryRate: 90, badge: "VERIFIE", location: "Porto-Novo", niche: "beaute", description: "Extensions, perruques, peignes, brosses et éponges", subcategories: ["Extensions", "Perruques", "Accessoires beauté"] },

  // Santé & Hygiène
  { id: 8, name: "ProClean SARL", avatar: IMAGES.hygiene, cover: IMAGES.hygiene, rating: 4.5, orders: 670, deliveryRate: 95, badge: "TOP", location: "Porto-Novo", niche: "sante", description: "Savons, gels douche, dentifrices et protections féminines", subcategories: ["Savons", "Dentifrices", "Hygiène féminine"] },
  { id: 25, name: "PharmaGros Bénin", avatar: EXTRA.pharmacy, cover: EXTRA.pharmacy, rating: 4.7, orders: 520, deliveryRate: 97, badge: "VIP", location: "Cotonou", niche: "sante", description: "Médicaments génériques OTC, compléments et vitamines en gros", subcategories: ["Médicaments OTC", "Vitamines", "Compléments"] },
  { id: 26, name: "MédiEquip Parakou", avatar: EXTRA.pharmacy, cover: EXTRA.pharmacy, rating: 4.5, orders: 340, deliveryRate: 95, badge: "TOP", location: "Parakou", niche: "sante", description: "Thermomètres, pansements, gants et matériel médical de base", subcategories: ["Matériel médical", "Pansements", "Gants"] },

  // Maison & Décoration
  { id: 10, name: "HygiènePro Bénin", avatar: IMAGES.hygiene, cover: IMAGES.hygiene, rating: 4.5, orders: 560, deliveryRate: 94, badge: "TOP", location: "Cotonou", niche: "maison-deco", description: "Détergents, savons liquides, produits sol et surfaces en gros", subcategories: ["Détergents", "Produits sol", "Ménager"] },
  { id: 11, name: "MaisonPlus Porto", avatar: EXTRA.cookware, cover: EXTRA.cookware, rating: 4.4, orders: 420, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo", niche: "maison-deco", description: "Vaisselle, casseroles, poêles et ustensiles de cuisine", subcategories: ["Vaisselle", "Ustensiles", "Casseroles"] },
  { id: 12, name: "RangeStock SARL", avatar: IMAGES.warehouse, cover: IMAGES.warehouse, rating: 4.3, orders: 310, deliveryRate: 91, badge: "VERIFIE", location: "Parakou", niche: "maison-deco", description: "Boîtes de rangement, paniers, étagères et organisation", subcategories: ["Rangement", "Paniers", "Étagères"] },
  { id: 35, name: "CleanMaster SARL", avatar: IMAGES.hygiene, cover: IMAGES.market, rating: 4.3, orders: 320, deliveryRate: 91, badge: "VERIFIE", location: "Parakou", niche: "maison-deco", description: "Savons de ménage, désinfectants et produits sanitaires professionnels", subcategories: ["Savons ménage", "Désinfectants", "Sanitaire"] },

  // Téléphonie & Objets connectés
  { id: 13, name: "MobilePlus Cotonou", avatar: EXTRA.phoneShop, cover: IMAGES.electronics, rating: 4.6, orders: 450, deliveryRate: 95, badge: "TOP", location: "Cotonou", niche: "telephonie", description: "Coques, chargeurs, câbles, écouteurs et accessoires téléphone", subcategories: ["Coques", "Chargeurs", "Écouteurs"] },

  // Électroménager & Maison
  { id: 14, name: "TechGros Bénin", avatar: IMAGES.electronics, cover: EXTRA.phoneShop, rating: 4.7, orders: 430, deliveryRate: 96, badge: "VIP", location: "Cotonou", niche: "electromenager", description: "Bouilloires, mixeurs, ventilateurs et lampes LED en gros", subcategories: ["Petit électro", "Ventilateurs", "LED"] },

  // Électronique & Multimédia
  { id: 15, name: "SolarTech Bénin", avatar: IMAGES.electronics, cover: EXTRA.phoneShop, rating: 4.8, orders: 350, deliveryRate: 97, badge: "VIP", location: "Cotonou", niche: "electronique", description: "Panneaux solaires, batteries, piles et onduleurs", subcategories: ["Solaire", "Batteries", "Piles"] },

  // Mode Femme
  { id: 16, name: "Tokpa Textiles", avatar: IMAGES.businessman, cover: IMAGES.textile, rating: 4.9, orders: 890, deliveryRate: 97, badge: "TOP", location: "Cotonou", niche: "mode-femme", description: "Tissus wax, bazin, vêtements hommes, femmes et enfants", subcategories: ["Wax", "Bazin", "Vêtements"] },
  { id: 17, name: "Wax Empire", avatar: EXTRA.fashion, cover: IMAGES.textile, rating: 4.8, orders: 1100, deliveryRate: 97, badge: "VIP", location: "Cotonou", niche: "mode-femme", description: "Prêt-à-porter africain, sacs, ceintures et chapeaux", subcategories: ["Prêt-à-porter", "Sacs", "Accessoires"] },
  { id: 19, name: "Faso Dan Fani Center", avatar: EXTRA.fashion, cover: IMAGES.textile, rating: 4.6, orders: 410, deliveryRate: 95, badge: "TOP", location: "Parakou", niche: "mode-femme", description: "Tissu traditionnel, teinture artisanale et confection", subcategories: ["Tissus traditionnels", "Teinture", "Confection"] },
  { id: 36, name: "Mode Afrik Porto", avatar: IMAGES.textile, cover: EXTRA.fashion, rating: 4.4, orders: 520, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo", niche: "mode-femme", description: "Confection, prêt-à-porter femmes et ceintures artisanales", subcategories: ["Confection", "Prêt-à-porter", "Ceintures"] },

  // Mode Homme
  { id: 18, name: "ChaussuresExpress", avatar: EXTRA.shoes, cover: EXTRA.shoes, rating: 4.3, orders: 370, deliveryRate: 91, badge: "VERIFIE", location: "Porto-Novo", niche: "mode-homme", description: "Chaussures sport, casual, formel et lunettes en gros", subcategories: ["Chaussures", "Lunettes", "Sport"] },

  // Bricolage & Construction
  { id: 20, name: "BâtiPlus Cotonou", avatar: EXTRA.construction, cover: EXTRA.construction, rating: 4.4, orders: 620, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou", niche: "bricolage", description: "Marteaux, tournevis, perceuses et outils de bricolage", subcategories: ["Outils", "Perceuses", "Quincaillerie"] },
  { id: 21, name: "FerraPlus Porto-Novo", avatar: EXTRA.construction, cover: IMAGES.warehouse, rating: 4.5, orders: 480, deliveryRate: 94, badge: "TOP", location: "Porto-Novo", niche: "bricolage", description: "Câbles électriques, ampoules, prises et fournitures électriques", subcategories: ["Câbles", "Ampoules", "Électrique"] },
  { id: 22, name: "PeintPro Parakou", avatar: EXTRA.construction, cover: EXTRA.construction, rating: 4.3, orders: 280, deliveryRate: 90, badge: "VERIFIE", location: "Parakou", niche: "bricolage", description: "Peintures, pinceaux, rouleaux, colles et matériaux de finition", subcategories: ["Peintures", "Colles", "Pinceaux"] },

  // Librairie & Papeterie
  { id: 23, name: "PapetPlus Bénin", avatar: EXTRA.stationery, cover: EXTRA.stationery, rating: 4.5, orders: 390, deliveryRate: 94, badge: "TOP", location: "Cotonou", niche: "librairie", description: "Cahiers, stylos, enveloppes, dossiers et fournitures scolaires", subcategories: ["Cahiers", "Stylos", "Scolaire"] },
  { id: 24, name: "BureauxModernes SARL", avatar: EXTRA.stationery, cover: EXTRA.stationery, rating: 4.4, orders: 260, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo", niche: "librairie", description: "Mobilier de bureau, chaises, tables, classeurs et rangement", subcategories: ["Mobilier", "Chaises", "Classeurs"] },

  // Auto & Moto
  { id: 27, name: "AutoParts Cotonou", avatar: EXTRA.autoParts, cover: EXTRA.autoParts, rating: 4.4, orders: 410, deliveryRate: 93, badge: "TOP", location: "Cotonou", niche: "auto-moto", description: "Filtres, ampoules auto, batteries et pièces détachées courantes", subcategories: ["Filtres", "Batteries auto", "Ampoules"] },
  { id: 28, name: "MotoPlus Parakou", avatar: EXTRA.autoParts, cover: EXTRA.autoParts, rating: 4.3, orders: 290, deliveryRate: 91, badge: "VERIFIE", location: "Parakou", niche: "auto-moto", description: "Housses de siège, tapis, produits d'entretien auto et accessoires", subcategories: ["Housses", "Tapis auto", "Entretien"] },

  // Enfants & Bébé
  { id: 29, name: "JoujouLand Bénin", avatar: EXTRA.gifts, cover: EXTRA.gifts, rating: 4.5, orders: 450, deliveryRate: 93, badge: "TOP", location: "Cotonou", niche: "enfants-bebe", description: "Jouets, articles pour enfants et gadgets éducatifs en gros", subcategories: ["Jouets", "Enfants", "Éducatifs"] },

  // Produits locaux & artisanat
  { id: 30, name: "FêtesExpress Porto", avatar: EXTRA.gifts, cover: EXTRA.gifts, rating: 4.2, orders: 220, deliveryRate: 89, badge: "VERIFIE", location: "Porto-Novo", niche: "artisanat", description: "Décorations, articles saisonniers, cadeaux et articles promotionnels", subcategories: ["Décorations", "Saisonnier", "Cadeaux"] },
  { id: 31, name: "AgroNord Parakou", avatar: IMAGES.vegetables, cover: EXTRA.grain, rating: 4.3, orders: 520, deliveryRate: 91, badge: "VERIFIE", location: "Parakou", niche: "artisanat", description: "Maïs, sorgho, mil, riz local et légumineuses en vrac", subcategories: ["Maïs", "Sorgho", "Légumineuses"] },
  { id: 32, name: "Grenier du Nord", avatar: EXTRA.grain, cover: EXTRA.farmer, rating: 4.6, orders: 870, deliveryRate: 95, badge: "VIP", location: "Parakou", niche: "artisanat", description: "Grossiste céréales, igname, manioc et produits laitiers locaux", subcategories: ["Céréales", "Igname", "Manioc"] },
  { id: 33, name: "CoopAgri Bénin", avatar: EXTRA.farmer, cover: IMAGES.vegetables, rating: 4.4, orders: 430, deliveryRate: 92, badge: "TOP", location: "Porto-Novo", niche: "artisanat", description: "Coopérative agricole, fruits, légumes frais et tubercules", subcategories: ["Fruits", "Légumes", "Tubercules"] },
  { id: 34, name: "Nectar d'Afrique", avatar: EXTRA.beverages, cover: EXTRA.farmer, rating: 4.3, orders: 340, deliveryRate: 91, badge: "VERIFIE", location: "Parakou", niche: "alimentation", description: "Jus naturels artisanaux, boissons locales et eaux aromatisées", subcategories: ["Jus naturels", "Boissons locales", "Eaux"] },
];

/* ════════════════════════════════════════════════════════════════
   ASSIGNATION D'IMAGES UNIQUES
   Chaque vendeur reçoit DEUX images (cover + logo) prises dans un
   pool global, chaque URL ne pouvant être utilisée qu'UNE seule
   fois sur toute la plateforme. La cover est de préférence tirée
   du pool de la niche, le logo d'une autre niche (variation
   visuelle) — toujours via le même registre d'unicité.
   ════════════════════════════════════════════════════════════════ */
const _GLOBAL_POOL: string[] = (() => {
  const set = new Set<string>();
  for (const arr of Object.values(NICHE_COVERS)) for (const url of arr) set.add(url);
  for (const url of Object.values(EXTRA)) set.add(url);
  return Array.from(set);
})();
const _assignedImages = new Set<string>();
function _takeImage(prefNiche?: string): string {
  if (prefNiche) {
    const pref = NICHE_COVERS[prefNiche] || [];
    for (const url of pref) if (!_assignedImages.has(url)) { _assignedImages.add(url); return url; }
  }
  for (const url of _GLOBAL_POOL) if (!_assignedImages.has(url)) { _assignedImages.add(url); return url; }
  // Pool épuisé — derniers fallbacks (ne devrait pas arriver pour la seed actuelle)
  return _GLOBAL_POOL[(_assignedImages.size) % _GLOBAL_POOL.length];
}

export const seededVendors: Vendor[] = VENDOR_SEED.map((v) => {
  const cover = _takeImage(v.niche);
  const avatar = _takeImage();
  return {
    ...v,
    cover,
    avatar,
    category: categoryLabel(v.niche),
  };
});

export function vendorFromProfile(p: UserProfile): Vendor | null {
  if (!isSeller(p)) return null;
  const niche = p.niche || p.subsectorId || "alimentation";
  const pool = NICHE_COVERS[niche];
  const fallbackCover = pool?.[0] || IMAGES.market;
  const resolvedName = p.businessName || `${p.firstName} ${p.lastName}`.trim() || "Ma boutique";
  const v = resolveShopVisuals(p.email || resolvedName, resolvedName);
  return {
    id: hashId(`me:${p.email || p.businessName || p.firstName}`),
    name: resolvedName,
    avatar: v.logo || p.logo || p.avatar || fallbackCover,
    cover: v.banner || p.shopPhoto || fallbackCover,
    category: categoryLabel(niche),
    rating: 5,
    orders: 0,
    deliveryRate: 100,
    badge: "VERIFIE",
    location: p.city || "Cotonou",
    niche,
    description: p.description || "Nouvelle boutique IPPOO Market",
    subcategories: [],
  };
}

export function vendorFromPublic(v: PublicVendor): Vendor {
  const niche = v.niche || "alimentation";
  const pool = NICHE_COVERS[niche];
  const fallbackCover = pool?.[0] || IMAGES.market;
  const vis = resolveShopVisuals(v.ownerId || v.name, v.name);
  return {
    id: hashId(v.ownerId || v.name),
    name: v.name,
    avatar: vis.logo || v.logo || v.avatar || fallbackCover,
    cover: vis.banner || v.shopPhoto || fallbackCover,
    category: categoryLabel(niche),
    rating: 5,
    orders: 0,
    deliveryRate: 100,
    badge: "VERIFIE",
    location: v.city || "Cotonou",
    niche,
    description: v.description || "Nouvelle boutique IPPOO Market",
    subcategories: [],
    shopStatus: v.shopStatus,
    slug: slugifyShopName(v.name),
  };
}

function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || Date.now();
}

export const filters = ["Tous", "VIP", "Top vendeurs", "Vérifiés", "Cotonou", "Porto-Novo", "Parakou"];

export type SortKey = "pertinence" | "rating" | "orders" | "fiabilite";
export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "pertinence", label: "Pertinence" },
  { key: "rating", label: "Meilleure note" },
  { key: "orders", label: "Plus de ventes" },
  { key: "fiabilite", label: "Fiabilité" },
];
