import { IMAGES } from "./mock-data";

/* ═══════════════════════════════════════════════════
   RICH MARKET DATA
   ═══════════════════════════════════════════════════ */
export const MARKET_IMAGES = {
  tokpa_textile: "https://images.unsplash.com/photo-1768212565424-efa3a3852b81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwdGV4dGlsZSUyMG1hcmtldCUyMGNvbG9yZnVsJTIwZmFicmljc3xlbnwxfHx8fDE3NzI5MTU1OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  missebo_friperie: "https://images.unsplash.com/photo-1650035931440-8f11f00544bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWNvbmRoYW5kJTIwY2xvdGhpbmclMjBtYXJrZXQlMjBBZnJpY2ElMjB0aHJpZnR8ZW58MXx8fHwxNzcyOTE1NjAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  arzeke_food: "https://images.unsplash.com/photo-1759316777881-24c0b09c3a63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZm9vZCUyMG1hcmtldCUyMHNwaWNlcyUyMGNvbmRpbWVudHN8ZW58MXx8fHwxNzcyOTE1NTk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  guema_cereals: "https://images.unsplash.com/photo-1599456942086-8430fb30fa00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFpbiUyMGNlcmVhbCUyMG1hcmtldCUyMHdob2xlc2FsZSUyMGJhZ3N8ZW58MXx8fHwxNzcyOTE1NTk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  accessories: "https://images.unsplash.com/photo-1692689383138-c2df3476072c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tYW4lMjBzaG9wcGluZyUyMGJhZ3MlMjBhY2Nlc3Nvcmllc3xlbnwxfHx8fDE3NzI5MTU2MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  tropical_fruits: "https://images.unsplash.com/photo-1759344114577-b6c32e4d68c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGZydWl0cyUyMHZlZ2V0YWJsZXMlMjBBZnJpY2FuJTIwbWFya2V0JTIwc3RhbGx8ZW58MXx8fHwxNzcyOTE1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

export interface MarketDay {
  id: number;
  slug: string;
  name: string;
  fullName: string;
  theme: string;
  description: string;
  color: string;
  colorLight: string;
  date: string;
  dateLabel: string;
  time: string;
  location: string;
  city: string;
  heroImage: string;
  secondaryImages: string[];
  couponCode: string;
  couponDiscount: string;
  couponCondition: string;
  deliveryFree: boolean;
  deliveryFreeMin: number;
  participants: number;
  categories: string[];
  highlights: string[];
  vendors: MarketVendor[];
  products: MarketProduct[];
  schedule: ScheduleItem[];
  rules: string[];
}

export interface MarketVendor {
  id: number;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  badge: string;
  specialOffer: string;
}

export interface MarketProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  moq: number;
  unit: string;
  seller: string;
  rating: number;
  stock: number;
}

export interface ScheduleItem {
  time: string;
  label: string;
  highlight?: boolean;
}

export const marketsData: MarketDay[] = [
  {
    id: 1,
    slug: "tokpa",
    name: "Jour Tokpa",
    fullName: "Grand Marché Tokpa, Journée Textile & Accessoires",
    theme: "Textile & Accessoires",
    description: "Retrouvez les meilleurs prix sur les tissus Wax, pagnes, accessoires et textiles du plus grand marché d'Afrique de l'Ouest. Négociez directement avec les grossistes de Tokpa depuis votre téléphone.",
    color: "#E11D2E",
    colorLight: "#FEE2E2",
    date: "Samedi 8 Mars 2026",
    dateLabel: "Chaque samedi",
    time: "06h00, 18h00",
    location: "Marché Tokpa, Cotonou",
    city: "Cotonou",
    heroImage: MARKET_IMAGES.tokpa_textile,
    secondaryImages: [MARKET_IMAGES.accessories, IMAGES.textile],
    couponCode: "TOKPA25",
    couponDiscount: "-25% sur les textiles",
    couponCondition: "Minimum 5 pièces commandées",
    deliveryFree: true,
    deliveryFreeMin: 75000,
    participants: 342,
    categories: ["Wax Hollandais", "Pagnes", "Basin", "Brodé", "Dentelle", "Foulards", "Sacs", "Bijoux fantaisie", "Chaussures", "Ceintures"],
    highlights: ["Jusqu'à -30% sur le Wax", "Livraison offerte dès 75 000 FCFA", "Vendeurs certifiés Tokpa"],
    vendors: [
      { id: 1, name: "Tokpa Textiles", avatar: IMAGES.businessman, category: "Wax & Pagnes", rating: 4.9, badge: "TOP", specialOffer: "-20% Wax Hollandais" },
      { id: 2, name: "Mama Ayo Tissus", avatar: IMAGES.entrepreneur, category: "Basin & Brodé", rating: 4.8, badge: "VIP", specialOffer: "3 achetés = 1 offert" },
      { id: 5, name: "Style & Mode Cotonou", avatar: IMAGES.market, category: "Accessoires", rating: 4.6, badge: "VERIFIE", specialOffer: "Pack accessoires -15%" },
      { id: 8, name: "Bénin Couture Pro", avatar: IMAGES.entrepreneur, category: "Dentelle & Brodé", rating: 4.7, badge: "TOP", specialOffer: "Lot dentelle -25%" },
    ],
    products: [
      { id: 4, name: "Tissu Wax Hollandais 12 yards", image: IMAGES.textile, price: 22400, originalPrice: 28000, discount: 20, moq: 10, unit: "pièces", seller: "Tokpa Textiles", rating: 4.9, stock: 40 },
      { id: 29, name: "Pagne Basin Riche Doré", image: MARKET_IMAGES.tokpa_textile, price: 35000, originalPrice: 45000, discount: 22, moq: 5, unit: "pièces", seller: "Mama Ayo Tissus", rating: 4.8, stock: 25 },
      { id: 30, name: "T-shirts & Foulards Assortis x50", image: MARKET_IMAGES.accessories, price: 18000, originalPrice: 24000, discount: 25, moq: 3, unit: "lots", seller: "Style & Mode", rating: 4.6, stock: 60 },
      { id: 31, name: "Pagne Kente 6 yards Premium", image: IMAGES.textile, price: 42000, originalPrice: 55000, discount: 24, moq: 3, unit: "pièces", seller: "Bénin Couture Pro", rating: 4.7, stock: 15 },
      { id: 32, name: "Draps de lit 2 places x10", image: MARKET_IMAGES.tokpa_textile, price: 28000, originalPrice: 35000, discount: 20, moq: 5, unit: "pièces", seller: "Tokpa Textiles", rating: 4.9, stock: 30 },
      { id: 33, name: "Friperie triée balles 100kg", image: MARKET_IMAGES.accessories, price: 45000, originalPrice: 60000, discount: 25, moq: 2, unit: "lots", seller: "Style & Mode", rating: 4.5, stock: 20 },
    ],
    schedule: [
      { time: "06:00", label: "Ouverture, Premiers arrivages" },
      { time: "08:00", label: "Flash Wax : -30% pendant 2h", highlight: true },
      { time: "10:00", label: "Vente groupée Basin" },
      { time: "12:00", label: "Pause, Offres midi" },
      { time: "14:00", label: "Flash Accessoires : -25%", highlight: true },
      { time: "16:00", label: "Dernières enchères" },
      { time: "18:00", label: "Clôture" },
    ],
    rules: [
      "Commande minimum : 3 pièces par référence",
      "Livraison offerte dès 75 000 FCFA à Cotonou",
      "Retours acceptés sous 48h si non-conformité",
      "Paiement : IPPOO CASH, Mobile Money, Carte bancaire",
    ],
  },
  {
    id: 2,
    slug: "missebo",
    name: "Jour Missèbo",
    fullName: "Marché Missèbo, Journée Textile & Friperie",
    theme: "Textile & Friperie",
    description: "Le marché de la friperie et du textile d'occasion le plus populaire de Cotonou. Trouvez des vêtements de marque, friperie triée et textiles à prix imbattables en gros.",
    color: "#F97316",
    colorLight: "#FFF7ED",
    date: "Dimanche 9 Mars 2026",
    dateLabel: "Chaque dimanche",
    time: "07h00, 17h00",
    location: "Marché Missèbo, Cotonou",
    city: "Cotonou",
    heroImage: MARKET_IMAGES.missebo_friperie,
    secondaryImages: [MARKET_IMAGES.accessories, IMAGES.textile],
    couponCode: "MISSEBO15",
    couponDiscount: "-15% friperie & textile",
    couponCondition: "Minimum 10 pièces",
    deliveryFree: true,
    deliveryFreeMin: 50000,
    participants: 278,
    categories: ["Friperie triée", "Jeans", "T-shirts", "Robes", "Chemises", "Chaussures occasion", "Sacs", "Vêtements enfants", "Manteaux", "Sport"],
    highlights: ["Balles triées premium", "Friperie 1er choix dès 500 FCFA/pièce", "Livraison gratuite dès 50 000 FCFA"],
    vendors: [
      { id: 3, name: "Missèbo Select", avatar: IMAGES.market, category: "Friperie 1er choix", rating: 4.7, badge: "TOP", specialOffer: "Balle 50kg : -20%" },
      { id: 6, name: "Faso Fashion", avatar: IMAGES.entrepreneur, category: "Jeans & Casual", rating: 4.5, badge: "VERIFIE", specialOffer: "Lot 100 jeans : 35 000 FCFA" },
      { id: 9, name: "Kids Corner Frip", avatar: IMAGES.businessman, category: "Vêtements enfants", rating: 4.4, badge: "VERIFIE", specialOffer: "Lot enfants : 200 FCFA/pièce" },
      { id: 12, name: "Premium Second", avatar: IMAGES.entrepreneur, category: "Marques & Premium", rating: 4.8, badge: "VIP", specialOffer: "Marques : -30% ce dimanche" },
    ],
    products: [
      { id: 33, name: "Balle friperie triée 100kg - Premium", image: MARKET_IMAGES.missebo_friperie, price: 40000, originalPrice: 55000, discount: 27, moq: 1, unit: "balles", seller: "Missèbo Select", rating: 4.7, stock: 50 },
      { id: 30, name: "T-shirts blancs coton x50", image: MARKET_IMAGES.missebo_friperie, price: 35000, originalPrice: 48000, discount: 27, moq: 1, unit: "lots", seller: "Faso Fashion", rating: 4.5, stock: 30 },
      { id: 4, name: "Tissu Wax Hollandais 12 yards", image: IMAGES.textile, price: 25000, originalPrice: 35000, discount: 29, moq: 1, unit: "lots", seller: "Missèbo Select", rating: 4.6, stock: 40 },
      { id: 31, name: "Pagne Kente 6 yards", image: MARKET_IMAGES.accessories, price: 20000, originalPrice: 28000, discount: 29, moq: 1, unit: "lots", seller: "Kids Corner Frip", rating: 4.4, stock: 35 },
      { id: 29, name: "Bazin riche 10 yards", image: MARKET_IMAGES.missebo_friperie, price: 30000, originalPrice: 42000, discount: 29, moq: 1, unit: "lots", seller: "Faso Fashion", rating: 4.5, stock: 20 },
      { id: 32, name: "Draps de lit 2 places x10", image: MARKET_IMAGES.accessories, price: 22000, originalPrice: 30000, discount: 27, moq: 1, unit: "lots", seller: "Premium Second", rating: 4.8, stock: 18 },
    ],
    schedule: [
      { time: "07:00", label: "Ouverture, Arrivage balles" },
      { time: "08:30", label: "Flash Jeans : -30%", highlight: true },
      { time: "10:00", label: "Tri premium ouvert" },
      { time: "11:30", label: "Vente groupée enfants", highlight: true },
      { time: "13:00", label: "Pause" },
      { time: "14:30", label: "Flash chaussures", highlight: true },
      { time: "17:00", label: "Clôture" },
    ],
    rules: [
      "Achat minimum : 1 balle ou 1 lot",
      "Livraison offerte dès 50 000 FCFA",
      "Échange possible sous 24h",
      "Paiement : IPPOO CASH, Mobile Money",
    ],
  },
  {
    id: 3,
    slug: "arzeke",
    name: "Jour Arzèkè",
    fullName: "Grand Marché Arzèkè, Journée Alimentaire & Condiments",
    theme: "Alimentaire & Condiments",
    description: "Le plus grand marché du Nord Bénin arrive en ligne ! Épices, condiments, produits alimentaires en gros, directement des producteurs et grossistes d'Arzèkè à Parakou.",
    color: "#16A34A",
    colorLight: "#F0FDF4",
    date: "Lundi 10 Mars 2026",
    dateLabel: "Chaque lundi",
    time: "05h30, 16h00",
    location: "Marché Arzèkè, Parakou",
    city: "Parakou",
    heroImage: MARKET_IMAGES.arzeke_food,
    secondaryImages: [IMAGES.grocery, MARKET_IMAGES.tropical_fruits],
    couponCode: "ARZEKE20",
    couponDiscount: "-20% alimentaire",
    couponCondition: "Dès 100 000 FCFA d'achat",
    deliveryFree: true,
    deliveryFreeMin: 100000,
    participants: 456,
    categories: ["Riz", "Huiles", "Épices", "Condiments", "Conserves", "Farine", "Sucre", "Sel", "Tomate concentrée", "Poisson séché"],
    highlights: ["Directement des producteurs du Nord", "Prix imbattables sur le riz et l'huile", "-20% dès 100 000 FCFA"],
    vendors: [
      { id: 4, name: "Ets Ahouandjinou", avatar: IMAGES.entrepreneur, category: "Riz & Céréales", rating: 4.8, badge: "VIP", specialOffer: "Riz 25kg : 12 800 FCFA" },
      { id: 7, name: "Soja Gold Bénin", avatar: IMAGES.businessman, category: "Huiles & Corps gras", rating: 4.6, badge: "TOP", specialOffer: "Huile 20L : -18%" },
      { id: 10, name: "Épices du Nord", avatar: IMAGES.market, category: "Épices & Condiments", rating: 4.7, badge: "VERIFIE", specialOffer: "Pack épices : -25%" },
      { id: 13, name: "Konserv Plus", avatar: IMAGES.entrepreneur, category: "Conserves", rating: 4.5, badge: "VERIFIE", specialOffer: "Lot tomate : 2+1 gratuit" },
    ],
    products: [
      { id: 1, name: "Riz Parfumé 25kg, Premium", image: IMAGES.grocery, price: 12800, originalPrice: 16000, discount: 20, moq: 10, unit: "sacs", seller: "Ets Ahouandjinou", rating: 4.8, stock: 200 },
      { id: 2, name: "Huile de palme raffinée 20L", image: IMAGES.vegetables, price: 14500, originalPrice: 18000, discount: 19, moq: 5, unit: "bidons", seller: "Soja Gold Bénin", rating: 4.6, stock: 80 },
      { id: 10, name: "Concentré de tomate 400g x48", image: MARKET_IMAGES.arzeke_food, price: 15000, originalPrice: 20000, discount: 25, moq: 5, unit: "packs", seller: "Épices du Nord", rating: 4.7, stock: 60 },
      { id: 11, name: "Farine de blé T55 - 50kg", image: IMAGES.grocery, price: 24000, originalPrice: 32000, discount: 25, moq: 3, unit: "cartons", seller: "Konserv Plus", rating: 4.5, stock: 100 },
      { id: 13, name: "Lait en poudre 400g x24", image: IMAGES.grocery, price: 22000, originalPrice: 28000, discount: 21, moq: 5, unit: "sacs", seller: "Ets Ahouandjinou", rating: 4.8, stock: 90 },
      { id: 12, name: "Sucre en poudre 50kg", image: IMAGES.grocery, price: 19500, originalPrice: 25000, discount: 22, moq: 5, unit: "sacs", seller: "Soja Gold Bénin", rating: 4.6, stock: 70 },
    ],
    schedule: [
      { time: "05:30", label: "Ouverture, Arrivages frais" },
      { time: "07:00", label: "Flash Riz : -25% les 2 premières heures", highlight: true },
      { time: "09:00", label: "Vente groupée huiles" },
      { time: "10:30", label: "Flash Épices : packs -30%", highlight: true },
      { time: "12:00", label: "Pause" },
      { time: "13:30", label: "Derniers arrivages conserves", highlight: true },
      { time: "16:00", label: "Clôture" },
    ],
    rules: [
      "Commande minimum selon produit (voir fiche)",
      "Livraison offerte dès 100 000 FCFA",
      "Produits vérifiés DLUO conformes",
      "Paiement : IPPOO CASH, Mobile Money, Carte, Virement",
    ],
  },
  {
    id: 4,
    slug: "guema",
    name: "Jour Guéma",
    fullName: "Marché Guéma, Journée Vivrier & Céréales",
    theme: "Vivrier & Céréales",
    description: "Le marché des produits vivriers et céréales en gros du Bénin. Maïs, igname, manioc, haricot, mil, sorgho, directement des zones de production vers votre commerce.",
    color: "#E8A817",
    colorLight: "#FEF9E7",
    date: "Mardi 11 Mars 2026",
    dateLabel: "Chaque mardi",
    time: "06h00, 15h00",
    location: "Marché Guéma, Parakou",
    city: "Parakou",
    heroImage: MARKET_IMAGES.guema_cereals,
    secondaryImages: [IMAGES.vegetables, MARKET_IMAGES.tropical_fruits],
    couponCode: "GUEMA15",
    couponDiscount: "-15% vivrier",
    couponCondition: "Dès 20 sacs commandés",
    deliveryFree: true,
    deliveryFreeMin: 150000,
    participants: 389,
    categories: ["Maïs", "Igname", "Manioc", "Haricot", "Mil", "Sorgho", "Arachide", "Soja", "Noix de palme", "Karité"],
    highlights: ["Prix producteur garanti", "Céréales récoltées 2026", "Transport groupé disponible"],
    vendors: [
      { id: 11, name: "AgroNord Bénin", avatar: IMAGES.businessman, category: "Céréales & Grains", rating: 4.7, badge: "TOP", specialOffer: "Maïs 50kg : 6 800 FCFA" },
      { id: 14, name: "Coop Vivrier Borgou", avatar: IMAGES.entrepreneur, category: "Igname & Tubercules", rating: 4.6, badge: "VIP", specialOffer: "Igname pilée : -20%" },
      { id: 15, name: "Karité Gold", avatar: IMAGES.market, category: "Oléagineux", rating: 4.5, badge: "VERIFIE", specialOffer: "Beurre karité : lot -25%" },
      { id: 16, name: "Haricot Express", avatar: IMAGES.entrepreneur, category: "Légumineuses", rating: 4.4, badge: "VERIFIE", specialOffer: "Haricot 100kg : prix cassé" },
    ],
    products: [
      { id: 7, name: "Maïs séché 50kg, Récolte 2026", image: MARKET_IMAGES.guema_cereals, price: 6800, originalPrice: 8500, discount: 20, moq: 20, unit: "sacs", seller: "AgroNord Bénin", rating: 4.7, stock: 300 },
      { id: 44, name: "Igname pilée, Sac 25kg", image: IMAGES.vegetables, price: 12000, originalPrice: 15000, discount: 20, moq: 10, unit: "sacs", seller: "Coop Vivrier Borgou", rating: 4.6, stock: 150 },
      { id: 46, name: "Haricots rouges 25kg", image: MARKET_IMAGES.guema_cereals, price: 45000, originalPrice: 58000, discount: 22, moq: 5, unit: "sacs", seller: "Haricot Express", rating: 4.4, stock: 80 },
      { id: 25, name: "Beurre de karité brut 10kg", image: MARKET_IMAGES.tropical_fruits, price: 28000, originalPrice: 35000, discount: 20, moq: 3, unit: "bidons", seller: "Karité Gold", rating: 4.5, stock: 40 },
      { id: 47, name: "Arachide décortiquée 50kg", image: MARKET_IMAGES.guema_cereals, price: 7500, originalPrice: 9500, discount: 21, moq: 15, unit: "sacs", seller: "AgroNord Bénin", rating: 4.7, stock: 200 },
      { id: 45, name: "Gari (manioc séché) 50kg", image: IMAGES.grocery, price: 5500, originalPrice: 7000, discount: 21, moq: 20, unit: "sacs", seller: "Coop Vivrier Borgou", rating: 4.6, stock: 250 },
    ],
    schedule: [
      { time: "06:00", label: "Ouverture, Arrivages producteurs" },
      { time: "07:30", label: "Flash Maïs & Sorgho : -25%", highlight: true },
      { time: "09:00", label: "Vente groupée igname" },
      { time: "10:30", label: "Flash Légumineuses", highlight: true },
      { time: "12:00", label: "Oléagineux : lots karité & arachide", highlight: true },
      { time: "13:30", label: "Derniers prix" },
      { time: "15:00", label: "Clôture" },
    ],
    rules: [
      "Commande minimum : 5 sacs par référence",
      "Livraison offerte dès 150 000 FCFA",
      "Produits certifiés origine Borgou",
      "Transport groupé disponible vers le Sud",
    ],
  },
];
