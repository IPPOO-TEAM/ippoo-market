// Mock data for IPPOO Market
import { MARKETPLACE_PRODUCTS } from "../data/marketplace";
import { IMAGES } from "./mock-data-images";
import { curatedProducts } from "./mock-data-curated";
export { IMAGES };


/**
 * Taxonomie officielle IPPOO Market, 16 catégories
 * Toute page filtrant par catégorie DOIT utiliser uniquement ces noms.
 */
export const CATEGORY_NAMES = [
  "Alimentaire",
  "Boissons",
  "Hygiène",
  "Textile",
  "Électronique",
  "BTP",
  "Beauté",
  "Fournitures",
  "Auto/Moto",
  "Bébé/Enfant",
  "Équipements",
  "Industriel",
  "Maison",
  "Sport",
  "Luxe",
  "Services",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const categories = [
  { id: 1, name: "Alimentaire", icon: "Wheat", color: "#FF6A00", count: 3450 },
  { id: 2, name: "Boissons", icon: "Coffee", color: "#B45309", count: 890 },
  { id: 3, name: "Hygiène", icon: "SprayCan", color: "#0EA5E9", count: 760 },
  { id: 4, name: "Textile", icon: "Shirt", color: "#EC4899", count: 1540 },
  { id: 5, name: "Électronique", icon: "Cpu", color: "#3B82F6", count: 680 },
  { id: 6, name: "BTP", icon: "HardHat", color: "#78716C", count: 420 },
  { id: 7, name: "Beauté", icon: "Heart", color: "#F0278E", count: 720 },
  { id: 8, name: "Fournitures", icon: "BookOpen", color: "#6366F1", count: 520 },
  { id: 9, name: "Auto/Moto", icon: "Car", color: "#DC2626", count: 310 },
  { id: 10, name: "Bébé/Enfant", icon: "Baby", color: "#FBBF24", count: 190 },
  { id: 11, name: "Équipements", icon: "Wrench", color: "#8B5CF6", count: 460 },
  { id: 12, name: "Industriel", icon: "Factory", color: "#7C3AED", count: 380 },
  { id: 13, name: "Maison", icon: "Sofa", color: "#16A34A", count: 1230 },
  { id: 14, name: "Sport", icon: "Dumbbell", color: "#F97316", count: 250 },
  { id: 15, name: "Luxe", icon: "Gem", color: "#E8A817", count: 280 },
  { id: 16, name: "Services", icon: "Briefcase", color: "#0D9488", count: 340 },
];

export const flashProducts = [
  {
    id: 1,
    name: "Riz Parfumé 25kg - Premium",
    image: IMAGES.riceBags,
    priceOriginal: 18500,
    priceFlash: 14800,
    moq: 10,
    unit: "sacs",
    discount: 20,
    stock: 45,
    seller: "Ets Ahouandjinou",
    rating: 4.8,
    badge: "FLASH",
  },
  {
    id: 2,
    name: "Huile de palme raffinée 20L",
    image: IMAGES.palmOil,
    priceOriginal: 22000,
    priceFlash: 17600,
    moq: 5,
    unit: "bidons",
    discount: 20,
    stock: 30,
    seller: "Soja Gold Bénin",
    rating: 4.6,
    badge: "FLASH",
  },
  {
    id: 3,
    name: "Savon de ménage - Carton 48pcs",
    image: IMAGES.hygiene,
    priceOriginal: 12000,
    priceFlash: 9000,
    moq: 20,
    unit: "cartons",
    discount: 25,
    stock: 100,
    seller: "ProClean SARL",
    rating: 4.5,
    badge: "FLASH",
  },
  {
    id: 4,
    name: "Tissu Wax Hollandais 12 yards",
    image: IMAGES.textile,
    priceOriginal: 35000,
    priceFlash: 28000,
    moq: 10,
    unit: "pièces",
    discount: 20,
    stock: 25,
    seller: "Tokpa Textiles",
    rating: 4.9,
    badge: "TOP",
  },
];

export const topVendors = [
  {
    id: 1,
    name: "Ets Ahouandjinou",
    avatar: IMAGES.entrepreneur,
    category: "Alimentaire & Vivrier",
    rating: 4.8,
    orders: 1250,
    deliveryRate: 98,
    badge: "VIP",
    location: "Cotonou",
  },
  {
    id: 2,
    name: "Tokpa Textiles",
    avatar: IMAGES.businessman,
    category: "Textile & Mode",
    rating: 4.9,
    orders: 890,
    deliveryRate: 97,
    badge: "TOP",
    location: "Cotonou",
  },
  {
    id: 3,
    name: "ProClean SARL",
    avatar: IMAGES.marketVendor,
    category: "Maison",
    rating: 4.5,
    orders: 670,
    deliveryRate: 95,
    badge: "VERIFIE",
    location: "Porto-Novo",
  },
  {
    id: 4,
    name: "TechGros Bénin",
    avatar: IMAGES.electronics,
    category: "Électronique",
    rating: 4.7,
    orders: 430,
    deliveryRate: 96,
    badge: "VIP",
    location: "Cotonou",
  },
];

export const marketDays = [
  { id: 1, name: "Jour Tokpa", theme: "Textile & Accessoires", color: "#E11D2E", date: "Samedi 8 Mars" },
  { id: 2, name: "Jour Missèbo", theme: "Textile & Friperie", color: "#F97316", date: "Dimanche 9 Mars" },
  { id: 3, name: "Jour Arzèkè", theme: "Alimentaire & Condiments", color: "#16A34A", date: "Lundi 10 Mars" },
  { id: 4, name: "Jour Guéma", theme: "Vivrier & Céréales", color: "#E8A817", date: "Mardi 11 Mars" },
];


// Garantit l'unicité des images : aucune URL ne peut être partagée entre 2 produits.
function ensureUniqueImages<T extends { id: number; image: string }>(products: T[]): T[] {
  const seen = new Set<string>();
  return products.map((p) => {
    if (seen.has(p.image)) {
      const replaced = `https://picsum.photos/seed/ippoo-curated-${p.id}/600/600`;
      seen.add(replaced);
      return { ...p, image: replaced };
    }
    seen.add(p.image);
    return p;
  });
}

// Garantit l'absence de doublons par nom (le premier gagne).
function dedupeByName<T extends { name: string }>(products: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of products) {
    const k = p.name.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

export const allProducts = ensureUniqueImages(
  dedupeByName([...curatedProducts, ...MARKETPLACE_PRODUCTS]),
).map((p) => {
  if ((p as { reference?: string }).reference) return p;
  const catCode = (p.category ?? "GEN").replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 3).toUpperCase() || "GEN";
  return { ...p, reference: `IPP-${catCode}-CUR-${String(p.id).padStart(6, "0")}` };
});

// Rééquilibre `count` des `categories` avec les vrais nombres de produits.
{
  const realCounts = new Map<string, number>();
  for (const p of allProducts) {
    if (!p.category) continue;
    realCounts.set(p.category, (realCounts.get(p.category) ?? 0) + 1);
  }
  for (const c of categories) {
    const n = realCounts.get(c.name);
    if (n !== undefined) c.count = n;
  }
}

/* ═══════════════════════════════════════════════════
   PRODUCT DESCRIPTIONS (per product, for product-page)
   ═══════════════════════════════════════════════════ */
export const productDescriptions: Record<number, string> = {
  1: "Riz parfumé de qualité supérieure importé, grain long et léger. Idéal pour la revente en détail ou la restauration. Conditionnement hermétique 25kg garantissant fraîcheur et conservation optimale.",
  2: "Huile de palme 100% raffinée, conditionnée en bidon de 20 litres. Produit de première nécessité très demandé sur les marchés béninois. Qualité constante, couleur dorée, goût neutre.",
  3: "Savon de ménage multi-usage, carton de 48 pièces. Formule concentrée pour un nettoyage efficace. Produit phare de ProClean SARL, fabriqué localement au Bénin.",
  4: "Tissu wax hollandais authentique, pièce de 12 yards. Motifs colorés exclusifs, impression haute qualité. Très recherché pour les cérémonies et la mode africaine.",
  5: "Crème corporelle hydratante premium, lot de 24 flacons de 500ml. Formule enrichie au beurre de karité et à la vitamine E. Marque reconnue en Afrique de l'Ouest.",
  6: "Câbles USB-C universels haute qualité, pack de 50 pièces. Compatibles avec tous les smartphones récents. Charge rapide 3A, longueur 1m. Emballage individuel pour la revente.",
  7: "Maïs séché de qualité premium, récolte 2026. Grains entiers triés et nettoyés, taux d'humidité contrôlé. Produit du Nord-Bénin, livraison en sacs de 50kg.",
  8: "Détergent liquide concentré en bidon de 5L, lot de 12. Formule professionnelle pour un nettoyage intensif. Parfum frais longue durée.",
  9: "Riz Basmati longue durée importé d'Inde, sac de 50kg. Grain extra-long, parfum délicat. Qualité restaurant, très prisé dans les hôtels et traiteurs.",
  10: "Concentré de tomate double concentration, carton de 48 boîtes de 400g. Produit incontournable de la cuisine béninoise. Conservation longue durée, goût naturel.",
  11: "Farine de blé type T55, sac de 50kg. Qualité boulangerie-pâtisserie, finesse garantie. Produit par MoulinsAfric, référence locale.",
  12: "Sucre en poudre blanc raffiné, sac de 50kg. Qualité alimentaire premium, granulométrie fine et régulière. Importation contrôlée.",
  13: "Lait en poudre entier, carton de 24 sachets de 400g. Marque internationale reconnue, dissolution instantanée. Fort pouvoir nutritif.",
  14: "Pâtes alimentaires de qualité supérieure, carton de 30 sachets de 500g. Cuisson rapide, texture ferme. Importation directe, prix grossiste compétitif.",
  15: "Eau minérale naturelle, pack de 12 bouteilles de 1.5L. Source certifiée, minéralisation équilibrée. Emballage PET recyclable.",
  16: "Jus de fruits tropicaux 100% naturels, carton de 24 canettes de 33cl. Mélange mangue-ananas-passion. Sans conservateurs artificiels.",
  17: "Sodabi traditionnel du Bénin, carton de 12 bouteilles de 1L. Distillation artisanale de Savalou, goût authentique.",
  18: "Bissap concentré naturel, bidon de 5 litres. Infusion d'hibiscus sabdariffa, riche en vitamine C. Prêt à diluer, rendement 25L.",
  19: "Thé vert en sachets individuels, boîte de 100 sachets. Importation directe, qualité premium. Emballage hermétique préservant les arômes.",
  20: "Papier toilette 2 plis extra-doux, pack de 96 rouleaux. Qualité premium, dissolution rapide. Produit d'hygiène essentiel.",
  21: "Eau de javel concentrée, pack de 6 bidons de 5L. Désinfectant puissant multi-surfaces. Formule professionnelle ProClean.",
  22: "Dentifrice fluoré protection complète, carton de 48 tubes de 100ml. Marque internationale reconnue.",
  23: "Serpillière microfibre professionnelle, lot de 50 pièces. Absorption maximale, lavable en machine. Qualité professionnelle durable.",
  24: "Huile de coco vierge pressée à froid, carton de 24 flacons de 500ml. Produit 100% naturel, multi-usage beauté et cuisine.",
  25: "Beurre de karité brut non raffiné, seau de 10kg. Origine Bénin/Burkina, qualité premium. Riche en vitamines A, D, E, F.",
  26: "Mèches brésiliennes 100% Remy hair, 20 pouces, lot de 10 paquets. Qualité salon, texture naturelle.",
  27: "Savon noir africain traditionnel, lot de 50 savons de 200g. Riche en beurre de karité et huile de coco. Produit naturel tendance.",
  28: "Vernis à ongles lot de 120 couleurs assorties. Formule longue tenue, séchage rapide. Emballage présentoir inclus.",
  29: "Bazin riche authentique, pièce de 10 yards. Tissu de prestige pour les grandes occasions. Qualité supérieure, finition brillante.",
  30: "T-shirts blancs 100% coton peigné, lot de 50 pièces toutes tailles. Idéal pour la personnalisation ou la revente directe.",
  31: "Pagne Kente traditionnel, pièce de 6 yards. Tissage artisanal, motifs symboliques. Origine Ghana/Togo, qualité authentique.",
  32: "Draps de lit 2 places en coton percale, lot de 10 parures. 240 fils/cm², toucher soyeux. Qualité hôtelière.",
  33: "Friperie triée par catégorie, balle de 100kg. Vêtements en bon état, marques variées. Tri qualité A/B. Importation d'Europe.",
  34: "Écouteurs Bluetooth sans fil, lot de 20 paires. Son stéréo HD, autonomie 6h. Design moderne, emballage individuel.",
  35: "Coques de smartphone universelles, lot de 100 pièces assorties. Compatible iPhone et Samsung. Designs variés et tendance.",
  36: "Chargeur rapide USB-C 20W, lot de 50 pièces. Compatible iPhone 15+, Samsung, Xiaomi. Certification CE.",
  37: "Ampoules LED 12W équivalent 100W, lot de 100 pièces. Lumière blanche 6500K, durée 25000h. Économie d'énergie 85%.",
  38: "Power Bank 10000mAh double sortie USB, lot de 20 pièces. Charge rapide, indicateur LED. Design compact.",
  39: "Ciment Portland CPA 42.5, sac de 50kg. Qualité construction, résistance normée. Produit de base indispensable pour le BTP.",
  40: "Fer à béton haute adhérence 12mm, barre de 12m. Norme NF, qualité construction. Conditionnement par lot de 50 barres.",
  41: "Peinture murale acrylique blanche, seau de 20L. Finition mate, haut pouvoir couvrant. Séchage rapide, faible odeur.",
  42: "Tôle bac aluminium 3m x 0.6m, épaisseur 0.4mm. Résistance aux intempéries, légèreté. Finition prélaquée.",
  43: "Carreaux céramique 40x40cm, palette de 50m². Finition brillante, résistance à l'usure PEI 4. Qualité import.",
  44: "Igname pilée prête à consommer, sac de 25kg. Produit du terroir béninois, qualité contrôlée. Conservation longue durée.",
  45: "Gari (manioc séché) de qualité supérieure, sac de 50kg. Produit du centre Bénin, granulométrie fine. Taux d'humidité contrôlé.",
  46: "Haricots rouges séchés et triés, sac de 25kg. Récolte récente, calibre régulier. Source de protéines végétales.",
  47: "Arachide décortiquée de qualité export, sac de 50kg. Grains entiers, taux de brisure <5%. Origine Nord-Bénin.",
  48: "Soja en grains entiers, sac de 50kg. Récolte 2026, taux de protéines élevé. Produit par Soja Gold Bénin.",
  49: "Groupe électrogène diesel 5kVA, démarrage automatique. Idéal pour les commerces, ateliers et habitations. Autonomie 10h, faible consommation. Garantie 12 mois EquipPro Bénin.",
  50: "Congélateur commercial horizontal 500 litres, double compartiment. Classe énergétique A+, compresseur Embraco. Parfait pour les boutiques de boissons et commerces alimentaires.",
  51: "Machine à coudre industrielle haute vitesse, point droit. Moteur silencieux 550W, 5500 points/min. Table et support inclus. Idéale pour les ateliers de couture et confection.",
  52: "Moulin à grains électrique professionnel, capacité 200kg/h. Convient pour maïs, mil, sorgho, riz. Construction robuste en acier inoxydable. Moteur triphasé 3kW.",
  53: "Poste à souder inverseur MMA/TIG 200A, technologie IGBT. Compact et portable, alimentation 220V. Arc stable, anti-collage. Livré avec câbles et masque de protection.",
  54: "Pompe à eau submersible 2HP, débit 15m³/h, hauteur de refoulement 25m. Acier inoxydable, protection thermique intégrée. Idéale pour forage, irrigation et alimentation en eau.",
};

/* ═══════════════════════════════════════════════════
   COMPLEMENTARY PRODUCTS
   ═══════════════════════════════════════════════════ */
const categoryComplements: Record<string, string[]> = {
  "Électronique": ["Maison", "Fournitures", "Équipements"],
  "Maison": ["Électronique", "Beauté", "BTP"],
  "Textile": ["Beauté", "Luxe"],
  "Beauté": ["Textile", "Maison", "Luxe"],
  "BTP": ["Industriel", "Maison"],
  "Industriel": ["BTP", "Équipements", "Auto/Moto"],
  "Auto/Moto": ["Industriel", "Électronique"],
  "Sport": ["Textile", "Bébé/Enfant"],
  "Bébé/Enfant": ["Sport", "Textile"],
  "Fournitures": ["Équipements", "Industriel"],
  "Équipements": ["Fournitures", "Électronique", "Industriel"],
  "Luxe": ["Textile", "Beauté"],
  "Alimentaire": ["Boissons", "Maison"],
  "Boissons": ["Alimentaire", "Maison"],
};

export function getComplementaryProducts(productId: number, limit = 6): typeof allProducts {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return allProducts.filter(p => p.inStock).slice(0, limit);
  const complCats = categoryComplements[product.category] || [];
  const sameCat = allProducts.filter(p => p.category === product.category && p.id !== productId && p.inStock);
  const complCat = allProducts.filter(p => complCats.includes(p.category) && p.inStock);
  const result: typeof allProducts = [];
  // Tri déterministe basé sur productId pour garder des recos stables entre rendus.
  const seeded = (p: { id: number }) => ((p.id * 9301 + productId * 49297) % 233280) / 233280;
  const sameShuffle = [...sameCat].sort((a, b) => seeded(a) - seeded(b));
  const complShuffle = [...complCat].sort((a, b) => seeded(a) - seeded(b));
  for (const p of sameShuffle) { if (result.length >= 3) break; result.push(p); }
  for (const p of complShuffle) { if (result.length >= limit) break; if (!result.find(r => r.id === p.id)) result.push(p); }
  return result;
}

// Expérience perso : un nouvel utilisateur démarre sans commandes ni transactions.
// Ces listes se remplissent via les vrais flux de checkout / portefeuille.
export const orders: Array<{
  id: string; date: string; status: string; statusLabel: string;
  total: number; items: number; seller: string;
}> = [];

export const walletTransactions: Array<{
  id: number; type: "credit" | "debit"; label: string; amount: number;
  date: string; status: string;
}> = [];

export const promos = [
  {
    id: 1,
    title: "FLASH -20% Alimentaire",
    description: "Jusqu'à -20% sur tous les produits alimentaires en gros",
    color: "#E11D2E",
    endDate: "08 Mars 2026",
    type: "flash",
  },
  {
    id: 2,
    title: "Jour Tokpa Special",
    description: "Textile & accessoires : prix imbattables + livraison offerte",
    color: "#F97316",
    endDate: "08 Mars 2026",
    type: "marche",
  },
  {
    id: 3,
    title: "Bonus Doré VIP",
    description: "Double cashback pour les membres VIP ce weekend",
    color: "#E8A817",
    endDate: "09 Mars 2026",
    type: "vip",
  },
  {
    id: 4,
    title: "Roue de la Fortune",
    description: "Tentez votre chance et gagnez des bons d'achat !",
    color: "#EC4899",
    endDate: "15 Mars 2026",
    type: "jeu",
  },
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};