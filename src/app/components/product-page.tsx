import { useParams, useNavigate, useSearchParams } from "react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { WhatsAppIcon } from "./icons/whatsapp-icon";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  MessageSquare,
  Package,
  ChevronRight,
  Minus,
  Plus,
  BadgeCheck,
  MapPin,
  Clock,
  FileText,
  Sparkles,
  ThumbsUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Phone,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
  Image as ImageIcon,
  Boxes,
  Scale,
  Globe,
  Award,
  Bell,
  BellRing,
  TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { allProducts, formatPrice, productDescriptions, getComplementaryProducts, IMAGES } from "./mock-data";
import { useStorefrontProducts } from "../data/storefront";
import { MARKETPLACE_PRODUCTS, findShop } from "../data/marketplace";
import { slugifyShopName } from "../data/shop-assets";
import { hydrateMyProducts, getMyProduct } from "../data/my-products";
import { isProductWatched, toggleProductWatch, comparisonForProductId } from "./comparateur/data";
import { CouponStrip, FlashPromoBanner, ContestCard, SpinWheelTeaser } from "./promo-widgets";
import { ProductCard } from "./product-card";
import { GroupPurchaseModal, GroupPurchaseButton } from "./group-purchase";
import { addToCart, getStock } from "../payments/store";
import { productUid, productScanUrl } from "../lib/product-uid";
import { ProductQrCard } from "./product-qr-card";

// ─── Category breadcrumb mapping ───
const categoryBreadcrumbs: Record<string, string> = {
  "Électronique": "Tech → Accessoires & Appareils",
  "Textile": "Mode → Tissus & Habillement",
  "Beauté": "Beauté → Soins & Cosmétiques",
  "Maison": "Maison → Entretien & Nettoyage",
  "BTP": "Construction → Matériaux de base",
  "Industriel": "Industrie → Machines & Équipements",
  "Auto/Moto": "Auto → Pièces & Accessoires",
  "Sport": "Loisirs → Sports & Plein air",
  "Bébé/Enfant": "Enfants → Jouets & Puériculture",
  "Fournitures": "Bureau → Fournitures & Papeterie",
  "Emballage": "Pro → Emballage & Impression",
  "Équipements": "Entreprise → Équipements de bureau",
  "Luxe": "Premium → Mode & Accessoires de luxe",
  "Alimentaire": "Alimentation → Céréales & Produits de base",
  "Boissons": "Alimentation → Boissons & Jus",
};

// ─── Category gallery images (secondary shots) ───
const categoryGalleryImages: Record<string, string[]> = {
  "Électronique": [IMAGES.phoneAccessories, IMAGES.electronics, IMAGES.delivery],
  "Textile": [IMAGES.textile, IMAGES.warehouse, IMAGES.delivery],
  "Beauté": [IMAGES.skincare, IMAGES.cosmetics, IMAGES.delivery],
  "Maison": [IMAGES.soapBulk, IMAGES.warehouse, IMAGES.delivery],
  "BTP": [IMAGES.cement, IMAGES.warehouse, IMAGES.delivery],
  "Industriel": [IMAGES.generator, IMAGES.warehouse, IMAGES.delivery],
  "Auto/Moto": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Sport": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Bébé/Enfant": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Fournitures": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Emballage": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Équipements": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Luxe": [IMAGES.warehouse, IMAGES.delivery, IMAGES.warehouse],
  "Alimentaire": [IMAGES.riceBags, IMAGES.warehouse, IMAGES.delivery],
  "Boissons": [IMAGES.juices, IMAGES.warehouse, IMAGES.delivery],
};

// ─── Conditionnement data ───
const getConditionnement = (product: { unit: string; moq: number }) => {
  const unitSingular = product.unit.endsWith("s") ? product.unit.slice(0, -1) : product.unit;
  const moq = product.moq;
  return {
    type: unitSingular === "sac" ? "Sac renforcé" : unitSingular === "carton" ? "Carton scellé" : unitSingular === "bidon" ? "Bidon hermétique" : unitSingular === "pièce" ? "Emballage individuel" : unitSingular === "lot" ? "Lot conditionné" : unitSingular === "unité" ? "Emballé individuellement" : "Conditionnement standard",
    poids: unitSingular === "sac" ? "25 kg" : unitSingular === "bidon" ? "20 L" : unitSingular === "carton" ? "Variable" : ",",
    logistics: [
      { qty: moq, label: "demi-palette" },
      { qty: moq * 2.5, label: "palette complète" },
      { qty: moq * 5, label: "chargement grossiste" },
    ],
  };
};

// ─── Gallery thumbnail labels ───
const galleryLabels = ["Produit", "Conditionnement", "Stockage", "Livraison"];

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  hydrateMyProducts();
  const isVendorProduct = typeof id === "string" && id.startsWith("MP-");
  const vendorProduct = isVendorProduct ? getMyProduct(id!) : undefined;
  const productId = Number(id);
  const serverProducts = useStorefrontProducts();
  const fallback =
    serverProducts.find((p) => p.id === productId)
    || allProducts.find((p) => p.id === productId)
    || MARKETPLACE_PRODUCTS.find((p) => p.id === productId)
    || allProducts[0];
  const product = vendorProduct
    ? {
        id: vendorProduct.id as unknown as number,
        name: vendorProduct.name,
        image: vendorProduct.image || fallback.image,
        price: vendorProduct.price,
        moq: vendorProduct.moq,
        unit: vendorProduct.unit,
        seller: vendorProduct.shopSlug,
        rating: 0,
        category: vendorProduct.category ?? "Boutique",
        inStock: (vendorProduct.stockQty ?? 0) > 0 && vendorProduct.status !== "out_of_stock",
        paliers: [{ qty: vendorProduct.moq, price: vendorProduct.price }],
      } as typeof fallback
    : fallback;
  const [quantity, setQuantity] = useState(product.moq);
  const [activeTab, setActiveTab] = useState<"description" | "logistique" | "avis">("description");
  const [isFav, setIsFav] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showGroupPurchase, setShowGroupPurchase] = useState(false);
  const [priceWatched, setPriceWatched] = useState(false);
  const [sp, setSp] = useSearchParams();

  useEffect(() => { setPriceWatched(isProductWatched(product.id)); }, [product.id]);

  const comparisonEntry = useMemo(() => comparisonForProductId(product.id), [product.id]);

  useEffect(() => {
    // QR ouvert hors-app (lecteur système) : on nettoie le marqueur ?via=qr mais
    // on reste sur la fiche produit. L'achat reste manuel.
    if (sp.get("via") === "qr" || sp.get("pay") === "qr") {
      const next = new URLSearchParams(sp);
      next.delete("via");
      next.delete("pay");
      setSp(next, { replace: true });
    }
  }, [sp, setSp]);

  const currentPrice = (product.paliers ?? [])
    .slice()
    .reverse()
    .find((p) => quantity >= p.qty)?.price || product.price;

  const totalPrice = currentPrice * quantity;

  const description = productDescriptions[product.id] ||
    `Produit de qualité premium disponible en gros sur IPPOO Market. Conditionnement soigné, origine vérifiée, traçabilité assurée. Catégorie ${product.category}, vendu par ${product.seller}. Ce produit est proposé exclusivement pour les revendeurs, commerçants, restaurants et distributeurs. Les commandes se font en volume important afin de garantir des prix compétitifs et une marge élevée pour les acheteurs professionnels.`;

  const breadcrumb = categoryBreadcrumbs[product.category] || product.category;
  const conditionnement = getConditionnement(product);
  const recommendedQty = Math.ceil(product.moq * 2.5);

  // Galerie : uniquement l'image du produit lui-même. Les visuels génériques
  // (entrepôt / livraison) trompaient l'œil et n'apportaient rien.
  const galleryImages = [product.image].filter(Boolean);

  // Availability
  const availabilityConfig = product.inStock
    ? { icon: CheckCircle, label: "Disponible en stock", color: "#16A34A", bgColor: "#16A34A/10" }
    : { icon: XCircle, label: "Temporairement indisponible", color: "#FF6A00", bgColor: "#E11D2E/10" };
  const AvailIcon = availabilityConfig.icon;

  // Reviews
  const categoryReviews: Record<string, { id: number; author: string; rating: number; date: string; comment: string }[]> = {
    "Alimentaire": [
      { id: 1, author: "Aminata D.", rating: 5, date: "04 Mars 2026", comment: "Excellent rapport qualité-prix. Livraison rapide et produit conforme à la description." },
      { id: 2, author: "Ibrahim K.", rating: 4, date: "01 Mars 2026", comment: "Bonne qualité, emballage soigné. Le riz est parfumé comme annoncé." },
      { id: 3, author: "Fatou S.", rating: 5, date: "28 Fév 2026", comment: "Très satisfaite ! Commande reçue à temps. Je recommande ce vendeur." },
    ],
    "Boissons": [
      { id: 1, author: "Kodjo M.", rating: 5, date: "03 Mars 2026", comment: "Les bouteilles sont arrivées intactes. Excellent service de livraison." },
      { id: 2, author: "Clarisse A.", rating: 4, date: "28 Fév 2026", comment: "Bon produit, goût authentique. Sera re-commandé pour mon restaurant." },
      { id: 3, author: "Pascal D.", rating: 5, date: "25 Fév 2026", comment: "Parfait pour la revente. Mes clients adorent !" },
    ],
    "Maison": [
      { id: 1, author: "Rachida B.", rating: 5, date: "05 Mars 2026", comment: "Produits d'hygiène de qualité. Le savon mousse très bien, les clients reviennent." },
      { id: 2, author: "Moussa T.", rating: 4, date: "02 Mars 2026", comment: "Conditionnement solide, aucune casse à la livraison. Prix compétitif." },
      { id: 3, author: "Béatrice K.", rating: 5, date: "27 Fév 2026", comment: "Très bon produit. J'ai commandé 50 cartons, tout est parfait." },
    ],
    "Beauté": [
      { id: 1, author: "Awa N.", rating: 5, date: "04 Mars 2026", comment: "Produits authentiques, mes clientes adorent ! Bonne marge de revente." },
      { id: 2, author: "Christelle M.", rating: 5, date: "01 Mars 2026", comment: "Qualité salon, je suis ravie. Emballage soigné et livraison rapide." },
      { id: 3, author: "Grâce A.", rating: 4, date: "26 Fév 2026", comment: "Très satisfaite du lot. Une ou deux pièces endommagées mais le reste est parfait." },
    ],
    "Textile": [
      { id: 1, author: "Fatoumata S.", rating: 5, date: "05 Mars 2026", comment: "Tissu magnifique, les couleurs sont vives et ne déteint pas au lavage." },
      { id: 2, author: "Honoré G.", rating: 5, date: "03 Mars 2026", comment: "Qualité hollandaise confirmée. Mes clients sont enchantés." },
      { id: 3, author: "Aïssatou D.", rating: 4, date: "28 Fév 2026", comment: "Bon tissu, mais j'aurais aimé plus de choix de motifs dans le lot." },
    ],
    "Électronique": [
      { id: 1, author: "Cédric T.", rating: 4, date: "04 Mars 2026", comment: "Produits fonctionnels, bon rapport qualité-prix pour la revente." },
      { id: 2, author: "Saliou B.", rating: 5, date: "01 Mars 2026", comment: "Excellent ! Tous les câbles fonctionnent, emballage individuel impeccable." },
      { id: 3, author: "Marie-Claire H.", rating: 4, date: "27 Fév 2026", comment: "Bonne qualité globale, charge rapide comme annoncé." },
    ],
    "BTP": [
      { id: 1, author: "Jean-Pierre A.", rating: 5, date: "05 Mars 2026", comment: "Ciment de bonne qualité, livraison au chantier efficace." },
      { id: 2, author: "Urbain K.", rating: 4, date: "02 Mars 2026", comment: "Bon produit, conforme aux normes. Livraison un peu longue mais acceptable." },
      { id: 3, author: "Émile D.", rating: 5, date: "28 Fév 2026", comment: "Excellent rapport qualité-prix. J'achète régulièrement ici." },
    ],
    "Industriel": [
      { id: 1, author: "Olivier A.", rating: 5, date: "07 Mars 2026", comment: "Groupe électrogène livré en parfait état. Démarrage facile, consommation raisonnable. Très bon rapport qualité-prix." },
      { id: 2, author: "Mariam K.", rating: 5, date: "05 Mars 2026", comment: "Machine à coudre industrielle robuste et silencieuse. Mon atelier tourne à plein régime maintenant !" },
      { id: 3, author: "Serge B.", rating: 4, date: "03 Mars 2026", comment: "Congélateur commercial bien emballé. Fonctionne bien, bonne capacité. Un peu lourd à déplacer seul." },
    ],
    "Électroménager": [
      { id: 1, author: "Serge B.", rating: 4, date: "03 Mars 2026", comment: "Congélateur commercial bien emballé. Fonctionne bien, bonne capacité. Un peu lourd à déplacer seul." },
      { id: 2, author: "Olivier A.", rating: 5, date: "07 Mars 2026", comment: "Appareil livré en parfait état. Fonctionne bien, bonne consommation énergétique." },
      { id: 3, author: "Mariam K.", rating: 5, date: "05 Mars 2026", comment: "Bon produit, fiable et silencieux. Livraison rapide." },
    ],
  };

  const reviews = categoryReviews[product.category] || categoryReviews["Alimentaire"]!;
  const complementary = useMemo(() => getComplementaryProducts(product.id, 6), [product.id]);

  // UID unique + QR + stock courant (en cas de réappro ou de ventes déjà passées)
  const uid = productUid(product);
  const scanUrl = productScanUrl(uid);
  const liveStock = getStock(product.id, (product as { stockQty?: number }).stockQty ?? 0);
  const vendorId = (product as { vendorId?: string }).vendorId;
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      price: currentPrice,
      quantity,
      unit: product.unit,
      seller: product.seller,
      moq: product.moq,
      uid,
      category: product.category,
      vendorId,
      vendorName: product.seller,
    });
    toast.success(`${product.name} (×${quantity}) ajouté au panier !`);
  };

  return (
    <div className="pb-24">
      {/* ═══ HEADER STICKY ═══ */}
      <div className="sticky top-[var(--ippoo-top-h,0px)] z-40 -mt-px bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="flex-1 text-center truncate px-4" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => { setIsFav(!isFav); toast.success(isFav ? "Retiré des favoris" : "Ajouté aux favoris !"); }} className="p-2 rounded-xl hover:bg-muted">
            <Heart className={`w-5 h-5 ${isFav ? "fill-[#E11D2E] text-[#FF6A00]" : ""}`} />
          </button>
          <button onClick={() => { copyToClipboard(window.location.href); toast.success("Lien copié !"); }} className="p-2 rounded-xl hover:bg-muted">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-4 lg:pt-6">

          {/* ═══ 2. GALERIE D'IMAGES ═══ */}
          <div>
            <div className="aspect-square overflow-hidden lg:rounded-2xl relative">
              <SafeImg src={galleryImages[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600 }}>
                  <ImageIcon className="w-3 h-3" />
                  {activeImage + 1}/{galleryImages.length}
                </div>
              )}
            </div>
            {/* Thumbnails - masquées s'il n'y a qu'une seule image */}
            <div className={`flex gap-2 px-4 mt-3 lg:px-0 ${galleryImages.length <= 1 ? "hidden" : ""}`}>
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-colors ${activeImage === i ? "border-[#FF6A00]" : "border-transparent"}`}
                >
                  <SafeImg src={img} alt={galleryLabels[i]} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ═══ INFO COLUMN ═══ */}
          <div className="px-4 py-4 lg:px-0">

            {/* ═══ 1. EN-TÊTE DU PRODUIT ═══ */}

            {/* Fournisseur - lien vers la boutique émettrice */}
            <button
              onClick={() => {
                const shopId = (product as { shopId?: string }).shopId;
                if (shopId && findShop(shopId)) {
                  navigate(`/boutique/${shopId}`);
                  return;
                }
                // Fallback : slug du nom de vendeur, résolu côté BoutiquePage
                const slug = slugifyShopName(product.seller || "");
                if (slug) {
                  navigate(`/boutique/${slug}`);
                  return;
                }
                navigate("/vendeurs");
              }}
              className="flex items-center gap-2 mb-2 text-[#FF6A00]"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <BadgeCheck className="w-4 h-4 text-[#00B341]" /> {product.seller}, Fournisseur partenaire <ChevronRight className="w-3 h-3" />
            </button>

            {/* Nom */}
            <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{product.name}</h1>

            {/* Référence */}
            {(product as { reference?: string }).reference && (
              null
            )}

            {/* Catégorie breadcrumb */}
            <div className="mt-1.5 mb-2">
              <button
                onClick={() => navigate(`/explorer?cat=${encodeURIComponent(product.category)}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F97316]/10 text-[#F97316]"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                <Package className="w-3.5 h-3.5" /> {breadcrumb}
              </button>
            </div>

            {/* Disponibilité */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg`} style={{ backgroundColor: product.inStock ? "rgba(22,163,74,0.1)" : "rgba(225,29,46,0.1)" }}>
                <AvailIcon className="w-3.5 h-3.5" style={{ color: availabilityConfig.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: availabilityConfig.color }}>{availabilityConfig.label}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-[#F0B429] text-[#F0B429]" : "text-gray-300"}`}
                  />
                ))}
                <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 4 }}>{product.rating}</span>
              </div>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>({reviews.length} avis vérifiés)</span>
            </div>

            {/* ═══ COMPARATEUR + SURVEILLANCE ═══ */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                onClick={() => navigate(`/comparateur/produit/${product.id}`)}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                <Scale className="w-4 h-4 shrink-0" />
                <span className="truncate">Comparer les prix</span>
                {comparisonEntry && comparisonEntry.economieVsExterne > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#059669] text-white shrink-0" style={{ fontSize: 9, fontWeight: 800 }}>
                    <TrendingDown className="w-2.5 h-2.5" />-{comparisonEntry.economieVsExterne}%
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const now = toggleProductWatch(product.id);
                  setPriceWatched(now);
                  toast.success(now ? "Surveillance du prix activée" : "Surveillance désactivée");
                }}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  fontSize: 12, fontWeight: 700,
                  background: priceWatched ? "#F59E0B" : "rgba(245,158,11,0.1)",
                  color: priceWatched ? "#fff" : "#B45309",
                  borderColor: priceWatched ? "#F59E0B" : "rgba(245,158,11,0.2)",
                }}
              >
                {priceWatched ? <BellRing className="w-4 h-4 shrink-0" /> : <Bell className="w-4 h-4 shrink-0" />}
                <span className="truncate">{priceWatched ? "Prix surveillé" : "Surveiller le prix"}</span>
              </button>
            </div>

            {/* ═══ 4. GRILLE DE PRIX ═══ */}
            <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4400] rounded-2xl p-3.5 sm:p-4 mb-4">
              <div className="flex items-end gap-2 sm:gap-3">
                <span className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: "clamp(22px, 5vw, 28px)" }}>
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-white/60 mb-0.5 sm:mb-1" style={{ fontSize: 12 }}>/ {product.unit.endsWith("s") ? product.unit.slice(0, -1) : product.unit}</span>
              </div>
              <p className="text-white/80 mt-1" style={{ fontSize: 11 }}>
                Minimum de commande : {product.moq} {product.unit} · Recommandé : {recommendedQty} {product.unit}
              </p>
            </div>

            {/* Paliers table */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-4">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Scale className="w-4 h-4 text-[#F97316]" /> Prix dégressifs (gros / semi-gros)
              </h4>
              {/* Table header */}
              <div className="flex items-center justify-between px-3 py-2 rounded-t-xl bg-[#1A1A2E] text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                <span>Quantité</span>
                <span>Prix unitaire</span>
              </div>
              <div className="space-y-0">
                {(product.paliers ?? []).map((p, i) => {
                  const nextQty = (product.paliers ?? [])[i + 1]?.qty;
                  const rangeLabel = nextQty
                    ? `${p.qty} - ${nextQty - 1} ${product.unit}`
                    : `${p.qty} ${product.unit} et +`;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] ${quantity >= p.qty ? "bg-[#FF6A00]/5" : ""}`}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{rangeLabel}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#FF6A00" }}>{formatPrice(p.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ 3. MOQ ═══ */}
            <div className="bg-[#FFF7ED] rounded-2xl border border-[#F97316]/20 p-4 mb-4">
              <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Boxes className="w-4 h-4 text-[#F97316]" /> Quantité minimale de commande (MOQ)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-[#F97316]/10">
                  <p className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600 }}>Commande minimum</p>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#F97316" }}>{product.moq} {product.unit}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#16A34A]/10">
                  <p className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600 }}>Commande recommandée</p>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#16A34A" }}>{recommendedQty} {product.unit}</p>
                </div>
              </div>
            </div>

            {/* ═══ 5. CONDITIONNEMENT ═══ */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-4">
              <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Package className="w-4 h-4 text-[#E8A817]" /> Conditionnement
              </h4>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>Type</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{conditionnement.type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>Poids par unité</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{conditionnement.poids}</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: 11, fontWeight: 600 }}>Conditionnement logistique :</p>
              <div className="space-y-1.5">
                {conditionnement.logistics.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#F3F4F6] rounded-lg">
                    <Package className="w-3.5 h-3.5 text-[#E8A817]" />
                    <span style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 700 }}>{Math.round(l.qty)} {product.unit}</span>
                      <span className="text-muted-foreground"> = {l.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ QUANTITY SELECTOR ═══ */}
            <div className="bg-white rounded-2xl border border-border p-3.5 sm:p-4 mb-4">
              <h4 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Quantité à commander</h4>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center bg-[#F3F4F6] rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(product.moq, quantity - 1))}
                    className="p-2.5 sm:p-3 hover:bg-[#E5E7EB] rounded-l-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.moq, Number(e.target.value)))}
                    className="w-16 sm:w-20 text-center bg-transparent border-none"
                    style={{ fontSize: 15, fontWeight: 700 }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 sm:p-3 hover:bg-[#E5E7EB] rounded-r-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>Total estimé</p>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: "clamp(14px, 4vw, 18px)", color: "#FF6A00" }}>
                    {formatPrice(totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ UID + QR PRODUIT ═══ */}
            <ProductQrCard
              uid={uid}
              scanUrl={scanUrl}
              productName={product.name}
              origin={(product as { origin?: string }).origin}
              liveStock={liveStock}
            />

            {/* Verified Supplier Alibaba-style */}
            <div className="bg-white rounded-xl border border-border p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center text-white shrink-0" style={{ fontWeight: 800 }}>
                  {String(product.seller || "S").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate" style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{product.seller}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FFF1E5] text-[#FF6A00]" style={{ fontSize: 9, fontWeight: 700 }}>
                      <BadgeCheck className="w-3 h-3" /> Verified Supplier
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[#757575]" style={{ fontSize: 10 }}>
                    <span>Bénin</span>
                    <span className="text-[#E5E5E5]">·</span>
                    <span>2 ans sur IPPOO</span>
                    <span className="text-[#E5E5E5]">·</span>
                    <span>Réponse &lt; 24h</span>
                  </div>
                </div>
                {vendorId && (
                  <button onClick={() => navigate(`/boutique/${vendorId}`)} className="px-3 py-1.5 rounded-lg border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF1E5] transition-colors shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
                    Boutique
                  </button>
                )}
              </div>
            </div>

            {/* ═══ 6. BOUTONS D'ACTION ═══ */}
            <div className="space-y-2 mb-4">
              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
              >
                <ShoppingCart className="w-5 h-5" /> Commander en gros · {formatPrice(totalPrice)}
              </button>
              <GroupPurchaseButton variant="full" onClick={() => setShowGroupPurchase(true)} />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { navigate("/devis"); toast.info("Demande de devis initiée !"); }}
                  className="py-3 rounded-xl border-2 border-[#E8A817] bg-[#E8A817]/10 text-[#E8A817] flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  style={{ fontWeight: 700, fontSize: 11 }}
                >
                  <FileText className="w-5 h-5" />
                  Devis
                </button>
                <button
                  onClick={() => toast.success("Ouverture WhatsApp... Négociation, disponibilité, photos, transport !")}
                  className="py-3 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 text-[#25D366] flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  style={{ fontWeight: 700, fontSize: 11 }}
                >
                  <WhatsAppIcon size={20} />
                  WhatsApp
                </button>
                <button
                  onClick={() => toast.info("Appel au fournisseur en cours...")}
                  className="py-3 rounded-xl border-2 border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF] flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  style={{ fontWeight: 700, fontSize: 11 }}
                >
                  <Phone className="w-5 h-5" />
                  Appeler
                </button>
              </div>
            </div>

            {/* ═══ 7. MODES DE LIVRAISON ═══ */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-4">
              <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Truck className="w-4 h-4 text-[#F97316]" /> Modes de livraison
              </h4>
              <div className="space-y-3">
                {/* Livraison grossiste */}
                <div className="p-3 bg-[#FFF7ED] rounded-xl border border-[#F97316]/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-[#F97316]" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Livraison grossiste à domicile</span>
                  </div>
                  <p className="text-muted-foreground ml-6" style={{ fontSize: 11 }}>
                    Par camion ou transporteur · Délai : 24 à 72h
                  </p>
                  <p className="text-muted-foreground ml-6" style={{ fontSize: 11 }}>
                    Frais estimés : 3 000 à 15 000 FCFA selon volume et distance
                  </p>
                </div>

                {/* Points de retrait IPPOO */}
                <div className="p-3 bg-[#16A34A]/5 rounded-xl border border-[#16A34A]/10">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#16A34A]" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Points de retrait IPPOO</span>
                  </div>
                  <p className="text-muted-foreground ml-6" style={{ fontSize: 11 }}>
                    Hub Cotonou · Hub Abomey-Calavi · Hub Porto-Novo
                  </p>
                  <p className="text-muted-foreground ml-6" style={{ fontSize: 11 }}>
                    Délai : 24 à 48h
                  </p>
                </div>

                {/* Retrait chez fournisseur */}
                <div className="p-3 bg-[#E8A817]/5 rounded-xl border border-[#E8A817]/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-[#E8A817]" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Retrait chez fournisseur</span>
                  </div>
                  <p className="text-muted-foreground ml-6" style={{ fontSize: 11 }}>
                    Retrait direct au dépôt du grossiste · <span style={{ fontWeight: 700, color: "#16A34A" }}>Gratuit</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ 10. MOYENS DE PAIEMENT ═══ */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-4">
              <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <CreditCard className="w-4 h-4 text-[#16A34A]" /> Moyens de paiement
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Smartphone, label: "Mobile Money", color: "#F97316" },
                  { icon: CreditCard, label: "Carte bancaire", color: "#0066FF" },
                  { icon: Banknote, label: "Virement bancaire", color: "#16A34A" },
                  { icon: Truck, label: "Paiement à la livraison", color: "#E8A817" },
                  { icon: Wallet, label: "IPPOO CASH", color: "#FF6A00" },
                ].map((pm, i) => {
                  const PmIcon = pm.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F3F4F6]">
                      <PmIcon className="w-3.5 h-3.5" style={{ color: pm.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{pm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ COUPON APPLICABLE ═══ */}
            <div className="space-y-2 mb-4">
              <CouponStrip code="GROS10" label="Volume" discount="-10% dès 10 cartons" condition="Applicable sur ce produit, cumulable avec les prix dégressifs" color="#FF6B00" expiry="Offre permanente" />
              <CouponStrip code="BIENVENUE" label="Bienvenue" discount="-15% première commande" condition="Nouveaux acheteurs uniquement" color="#FF6A00" expiry="Expire le 31 mars" />
            </div>

            {/* Flash promo */}
            <div className="mb-4">
              <FlashPromoBanner
                text="SUPER PRIX : commandez avant minuit"
                subtext="Prix flash garanti, Stock limité à 50 unités"
                link="/promos"
                color="#FF6A00"
              />
            </div>
          </div>
        </div>

        {/* Contest + Spin */}
        <div className="px-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ContestCard
            title="Gagnez 100 000 FCFA"
            prize="Bon d'achat à utiliser sur IPPOO"
            endsIn="5 jours restants"
            participants={2341}
            link="/jeux"
          />
          <SpinWheelTeaser />
        </div>

        {/* ═══ TABS ═══ */}
        <div className="px-4 mt-4">
          <div className="flex border-b border-border mb-4">
            {(["description", "logistique", "avis"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 ${
                  activeTab === tab ? "border-b-2 border-[#FF6A00] text-[#FF6A00]" : "text-muted-foreground"
                }`}
                style={{ fontSize: 13, fontWeight: 600, fontFamily: "Poppins" }}
              >
                {tab === "description" ? "Description" : tab === "logistique" ? "Infos logistiques" : "Avis"}
              </button>
            ))}
          </div>

          {/* ═══ 8. DESCRIPTION ═══ */}
          {activeTab === "description" && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-muted-foreground mb-1" style={{ fontSize: 11, fontWeight: 600, color: "#F97316" }}>
                Exclusivement pour revendeurs, commerçants, restaurants et distributeurs
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>
                {description}
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Catégorie", value: product.category },
                  { label: "Vendeur", value: product.seller },
                  { label: "Unité de vente", value: product.unit },
                  { label: "MOQ", value: `${product.moq} ${product.unit}` },
                  { label: "Commande recommandée", value: `${recommendedQty} ${product.unit}` },
                  { label: "Conditionnement", value: conditionnement.type },
                  { label: "Origine", value: "Bénin / Import" },
                  { label: "Certifications", value: "Conforme aux normes locales" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                    <span className="text-muted-foreground" style={{ fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => toast.success("Fiche technique téléchargée !")} className="mt-4 flex items-center gap-2 text-[#FF6A00]" style={{ fontSize: 13, fontWeight: 600 }}>
                <FileText className="w-4 h-4" /> Télécharger la fiche technique (PDF)
              </button>
            </div>
          )}

          {/* ═══ 9. INFOS LOGISTIQUES ═══ */}
          {activeTab === "logistique" && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <h4 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700 }}>
                <Boxes className="w-4 h-4 text-[#F97316]" /> Informations logistiques
              </h4>
              {/* Info table */}
              <div className="space-y-0 mb-5">
                {[
                  { label: "Poids unitaire", value: conditionnement.poids },
                  { label: "Quantité minimum", value: `${product.moq} ${product.unit}` },
                  { label: "Type d'emballage", value: conditionnement.type },
                  { label: "Capacité de livraison", value: "Jusqu'à plusieurs tonnes" },
                  { label: "Origine", value: "Import / Local" },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-3 ${i % 2 === 0 ? "bg-[#F9FAFB]" : "bg-white"} ${i === 0 ? "rounded-t-xl" : ""} ${i === 4 ? "rounded-b-xl" : ""}`}>
                    <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Conditions */}
              <div className="space-y-3">
                <div className="p-3 bg-[#FFF7ED] rounded-xl">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Zones de livraison</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    Cotonou, Porto-Novo, Parakou, Bohicon + Points de retrait IPPOO
                  </p>
                </div>
                <div className="p-3 bg-[#FFF7ED] rounded-xl">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Garantie & Retours</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    Retour sous 48h si non-conformité. Remboursement ou échange.
                  </p>
                </div>
                <div className="p-3 bg-[#FFF7ED] rounded-xl">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Délai de livraison</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    24 à 72 heures après confirmation du paiement
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ AVIS ═══ */}
          {activeTab === "avis" && (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center">
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>
                          {review.author[0]}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{review.author}</span>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-[#E8A817] text-[#E8A817]" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ VOUS AIMERIEZ AUSSI... ═══ */}
        <div className="px-4 mt-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
                Vous aimeriez aussi...
              </h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                Produits complémentaires sélectionnés pour vous
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-3 lg:grid-cols-3 sm:overflow-visible sm:pb-0" style={{ scrollbarWidth: "none" }}>
            {complementary.map((p) => (
              <div key={p.id} className="shrink-0 w-[170px] sm:w-auto">
                <ProductCard {...p} />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/explorer?cat=${encodeURIComponent(product.category)}`)}
            className="mt-3 w-full py-2.5 rounded-xl border border-[#FF6A00]/20 bg-[#FF6A00]/5 text-[#FF6A00] flex items-center justify-center gap-2 active:scale-98 transition-transform"
            style={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}
          >
            <ThumbsUp className="w-4 h-4" />
            Voir plus en {product.category}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══ STICKY CTA ═══ */}
      <div className="fixed left-0 right-0 px-4 z-40 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <button
            onClick={() => {
              try {
                window.sessionStorage.setItem(
                  "ippoo:messaging:pending-contact",
                  JSON.stringify({
                    sellerName: product.seller,
                    product: {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      moq: typeof product.moq === "number" ? `${product.moq} ${product.unit ?? "unités"}` : String(product.moq ?? "1 unité"),
                    },
                  }),
                );
              } catch { /* noop */ }
              navigate("/messagerie");
            }}
            className="p-3 bg-white rounded-xl border border-border"
          >
            <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
          </button>
          <GroupPurchaseButton variant="compact" onClick={() => setShowGroupPurchase(true)} />
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
          >
            <ShoppingCart className="w-5 h-5" />
            Panier · {formatPrice(totalPrice)}
          </button>
        </div>
      </div>

      {/* ═══ GROUP PURCHASE MODAL ═══ */}
      {showGroupPurchase && (
        <GroupPurchaseModal
          product={product}
          quantity={quantity}
          totalPrice={totalPrice}
          onClose={() => setShowGroupPurchase(false)}
        />
      )}

    </div>
  );
}
function SafeImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const valid = typeof src === "string" && src.trim().length > 0;
  if (!valid || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] text-muted-foreground ${className ?? ""}`}>
        <ImageIcon className="w-8 h-8 opacity-60" />
        <span style={{ fontSize: 11, fontWeight: 600 }}>Image indisponible</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
