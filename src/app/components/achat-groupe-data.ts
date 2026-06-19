import { Flame, Baby, Leaf, Beef, Package, Droplets, Home, Heart, UtensilsCrossed } from "lucide-react";
import { IMAGES } from "./mock-data-images";

export const NAVY = "#0F172A";
export const P = "#E11D2E";
export const GREEN = "#16A34A";
export const GOLD = "#E8A817";
export const BLUE = "#3B82F6";
export const PURPLE = "#7C3AED";
export const ORANGE = "#F97316";
export const TEAL = "#0D9488";
export const PINK = "#EC4899";

export const IMG_HERO = "https://images.unsplash.com/photo-1683538007978-ec84fe958c27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZmFtaWx5JTIwc2hhcmluZyUyMG1lYWwlMjBmb29kJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzczMzMxODI2fDA&ixlib=rb-4.1.0&q=80&w=1080";
export const IMG_CHICKEN = "https://images.unsplash.com/photo-1604899207144-d9c0f7d0238e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHdob2xlJTIwY2hpY2tlbiUyMHBvdWx0cnklMjBtYXJrZXR8ZW58MXx8fHwxNzczMzMxODI3fDA&ixlib=rb-4.1.0&q=80&w=1080";
export const IMG_VEGGIES = "https://images.unsplash.com/photo-1734772451376-0dd8003cb8f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBjcmF0ZSUyMG1hcmtldCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MzMzMTgyN3ww&ixlib=rb-4.1.0&q=80&w=1080";
export const IMG_BABY = "https://images.unsplash.com/photo-1769836215168-2c90327d786d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwZGlhcGVycyUyMGNhcmUlMjBwcm9kdWN0c3xlbnwxfHx8fDE3NzMzMzE4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080";
export const IMG_GAS = "https://images.unsplash.com/photo-1758777151107-b4573745d6c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwZ2FzJTIwY3lsaW5kZXIlMjBwcm9wYW5lJTIwdGFua3xlbnwxfHx8fDE3NzMzMzE4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080";

export type Tab = "actifs" | "creer" | "mes-groupes" | "catalogue" | "packs" | "comment";

// ─── Active groups ───
export interface Participant {
  name: string;
  part: string;
  amount: number;
  paid: boolean;
}

export interface Groupement {
  id: number;
  name: string;
  product: string;
  image: string;
  organizer: string;
  zone: string;
  targetQty: number;
  currentQty: number;
  participants: Participant[];
  maxParticipants: number;
  priceNormal: number;
  priceGroupe: number;
  timeLeft: string;
  paliers: { pct: number; price: number }[];
  status: "ouvert" | "complet" | "verrouillé";
  paymentMode: "individuel" | "leader";
  delivery: string;
}

// Aucun groupement actif tant qu'un utilisateur n'en a pas lancé un réel.
export const activeGroups: Groupement[] = [];

// ─── Catalogue (10 categories from spec) ───
export const catalogCategories = [
  { name: "Viandes & Volailles", icon: Beef, color: P, items: [
    { name: "Poulet entier 1,5-2kg", unit: "pièce", price: 5500, minGroup: 10, maxDiscount: 31, image: IMG_CHICKEN, portions: "Entier, 1/2, 1/3, 1/4, cuisses, ailes" },
    { name: "Viande bœuf (morceaux)", unit: "lot 3kg", price: 15000, minGroup: 15, maxDiscount: 25, image: IMG_CHICKEN, portions: "Lot sauce, lot grillade, lot steak" },
    { name: "Poisson tilapia frais", unit: "lot 5 pièces", price: 7500, minGroup: 20, maxDiscount: 28, image: IMG_CHICKEN, portions: "Par taille: petit, moyen, grand" },
  ]},
  { name: "Céréales & Féculents", icon: Package, color: ORANGE, items: [
    { name: "Riz Parfumé 25kg", unit: "sac", price: 18500, minGroup: 50, maxDiscount: 27, image: IMAGES.riceBags, portions: "Sac entier, 10kg, 5kg" },
    { name: "Maïs grains 25kg", unit: "sac", price: 8000, minGroup: 30, maxDiscount: 25, image: IMAGES.driedCorn, portions: "Sac entier, 10kg, 5kg" },
    { name: "Farine de blé 50kg", unit: "sac", price: 28000, minGroup: 25, maxDiscount: 25, image: IMAGES.flour, portions: "Sac entier" },
    { name: "Gari 25kg", unit: "sac", price: 6500, minGroup: 40, maxDiscount: 30, image: IMAGES.tubers, portions: "Sac entier, 10kg, 5kg" },
    { name: "Pâtes (spaghetti) carton", unit: "carton 24", price: 9600, minGroup: 30, maxDiscount: 22, image: IMAGES.pasta, portions: "Carton, demi-carton" },
  ]},
  { name: "Huiles & Condiments", icon: Droplets, color: GOLD, items: [
    { name: "Huile de palme 20L", unit: "bidon", price: 22000, minGroup: 30, maxDiscount: 27, image: IMAGES.palmOil, portions: "Bidon entier, 10L, 5L" },
    { name: "Tomate concentrée Crt", unit: "carton 48", price: 15000, minGroup: 30, maxDiscount: 25, image: IMAGES.tomatoPaste, portions: "Carton, demi-carton, 12 boîtes" },
    { name: "Sucre en poudre 50kg", unit: "sac", price: 32000, minGroup: 20, maxDiscount: 25, image: IMAGES.sugar, portions: "Sac entier, 10kg, 5kg" },
  ]},
  { name: "Légumes & Fruits", icon: Leaf, color: GREEN, items: [
    { name: "Cagette mixte légumes", unit: "cagette", price: 8500, minGroup: 15, maxDiscount: 30, image: IMG_VEGGIES, portions: "Cagette entière, 1/2 cagette" },
    { name: "Banane plantain (régime)", unit: "régime", price: 4500, minGroup: 20, maxDiscount: 28, image: IMAGES.vegetables, portions: "Régime, demi-régime" },
    { name: "Oignons 25kg", unit: "sac", price: 12000, minGroup: 20, maxDiscount: 25, image: IMG_VEGGIES, portions: "Sac, 10kg, 5kg" },
  ]},
  { name: "Boissons", icon: Droplets, color: BLUE, items: [
    { name: "Eau minérale Pack 6", unit: "carton 4 packs", price: 3800, minGroup: 100, maxDiscount: 30, image: IMAGES.mineralWater, portions: "Carton, pack unitaire" },
    { name: "Jus de fruit carton", unit: "carton 12", price: 6000, minGroup: 30, maxDiscount: 25, image: IMAGES.juices, portions: "Carton, demi-carton" },
  ]},
  { name: "Hygiène & Entretien", icon: Droplets, color: TEAL, items: [
    { name: "Savon lessive Crt 48", unit: "carton", price: 12000, minGroup: 40, maxDiscount: 29, image: IMAGES.soapBulk, portions: "Carton, demi-carton, 12 barres" },
    { name: "Eau de javel 5L", unit: "bidon", price: 2500, minGroup: 50, maxDiscount: 30, image: IMAGES.bleach, portions: "Bidon" },
    { name: "Couches bébé (carton)", unit: "carton", price: 18000, minGroup: 15, maxDiscount: 25, image: IMG_BABY, portions: "Carton, demi-carton" },
    { name: "Papier toilette ballot", unit: "ballot 12", price: 4800, minGroup: 40, maxDiscount: 28, image: IMAGES.toiletPaper, portions: "Ballot, demi-ballot" },
  ]},
  { name: "Beauté & Soins", icon: Heart, color: PINK, items: [
    { name: "Beurre de karité 5kg", unit: "pot", price: 15000, minGroup: 20, maxDiscount: 25, image: IMAGES.sheaButter, portions: "Pot entier, 1kg" },
  ]},
  { name: "Bébé & Famille", icon: Baby, color: PURPLE, items: [
    { name: "Couches taille 3 carton", unit: "carton", price: 18000, minGroup: 15, maxDiscount: 25, image: IMG_BABY, portions: "Carton, demi-carton" },
    { name: "Lingettes bébé carton", unit: "carton 24", price: 9500, minGroup: 20, maxDiscount: 22, image: IMG_BABY, portions: "Carton, demi-carton" },
  ]},
  { name: "Cuisine & Conservation", icon: Flame, color: "#DC2626", items: [
    { name: "Bonbonne de gaz + recharge", unit: "pièce", price: 14000, minGroup: 10, maxDiscount: 20, image: IMG_GAS, portions: "Unité" },
    { name: "Charbon sac 25kg", unit: "sac", price: 5000, minGroup: 20, maxDiscount: 25, image: IMG_GAS, portions: "Sac entier, demi-sac" },
  ]},
];

// ─── Packs Famille ───
export const packsFamille = [
  { name: "Pack Cuisine du mois", desc: "Riz + huile + tomate + oignons + cubes + sel", price: 42000, priceGroupe: 31500, members: "4-6 familles", icon: UtensilsCrossed, color: ORANGE, image: IMAGES.grocery },
  { name: "Pack Sauce semaine", desc: "Viande/poisson + tomate + oignons + piment + épices", price: 25000, priceGroupe: 18500, members: "3-5 familles", icon: Flame, color: P, image: IMG_CHICKEN },
  { name: "Pack Petit-déj", desc: "Lait + café/thé + sucre + biscuits", price: 15000, priceGroupe: 11000, members: "3-4 familles", icon: Droplets, color: BLUE, image: IMAGES.milkPowder },
  { name: "Pack Bébé", desc: "Couches + lingettes + savon + crème", price: 28000, priceGroupe: 21000, members: "3-5 familles", icon: Baby, color: PURPLE, image: IMG_BABY },
  { name: "Pack Hygiène maison", desc: "Lessive + javel + liquide vaisselle + papier toilette", price: 18000, priceGroupe: 13000, members: "4-6 familles", icon: Home, color: TEAL, image: IMAGES.soapBulk },
  { name: "Pack Fruits & Légumes", desc: "Cagette mixte de saison (tomate, carotte, oignon, piment, gombo)", price: 12000, priceGroupe: 8500, members: "3-4 familles", icon: Leaf, color: GREEN, image: IMG_VEGGIES },
];

// Historique perso vide pour un nouveau compte.
export const myGroups: Array<{
  name: string; role: string; part: string; status: string; date: string;
  ca: number; paid: boolean; color: string; product: string;
}> = [];
