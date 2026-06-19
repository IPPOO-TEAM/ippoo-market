import { useParams, useNavigate } from "react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  Package,
  Crown,
  MessageSquare,
  Share2,
  Phone,
  ShieldCheck,
  Truck,
  Users,
  Heart,
  Award,
  Globe,
  Calendar,
  ThumbsUp,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { allProducts as mockProducts, IMAGES } from "./mock-data";
import { useStorefrontProducts } from "../data/storefront";
import { ProductCard } from "./product-card";
import { CouponStrip, FlashPromoBanner, ContestCard } from "./promo-widgets";
import { setStock } from "../payments/store";
import { usePayments } from "../payments/usePayments";
import { PackagePlus } from "lucide-react";
import { AnimatedNumber } from "./animated-number";
import { resolveShopVisuals } from "../data/shop-resolver";

// Produits uniquement — synchronisé avec vendors-page.tsx, aucune réutilisation
const u = (id: string) => `https://images.unsplash.com/${id}?w=1080&q=80&auto=format&fit=crop`;
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

const allVendors = [
  { id: 1, name: "Ets Ahouandjinou", avatar: IMAGES.entrepreneur, category: "Alimentation & Boissons", rating: 4.8, orders: 1250, deliveryRate: 98, badge: "VIP", location: "Cotonou" },
  { id: 2, name: "Mama Délices SARL", avatar: IMAGES.grocery, category: "Alimentation & Boissons", rating: 4.7, orders: 920, deliveryRate: 96, badge: "VIP", location: "Porto-Novo" },
  { id: 3, name: "Saveurs du Bénin", avatar: EXTRA.spice, category: "Alimentation & Boissons", rating: 4.5, orders: 640, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou" },
  { id: 4, name: "BoissonsPlus Bénin", avatar: EXTRA.beverages, category: "Alimentation & Boissons", rating: 4.6, orders: 780, deliveryRate: 94, badge: "TOP", location: "Cotonou" },
  { id: 5, name: "Kérékou Import-Export", avatar: IMAGES.warehouse, category: "Alimentation & Boissons", rating: 4.6, orders: 780, deliveryRate: 94, badge: "TOP", location: "Cotonou" },
  { id: 6, name: "Beauty Queen Cosmetics", avatar: IMAGES.cosmetics, category: "Hygiène & Beauté", rating: 4.4, orders: 380, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou" },
  { id: 7, name: "NaturelAfro", avatar: EXTRA.hairBeauty, category: "Hygiène & Beauté", rating: 4.7, orders: 690, deliveryRate: 96, badge: "VIP", location: "Cotonou" },
  { id: 8, name: "ProClean SARL", avatar: IMAGES.hygiene, category: "Hygiène & Beauté", rating: 4.5, orders: 670, deliveryRate: 95, badge: "TOP", location: "Porto-Novo" },
  { id: 9, name: "Glamour Abidjan-Cotonou", avatar: IMAGES.cosmetics, category: "Hygiène & Beauté", rating: 4.2, orders: 290, deliveryRate: 90, badge: "VERIFIE", location: "Porto-Novo" },
  { id: 10, name: "HygiènePro Bénin", avatar: IMAGES.hygiene, category: "Maison & Entretien", rating: 4.5, orders: 560, deliveryRate: 94, badge: "TOP", location: "Cotonou" },
  { id: 11, name: "MaisonPlus Porto", avatar: EXTRA.cookware, category: "Maison & Entretien", rating: 4.4, orders: 420, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo" },
  { id: 12, name: "RangeStock SARL", avatar: IMAGES.warehouse, category: "Maison & Entretien", rating: 4.3, orders: 310, deliveryRate: 91, badge: "VERIFIE", location: "Parakou" },
  { id: 13, name: "MobilePlus Cotonou", avatar: EXTRA.phoneShop, category: "Électronique & Accessoires", rating: 4.6, orders: 450, deliveryRate: 95, badge: "TOP", location: "Cotonou" },
  { id: 14, name: "TechGros Bénin", avatar: IMAGES.electronics, category: "Électronique & Accessoires", rating: 4.7, orders: 430, deliveryRate: 96, badge: "VIP", location: "Cotonou" },
  { id: 15, name: "SolarTech Bénin", avatar: IMAGES.electronics, category: "Électronique & Accessoires", rating: 4.8, orders: 350, deliveryRate: 97, badge: "VIP", location: "Cotonou" },
  { id: 16, name: "Tokpa Textiles", avatar: IMAGES.businessman, category: "Vêtements & Accessoires", rating: 4.9, orders: 890, deliveryRate: 97, badge: "TOP", location: "Cotonou" },
  { id: 17, name: "Wax Empire", avatar: EXTRA.fashion, category: "Vêtements & Accessoires", rating: 4.8, orders: 1100, deliveryRate: 97, badge: "VIP", location: "Cotonou" },
  { id: 18, name: "ChaussuresExpress", avatar: EXTRA.shoes, category: "Vêtements & Accessoires", rating: 4.3, orders: 370, deliveryRate: 91, badge: "VERIFIE", location: "Porto-Novo" },
  { id: 19, name: "Faso Dan Fani Center", avatar: EXTRA.fashion, category: "Vêtements & Accessoires", rating: 4.6, orders: 410, deliveryRate: 95, badge: "TOP", location: "Parakou" },
  { id: 20, name: "BâtiPlus Cotonou", avatar: EXTRA.construction, category: "Bricolage & Matériel", rating: 4.4, orders: 620, deliveryRate: 93, badge: "VERIFIE", location: "Cotonou" },
  { id: 21, name: "FerraPlus Porto-Novo", avatar: EXTRA.construction, category: "Bricolage & Matériel", rating: 4.5, orders: 480, deliveryRate: 94, badge: "TOP", location: "Porto-Novo" },
  { id: 22, name: "PeintPro Parakou", avatar: EXTRA.construction, category: "Bricolage & Matériel", rating: 4.3, orders: 280, deliveryRate: 90, badge: "VERIFIE", location: "Parakou" },
  { id: 23, name: "PapetPlus Bénin", avatar: EXTRA.stationery, category: "Papeterie & Bureau", rating: 4.5, orders: 390, deliveryRate: 94, badge: "TOP", location: "Cotonou" },
  { id: 24, name: "BureauxModernes SARL", avatar: EXTRA.stationery, category: "Papeterie & Bureau", rating: 4.4, orders: 260, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo" },
  { id: 25, name: "PharmaGros Bénin", avatar: EXTRA.pharmacy, category: "Santé & Pharmacie", rating: 4.7, orders: 520, deliveryRate: 97, badge: "VIP", location: "Cotonou" },
  { id: 26, name: "MédiEquip Parakou", avatar: EXTRA.pharmacy, category: "Santé & Pharmacie", rating: 4.5, orders: 340, deliveryRate: 95, badge: "TOP", location: "Parakou" },
  { id: 27, name: "AutoParts Cotonou", avatar: EXTRA.autoParts, category: "Auto & Accessoires", rating: 4.4, orders: 410, deliveryRate: 93, badge: "TOP", location: "Cotonou" },
  { id: 28, name: "MotoPlus Parakou", avatar: EXTRA.autoParts, category: "Auto & Accessoires", rating: 4.3, orders: 290, deliveryRate: 91, badge: "VERIFIE", location: "Parakou" },
  { id: 29, name: "JoujouLand Bénin", avatar: EXTRA.gifts, category: "Divers & Cadeaux", rating: 4.5, orders: 450, deliveryRate: 93, badge: "TOP", location: "Cotonou" },
  { id: 30, name: "FêtesExpress Porto", avatar: EXTRA.gifts, category: "Divers & Cadeaux", rating: 4.2, orders: 220, deliveryRate: 89, badge: "VERIFIE", location: "Porto-Novo" },
  { id: 31, name: "AgroNord Parakou", avatar: IMAGES.vegetables, category: "Vivrier & Céréales", rating: 4.3, orders: 520, deliveryRate: 91, badge: "VERIFIE", location: "Parakou" },
  { id: 32, name: "Grenier du Nord", avatar: EXTRA.grain, category: "Vivrier & Céréales", rating: 4.6, orders: 870, deliveryRate: 95, badge: "VIP", location: "Parakou" },
  { id: 33, name: "CoopAgri Bénin", avatar: EXTRA.farmer, category: "Vivrier & Céréales", rating: 4.4, orders: 430, deliveryRate: 92, badge: "TOP", location: "Porto-Novo" },
  { id: 34, name: "Nectar d'Afrique", avatar: EXTRA.beverages, category: "Alimentation & Boissons", rating: 4.3, orders: 340, deliveryRate: 91, badge: "VERIFIE", location: "Parakou" },
  { id: 35, name: "CleanMaster SARL", avatar: IMAGES.hygiene, category: "Maison & Entretien", rating: 4.3, orders: 320, deliveryRate: 91, badge: "VERIFIE", location: "Parakou" },
  { id: 36, name: "Mode Afrik Porto", avatar: IMAGES.textile, category: "Vêtements & Accessoires", rating: 4.4, orders: 520, deliveryRate: 92, badge: "VERIFIE", location: "Porto-Novo" },
];

const coverImages: Record<number, string> = {
  1: IMAGES.market,
  2: IMAGES.textile,
  3: IMAGES.hygiene,
  4: IMAGES.electronics,
  5: IMAGES.cosmetics,
  6: IMAGES.vegetables,
  7: IMAGES.warehouse,
  8: IMAGES.grocery,
};

const reviews = [
  {
    id: 1,
    author: "Aminata D.",
    avatar: "A",
    rating: 5,
    date: "04 Mars 2026",
    comment: "Vendeur sérieux, produits conformes et livraison rapide. Je recommande à 100%.",
    helpful: 12,
  },
  {
    id: 2,
    author: "Ibrahim K.",
    avatar: "I",
    rating: 4,
    date: "01 Mars 2026",
    comment: "Bon rapport qualité/prix. Communication fluide et réponse rapide.",
    helpful: 8,
  },
  {
    id: 3,
    author: "Fatou S.",
    avatar: "F",
    rating: 5,
    date: "28 Fév 2026",
    comment: "Je recommande ! Très professionnel. Les produits étaient bien emballés.",
    helpful: 15,
  },
  {
    id: 4,
    author: "Koffi A.",
    avatar: "K",
    rating: 5,
    date: "25 Fév 2026",
    comment: "Excellent service, livraison en 24h comme promis. Qualité au top.",
    helpful: 6,
  },
  {
    id: 5,
    author: "Marie T.",
    avatar: "M",
    rating: 4,
    date: "22 Fév 2026",
    comment: "Bonne expérience dans l'ensemble. Petit retard de livraison mais produit conforme.",
    helpful: 3,
  },
];

const ratingDistribution = [
  { stars: 5, percent: 68, count: 245 },
  { stars: 4, percent: 22, count: 79 },
  { stars: 3, percent: 7, count: 25 },
  { stars: 2, percent: 2, count: 7 },
  { stars: 1, percent: 1, count: 4 },
];

function getBadgeInfo(badge: string) {
  if (badge === "VIP")
    return { bg: "linear-gradient(135deg, #E8A817, #FBBF24)", label: "VIP", icon: Crown };
  if (badge === "TOP")
    return { bg: "#FF6A00", label: "TOP SELLER", icon: Award };
  return { bg: "#16A34A", label: "VÉRIFIÉ", icon: ShieldCheck };
}

export function VendorShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseVendor = allVendors.find((v) => v.id === Number(id)) || allVendors[0];
  const visuals = resolveShopVisuals(baseVendor.id?.toString() ?? baseVendor.name, baseVendor.name);
  const vendor = {
    ...baseVendor,
    name: visuals.name || baseVendor.name,
    avatar: visuals.logo || baseVendor.avatar,
    category: baseVendor.category,
    location: visuals.city || baseVendor.location,
  };
  const [activeTab, setActiveTab] = useState<"produits" | "infos" | "avis">("produits");
  const [liked, setLiked] = useState(false);

  const serverProducts = useStorefrontProducts();
  const vendorProducts = useMemo(() => {
    const ownedByVendor = serverProducts.filter(
      (p) => p.seller === vendor.name || p.ownerId === (vendor as any).ownerId
    );
    if (ownedByVendor.length) return ownedByVendor.slice(0, 12);
    return mockProducts
      .filter((p) => p.seller === vendor.name || p.id % 2 === 0)
      .slice(0, 8);
  }, [vendor.name, (vendor as any).ownerId, serverProducts]);

  const badgeInfo = getBadgeInfo(vendor.badge);
  const BadgeIcon = badgeInfo.icon;
  const cover = visuals.banner || coverImages[vendor.id] || IMAGES.market;

  const tabs = [
    { key: "produits" as const, label: "Produits", count: vendorProducts.length },
    { key: "infos" as const, label: "Informations", count: null },
    { key: "avis" as const, label: "Avis", count: reviews.length },
  ];

  return (
    <div className="pb-28">
      {/* ─── Sticky top bar ─── */}
      <div className="sticky top-[60px] z-40 bg-white/80 backdrop-blur-lg border-b px-4 py-2.5 flex items-center justify-between" style={{ borderColor: "#F0EBE5" }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[#F5F0EB] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
        </button>
        <div className="flex-1 text-center px-4">
          <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>
            {vendor.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setLiked(!liked);
              toast.success(liked ? "Retiré des favoris" : "Ajouté aux favoris");
            }}
            className="p-2 rounded-xl hover:bg-[#F5F0EB] transition-colors"
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-[#E11D2E] text-[#FF6A00]" : "text-[#1A1A2E]"}`} />
          </button>
          <button
            onClick={() => {
              copyToClipboard(window.location.href);
              toast.success("Lien copié !");
            }}
            className="p-2 rounded-xl hover:bg-[#F5F0EB] transition-colors"
          >
            <Share2 className="w-5 h-5 text-[#1A1A2E]" />
          </button>
        </div>
      </div>

      {/* ─── Hero cover + profile ─── */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-44 sm:h-56 overflow-hidden">
          <img src={cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/80 via-[#1A1A2E]/30 to-transparent" />
        </div>

        {/* Badge floating */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: badgeInfo.bg }}>
            <BadgeIcon className="w-3.5 h-3.5 text-white" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
              {badgeInfo.label}
            </span>
          </div>
        </div>

        {/* Profile overlap area — centré verticalement sur la bannière */}
        <div className="absolute inset-0 z-10 flex items-center px-4">
          <div className="flex items-center gap-4 max-w-5xl mx-auto w-full">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shrink-0">
              <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
            </div>

            {/* Name + info (visible on cover overlay) */}
            <div className="flex-1 min-w-0">
              <h1
                className="text-white truncate"
                style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px" }}
              >
                {vendor.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{vendor.category}</span>
                <span className="flex items-center gap-1" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  <MapPin className="w-3 h-3" /> {vendor.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#F0EBE5" }}>
          <div className="grid grid-cols-4 gap-3">
            {([
              { icon: Star, value: <AnimatedNumber value={vendor.rating} decimals={1} />, label: "Note", color: "#E8A817", fill: true },
              { icon: Package, value: <AnimatedNumber value={vendor.orders} />, label: "Ventes", color: "#FF6B00", fill: false },
              { icon: BadgeCheck, value: <AnimatedNumber value={vendor.deliveryRate} suffix="%" />, label: "Fiabilité", color: "#16A34A", fill: false },
              { icon: Clock, value: <>&lt; 2h</>, label: "Réponse", color: "#6366F1", fill: false },
            ] as const).map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-1.5"
                  style={{ background: `${s.color}10` }}
                >
                  <s.icon
                    className={`w-4.5 h-4.5 ${s.fill ? "fill-[#E8A817]" : ""}`}
                    style={{ color: s.color }}
                  />
                </div>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA Buttons ─── */}
      <div className="max-w-5xl mx-auto px-4 mt-4 flex gap-2">
        <button
          onClick={() => navigate("/messagerie")}
          className="flex-1 py-3 bg-[#1A1A2E] text-white rounded-2xl flex items-center justify-center gap-2 transition-colors hover:bg-[#2D2D44]"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          <MessageSquare className="w-4 h-4" /> Envoyer un message
        </button>
        <button
          onClick={() => navigate("/devis")}
          className="py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border transition-colors hover:bg-[#FFF7ED]"
          style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", borderColor: "#E8E0D8" }}
        >
          <Phone className="w-4 h-4" /> Devis
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-2 p-1 bg-[#F5F0EB] rounded-2xl mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === t.key ? "bg-white text-[#1A1A2E]" : "text-[#9CA3AF]"
              }`}
              style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}
            >
              {t.label}
              {t.count !== null && (
                <span
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background: activeTab === t.key ? "#1A1A2E" : "#D1D5DB",
                    color: "#fff",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: Produits ─── */}
        <AnimatePresence mode="wait">
          {activeTab === "produits" && (
            <motion.div
              key="produits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Coupon */}
              <div className="mb-4">
                <CouponStrip
                  code="TOKPA15"
                  label="Exclusif"
                  discount={`-15% chez ${vendor.name}`}
                  condition="Valable cette semaine sur tous les produits de la boutique"
                  color="#E8A817"
                  expiry="Expire dimanche"
                />
              </div>

              <FlashPromoBanner
                text={`⚡ FLASH chez ${vendor.name}`}
                subtext="Réductions exceptionnelles sur les meilleurs produits"
                link="/promos"
                color="#FF6B00"
              />

              {/* Products section */}
              <div className="flex items-center justify-between mt-5 mb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#FF6B00]" />
                  <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>
                    CATALOGUE
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                  {vendorProducts.length} produits
                </span>
              </div>

              <VendorRestockBar vendor={vendor} products={vendorProducts} />

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {vendorProducts.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>

              {/* Contest card */}
              <div className="mt-5">
                <ContestCard
                  title={`Concours ${vendor.name}`}
                  prize="Bon d'achat 25 000 FCFA"
                  endsIn="12 jours restants"
                  participants={892}
                  link="/jeux"
                />
              </div>
            </motion.div>
          )}

          {/* ─── TAB: Informations ─── */}
          {activeTab === "infos" && (
            <motion.div
              key="infos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Description */}
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#F0EBE5" }}>
                <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E", marginBottom: 8 }}>
                  À propos
                </h4>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: "20px" }}>
                  {vendor.name} est un fournisseur professionnel spécialisé en {vendor.category.toLowerCase()} basé à {vendor.location}, Bénin.
                  Membre actif de la plateforme IPPOO depuis 2024, nous proposons des produits de qualité
                  en gros avec des prix compétitifs et une livraison rapide sur tout le territoire national.
                </p>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: "Adresse", value: `${vendor.location}, Bénin`, color: "#FF6A00" },
                  { icon: Clock, label: "Horaires", value: "Lun-Sam : 8h-18h", color: "#6366F1" },
                  { icon: Truck, label: "Livraison", value: "Cotonou, Porto-Novo, Parakou", color: "#FF6B00" },
                  { icon: ShieldCheck, label: "Paiement", value: "Paiement protégé IPPOO, Mobile Money", color: "#16A34A" },
                  { icon: Users, label: "Équipe", value: "10-50 employés", color: "#EC4899" },
                  { icon: Calendar, label: "Membre", value: "Depuis 2024", color: "#E8A817" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border p-3.5"
                    style={{ borderColor: "#F0EBE5" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                      style={{ background: `${item.color}10` }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", lineHeight: "16px" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#F0EBE5" }}>
                <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E", marginBottom: 12 }}>
                  Garanties IPPOO
                </h4>
                <div className="space-y-3">
                  {[
                    { icon: ShieldCheck, text: "Paiement protégé par IPPOO", color: "#16A34A" },
                    { icon: Truck, text: "Livraison suivie en temps réel", color: "#FF6B00" },
                    { icon: Globe, text: "Service client disponible 7j/7", color: "#6366F1" },
                    { icon: BadgeCheck, text: "Identité et documents vérifiés (KYC/KYB)", color: "#E8A817" },
                  ].map((g, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${g.color}10` }}
                      >
                        <g.icon className="w-4 h-4" style={{ color: g.color }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{g.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── TAB: Avis ─── */}
          {activeTab === "avis" && (
            <motion.div
              key="avis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Rating summary */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#F0EBE5" }}>
                <div className="flex items-start gap-5">
                  {/* Big rating */}
                  <div className="text-center shrink-0">
                    <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 44, color: "#1A1A2E", lineHeight: "48px" }}>
                      <AnimatedNumber value={vendor.rating} decimals={1} />
                    </p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Math.round(vendor.rating) ? "fill-[#E8A817] text-[#E8A817]" : "text-[#E8E0D8]"}`}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>360 avis</p>
                  </div>

                  {/* Distribution bars */}
                  <div className="flex-1 space-y-1.5">
                    {ratingDistribution.map((r) => (
                      <div key={r.stars} className="flex items-center gap-2">
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", width: 8, textAlign: "right" }}>
                          {r.stars}
                        </span>
                        <Star className="w-3 h-3 fill-[#E8A817] text-[#E8A817] shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-[#F5F0EB] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.percent}%` }}
                            transition={{ duration: 0.6, delay: 0.1 * r.stars }}
                            className="h-full rounded-full"
                            style={{ background: r.percent > 50 ? "#E8A817" : r.percent > 15 ? "#FBBF24" : "#E8E0D8" }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: "#9CA3AF", width: 28, textAlign: "right" }}>
                          {r.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review cards */}
              {reviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border p-4"
                  style={{ borderColor: "#F0EBE5" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${["#FF6A00", "#FF6B00", "#16A34A", "#6366F1", "#EC4899"][i % 5]}12`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: ["#FF6A00", "#FF6B00", "#16A34A", "#6366F1", "#EC4899"][i % 5],
                          }}
                        >
                          {r.avatar}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{r.author}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= r.rating ? "fill-[#E8A817] text-[#E8A817]" : "text-[#E8E0D8]"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.date}</span>
                  </div>

                  {/* Comment */}
                  <p style={{ fontSize: 13, color: "#4B5563", lineHeight: "20px" }}>{r.comment}</p>

                  {/* Helpful */}
                  <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #F5F0EB" }}>
                    <button
                      className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#1A1A2E] transition-colors"
                      onClick={() => toast.success("Merci pour votre vote !")}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Utile ({r.helpful})</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Sticky bottom contact bar ─── */}
      <div className="fixed left-0 right-0 z-30 px-4 pb-2 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
        <div className="max-w-5xl mx-auto">
          <div
            className="bg-white/90 backdrop-blur-lg rounded-2xl border px-4 py-3 flex items-center gap-3"
            style={{ borderColor: "#F0EBE5" }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src={vendor.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>
                {vendor.name}
              </p>
              <p className="flex items-center gap-1" style={{ fontSize: 10, color: "#16A34A" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
                En ligne maintenant
              </p>
            </div>
            <button
              onClick={() => navigate("/messagerie")}
              className="py-2.5 px-4 bg-[#1A1A2E] text-white rounded-xl flex items-center gap-1.5"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Contacter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function VendorRestockBar({ vendor, products }: { vendor: { id: number; name: string }; products: { id: number; name: string }[] }) {
  const pay = usePayments();
  const [productId, setProductId] = useState<string>("");
  const [qty, setQty] = useState<number>(50);

  const selectedProduct = products.find((p) => String(p.id) === productId) || products[0];
  const currentStock = selectedProduct ? (pay.stock[String(selectedProduct.id)] ?? 0) : 0;

  const restock = () => {
    if (!selectedProduct) { toast.error("Sélectionnez un produit"); return; }
    if (qty <= 0) { toast.error("Quantité invalide"); return; }
    const next = currentStock + qty;
    setStock(selectedProduct.id, next, {
      vendorId: String(vendor.id),
      vendorName: vendor.name,
      reason: "restock",
    });
    toast.success(`+${qty} unités · ${selectedProduct.name} (stock ${next})`);
    setQty(50);
  };

  if (products.length === 0) return null;

  return (
    <div className="mt-3 mb-4 rounded-2xl border border-[#FED7AA] bg-gradient-to-br from-[#FFF7ED] to-white p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center">
          <PackagePlus className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: "#1A1A2E" }}>Espace vendeur · Réapprovisionnement</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>Ajoutez du stock à un produit du catalogue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <select
          value={productId || (selectedProduct ? String(selectedProduct.id) : "")}
          onChange={(e) => setProductId(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
          style={{ fontSize: 13 }}
          aria-label="Produit à réapprovisionner"
        >
          {products.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-28 px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
          style={{ fontSize: 13 }}
          aria-label="Quantité à ajouter"
        />
        <button
          onClick={restock}
          className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white hover:brightness-110 flex items-center justify-center gap-1.5"
          style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
        >
          <PackagePlus className="w-4 h-4" /> Réapprovisionner
        </button>
      </div>

      {selectedProduct && (
        <p className="text-muted-foreground mt-2" style={{ fontSize: 11 }}>
          Stock actuel : <strong>{currentStock}</strong> · après ajout : <strong>{currentStock + Math.max(0, qty)}</strong>
        </p>
      )}
    </div>
  );
}
