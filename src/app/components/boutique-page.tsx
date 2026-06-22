import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Tag,
  Search,
  Share2,
  Heart,
  MessageSquare,
  Package,
  Clock,
  Truck,
  Globe,
  Calendar,
  Users,
  BadgeCheck,
  SlidersHorizontal,
  Store,
  Phone,
  ThumbsUp,
  LayoutDashboard,
  Pencil,
  Check,
  X as XIcon,
  Camera,
  Loader2,
} from "lucide-react";
import { patchUserProfile } from "../auth/user-profile";
import { publishMyVendor } from "../data/public-vendors";
import { uploadShopAsset, fileToCompressedDataUrl } from "../data/shop-assets";
import { getUserProfile, subscribe as subscribeProfile, SERVER_SNAPSHOT, isSeller, SHOP_STATUS_LABELS, SHOP_STATUS_COLORS, getEffectiveShopStatus } from "../auth/user-profile";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { findShop, findVendor, MARKETPLACE_PRODUCTS } from "../data/marketplace";
import { findCategory } from "../data/catalog";
import { ProductCard } from "./product-card";
import { StaggerList, StaggerItem } from "./anim";
import { allProducts } from "./mock-data";
import { CategoryIcon } from "./category-icon";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { getShopAssets, refreshShopAssets, slugifyShopName } from "../data/shop-assets";
import { resolveShopVisuals } from "../data/shop-resolver";
import {
  hydrateFollowedShops,
  subscribe as subscribeFollowed,
  getFollowedSnapshot,
  SERVER_SNAPSHOT as FOLLOWED_SNAPSHOT,
  isFollowingShop,
  toggleFollowShop,
} from "../data/followed-shops";
import {
  hydrateShopReviews,
  subscribe as subscribeReviews,
  getShopReviewsSnapshot,
  SERVER_SNAPSHOT as REVIEWS_SNAPSHOT,
  listApprovedReviews,
} from "../data/shop-reviews";
import {
  hydrateMyPromos,
  subscribe as subscribePromos,
  getMyPromosSnapshot,
  SERVER_SNAPSHOT as PROMOS_SNAPSHOT,
  listMyPromos,
  isPromoActive,
} from "../data/my-promos";
import {
  hydrateMyProducts,
  subscribe as subscribeMyProducts,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as MY_PRODUCTS_SNAPSHOT,
  listMyProducts,
} from "../data/my-products";
import { BadgePercent } from "lucide-react";
import { AnimatedNumber } from "./animated-number";
import { useSyncExternalStore, useEffect } from "react";
import { usePublicVendors } from "../data/usePublicVendors";
import type { PublicVendor } from "../data/public-vendors";
import { ReviewSubmitModal } from "./boutique/review-submit-modal";

function publicVendorToShop(v: PublicVendor) {
  return {
    id: v.ownerId || slugifyShopName(v.name),
    name: v.name,
    city: v.city || "Cotonou",
    verified: true,
    rating: 5,
    niche: v.niche || "alimentation",
    nicheName: "",
    vendorId: v.ownerId || "",
    description: v.description || "",
    isPublished: true,
  };
}

type SortKey = "popular" | "price-asc" | "price-desc" | "rating";

const SHOP_REVIEWS = [
  { id: 1, author: "Aminata D.", initial: "A", rating: 5, date: "12 mai 2026", comment: "Vendeur sérieux, produits conformes et livraison rapide. Je recommande à 100%.", helpful: 14 },
  { id: 2, author: "Ibrahim K.", initial: "I", rating: 4, date: "08 mai 2026", comment: "Bon rapport qualité/prix. Réponse rapide aux messages.", helpful: 9 },
  { id: 3, author: "Fatou S.", initial: "F", rating: 5, date: "02 mai 2026", comment: "Très professionnel. Emballage soigné. À recommander !", helpful: 17 },
  { id: 4, author: "Koffi A.", initial: "K", rating: 5, date: "28 avr 2026", comment: "Livraison en 24h comme promis. Qualité top.", helpful: 6 },
];

const RATING_DIST = [
  { stars: 5, percent: 68, count: 245 },
  { stars: 4, percent: 22, count: 79 },
  { stars: 3, percent: 7, count: 25 },
  { stars: 2, percent: 2, count: 7 },
  { stars: 1, percent: 1, count: 4 },
];

export function BoutiquePage() {
  const { shopId = "" } = useParams();
  const navigate = useNavigate();
  const publicVendors = usePublicVendors();
  const marketplaceShop = findShop(shopId);
  const publishedFallback = useMemo(() => {
    if (marketplaceShop) return undefined;
    const match = publicVendors.find(
      (v) => v.ownerId === shopId || slugifyShopName(v.name) === shopId,
    );
    return match ? publicVendorToShop(match) : undefined;
  }, [marketplaceShop, publicVendors, shopId]);
  const shop = marketplaceShop ?? publishedFallback;
  const isPublishedOnly = !marketplaceShop && !!publishedFallback;
  const vendor = shop && !isPublishedOnly ? findVendor(shop.vendorId) : undefined;
  const niche = shop ? findCategory(shop.niche) : undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialReview = searchParams.get("review") === "1";
  const [tab, setTab] = useState<"produits" | "infos" | "avis">(initialReview ? "avis" : "produits");
  const [reviewModalOpen, setReviewModalOpen] = useState(initialReview);
  useEffect(() => {
    hydrateShopReviews();
    hydrateMyPromos();
    hydrateMyProducts();
    if (initialReview) {
      // nettoie le param pour éviter ré-ouverture sur reload
      const next = new URLSearchParams(searchParams);
      next.delete("review");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useSyncExternalStore(subscribeReviews, getShopReviewsSnapshot, () => REVIEWS_SNAPSHOT);
  useSyncExternalStore(subscribePromos, getMyPromosSnapshot, () => PROMOS_SNAPSHOT);
  const myProductsSnapshot = useSyncExternalStore(subscribeMyProducts, getMyProductsSnapshot, () => MY_PRODUCTS_SNAPSHOT);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [uploading, setUploading] = useState<null | "logo" | "banner">(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [liked, setLiked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const products = useMemo(() => {
    if (!shop) return [];
    const fromMarketplace = MARKETPLACE_PRODUCTS.filter((p) => p.shopId === shop.id);
    const fromCurated = allProducts.filter(
      (p) => (p as { shopId?: string }).shopId === undefined && p.seller === shop.name,
    );
    const shopSlug = slugifyShopName(shop.name);
    const fromVendor = listMyProducts(shopSlug)
      .filter((p) => p.status === "published")
      .map((p) => ({
        id: p.id as unknown as number,
        name: p.name,
        image: p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
        price: p.price,
        moq: p.moq,
        unit: p.unit,
        seller: shop.name,
        rating: 0,
        category: p.category ?? "",
        inStock: (p.stockQty ?? 0) > 0 && p.status !== "out_of_stock",
        paliers: [{ qty: p.moq, price: p.price }],
        reference: undefined,
      }));
    return [...fromVendor, ...fromCurated, ...fromMarketplace];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, myProductsSnapshot]);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (maxPrice) list = list.filter((p) => p.price <= maxPrice);
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return sorted;
  }, [products, search, sort, maxPrice]);

  useEffect(() => {
    if (!shop) return;
    refreshShopAssets(shop.id);
    refreshShopAssets(slugifyShopName(shop.name));
  }, [shop]);
  const assets = useSyncExternalStore(
    (cb) => { window.addEventListener("ippoo:shop-assets", cb); return () => window.removeEventListener("ippoo:shop-assets", cb); },
    () => shop ? JSON.stringify(getShopAssets(shop.id, shop.name)) : "{}",
    () => "{}",
  );

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Boutique introuvable</p>
        <button
          onClick={() => navigate("/vendeurs")}
          className="mt-3 px-4 py-2 rounded-xl bg-[#FF6A00] text-white"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          Voir les vendeurs
        </button>
      </div>
    );
  }

  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => SERVER_SNAPSHOT);
  const isOwner = !!profile && isSeller(profile) && !!profile.businessName &&
    (slugifyShopName(profile.businessName) === shopId || shop.name === profile.businessName);
  // Statut affiché : preference owner locale > publication du vendor public
  const publishedStatus = publicVendors.find(
    (v) => v.ownerId === shopId || slugifyShopName(v.name) === shopId || v.name === shop.name,
  )?.shopStatus;
  const shopStatus = isOwner ? getEffectiveShopStatus(profile) : (publishedStatus ?? "open");

  const accent = niche?.color ?? "#0F172A";

  const handleAssetUpload = async (kind: "logo" | "banner", file: File) => {
    if (!isOwner || !shop) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Fichier trop lourd (max 5 Mo)"); return; }
    try {
      setUploading(kind);
      const dataUrl = await fileToCompressedDataUrl(file, kind === "logo" ? 512 : 1600);
      await uploadShopAsset(shop.id, kind, dataUrl);
      await refreshShopAssets(shop.id);
      toast.success(kind === "logo" ? "Logo mis à jour" : "Bannière mise à jour");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploading(null);
    }
  };
  const { logo: uploadedLogo, banner: uploadedBanner } = JSON.parse(assets) as { logo?: string; banner?: string };
  const visuals = resolveShopVisuals(shop.id, shop.name);
  useEffect(() => { hydrateFollowedShops(); }, []);
  useSyncExternalStore(subscribeFollowed, getFollowedSnapshot, () => FOLLOWED_SNAPSHOT);
  const following = isFollowingShop(visuals.slug);
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const avgRating = products.length
    ? products.reduce((s, p) => s + (p.rating ?? 0), 0) / products.length
    : shop.rating;

  return (
    <div className="pb-32">
      {isOwner && (
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", borderBottom: "1px solid #F59E0B" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#B45309" }} />
            <span className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: "#92400E" }}>
              Vous êtes le propriétaire de cette boutique
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              to="/profil"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 11, color: "#92400E" }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </Link>
            <Link
              to="/boutique"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white"
              style={{
                background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                fontFamily: "Poppins",
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Tableau de bord
            </Link>
          </div>
        </div>
      )}
      {/* Sticky top bar */}
      <div className="sticky top-[60px] z-40 bg-white/85 backdrop-blur-lg border-b border-border px-4 py-2.5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center px-4 min-w-0">
          <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            {shop.name}
          </h3>
          {shopStatus !== "open" && (
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SHOP_STATUS_COLORS[shopStatus] }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: SHOP_STATUS_COLORS[shopStatus] }}>
                {SHOP_STATUS_LABELS[shopStatus]}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setLiked(!liked); toast.success(liked ? "Retiré des favoris" : "Boutique ajoutée aux favoris"); }}
            className="p-2 rounded-xl hover:bg-muted"
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-[#E11D2E] text-[#E11D2E]" : ""}`} />
          </button>
          <button
            onClick={() => { copyToClipboard(window.location.href); toast.success("Lien copié !"); }}
            className="p-2 rounded-xl hover:bg-muted"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Hero modernisé : bannière + logo bien positionné ─── */}
      <div className="relative">
        {/* Bannière (image niche + overlay gradient accent) */}
        <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden">
          <img
            src={uploadedBanner || visuals.banner || `https://source.unsplash.com/1600x600/?${encodeURIComponent((niche?.name ?? shop.nicheName).toLowerCase())},shop,store,africa&sig=${shop.id}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          {/* Voile coloré niche pour cohérence visuelle */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}66 45%, rgba(15,23,42,0.85) 100%)` }}
          />
          {/* Pattern subtil */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, white 0.5px, transparent 1px), radial-gradient(circle at 80% 60%, white 0.5px, transparent 1px)",
              backgroundSize: "32px 32px, 48px 48px",
            }}
          />
          {/* Fade vers le bas pour lisibilité */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 to-transparent" />

          {/* Badge vérifiée - top right */}
          {shop.verified && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A", letterSpacing: 0.5 }}>VÉRIFIÉE</span>
            </div>
          )}
          {/* Chip niche - top left */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur text-white">
            <CategoryIcon name={niche?.icon} className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
              {(niche?.name ?? shop.nicheName).toUpperCase()}
            </span>
          </div>
          {/* Changer la bannière (owner) */}
          {isOwner && (
            <label className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 cursor-pointer shadow hover:bg-white">
              {uploading === "banner" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E11D2E]" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-[#E11D2E]" />
              )}
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, color: "#E11D2E" }}>
                {uploading === "banner" ? "Envoi…" : "Changer la bannière"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading !== null}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAssetUpload("banner", f); e.target.value = ""; }}
              />
            </label>
          )}
        </div>

        {/* Bloc identité - chevauche la bannière proprement */}
        <div className="relative px-4 max-w-5xl mx-auto">
          <div className="-mt-12 sm:-mt-14 flex items-end gap-3 sm:gap-4">
            {/* Logo circulaire avec halo blanc */}
            <div className="relative shrink-0">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
              >
                <img
                  src={uploadedLogo || visuals.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(shop.name)}&backgroundType=gradientLinear&backgroundColor=${accent.replace("#", "")},0f172a&fontWeight=900`}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              {/* Pastille statut en ligne */}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white shadow" />
              {/* Changer le logo (owner) */}
              {isOwner && (
                <label
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-border flex items-center justify-center cursor-pointer hover:bg-muted"
                  title="Changer le logo"
                >
                  {uploading === "logo" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#E11D2E]" />
                  ) : (
                    <Camera className="w-4 h-4 text-[#E11D2E]" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAssetUpload("logo", f); e.target.value = ""; }}
                  />
                </label>
              )}
            </div>

            {/* Nom + meta, alignés à hauteur du logo, sous la bannière */}
            <div className="pb-2 flex-1 min-w-0">
              <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px", color: "#0F172A" }}>
                {shop.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1 text-muted-foreground" style={{ fontSize: 12 }}>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {shop.city}</span>
                <span className="opacity-60">·</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>{avgRating.toFixed(1)}</span>
                  <span className="opacity-70">({products.length} produits)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-3">
            {([
              { icon: Star, node: <AnimatedNumber value={avgRating} decimals={1} />, label: "Note", color: "#F0B429", fill: true },
              { icon: Package, node: <AnimatedNumber value={products.length} />, label: "Produits", color: "#FF6B00", fill: false },
              { icon: BadgeCheck, node: <AnimatedNumber value={97} suffix="%" />, label: "Fiabilité", color: "#16A34A", fill: false },
              { icon: Clock, node: <>&lt; 2h</>, label: "Réponse", color: "#6366F1", fill: false },
            ]).map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-1.5" style={{ background: `${s.color}15` }}>
                  <s.icon className={`w-4 h-4 ${s.fill ? "fill-[#F0B429]" : ""}`} style={{ color: s.color }} />
                </div>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>{s.node}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="max-w-5xl mx-auto px-4 mt-3 flex gap-2">
        <button
          onClick={() => navigate("/messagerie")}
          className="flex-1 py-2.5 rounded-2xl text-white flex items-center justify-center gap-2"
          style={{ background: accent, fontSize: 13, fontWeight: 700 }}
        >
          <MessageSquare className="w-4 h-4" /> Contacter
        </button>
        <button
          onClick={() => {
            const now = toggleFollowShop(visuals.slug, visuals.name);
            toast.success(now ? "Boutique suivie" : "Boutique retirée");
          }}
          className="py-2.5 px-4 rounded-2xl border flex items-center justify-center gap-2 transition"
          style={{
            background: following ? "#FEF2F2" : "white",
            borderColor: following ? "#E11D2E" : "var(--border)",
            color: following ? "#E11D2E" : "#0F172A",
            fontSize: 13, fontWeight: 700,
          }}
          aria-pressed={following}
        >
          <Heart className={`w-4 h-4 ${following ? "fill-[#E11D2E]" : ""}`} />
          {following ? "Suivie" : "Suivre"}
        </button>
        <button
          onClick={() => navigate("/devis")}
          className="py-2.5 px-4 rounded-2xl border border-border flex items-center justify-center gap-2 hover:bg-muted"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          <Phone className="w-4 h-4" /> Devis
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-5">
        <div className="flex gap-1 p-1 bg-muted rounded-2xl">
          {([
            { key: "produits" as const, label: "Catalogue", count: products.length },
            { key: "infos" as const, label: "À propos", count: null },
            { key: "avis" as const, label: "Avis", count: isPublishedOnly ? 0 : SHOP_REVIEWS.length },
          ]).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${active ? "bg-white shadow-sm" : "text-muted-foreground"}`}
                style={{ fontSize: 12, fontWeight: 700, fontFamily: "Poppins" }}
              >
                {t.label}
                {t.count !== null && (
                  <span className="px-1.5 rounded-full" style={{ fontSize: 9, fontWeight: 800, background: active ? accent : "#D1D5DB", color: "#fff" }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "produits" && (
          <motion.div key="produits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-5xl mx-auto px-4 mt-4">
            {(() => {
              const shopSlug = slugifyShopName(shop.name);
              const activePromo = listMyPromos(shopSlug).filter(isPromoActive)[0];
              if (!activePromo) return null;
              const valueLabel = activePromo.type === "percent"
                ? `-${activePromo.value}%`
                : `-${activePromo.value.toLocaleString("fr-FR")} FCFA`;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 rounded-2xl p-3 flex items-center gap-3 text-white"
                  style={{ background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <BadgePercent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{valueLabel}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/25" style={{ fontWeight: 700, fontSize: 11 }}>
                        Code : {activePromo.code}
                      </span>
                    </div>
                    <div className="opacity-90 truncate" style={{ fontSize: 11 }}>
                      {activePromo.label || "Profitez de cette offre"}
                      {activePromo.minOrder ? ` · dès ${activePromo.minOrder.toLocaleString("fr-FR")} FCFA` : ""}
                      {activePromo.endsAt ? ` · jusqu'au ${activePromo.endsAt}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      copyToClipboard(activePromo.code);
                      toast.success(`Code ${activePromo.code} copié`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#E11D2E] shrink-0"
                    style={{ fontWeight: 700, fontSize: 12 }}
                  >
                    Copier
                  </button>
                </motion.div>
              );
            })()}
            {/* Search + sort */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher dans la boutique…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-transparent focus:bg-white focus:border-border outline-none"
                  style={{ fontSize: 13 }}
                />
              </div>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`px-3 rounded-xl border ${showFilters ? "bg-foreground text-white border-foreground" : "border-border"}`}
                aria-label="Filtres"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Sort chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {([
                ["popular", "Populaires"],
                ["price-asc", "Prix ↑"],
                ["price-desc", "Prix ↓"],
                ["rating", "Mieux notés"],
              ] as [SortKey, string][]).map(([k, l]) => {
                const active = sort === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`shrink-0 px-3 py-1.5 rounded-full border ${active ? "text-white border-transparent" : "border-border text-muted-foreground"}`}
                    style={{ fontSize: 12, fontWeight: 600, background: active ? accent : undefined }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>

            {/* Filters panel */}
            <AnimatePresence>
              {showFilters && prices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 rounded-2xl border border-border bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontSize: 12, fontWeight: 700 }}>Prix maximum</p>
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                        {(maxPrice ?? maxP).toLocaleString()} FCFA
                      </p>
                    </div>
                    <input
                      type="range"
                      min={minP}
                      max={maxP}
                      step={Math.max(1, Math.round((maxP - minP) / 50))}
                      value={maxPrice ?? maxP}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: accent }}
                    />
                    {maxPrice !== null && (
                      <button
                        onClick={() => setMaxPrice(null)}
                        className="mt-2 text-muted-foreground underline"
                        style={{ fontSize: 11 }}
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results header */}
            <div className="flex items-baseline justify-between mt-4 mb-3">
              <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
                {filtered.length} produit{filtered.length > 1 ? "s" : ""}
              </h2>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                Une boutique = une seule niche
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Store className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                  {products.length === 0
                    ? "Cette boutique n'a pas encore de produits référencés."
                    : "Aucun produit ne correspond à votre recherche."}
                </p>
              </div>
            ) : (
              <StaggerList className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {filtered.map((p) => (
                  <StaggerItem key={p.id}>
                    <ProductCard {...p} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}

        {tab === "infos" && (
          <motion.div key="infos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-5xl mx-auto px-4 mt-4 space-y-3">
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>À propos</h4>
                {isOwner && !editingDesc && (
                  <button
                    onClick={() => { setDescDraft(profile?.description ?? ""); setEditingDesc(true); }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    <Pencil className="w-3 h-3" /> Modifier
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white resize-none"
                    style={{ fontSize: 13, lineHeight: "20px" }}
                    placeholder="Décrivez votre boutique en quelques phrases…"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingDesc(false)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      <XIcon className="w-3.5 h-3.5" /> Annuler
                    </button>
                    <button
                      onClick={() => {
                        const next = descDraft.trim();
                        patchUserProfile({ description: next });
                        if (profile?.businessName) {
                          void publishMyVendor({
                            name: profile.businessName,
                            city: profile.city,
                            niche: profile.niche,
                            description: next,
                            logo: profile.logo,
                            shopPhoto: profile.shopPhoto,
                            avatar: profile.avatar,
                            accountType: profile.accountType,
                            whatsapp: profile.whatsapp,
                            phone: profile.phone,
                            shopStatus: getEffectiveShopStatus(profile),
                            createdAt: profile.createdAt,
                          });
                        }
                        setEditingDesc(false);
                        toast.success("Description mise à jour");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                      style={{
                        background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                        fontFamily: "Poppins", fontWeight: 700, fontSize: 12,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" /> Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: "20px" }}>
                  {(isOwner && profile?.description?.trim()) ||
                    visuals.description ||
                    publicVendors.find((v) => v.ownerId === shopId || slugifyShopName(v.name) === shopId || v.name === shop.name)?.description ||
                    `${shop.name} est une boutique spécialisée en ${(niche?.name ?? shop.nicheName).toLowerCase()}, basée à ${shop.city}. Membre actif d'IPPOO, elle propose un catalogue dédié à sa niche avec des prix de gros compétitifs et une livraison sur tout le Bénin.`}
                </p>
              )}
              {vendor && !editingDesc && (
                <button
                  onClick={() => navigate(`/vendeur/${vendor.id}`)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted"
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  <Users className="w-3.5 h-3.5" /> Voir le vendeur · {vendor.name}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MapPin, label: "Adresse", value: `${shop.city}, Bénin`, color: "#E11D2E" },
                { icon: Clock, label: "Horaires", value: "Lun-Sam : 8h-18h", color: "#6366F1" },
                { icon: Truck, label: "Livraison", value: "Cotonou, Porto-Novo, Parakou", color: "#FF6B00" },
                { icon: ShieldCheck, label: "Paiement", value: "Paiement protégé IPPOO, Mobile Money", color: "#16A34A" },
                { icon: Calendar, label: "Membre", value: vendor?.joined ? `Depuis ${vendor.joined}` : "Depuis 2024", color: "#F0B429" },
                { icon: Tag, label: "Niche", value: niche?.name ?? shop.nicheName, color: accent },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${item.color}15` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 10, marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, lineHeight: "16px" }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Garanties IPPOO</h4>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: "Paiement protégé par IPPOO", color: "#16A34A" },
                  { icon: Truck, text: "Livraison suivie en temps réel", color: "#FF6B00" },
                  { icon: Globe, text: "Service client disponible 7j/7", color: "#6366F1" },
                  { icon: BadgeCheck, text: "Identité et documents vérifiés (KYC/KYB)", color: "#F0B429" },
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${g.color}15` }}>
                      <g.icon className="w-4 h-4" style={{ color: g.color }} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600 }}>{g.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "avis" && isPublishedOnly && (() => {
          const shopSlug = slugifyShopName(shop.name);
          const storedReviews = listApprovedReviews(shopSlug);
          if (storedReviews.length === 0) {
            return (
              <motion.div key="avis-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-5xl mx-auto px-4 mt-4">
                <div className="bg-white rounded-2xl border border-border p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Star className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Pas encore d'avis</p>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                    Cette nouvelle boutique vient de rejoindre IPPOO Market.
                  </p>
                  {!isOwner && (
                    <button
                      onClick={() => setReviewModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
                      style={{ background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)", fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                    >
                      Laisser un avis
                    </button>
                  )}
                </div>
              </motion.div>
            );
          }
          const avg = storedReviews.reduce((s, r) => s + r.rating, 0) / storedReviews.length;
          return (
            <motion.div key="avis-stored" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-5xl mx-auto px-4 mt-4 space-y-3">
              <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
                <div className="text-center">
                  <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 36 }}>
                    <AnimatedNumber value={avg} decimals={1} />
                  </p>
                  <div className="flex items-center gap-0.5 justify-center">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(avg) ? "fill-[#F0B429] text-[#F0B429]" : "text-[#E5E7EB]"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{storedReviews.length} avis</p>
                </div>
                <div className="flex-1 text-right">
                  {!isOwner && (
                    <button
                      onClick={() => setReviewModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      Laisser un avis
                    </button>
                  )}
                </div>
              </div>
              {storedReviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                        <span style={{ fontWeight: 700, color: "#E11D2E", fontSize: 13 }}>{r.authorName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{r.authorName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-[#F0B429] text-[#F0B429]" : "text-[#E5E7EB]"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: "20px" }}>{r.comment}</p>
                  {r.vendorReply && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#F3F4F6] border-l-2 border-[#E11D2E]">
                      <div className="text-muted-foreground mb-0.5" style={{ fontSize: 10, fontWeight: 600 }}>Réponse du vendeur</div>
                      <p style={{ fontSize: 12 }}>{r.vendorReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          );
        })()}

        {tab === "avis" && !isPublishedOnly && (
          <motion.div key="avis" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-5xl mx-auto px-4 mt-4 space-y-3">
            {!isOwner && (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="w-full py-2.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5"
                style={{
                  background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                  fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
                }}
              >
                <Star className="w-4 h-4" />
                Laisser un avis
              </button>
            )}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start gap-5">
                <div className="text-center shrink-0">
                  <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 40, lineHeight: "44px" }}>
                    <AnimatedNumber value={avgRating} decimals={1} />
                  </p>
                  <div className="flex items-center gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? "fill-[#F0B429] text-[#F0B429]" : "text-[#E5E7EB]"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>360 avis</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {RATING_DIST.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="text-muted-foreground text-right" style={{ fontSize: 11, fontWeight: 600, width: 8 }}>{r.stars}</span>
                      <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429] shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.percent}%` }}
                          transition={{ duration: 0.6, delay: 0.05 * r.stars }}
                          className="h-full rounded-full"
                          style={{ background: r.percent > 50 ? "#F0B429" : r.percent > 15 ? "#FBBF24" : "#E5E7EB" }}
                        />
                      </div>
                      <span className="text-muted-foreground text-right" style={{ fontSize: 10, width: 28 }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {SHOP_REVIEWS.map((r, i) => {
              const palette = ["#E11D2E", "#FF6B00", "#16A34A", "#6366F1", "#EC4899"];
              const c = palette[i % palette.length];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c}15` }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: c }}>{r.initial}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{r.author}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-[#F0B429] text-[#F0B429]" : "text-[#E5E7EB]"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{r.date}</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: "20px" }}>{r.comment}</p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => toast.success("Merci pour votre vote !")}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Utile ({r.helpful})</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {reviewModalOpen && (
        <ReviewSubmitModal
          shopSlug={slugifyShopName(shop.name)}
          defaultName={profile ? `${profile.firstName ?? ""} ${profile.lastName?.charAt(0) ?? ""}.`.trim() : ""}
          onClose={() => setReviewModalOpen(false)}
        />
      )}

      {/* Sticky bottom contact bar */}
      <div className="fixed left-0 right-0 z-30 px-4 pb-2 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-border shadow-lg px-3 py-2.5 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              <CategoryIcon name={niche?.icon} className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{shop.name}</p>
              <p className="flex items-center gap-1 text-[#16A34A]" style={{ fontSize: 10 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
                En ligne maintenant
              </p>
            </div>
            <button
              onClick={() => navigate("/messagerie")}
              className="py-2 px-3 text-white rounded-xl flex items-center gap-1.5"
              style={{ background: accent, fontSize: 12, fontWeight: 700 }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

