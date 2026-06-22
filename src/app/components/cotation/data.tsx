import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export const P = "#0D9488";
export const PL = "#F0FDFA";
export const PD = "#065F46";
export const RED = "#E11D2E";
export const GREEN = "#16A34A";
export const GOLD = "#E8A817";
export const BLUE = "#3B82F6";
export const ORANGE = "#F97316";

export const IMG_HERO = "https://images.unsplash.com/photo-1586448910234-297fae7189e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tb2RpdHklMjBtYXJrZXQlMjB0cmFkaW5nJTIwc2NyZWVuJTIwZmluYW5jaWFsfGVufDF8fHx8MTc3MzMzNTQxNnww&ixlib=rb-4.1.0&q=80&w=1080";

export type Tab = "overview" | "categories" | "tableau" | "detail" | "analyse" | "alertes";

export interface Cotation {
  id: number;
  name: string;
  category: string;
  unit: string;
  prixSource: number;
  prixGros: number;
  prixDetail: number;
  variation24h: number;
  variation7j: number;
  variation30j: number;
  volume: number;
  dispo: "disponible" | "limité" | "rupture";
  zone: string;
  grade: string;
  verified: boolean;
  history: number[];
  lastUpdate: string;
  trend: "hausse" | "baisse" | "stable";
  fournisseur: string;
}

export const cotations: Cotation[] = [
  { id: 1, name: "Riz Parfumé Thai", category: "Alimentaire", unit: "sac 25kg", prixSource: 11000, prixGros: 14500, prixDetail: 18500, variation24h: -0.8, variation7j: -3.2, variation30j: -5.4, volume: 1250, dispo: "disponible", zone: "National", grade: "Premium", verified: true, history: [15200, 15000, 14800, 14700, 14600, 14500, 14500], lastUpdate: "12/03 08:30", trend: "baisse", fournisseur: "Bénin Import SA" },
  { id: 2, name: "Huile de palme rouge", category: "Alimentaire", unit: "bidon 20L", prixSource: 12000, prixGros: 17000, prixDetail: 22000, variation24h: 1.2, variation7j: 5.1, variation30j: 8.3, volume: 890, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [16200, 16400, 16600, 16800, 17000, 17000, 17000], lastUpdate: "12/03 09:15", trend: "hausse", fournisseur: "Palmeraie du Sud" },
  { id: 3, name: "Sucre en poudre", category: "Alimentaire", unit: "sac 50kg", prixSource: 20000, prixGros: 26000, prixDetail: 32000, variation24h: 0, variation7j: -1.5, variation30j: -2.1, volume: 670, dispo: "disponible", zone: "National", grade: "Raffiné", verified: true, history: [26500, 26400, 26300, 26200, 26100, 26000, 26000], lastUpdate: "12/03 07:45", trend: "baisse", fournisseur: "Sucrier National" },
  { id: 4, name: "Tomate concentrée", category: "Alimentaire", unit: "carton 48", prixSource: 8500, prixGros: 11500, prixDetail: 15000, variation24h: 2.1, variation7j: 8.2, variation30j: 12.5, volume: 420, dispo: "limité", zone: "Cotonou", grade: "Premium", verified: false, history: [10600, 10800, 11000, 11200, 11400, 11500, 11500], lastUpdate: "12/03 10:00", trend: "hausse", fournisseur: "Import Aagro" },
  { id: 5, name: "Eau minérale pack 6L", category: "Boissons", unit: "carton 12", prixSource: 2800, prixGros: 3500, prixDetail: 4500, variation24h: 0, variation7j: 0, variation30j: -1.2, volume: 2100, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [3500, 3500, 3500, 3500, 3500, 3500, 3500], lastUpdate: "12/03 08:00", trend: "stable", fournisseur: "Source Béninoise" },
  { id: 6, name: "Jus de bissap 33cl", category: "Boissons", unit: "carton 24", prixSource: 4200, prixGros: 6000, prixDetail: 8500, variation24h: -0.5, variation7j: -2.3, variation30j: -4.1, volume: 780, dispo: "disponible", zone: "National", grade: "Bio", verified: true, history: [6150, 6120, 6080, 6050, 6020, 6000, 6000], lastUpdate: "12/03 09:30", trend: "baisse", fournisseur: "Saveurs d'Afrique" },
  { id: 7, name: "Beurre de karité bio", category: "Beauté", unit: "pot 5kg", prixSource: 7500, prixGros: 11000, prixDetail: 15000, variation24h: -1.1, variation7j: -4.3, variation30j: -6.7, volume: 340, dispo: "disponible", zone: "Nord", grade: "Bio", verified: true, history: [11500, 11400, 11300, 11200, 11100, 11000, 11000], lastUpdate: "12/03 08:45", trend: "baisse", fournisseur: "Karité d'Or" },
  { id: 8, name: "Huile de coco vierge", category: "Beauté", unit: "carton 12L", prixSource: 9000, prixGros: 13500, prixDetail: 18000, variation24h: 0.3, variation7j: 1.8, variation30j: 3.2, volume: 280, dispo: "disponible", zone: "National", grade: "Premium", verified: true, history: [13200, 13250, 13300, 13350, 13400, 13450, 13500], lastUpdate: "12/03 09:00", trend: "hausse", fournisseur: "Cocotier Bénin" },
  { id: 9, name: "Savon de ménage 800g", category: "Maison", unit: "carton 48", prixSource: 6000, prixGros: 8500, prixDetail: 12000, variation24h: 0, variation7j: 0, variation30j: -0.5, volume: 950, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [8500, 8500, 8500, 8500, 8500, 8500, 8500], lastUpdate: "12/03 07:30", trend: "stable", fournisseur: "Propreté Plus" },
  { id: 10, name: "Javel 5L", category: "Maison", unit: "carton 6", prixSource: 3200, prixGros: 4500, prixDetail: 6500, variation24h: 0.5, variation7j: 2.1, variation30j: 4.8, volume: 620, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [4400, 4420, 4440, 4460, 4480, 4490, 4500], lastUpdate: "12/03 08:15", trend: "hausse", fournisseur: "Clean Bénin" },
  { id: 11, name: "Pagne Wax Hollandais", category: "Textile", unit: "yard 6", prixSource: 4500, prixGros: 7000, prixDetail: 10000, variation24h: 0.2, variation7j: 1.2, variation30j: 2.5, volume: 560, dispo: "disponible", zone: "National", grade: "Super Wax", verified: true, history: [6900, 6920, 6940, 6960, 6980, 7000, 7000], lastUpdate: "12/03 09:45", trend: "hausse", fournisseur: "Wax Kingdom" },
  { id: 12, name: "T-shirt blanc uni", category: "Textile", unit: "carton 50", prixSource: 15000, prixGros: 22000, prixDetail: 35000, variation24h: 0, variation7j: -0.8, variation30j: -1.5, volume: 310, dispo: "disponible", zone: "Cotonou", grade: "Standard", verified: true, history: [22200, 22150, 22100, 22080, 22050, 22020, 22000], lastUpdate: "12/03 10:15", trend: "baisse", fournisseur: "Textil Pro" },
  { id: 13, name: "Ciment CIM BENIN", category: "BTP", unit: "sac 50kg", prixSource: 3200, prixGros: 3800, prixDetail: 4500, variation24h: 0.4, variation7j: 2.8, variation30j: 5.2, volume: 3200, dispo: "limité", zone: "Sud", grade: "CPA 42.5", verified: true, history: [3700, 3720, 3750, 3780, 3800, 3800, 3800], lastUpdate: "12/03 06:30", trend: "hausse", fournisseur: "CIM Bénin" },
  { id: 14, name: "Fer à béton 10mm", category: "BTP", unit: "barre 12m", prixSource: 3500, prixGros: 4200, prixDetail: 5000, variation24h: -0.2, variation7j: -0.5, variation30j: 1.8, volume: 1800, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [4220, 4210, 4210, 4200, 4200, 4200, 4200], lastUpdate: "12/03 07:00", trend: "stable", fournisseur: "Acier Plus" },
  { id: 15, name: "Câble USB-C charge rapide", category: "Électronique", unit: "carton 100", prixSource: 25000, prixGros: 38000, prixDetail: 55000, variation24h: -0.3, variation7j: -1.5, variation30j: -3.8, volume: 450, dispo: "disponible", zone: "Cotonou", grade: "Certifié", verified: true, history: [38600, 38500, 38400, 38300, 38200, 38100, 38000], lastUpdate: "12/03 10:30", trend: "baisse", fournisseur: "TechWave" },
  { id: 16, name: "Écouteurs Bluetooth", category: "Électronique", unit: "carton 50", prixSource: 45000, prixGros: 65000, prixDetail: 95000, variation24h: 0.8, variation7j: 2.5, variation30j: 5.1, volume: 220, dispo: "disponible", zone: "National", grade: "Premium", verified: true, history: [63400, 63800, 64200, 64500, 64700, 64900, 65000], lastUpdate: "12/03 11:00", trend: "hausse", fournisseur: "ElectroBénin" },
  { id: 17, name: "Ventilateur plafond", category: "Maison", unit: "carton 4", prixSource: 28000, prixGros: 40000, prixDetail: 55000, variation24h: 0, variation7j: -1.2, variation30j: -2.8, volume: 180, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [40500, 40400, 40300, 40200, 40100, 40050, 40000], lastUpdate: "12/03 08:00", trend: "baisse", fournisseur: "Cool Bénin" },
  { id: 18, name: "Réfrigérateur 200L", category: "Maison", unit: "pièce", prixSource: 145000, prixGros: 195000, prixDetail: 260000, variation24h: 0, variation7j: 0, variation30j: -1.5, volume: 85, dispo: "limité", zone: "Cotonou", grade: "A+", verified: true, history: [195000, 195000, 195000, 195000, 195000, 195000, 195000], lastUpdate: "12/03 09:00", trend: "stable", fournisseur: "Froid Express" },
  { id: 19, name: "Groupe électrogène 5kVA", category: "Industriel", unit: "pièce", prixSource: 280000, prixGros: 350000, prixDetail: 420000, variation24h: -0.5, variation7j: -2.1, variation30j: -4.5, volume: 65, dispo: "limité", zone: "Cotonou", grade: "Pro", verified: true, history: [358000, 356000, 354000, 352000, 350000, 350000, 350000], lastUpdate: "12/03 07:15", trend: "baisse", fournisseur: "PowerGen" },
  { id: 20, name: "Machine à coudre industrielle", category: "Industriel", unit: "pièce", prixSource: 180000, prixGros: 245000, prixDetail: 320000, variation24h: 0.3, variation7j: 1.8, variation30j: 3.2, volume: 45, dispo: "disponible", zone: "National", grade: "Pro", verified: true, history: [240800, 241500, 242200, 243000, 243800, 244500, 245000], lastUpdate: "12/03 10:45", trend: "hausse", fournisseur: "IndustriBénin" },
  { id: 21, name: "Pneu moto 2.75-17", category: "Auto/Moto", unit: "lot 10", prixSource: 35000, prixGros: 48000, prixDetail: 65000, variation24h: 0.6, variation7j: 3.2, variation30j: 6.1, volume: 320, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [46500, 46800, 47100, 47400, 47700, 47850, 48000], lastUpdate: "12/03 08:30", trend: "hausse", fournisseur: "AutoParts Bénin" },
  { id: 22, name: "Huile moteur 5W-30", category: "Auto/Moto", unit: "carton 12L", prixSource: 18000, prixGros: 25000, prixDetail: 35000, variation24h: 0, variation7j: -0.8, variation30j: -1.2, volume: 540, dispo: "disponible", zone: "National", grade: "Premium", verified: true, history: [25200, 25200, 25100, 25100, 25050, 25000, 25000], lastUpdate: "12/03 09:15", trend: "stable", fournisseur: "Lubrif Express" },
  { id: 23, name: "Ballon de football", category: "Sport", unit: "carton 20", prixSource: 12000, prixGros: 18000, prixDetail: 28000, variation24h: 0, variation7j: 0, variation30j: -2.1, volume: 180, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [18000, 18000, 18000, 18000, 18000, 18000, 18000], lastUpdate: "12/03 10:00", trend: "stable", fournisseur: "SportZone" },
  { id: 24, name: "Jouets éducatifs assortis", category: "Bébé/Enfant", unit: "carton 24", prixSource: 8500, prixGros: 12500, prixDetail: 18000, variation24h: -0.4, variation7j: -1.8, variation30j: -3.5, volume: 95, dispo: "disponible", zone: "Cotonou", grade: "Sécurisé", verified: true, history: [12700, 12680, 12650, 12600, 12570, 12530, 12500], lastUpdate: "12/03 11:15", trend: "baisse", fournisseur: "KidsPlanet" },
  { id: 25, name: "Ramette papier A4 80g", category: "Fournitures", unit: "carton 5 ram.", prixSource: 10000, prixGros: 14500, prixDetail: 19000, variation24h: 0.7, variation7j: 3.5, variation30j: 7.2, volume: 680, dispo: "limité", zone: "National", grade: "Standard", verified: true, history: [14000, 14080, 14150, 14250, 14350, 14420, 14500], lastUpdate: "12/03 07:45", trend: "hausse", fournisseur: "Bureau Express" },
  { id: 26, name: "Stylo bille bleu BIC", category: "Fournitures", unit: "carton 50", prixSource: 5500, prixGros: 8000, prixDetail: 12000, variation24h: 0, variation7j: 0, variation30j: 0, volume: 1200, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [8000, 8000, 8000, 8000, 8000, 8000, 8000], lastUpdate: "12/03 08:00", trend: "stable", fournisseur: "Papeterie Nationale" },
  { id: 27, name: "Sacs kraft recyclé", category: "Fournitures", unit: "carton 500", prixSource: 15000, prixGros: 22000, prixDetail: 32000, variation24h: 0.3, variation7j: 1.5, variation30j: 2.8, volume: 280, dispo: "disponible", zone: "National", grade: "Éco", verified: true, history: [21700, 21750, 21800, 21850, 21900, 21950, 22000], lastUpdate: "12/03 09:30", trend: "hausse", fournisseur: "EcoPack Bénin" },
  { id: 28, name: "Bureau professionnel bois", category: "Équipements", unit: "pièce", prixSource: 45000, prixGros: 65000, prixDetail: 90000, variation24h: 0, variation7j: -0.5, variation30j: -1.8, volume: 60, dispo: "disponible", zone: "Cotonou", grade: "Premium", verified: true, history: [65300, 65300, 65200, 65200, 65100, 65050, 65000], lastUpdate: "12/03 10:00", trend: "stable", fournisseur: "Mobilier Pro" },
  { id: 29, name: "Parfum haut de gamme", category: "Luxe", unit: "lot 12", prixSource: 85000, prixGros: 120000, prixDetail: 180000, variation24h: 0, variation7j: 0.8, variation30j: 2.5, volume: 35, dispo: "disponible", zone: "Cotonou", grade: "Prestige", verified: true, history: [119000, 119200, 119400, 119600, 119700, 119800, 120000], lastUpdate: "12/03 11:30", trend: "hausse", fournisseur: "Luxe Import" },
  { id: 30, name: "Montre fashion", category: "Luxe", unit: "lot 6", prixSource: 55000, prixGros: 78000, prixDetail: 110000, variation24h: -0.2, variation7j: -1.2, variation30j: -2.8, volume: 28, dispo: "limité", zone: "Cotonou", grade: "Premium", verified: true, history: [78900, 78800, 78600, 78500, 78300, 78100, 78000], lastUpdate: "12/03 10:45", trend: "baisse", fournisseur: "Chrono Elite" },
  { id: 31, name: "Farine de blé T55", category: "Alimentaire", unit: "sac 50kg", prixSource: 18000, prixGros: 24000, prixDetail: 30000, variation24h: 0.5, variation7j: 2.2, variation30j: 4.8, volume: 580, dispo: "disponible", zone: "National", grade: "Standard", verified: true, history: [23500, 23600, 23700, 23800, 23850, 23950, 24000], lastUpdate: "12/03 08:15", trend: "hausse", fournisseur: "Minoterie Bénin" },
  { id: 32, name: "Tôle ondulée 0.3mm", category: "BTP", unit: "paquet 10", prixSource: 25000, prixGros: 35000, prixDetail: 45000, variation24h: 1.1, variation7j: 4.5, variation30j: 8.2, volume: 920, dispo: "limité", zone: "National", grade: "Standard", verified: true, history: [33500, 33800, 34000, 34300, 34600, 34800, 35000], lastUpdate: "12/03 07:00", trend: "hausse", fournisseur: "Tôlerie Nationale" },
];

export const cotationCategories = [
  "Tous",
  ...Array.from(new Set(cotations.map(c => c.category))).sort(),
];

export interface Alert {
  id: number;
  product: string;
  seuil: string;
  type: "hausse" | "baisse" | "both";
  active: boolean;
  channel: string;
}

// Aucune alerte préconfigurée : l'utilisateur définit les siennes.
export const defaultAlerts: Alert[] = [];

export const dispoStyle = (d: string) => {
  if (d === "disponible") return { color: GREEN, label: "Disponible", bg: `rgba(22,163,74,0.1)` };
  if (d === "limité") return { color: GOLD, label: "Limité", bg: `rgba(232,168,23,0.1)` };
  return { color: RED, label: "Rupture", bg: `rgba(225,29,46,0.1)` };
};

export const trendColor = (v: number) => v > 0 ? RED : v < 0 ? GREEN : "#9CA3AF";
export const trendIcon = (v: number) => v > 0 ? ArrowUpRight : v < 0 ? ArrowDownRight : Minus;
export const formatVar = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

export const dayLabels = ["L-6", "L-5", "L-4", "L-3", "L-2", "Hier", "Auj."];

export function MiniSparkline({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
