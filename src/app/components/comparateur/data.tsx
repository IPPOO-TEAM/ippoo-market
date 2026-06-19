import { Store, ShoppingCart, Tag, Building2, Warehouse, Landmark, Package, Globe, Home, Briefcase, Truck, type LucideIcon } from "lucide-react";
import { allProducts as catalogProducts } from "../mock-data";
import { scopedGetItem, scopedSetItem } from "../../lib/scoped-storage";
import {
  getPublicProducts, subscribePublicProducts, hashProductIdToNumber, type PublicProduct,
} from "../../data/public-products";

export const IMG = {
  hero: "https://images.unsplash.com/photo-1759316777881-24c0b09c3a63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFya2V0JTIwY29sb3JmdWwlMjBzcGljZXMlMjBwcm9kdWNlJTIwYWVyaWFsfGVufDF8fHx8MTc3MjkzNzg5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  textileMarket: "https://images.unsplash.com/photo-1546388556-40e4b23d8392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxXZXN0JTIwQWZyaWNhbiUyMHRleHRpbGUlMjBmYWJyaWMlMjBtYXJrZXQlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzI5Mzg2ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  beautyShop: "https://images.unsplash.com/photo-1699726242741-11e3ccc06610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYmVhdXR5JTIwcHJvZHVjdHMlMjBjb3NtZXRpY3MlMjBzaG9wfGVufDF8fHx8MTc3MjkzODY4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
  electronics: "https://images.unsplash.com/photo-1767818375622-f67d3b504f8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZWxlY3Ryb25pY3MlMjBwaG9uZSUyMHNob3AlMjBzdG9yZXxlbnwxfHx8fDE3NzI5Mzg2ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  construction: "https://images.unsplash.com/photo-1688241320695-6ca991df8818?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwY29uc3RydWN0aW9uJTIwYnVpbGRpbmclMjBtYXRlcmlhbHMlMjBoYXJkd2FyZXxlbnwxfHx8fDE3NzI5Mzg2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  beverages: "https://images.unsplash.com/photo-1762945274836-4c2cbb75e20e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYmV2ZXJhZ2UlMjBkcmlua3MlMjBqdWljZSUyMG1hcmtldCUyMHN0YWxsfGVufDF8fHx8MTc3MjkzODY4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  womanVendor: "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tYW4lMjBtYXJrZXQlMjB2ZW5kb3IlMjBzbWlsaW5nJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzI5Mzg2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  vegetables: "https://images.unsplash.com/photo-1759344114577-b6c32e4d68c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFya2V0JTIwc3RhbGwlMjB2ZWdldGFibGVzJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzcyOTM4NjkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  groceryStore: "https://images.unsplash.com/photo-1756158452957-cb6807d37d27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZ3JvY2VyeSUyMHN0b3JlJTIwc2hlbHZlcyUyMHByb2R1Y3RzfGVufDF8fHx8MTc3MjkzODY5MHww&ixlib=rb-4.1.0&q=80&w=1080",
  spices: "https://images.unsplash.com/photo-1758745464235-ccb8c1253074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwc3BpY2VzJTIwcGVwcGVyJTIwbWFya2V0JTIwYm93bHN8ZW58MXx8fHwxNzcyOTM4NjkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  cleaningProducts: "https://images.unsplash.com/photo-1654796372840-5684e1bea0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2FwJTIwY2xlYW5pbmclMjBwcm9kdWN0cyUyMHNoZWxmJTIwc3VwZXJtYXJrZXR8ZW58MXx8fHwxNzcyOTM4NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  entrepreneur: "https://images.unsplash.com/photo-1655720357761-f18ea9e5e7e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZW50cmVwcmVuZXVyJTIwYnVzaW5lc3MlMjB3b21hbiUyMGxhcHRvcHxlbnwxfHx8fDE3NzI5Mzg2OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

export const categoryImages: Record<string, string> = {
  "Alimentaire": "https://images.unsplash.com/photo-1759344114577-b6c32e4d68c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFya2V0JTIwc3RhbGwlMjB2ZWdldGFibGVzJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzcyOTM4NjkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "Boissons": "https://images.unsplash.com/photo-1762945274836-4c2cbb75e20e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYmV2ZXJhZ2UlMjBkcmlua3MlMjBqdWljZSUyMG1hcmtldCUyMHN0YWxsfGVufDF8fHx8MTc3MjkzODY4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  "Hygiène": "https://images.unsplash.com/photo-1654796372840-5684e1bea0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2FwJTIwY2xlYW5pbmclMjBwcm9kdWN0cyUyMHNoZWxmJTIwc3VwZXJtYXJrZXR8ZW58MXx8fHwxNzcyOTM4NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "Textile": "https://images.unsplash.com/photo-1546388556-40e4b23d8392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxXZXN0JTIwQWZyaWNhbiUyMHRleHRpbGUlMjBmYWJyaWMlMjBtYXJrZXQlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzI5Mzg2ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "Électronique": "https://images.unsplash.com/photo-1767818375622-f67d3b504f8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZWxlY3Ryb25pY3MlMjBwaG9uZSUyMHNob3AlMjBzdG9yZXxlbnwxfHx8fDE3NzI5Mzg2ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "BTP": "https://images.unsplash.com/photo-1688241320695-6ca991df8818?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwY29uc3RydWN0aW9uJTIwYnVpbGRpbmclMjBtYXRlcmlhbHMlMjBoYXJkd2FyZXxlbnwxfHx8fDE3NzI5Mzg2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "Beauté": "https://images.unsplash.com/photo-1699726242741-11e3ccc06610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYmVhdXR5JTIwcHJvZHVjdHMlMjBjb3NtZXRpY3MlMjBzaG9wfGVufDF8fHx8MTc3MjkzODY4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "Fournitures": "https://images.unsplash.com/photo-1756158452957-cb6807d37d27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZ3JvY2VyeSUyMHN0b3JlJTIwc2hlbHZlcyUyMHByb2R1Y3RzfGVufDB8fHx8MTc3MjkzODY5MHww&ixlib=rb-4.1.0&q=80&w=1080",
  "Auto/Moto": "https://images.unsplash.com/photo-1546388556-40e4b23d8392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Bébé/Enfant": "https://images.unsplash.com/photo-1699726242741-11e3ccc06610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Équipements": "https://images.unsplash.com/photo-1741012254499-fd90b2015605?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZ2VuZXJhdG9yJTIwcG93ZXIlMjBlcXVpcG1lbnQlMjBBZnJpY2F8ZW58MXx8fHwxNzcyOTM5NTkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "Industriel": "https://images.unsplash.com/photo-1741012254499-fd90b2015605?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Maison": "https://images.unsplash.com/photo-1756158452957-cb6807d37d27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Sport": "https://images.unsplash.com/photo-1741012254499-fd90b2015605?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Luxe": "https://images.unsplash.com/photo-1699726242741-11e3ccc06610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "Services": "https://images.unsplash.com/photo-1655720357761-f18ea9e5e7e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZW50cmVwcmVuZXVyJTIwYnVzaW5lc3MlMjB3b21hbiUyMGxhcHRvcHxlbnwxfHx8fDE3NzI5Mzg2OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

export const tabThemes = {
  comparatif: { accent: "#059669", accentLight: "#ECFDF5", accentMid: "#D1FAE5", gradient: "linear-gradient(135deg, #059669, #10B981)" },
  externe: { accent: "#4F46E5", accentLight: "#EEF2FF", accentMid: "#E0E7FF", gradient: "linear-gradient(135deg, #4F46E5, #6366F1)" },
  selection: { accent: "#D97706", accentLight: "#FFFBEB", accentMid: "#FEF3C7", gradient: "linear-gradient(135deg, #D97706, #F59E0B)" },
  blog: { accent: "#7C3AED", accentLight: "#F5F3FF", accentMid: "#EDE9FE", gradient: "linear-gradient(135deg, #7C3AED, #8B5CF6)" },
  profils: { accent: "#E11D68", accentLight: "#FFF1F2", accentMid: "#FFE4E6", gradient: "linear-gradient(135deg, #E11D68, #F43F5E)" },
};

export const categoryColors: Record<string, string> = {
  "Alimentaire": "#059669",
  "Boissons": "#0EA5E9",
  "Textile & Mode": "#EC4899",
  "Beaute & Soin": "#A855F7",
  "Electronique": "#3B82F6",
  "Nettoyage": "#06B6D4",
  "BTP & Materiaux": "#F97316",
  "Commerce General": "#E8A817",
  "Equipements": "#7C3AED",
};

export interface ExternalStore {
  id: string;
  name: string;
  type: "supermarche" | "hypermarche" | "grossiste" | "marche";
  icon: LucideIcon;
  color: string;
  location: string;
  country: string;
}

export const externalStores: ExternalStore[] = [
  { id: "erevan", name: "Erevan Supermarche", type: "supermarche", icon: Store, color: "#0EA5E9", location: "Cotonou", country: "Benin" },
  { id: "marina", name: "Marina Market", type: "supermarche", icon: ShoppingCart, color: "#8B5CF6", location: "Cotonou", country: "Benin" },
  { id: "leader", name: "Leader Price", type: "supermarche", icon: Tag, color: "#EF4444", location: "Cotonou", country: "Benin" },
  { id: "supermarchemondial", name: "Supermarche Mondial", type: "hypermarche", icon: Building2, color: "#DC2626", location: "Cotonou", country: "Benin" },
  { id: "azalai", name: "Azalai Market", type: "hypermarche", icon: ShoppingCart, color: "#2563EB", location: "Cotonou", country: "Benin" },
  { id: "supersarl", name: "Super SARL", type: "hypermarche", icon: Warehouse, color: "#E11D2E", location: "Porto-Novo", country: "Benin" },
  { id: "casinobenin", name: "Casino Bénin", type: "supermarche", icon: Landmark, color: "#16A34A", location: "Cotonou / Porto-Novo", country: "Benin" },
  { id: "dantokpa", name: "Marche Dantokpa", type: "marche", icon: Store, color: "#F97316", location: "Cotonou", country: "Benin" },
  { id: "ouando", name: "Marche Ouando", type: "marche", icon: Package, color: "#E8A817", location: "Porto-Novo", country: "Benin" },
  { id: "arzeke", name: "Marche Arzeke", type: "marche", icon: Globe, color: "#7C3AED", location: "Parakou", country: "Benin" },
];

export const storeTypeLabels: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  supermarche: { label: "Supermarche", color: "#0EA5E9", icon: Store },
  hypermarche: { label: "Hypermarche", color: "#8B5CF6", icon: Building2 },
  grossiste: { label: "Grossiste", color: "#16A34A", icon: Warehouse },
  marche: { label: "Marche traditionnel", color: "#F97316", icon: Globe },
};

export const zones = [
  "Toutes zones", "Cotonou -- Dantokpa", "Cotonou -- Ganhi", "Cotonou -- St-Michel",
  "Porto-Novo -- Ouando", "Parakou -- Arzeke", "Abomey -- Bohicon", "Natitingou", "Lokossa",
];

export const quantityModes = [
  { key: "detail", label: "Detail (1-9)", icon: Home, short: "Detail" },
  { key: "semi", label: "Semi-gros (10-49)", icon: Briefcase, short: "Semi-gros" },
  { key: "gros", label: "Gros (50-99)", icon: Store, short: "Gros" },
  { key: "volume", label: "Volume (100+)", icon: Building2, short: "Volume" },
];

export interface SellerEntry {
  name: string; zone: string; rating: number; verified: boolean;
  priceDetail: number; priceSemiGros: number; priceGros: number; priceVolume: number;
  trend: "up" | "down" | "stable"; trendPercent: number;
  stock: "disponible" | "limite" | "epuise"; deliveryDays: number; moq: number;
  badge?: string;
}
export interface ComparisonEntry {
  productId: number; productName: string; category: string; image: string; unit: string;
  sellers: SellerEntry[]; externalPrices: { store: ExternalStore; price: number; priceGros?: number }[];
  prixMoyen: number; prixMin: number; prixMax: number; prixIppoo: number;
  economieVsExterne: number; evolution7j: number; evolution30j: number; isSelection: boolean;
}

function generateComparisons(): ComparisonEntry[] {
  const zoneOptions = zones.slice(1);
  const sellerPool = [
    "Ets Ahouandjinou", "Soja Gold Benin", "Import Cereales Plus", "MoulinsAfric", "SucreBenin SA",
    "ProClean SARL", "Tokpa Textiles", "Mama Ayo Mode", "TechGros Benin", "Tech Revendeurs Cotonou",
    "Beaute Queens", "GlowUp Distribution", "BricoPlus Benin", "MatBTP Benin", "Boissons du Golfe",
    "AfricJuice Distribution", "Mama Tokpa", "Commerce General Cotonou", "Delta Import-Export",
    "EquipPro Benin", "FroidAfric SARL", "CoutureEquip Cotonou", "AgroMachines Benin", "HydroEquip Benin",
  ];
  const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; };

  // On capte l'intégralité du catalogue plateforme : chaque produit obtient
  // sa fiche comparative générée déterministiquement à partir de son `id`.
  return catalogProducts.map((product, idx) => {
    const rand = rng(product.id * 137 + 42);
    const basePrice = product.price;
    const numSellers = 3 + Math.floor(rand() * 4);
    const sellers: SellerEntry[] = Array.from({ length: numSellers }, (_, i) => {
      const variation = 0.85 + rand() * 0.35;
      const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
      return {
        name: sellerPool[(product.id * 3 + i * 7) % sellerPool.length],
        zone: zoneOptions[(product.id + i * 2) % zoneOptions.length],
        rating: +(4 + rand() * 0.9).toFixed(1), verified: rand() > 0.2,
        priceDetail: Math.round(basePrice * 1.15 * variation),
        priceSemiGros: Math.round(basePrice * variation),
        priceGros: Math.round(basePrice * 0.88 * variation),
        priceVolume: Math.round(basePrice * 0.78 * variation),
        trend: trends[Math.floor(rand() * 3)], trendPercent: +(1 + rand() * 8).toFixed(1),
        stock: (["disponible", "disponible", "disponible", "limite", "epuise"] as const)[Math.floor(rand() * 5)],
        deliveryDays: 1 + Math.floor(rand() * 5), moq: product.moq,
        badge: i === 0 ? "MEILLEUR PRIX IPPOO" : i === 1 && rand() > 0.5 ? "LIVRAISON RAPIDE" : undefined,
      };
    }).sort((a, b) => a.priceGros - b.priceGros);

    const ippooBest = sellers[0].priceGros;
    const externalPrices = externalStores
      .filter(() => rand() > 0.35).slice(0, 5 + Math.floor(rand() * 3))
      .map((store) => {
        const markup = store.type === "hypermarche" ? 1.18 + rand() * 0.25 : store.type === "supermarche" ? 1.22 + rand() * 0.3 : 1.05 + rand() * 0.15;
        return { store, price: Math.round(basePrice * markup), priceGros: store.type === "marche" ? Math.round(ippooBest * (1.02 + rand() * 0.12)) : undefined };
      });
    const avgExtPrice = externalPrices.length > 0 ? externalPrices.reduce((a, e) => a + e.price, 0) / externalPrices.length : basePrice * 1.2;
    const prices = sellers.map((s) => s.priceGros);
    return {
      productId: product.id, productName: product.name, category: product.category, image: product.image, unit: product.unit || "unites",
      sellers, externalPrices,
      prixMoyen: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      prixMin: Math.min(...prices), prixMax: Math.max(...prices), prixIppoo: ippooBest,
      economieVsExterne: Math.max(5, Math.round(((avgExtPrice - ippooBest) / avgExtPrice) * 100)),
      evolution7j: +(-5 + (rng(product.id * 31 + 7))() * 10).toFixed(1),
      evolution30j: +(-8 + (rng(product.id * 17 + 3))() * 16).toFixed(1),
      isSelection: idx < 6 || (idx % 3 === 0),
    };
  });
}
/* ─── Comparaisons issues des produits vendeurs publiés ───
   Chaque produit publié devient une entrée comparative avec un seul vendeur
   réel (le publisher). On hash l'id string en numérique ≥ 1_000_000 pour
   éviter les collisions avec les ids du catalogue. */
function generatePublicProductComparison(p: PublicProduct, idx: number): ComparisonEntry {
  const numericId = hashProductIdToNumber(p.id);
  const seed = numericId;
  const rng = (s: number) => { let v = s; return () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; };
  const rand = rng(seed);
  const basePrice = Math.max(1, p.price);
  const ippooBest = Math.round(basePrice * 0.92);
  const sellers: SellerEntry[] = [{
    name: p.shopSlug ? p.shopSlug.replace(/-/g, " ") : "Vendeur IPPOO",
    zone: zones.slice(1)[Math.floor(rand() * (zones.length - 1))],
    rating: +(4.2 + rand() * 0.7).toFixed(1),
    verified: true,
    priceDetail: Math.round(basePrice * 1.12),
    priceSemiGros: basePrice,
    priceGros: ippooBest,
    priceVolume: Math.round(basePrice * 0.82),
    trend: "stable",
    trendPercent: 0,
    stock: (p.stockQty ?? 1) > 0 ? "disponible" : "epuise",
    deliveryDays: 2 + Math.floor(rand() * 4),
    moq: p.moq ?? 1,
    badge: "PRODUIT VENDEUR",
  }];
  const externalPrices = externalStores
    .filter(() => rand() > 0.4).slice(0, 4)
    .map((store) => {
      const markup = store.type === "hypermarche" ? 1.18 + rand() * 0.2 : store.type === "supermarche" ? 1.22 + rand() * 0.25 : 1.05 + rand() * 0.12;
      return { store, price: Math.round(basePrice * markup) };
    });
  const avgExtPrice = externalPrices.length ? externalPrices.reduce((a, e) => a + e.price, 0) / externalPrices.length : basePrice * 1.2;
  return {
    productId: numericId,
    productName: p.name,
    category: p.category ?? "Fournitures",
    image: p.image ?? IMG.groceryStore,
    unit: p.unit ?? "unites",
    sellers,
    externalPrices,
    prixMoyen: ippooBest,
    prixMin: ippooBest,
    prixMax: ippooBest,
    prixIppoo: ippooBest,
    economieVsExterne: Math.max(5, Math.round(((avgExtPrice - ippooBest) / avgExtPrice) * 100)),
    evolution7j: 0,
    evolution30j: 0,
    isSelection: idx < 3,
  };
}

const catalogComparisons = generateComparisons();
export let allComparisons: ComparisonEntry[] = catalogComparisons;

const comparisonListeners = new Set<() => void>();
export function subscribeComparisons(fn: () => void): () => void {
  comparisonListeners.add(fn);
  return () => { comparisonListeners.delete(fn); };
}

function rebuildAllComparisons() {
  const publics = getPublicProducts();
  // On évite les doublons : un produit public porte déjà un id hashé > 1_000_000
  // donc impossible de collisionner avec un id catalogue (petit entier).
  const publicEntries = publics.map((p, i) => generatePublicProductComparison(p, i));
  // Si un produit vendeur porte exactement le même nom qu'un produit catalogue,
  // on garde les deux (le comparateur les affiche comme alternatives distinctes).
  allComparisons = [...catalogComparisons, ...publicEntries];
  comparisonListeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  subscribePublicProducts(rebuildAllComparisons);
  // Premier merge si le cache localStorage contient déjà des items publiés.
  if (getPublicProducts().length > 0) rebuildAllComparisons();
}

/**
 * Récupère une entrée de comparaison pour un produit donné.
 * Si le produit n'a pas d'entrée pré-générée (dépasse les 24 premiers),
 * la construit à la volée à partir du catalogue avec la même logique
 * déterministe (seed = product.id). Renvoie `null` si introuvable.
 */
export function comparisonForProductId(productId: number): ComparisonEntry | null {
  const existing = allComparisons.find((e) => e.productId === productId);
  if (existing) return existing;
  // Si l'id est hashé (≥ 1_000_000), il vient d'un produit vendeur publié.
  if (productId >= 1_000_000) {
    const pp = getPublicProducts().find((p) => hashProductIdToNumber(p.id) === productId);
    return pp ? generatePublicProductComparison(pp, 0) : null;
  }
  const product = catalogProducts.find((p) => p.id === productId);
  if (!product) return null;
  const zoneOptions = zones.slice(1);
  const sellerPool = [
    "Ets Ahouandjinou", "Soja Gold Benin", "Import Cereales Plus", "MoulinsAfric", "SucreBenin SA",
    "ProClean SARL", "Tokpa Textiles", "Mama Ayo Mode", "TechGros Benin", "Tech Revendeurs Cotonou",
    "Beaute Queens", "GlowUp Distribution", "BricoPlus Benin", "MatBTP Benin", "Boissons du Golfe",
    "AfricJuice Distribution", "Mama Tokpa", "Commerce General Cotonou", "Delta Import-Export",
  ];
  const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const rand = rng(product.id * 137 + 42);
  const basePrice = product.price;
  const numSellers = 3 + Math.floor(rand() * 4);
  const sellers: SellerEntry[] = Array.from({ length: numSellers }, (_, i) => {
    const variation = 0.85 + rand() * 0.35;
    const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
    return {
      name: sellerPool[(product.id * 3 + i * 7) % sellerPool.length],
      zone: zoneOptions[(product.id + i * 2) % zoneOptions.length],
      rating: +(4 + rand() * 0.9).toFixed(1), verified: rand() > 0.2,
      priceDetail: Math.round(basePrice * 1.15 * variation),
      priceSemiGros: Math.round(basePrice * variation),
      priceGros: Math.round(basePrice * 0.88 * variation),
      priceVolume: Math.round(basePrice * 0.78 * variation),
      trend: trends[Math.floor(rand() * 3)], trendPercent: +(1 + rand() * 8).toFixed(1),
      stock: (["disponible", "disponible", "disponible", "limite", "epuise"] as const)[Math.floor(rand() * 5)],
      deliveryDays: 1 + Math.floor(rand() * 5), moq: product.moq,
      badge: i === 0 ? "MEILLEUR PRIX IPPOO" : i === 1 && rand() > 0.5 ? "LIVRAISON RAPIDE" : undefined,
    };
  }).sort((a, b) => a.priceGros - b.priceGros);
  const ippooBest = sellers[0].priceGros;
  const externalPrices = externalStores
    .filter(() => rand() > 0.35).slice(0, 5 + Math.floor(rand() * 3))
    .map((store) => {
      const markup = store.type === "hypermarche" ? 1.18 + rand() * 0.25 : store.type === "supermarche" ? 1.22 + rand() * 0.3 : 1.05 + rand() * 0.15;
      return { store, price: Math.round(basePrice * markup), priceGros: store.type === "marche" ? Math.round(ippooBest * (1.02 + rand() * 0.12)) : undefined };
    });
  const avgExtPrice = externalPrices.length > 0 ? externalPrices.reduce((a, e) => a + e.price, 0) / externalPrices.length : basePrice * 1.2;
  const prices = sellers.map((s) => s.priceGros);
  return {
    productId: product.id, productName: product.name, category: product.category, image: product.image, unit: product.unit || "unites",
    sellers, externalPrices,
    prixMoyen: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    prixMin: Math.min(...prices), prixMax: Math.max(...prices), prixIppoo: ippooBest,
    economieVsExterne: Math.max(5, Math.round(((avgExtPrice - ippooBest) / avgExtPrice) * 100)),
    evolution7j: +(-5 + (rng(product.id * 31 + 7))() * 10).toFixed(1),
    evolution30j: +(-8 + (rng(product.id * 17 + 3))() * 16).toFixed(1),
    isSelection: false,
  };
}

/* ── Surveillance prix par produit (liste d'IDs) ── */
export const PRICE_WATCH_LIST_KEY = "ippoo:price-watch-list";
export const PRICE_WATCH_SEEN_KEY = "ippoo:price-watch-seen-trends";

const watchListeners = new Set<() => void>();
function emitWatch() { watchListeners.forEach((l) => l()); }
export function subscribeWatchList(l: () => void) {
  watchListeners.add(l);
  return () => { watchListeners.delete(l); };
}

export function readPriceWatchList(): number[] {
  try { const raw = scopedGetItem(PRICE_WATCH_LIST_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function writePriceWatchList(ids: number[]) {
  scopedSetItem(PRICE_WATCH_LIST_KEY, JSON.stringify(ids));
  emitWatch();
}
export function isProductWatched(productId: number): boolean {
  return readPriceWatchList().includes(productId);
}
export function toggleProductWatch(productId: number): boolean {
  const list = readPriceWatchList();
  const exists = list.includes(productId);
  const next = exists ? list.filter((x) => x !== productId) : [productId, ...list];
  writePriceWatchList(next);
  return !exists;
}

/** Snapshot des tendances déjà notifiées (évite les toasts répétés). */
function readSeenTrends(): Record<number, number> {
  try { const raw = scopedGetItem(PRICE_WATCH_SEEN_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function writeSeenTrends(map: Record<number, number>) {
  scopedSetItem(PRICE_WATCH_SEEN_KEY, JSON.stringify(map));
}

/** Élément enrichi pour l'écran "Mes prix surveillés". */
export type WatchedPriceItem = {
  productId: number;
  productName: string;
  category: string;
  image: string;
  unit: string;
  prixIppoo: number;
  prixMoyen: number;
  evolution7j: number;
  evolution30j: number;
  economieVsExterne: number;
  bestSellerName?: string;
};

export function getWatchedPriceItems(): WatchedPriceItem[] {
  return readPriceWatchList()
    .map((id) => {
      const e = comparisonForProductId(id);
      if (!e) return null;
      return {
        productId: e.productId,
        productName: e.productName,
        category: e.category,
        image: e.image,
        unit: e.unit,
        prixIppoo: e.prixIppoo,
        prixMoyen: e.prixMoyen,
        evolution7j: e.evolution7j,
        evolution30j: e.evolution30j,
        economieVsExterne: e.economieVsExterne,
        bestSellerName: e.sellers[0]?.name,
      } as WatchedPriceItem;
    })
    .filter((x): x is WatchedPriceItem => x !== null);
}

/**
 * Renvoie les nouveaux items dont la tendance 7 j est passée négative
 * depuis la dernière vérification, et persiste l'état vu pour ne pas
 * re-notifier au prochain démarrage.
 */
export function detectNewPriceDrops(): WatchedPriceItem[] {
  const seen = readSeenTrends();
  const items = getWatchedPriceItems();
  const drops: WatchedPriceItem[] = [];
  const next: Record<number, number> = { ...seen };
  for (const it of items) {
    const prev = seen[it.productId];
    if (it.evolution7j < 0 && (prev === undefined || prev >= 0)) {
      drops.push(it);
    }
    next[it.productId] = it.evolution7j;
  }
  // Nettoie les produits retirés de la liste
  const activeIds = new Set(items.map((i) => i.productId));
  for (const k of Object.keys(next)) {
    if (!activeIds.has(Number(k))) delete next[Number(k)];
  }
  writeSeenTrends(next);
  return drops;
}

export const ALERTS_KEY = "ippoo:cotation-alerts";
export const DEVIS_INTENT_KEY = "ippoo:devis-intent";
export const PRICE_WATCH_KEY = "ippoo:price-watch";
export const BOOKMARKS_KEY = "ippoo:cotation-bookmarks";

export interface PersistedAlert {
  id: number; product: string; seuil: string;
  type: "hausse" | "baisse" | "both"; active: boolean; channel: string;
}

export function pushAlertForProduct(product: string, seuilPct = 5): PersistedAlert {
  let list: PersistedAlert[] = [];
  try { const raw = scopedGetItem(ALERTS_KEY); if (raw) list = JSON.parse(raw); } catch { /* parse */ }
  if (list.some((a) => a.product.toLowerCase() === product.toLowerCase())) {
    const existing = list.find((a) => a.product.toLowerCase() === product.toLowerCase())!;
    if (!existing.active) {
      existing.active = true;
      scopedSetItem(ALERTS_KEY, JSON.stringify(list));
    }
    return existing;
  }
  const newAlert: PersistedAlert = {
    id: Date.now(), product, seuil: `±${seuilPct}%`,
    type: "both", active: true, channel: "Push",
  };
  list = [newAlert, ...list];
  scopedSetItem(ALERTS_KEY, JSON.stringify(list));
  return newAlert;
}

export function persistDevisIntent(productName: string, productId: number, vendor?: string) {
  try {
    sessionStorage.setItem(DEVIS_INTENT_KEY, JSON.stringify({
      productName, productId, vendor: vendor || null, at: Date.now(),
    }));
  } catch { /* quota */ }
}

export function readWatchFlag(): boolean {
  return scopedGetItem(PRICE_WATCH_KEY) === "1";
}
export function writeWatchFlag(on: boolean) {
  scopedSetItem(PRICE_WATCH_KEY, on ? "1" : "0");
}

export function readBookmarks(): number[] {
  try { const raw = scopedGetItem(BOOKMARKS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export function writeBookmarks(ids: number[]) {
  scopedSetItem(BOOKMARKS_KEY, JSON.stringify(ids));
}

export const productReviews: { name: string; location: string; rating: number; text: string }[] = [
  { name: "Aminata D.", location: "Cotonou", rating: 5, text: "Prix imbattable ! J'ai economise 35% par rapport a Erevan sur le meme produit." },
  { name: "Kofi M.", location: "Abomey-Calavi", rating: 5, text: "Livraison rapide et produit conforme. Le comparateur m'a aide a choisir le bon vendeur." },
  { name: "Fatou S.", location: "Porto-Novo", rating: 4, text: "Bon rapport qualite-prix. Je recommande de comparer avant d'acheter au marche." },
  { name: "Pascal A.", location: "Porto-Novo", rating: 5, text: "Grace a IPPOO j'ai trouve ce produit 40% moins cher qu'en supermarche !" },
  { name: "Grace O.", location: "Parakou", rating: 5, text: "Vendeur serieux, produit de qualite. Le prix est vraiment le meilleur du marche." },
  { name: "Ibrahim T.", location: "Parakou", rating: 4, text: "Tres satisfait de la qualite. La comparaison m'a permis de negocier avec mon fournisseur habituel." },
  { name: "Blessing N.", location: "Bohicon", rating: 5, text: "Achat groupe avec ma communaute : prix gros meme pour une petite quantite. Genial !" },
  { name: "Moussa K.", location: "Cotonou", rating: 5, text: "Le meilleur prix que j'ai trouve. Vendeur verifie et professionnel." },
];

export function getProductReviews(productId: number) {
  const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const rand = rng(productId * 73 + 19);
  const count = 2 + Math.floor(rand() * 3);
  const offset = productId % productReviews.length;
  return Array.from({ length: count }, (_, i) => productReviews[(offset + i) % productReviews.length]);
}

export const slogans = [
  "Achetez malin. Vendez juste. Grandissez ensemble.",
  "Le prix le plus bas, c'est celui que vous connaissez.",
  "Comparez. Economisez. Recommencez.",
  "Votre marche, vos prix, votre pouvoir.",
  "Chaque FCFA compte. IPPOO les protege.",
];

export const userProfiles = [
  { id: "menage", label: "Menage / Famille", icon: Home, color: "#E11D68", desc: "Protegez votre budget au quotidien.", tip: "Comparez les prix detail. Si l'ecart est fort, passez a l'achat groupe via les Communautes IPPOO.", mode: "detail" },
  { id: "independant", label: "Independant", icon: Briefcase, color: "#F97316", desc: "Construisez des prix credibles.", tip: "L'ecart gros/detail = votre marge. Tenez compte de la livraison.", mode: "semi" },
  { id: "detaillant", label: "Detaillant", icon: Store, color: "#3B82F6", desc: "Optimisez rotation & marge.", tip: "Suivez la tendance 30j pour anticiper. Le semi-gros est votre sweet spot.", mode: "semi" },
  { id: "grossiste", label: "Acheteur gros", icon: Package, color: "#059669", desc: "Negociez avec puissance.", tip: "Comparez Volume (100+) entre zones. Verrouillez le prix via un devis IPPOO.", mode: "gros" },
  { id: "vendeur", label: "Distributeur", icon: Truck, color: "#7C3AED", desc: "Protegez vos marges.", tip: "Restez aligne sur le prix moyen de votre zone. Utilisez les tendances.", mode: "volume" },
  { id: "entreprise", label: "Entreprise", icon: Building2, color: "#E8A817", desc: "Decisions collectives.", tip: "Preparez vos commandes groupees avec le comparatif comme support de decision.", mode: "volume" },
];
