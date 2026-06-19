import {
  Smartphone, Zap, Shirt, Sparkles, Home, Hammer, Cog, Car, Trophy,
  Baby, BookOpen, Package, Monitor, Crown, UtensilsCrossed, GlassWater,
  Flame, SprayCan, Briefcase, Wheat, HardHat, Wrench, Factory, Sofa,
  Gem, Dumbbell, Cpu, Bike, Heart, Coffee, type LucideIcon,
} from "lucide-react";
import { IMAGES } from "./mock-data-images";

import heroImg1 from "../../imports/photo_1_2026-05-18_23-15-52.jpg";
import heroImg2 from "../../imports/photo_2_2026-05-18_23-15-52.jpg";
import heroImg3 from "../../imports/photo_3_2026-05-18_23-15-52.jpg";
import heroImg4 from "../../imports/photo_4_2026-05-18_23-15-52.jpg";
import heroImg5 from "../../imports/photo_5_2026-05-18_23-15-52.jpg";
import heroImg6 from "../../imports/photo_6_2026-05-18_23-15-52.jpg";
import heroImg7 from "../../imports/photo_7_2026-05-18_23-15-52.jpg";
import heroImg8 from "../../imports/photo_8_2026-05-18_23-15-52.jpg";
import heroImg9 from "../../imports/photo_9_2026-05-18_23-15-52.jpg";
import heroImg10 from "../../imports/photo_10_2026-05-18_23-15-52.jpg";
import heroImg11 from "../../imports/photo_11_2026-05-18_23-15-52.jpg";
import heroImg12 from "../../imports/photo_12_2026-05-18_23-15-52.jpg";
import heroImg13 from "../../imports/photo_13_2026-05-18_23-15-52.jpg";
import heroImg14 from "../../imports/photo_14_2026-05-18_23-15-52.jpg";
import heroImg15 from "../../imports/photo_15_2026-05-18_23-15-52.jpg";
import heroImg16 from "../../imports/photo_16_2026-05-18_23-15-52.jpg";
import heroImg17 from "../../imports/photo_17_2026-05-18_23-15-52.jpg";
import heroImg18 from "../../imports/photo_18_2026-05-18_23-15-52.jpg";
import heroImg19 from "../../imports/photo_19_2026-05-18_23-15-52.jpg";
import heroImg20 from "../../imports/photo_20_2026-05-18_23-15-52.jpg";

export const categoryIcons: Record<string, LucideIcon> = {
  Smartphone, Zap, Shirt, Sparkles, Home, Hammer, Cog, Car, Trophy,
  Baby, BookOpen, Package, Monitor, Crown, UtensilsCrossed, GlassWater,
  SprayCan, Briefcase, Wheat, HardHat, Wrench, Factory, Sofa, Gem,
  Dumbbell, Cpu, Bike, Heart, Coffee,
};

export const categoryShortLabels: Record<string, string> = {
  "Alimentaire": "Alimentaire",
  "Boissons": "Boissons",
  "Hygiène": "Hygiène",
  "Textile": "Textile",
  "Électronique": "Électronique",
  "BTP": "BTP",
  "Beauté": "Beauté",
  "Fournitures": "Fournitures",
  "Auto/Moto": "Auto/Moto",
  "Bébé/Enfant": "Bébé",
  "Équipements": "Équipements",
  "Industriel": "Industriel",
  "Maison": "Maison",
  "Sport": "Sport",
  "Luxe": "Luxe",
  "Services": "Services",
};

export const heroSlides = [
  {
    title: "RIZ EN GROS À PRIX CASSÉ",
    subtitle: "Sacs de riz parfumé et basmati - tarifs grossistes",
    cta: "J'en profite",
    bg: "from-[#FF6A00] to-[#FF4400]",
    image: heroImg1,
    link: "/explorer?cat=Alimentaire",
    promoCode: "RIZ25",
  },
  {
    title: "RIZ & ÉPICES IMPORTÉS",
    subtitle: "Riz basmati, curry, safran - le meilleur du grossiste",
    cta: "Découvrir",
    bg: "from-[#E8A817] to-[#DC2626]",
    image: heroImg2,
    link: "/explorer?cat=Alimentaire",
    promoCode: null,
  },
  {
    title: "ÉLECTROMÉNAGER DE CUISINE",
    subtitle: "Mixeurs, cafetières, grille-pain : équipez votre boutique",
    cta: "Voir le rayon",
    bg: "from-[#3B82F6] to-[#6366F1]",
    image: heroImg3,
    link: "/explorer?cat=Maison",
    promoCode: null,
  },
  {
    title: "ROBOTS PÂTISSIERS PRO",
    subtitle: "Batteurs et robots de cuisine - garantie 2 ans",
    cta: "Commander",
    bg: "from-[#0EA5E9] to-[#0F766E]",
    image: heroImg4,
    link: "/explorer?cat=Maison",
    promoCode: null,
  },
  {
    title: "BIJOUX OR & PLAQUÉ",
    subtitle: "Colliers, bracelets, bagues - directement importateur",
    cta: "Voir la collection",
    bg: "from-[#E8A817] to-[#F0B429]",
    image: heroImg5,
    link: "/explorer?cat=Luxe",
    promoCode: null,
  },
  {
    title: "SNEAKERS CUIR HOMME",
    subtitle: "Lots de chaussures cuir véritable - prix revendeurs",
    cta: "Voir les chaussures",
    bg: "from-[#78716C] to-[#0F172A]",
    image: heroImg6,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "BRACELETS TENDANCE",
    subtitle: "Manchettes dorées strass : nouvelle collection en gros",
    cta: "J'explore",
    bg: "from-[#F0B429] to-[#E8A817]",
    image: heroImg7,
    link: "/explorer?cat=Luxe",
    promoCode: null,
  },
  {
    title: "SNEAKERS FEMME",
    subtitle: "Baskets running et lifestyle - cartons mixtes dispo",
    cta: "Voir le rayon",
    bg: "from-[#EC4899] to-[#F0278E]",
    image: heroImg8,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "BRACELETS PLAQUÉ OR",
    subtitle: "Lots assortis pour bijouteries et boutiques mode",
    cta: "Commander",
    bg: "from-[#E8A817] to-[#92400E]",
    image: heroImg9,
    link: "/explorer?cat=Luxe",
    promoCode: null,
  },
  {
    title: "BAGUES OR MASSIF",
    subtitle: "Bijouterie en gros - tous gabarits, tous styles",
    cta: "Voir la bijouterie",
    bg: "from-[#F0B429] to-[#D97706]",
    image: heroImg10,
    link: "/explorer?cat=Luxe",
    promoCode: null,
  },
  {
    title: "FOULARDS & ÉCHARPES",
    subtitle: "Carrés et foulards imprimés - tendance et grossiste",
    cta: "Découvrir",
    bg: "from-[#F97316] to-[#E11D2E]",
    image: heroImg11,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "MONTRES & JOAILLERIE",
    subtitle: "Bracelets, montres et accessoires premium en gros",
    cta: "J'explore",
    bg: "from-[#92400E] to-[#E8A817]",
    image: heroImg12,
    link: "/explorer?cat=Luxe",
    promoCode: null,
  },
  {
    title: "SNEAKERS LIFESTYLE",
    subtitle: "Modèles tendance pour boutiques sneakers - lots dispo",
    cta: "Voir la sélection",
    bg: "from-[#F97316] to-[#DC2626]",
    image: heroImg13,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "CHAUSSURES URBAINES",
    subtitle: "Sneakers casual cuir et toile - cartons grossistes",
    cta: "Commander",
    bg: "from-[#78716C] to-[#0F766E]",
    image: heroImg14,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "RUNNING & SPORT",
    subtitle: "Baskets sport multi-tailles - lots revendeurs",
    cta: "Voir le sport",
    bg: "from-[#16A34A] to-[#0F766E]",
    image: heroImg15,
    link: "/explorer?cat=Sport",
    promoCode: null,
  },
  {
    title: "SUPERMARCHÉ EN GROS",
    subtitle: "Faites le plein - épicerie, frais et hygiène à prix bas",
    cta: "Faire mes courses",
    bg: "from-[#FF6A00] to-[#FF4400]",
    image: heroImg16,
    link: "/explorer?cat=Alimentaire",
    promoCode: "COURSES15",
  },
  {
    title: "FRUITS & LÉGUMES FRAIS",
    subtitle: "Direct producteur, livraison 24h - cageots et lots",
    cta: "Voir le marché",
    bg: "from-[#16A34A] to-[#84CC16]",
    image: heroImg17,
    link: "/explorer?cat=Alimentaire",
    promoCode: null,
  },
  {
    title: "PRÊT-À-PORTER MIXTE",
    subtitle: "Cartons multi-tailles femme & homme - prix grossistes",
    cta: "J'en profite",
    bg: "from-[#EC4899] to-[#F97316]",
    image: heroImg18,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "BOUTIQUE MODE PREMIUM",
    subtitle: "Inspirez-vous des boutiques tendance - tous styles dispo",
    cta: "Voir la mode",
    bg: "from-[#A855F7] to-[#EC4899]",
    image: heroImg19,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
  {
    title: "ROBES & VÊTEMENTS FEMME",
    subtitle: "Portants prêt-à-porter pour boutiques - lots couleurs",
    cta: "Découvrir",
    bg: "from-[#F97316] to-[#EC4899]",
    image: heroImg20,
    link: "/explorer?cat=Textile",
    promoCode: null,
  },
];

export const quickSections = [
  { label: "Top deals", icon: Flame, color: "#E11D2E", path: "/promos" },
  { label: "Alimentaire", icon: UtensilsCrossed, color: "#FF6B00", path: "/explorer?cat=Alimentaire" },
  { label: "Textile", icon: Shirt, color: "#EC4899", path: "/explorer?cat=Textile" },
  { label: "Beauté", icon: Sparkles, color: "#F0278E", path: "/explorer?cat=Beauté" },
  { label: "Tech", icon: Smartphone, color: "#3B82F6", path: "/explorer?cat=Électronique" },
];

export const superDeals = [
  { id: 2, name: "Huile de palme 20L", image: IMAGES.vegetables, price: 17600, originalPrice: 22000, discount: 20, sold: "2.5k+" },
  { id: 3, name: "Savon carton 48pcs", image: IMAGES.hygiene, price: 9000, originalPrice: 12000, discount: 25, sold: "4.1k+" },
  { id: 4, name: "Tissu Wax 12 yards", image: IMAGES.textile, price: 28000, originalPrice: 35000, discount: 20, sold: "1.8k+" },
  { id: 6, name: "Câbles USB-C x50", image: IMAGES.electronics, price: 25000, originalPrice: 32000, discount: 22, sold: "980+" },
];
