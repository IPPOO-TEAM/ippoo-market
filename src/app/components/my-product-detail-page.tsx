/* ═══════════════════════════════════════════
   IPPOO — Fiche produit (côté vendeur)
   Aperçu complet d'un produit de la boutique :
   galerie multi-images + vidéos, description,
   points-clés, paliers, logistique. Reflète
   les options du formulaire d'ajout.
   ═══════════════════════════════════════════ */

import { useEffect, useState, useSyncExternalStore } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Edit2, Eye, EyeOff, Trash2, Package, ImageIcon,
  Video as VideoIcon, Star, BadgeCheck, Sparkles, Boxes, Scale,
  MapPin, Tag, Weight, Hash, ChevronLeft, ChevronRight, ExternalLink, QrCode,
  ShoppingCart, TrendingDown, TrendingUp, Receipt, X, Plus, Minus, FileText,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  hydrateMyProducts,
  subscribe as subscribeProducts,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as PRODUCTS_SNAPSHOT,
  getMyProduct,
  updateMyProduct,
  deleteMyProduct,
  listMyMovementsForProduct,
  listMyOrders,
  purchaseMyProduct,
  addStockMovement,
  type MyProductStatus,
  type PaymentMethod,
  type MyStockMovement,
  type MyOrder,
  type MovementReason,
} from "../data/my-products";
import { productUid } from "../lib/product-uid";
import {
  getUserProfile,
  subscribe as subscribeProfile,
  SERVER_SNAPSHOT as PROFILE_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import {
  hydrateMyShops,
  subscribe as subscribeShops,
  getMyShopsSnapshot,
  SERVER_SNAPSHOT as SHOPS_SNAPSHOT,
  listAllShops,
} from "../data/my-shops";
import { formatPrice } from "./mock-data";

const STATUS_LABELS: Record<MyProductStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  out_of_stock: "Rupture",
};
const STATUS_COLORS: Record<MyProductStatus, string> = {
  draft: "#9CA3AF",
  published: "#16A34A",
  out_of_stock: "#F59E0B",
};

export function MyProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateMyProducts(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeProducts, getMyProductsSnapshot, () => PRODUCTS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const [activeMedia, setActiveMedia] = useState(0);
  const product = id ? getMyProduct(id) : undefined;

  if (!isSeller(profile)) return <Navigate to="/boutique" replace />;
  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
        <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Produit introuvable</h2>
        <button
          onClick={() => navigate("/boutique/produits")}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft className="w-4 h-4" /> Retour à mes produits
        </button>
      </div>
    );
  }

  const shops = listAllShops(profile?.businessName);
  const shop = shops.find((s) => s.slug === product.shopSlug);
  const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const videos = product.videos ?? [];
  const totalMedia = images.length + videos.length;
  const isVideo = activeMedia >= images.length;
  const videoIndex = activeMedia - images.length;
  const tone = STATUS_COLORS[product.status];

  const toggleStatus = () => {
    const next: MyProductStatus = product.status === "published" ? "draft" : "published";
    updateMyProduct(product.id, { status: next });
    toast.success(next === "published" ? "Produit publié" : "Produit dépublié");
  };

  const handleDelete = () => {
    if (confirm(`Supprimer "${product.name}" ? Cette action est définitive.`)) {
      deleteMyProduct(product.id);
      toast.success("Produit supprimé");
      navigate("/boutique/produits");
    }
  };

  const navMedia = (dir: -1 | 1) => {
    if (totalMedia === 0) return;
    setActiveMedia((i) => (i + dir + totalMedia) % totalMedia);
  };

  const [sellOpen, setSellOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const productMovements = listMyMovementsForProduct(product.id);
  const productOrders = listMyOrders(product.shopSlug).filter((o) => o.productId === product.id);
  const uid = productUid({ id: product.id, reference: product.reference });

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique/produits")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Fiche produit
          </h1>
          {shop && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              {shop.name}
            </div>
          )}
        </div>
        <button
          onClick={toggleStatus}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
        >
          {product.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {product.status === "published" ? "Dépublier" : "Publier"}
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-xl border border-border hover:bg-[#FEF2F2] hover:border-[#E11D2E] hover:text-[#E11D2E]"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Galerie médias */}
        <div className="mb-5 lg:mb-0">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#F3F4F6] relative group">
            {totalMedia === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Package className="w-16 h-16 mb-2" />
                <span style={{ fontSize: 13 }}>Aucun média</span>
              </div>
            ) : isVideo ? (
              <video src={videos[videoIndex]} className="w-full h-full object-contain bg-black" controls autoPlay />
            ) : (
              <img src={images[activeMedia]} alt={product.name} className="w-full h-full object-cover" />
            )}
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white shadow-md"
              style={{ background: tone, fontSize: 11, fontWeight: 700 }}
            >
              {STATUS_LABELS[product.status]}
            </span>
            {totalMedia > 1 && (
              <>
                <button onClick={() => navMedia(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => navMedia(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-white inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600 }}>
                  {isVideo ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {activeMedia + 1}/{totalMedia}
                </div>
              </>
            )}
          </div>

          {totalMedia > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`i-${i}`}
                  onClick={() => setActiveMedia(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${activeMedia === i ? "border-[#E11D2E]" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {videos.map((src, i) => (
                <button
                  key={`v-${i}`}
                  onClick={() => setActiveMedia(images.length + i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 relative bg-black transition ${activeMedia === images.length + i ? "border-[#E11D2E]" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <video src={src} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <VideoIcon className="w-5 h-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos principales */}
        <div>
          {product.brand && (
            <div className="inline-flex items-center gap-1 mb-1" style={{ fontSize: 11, fontWeight: 700, color: "#F97316", letterSpacing: ".05em" }}>
              <BadgeCheck className="w-3.5 h-3.5" /> {product.brand.toUpperCase()}
            </div>
          )}
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, lineHeight: 1.2 }}>{product.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {product.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316]" style={{ fontSize: 11, fontWeight: 600 }}>
                <Tag className="w-3 h-3" /> {product.category}
              </span>
            )}
            {product.reference && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F3F4F6] text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
                <Hash className="w-3 h-3" /> {product.reference}
              </span>
            )}
            {product.origin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F3F4F6] text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
                <MapPin className="w-3 h-3" /> {product.origin}
              </span>
            )}
          </div>

          {/* Prix */}
          <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4400] rounded-2xl p-4 mt-4 shadow-lg">
            <div className="flex items-end gap-2 text-white">
              <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28 }}>{formatPrice(product.price)}</span>
              <span className="opacity-80 mb-1" style={{ fontSize: 12 }}>FCFA / {product.unit}</span>
            </div>
            <p className="text-white/85 mt-1" style={{ fontSize: 11 }}>
              MOQ : {product.moq} {product.unit} · Stock disponible : {product.stockQty} {product.unit}
            </p>
          </div>

          {/* Paliers */}
          {product.paliers && product.paliers.length > 0 && (
            <div className="mt-3 bg-white rounded-2xl border border-border p-4">
              <h4 className="flex items-center gap-2 mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Scale className="w-4 h-4 text-[#F97316]" /> Prix dégressifs
              </h4>
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A2E] text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                  <span>Quantité</span>
                  <span>Prix unitaire</span>
                </div>
                {product.paliers.map((t, i) => {
                  const next = product.paliers![i + 1];
                  const range = next ? `${t.qty} – ${next.qty - 1} ${product.unit}` : `${t.qty}+ ${product.unit}`;
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2 border-t border-border" style={{ fontSize: 13 }}>
                      <span>{range}</span>
                      <span style={{ fontWeight: 800, color: "#E11D2E" }}>{formatPrice(t.price)} FCFA</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-3 bg-gradient-to-br from-[#FEF2F2] to-[#FFF7ED] rounded-2xl border border-[#FECACA] p-4">
              <h4 className="flex items-center gap-2 mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#E11D2E" }}>
                <Sparkles className="w-3.5 h-3.5" /> Points-clés
              </h4>
              <ul className="space-y-1.5">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ fontSize: 13 }}>
                    <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 fill-[#F97316] text-[#F97316]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Edit / public preview */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate(`/boutique/produits?edit=${product.id}`)}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
            >
              <Edit2 className="w-4 h-4" /> Modifier
            </button>
            <button
              onClick={() => navigate(`/boutique/produits/etiquettes?product=${product.id}`)}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
            >
              <QrCode className="w-4 h-4" /> Étiquettes QR
            </button>
            <button
              onClick={() => setSellOpen(true)}
              disabled={product.stockQty <= 0}
              className="px-4 py-2.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5 col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
                boxShadow: "0 6px 14px rgba(22,163,74,.3)",
              }}
            >
              <ShoppingCart className="w-4 h-4" /> Encaisser une vente
            </button>
            <button
              onClick={() => setAdjustOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
            >
              <Boxes className="w-4 h-4" /> Ajuster le stock
            </button>
            {shop && (
              <button
                onClick={() => navigate(`/boutique/${shop.slug}`)}
                className="px-4 py-2.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5"
                style={{
                  background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                  fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
                  boxShadow: "0 6px 14px rgba(232,32,42,.3)",
                }}
              >
                <ExternalLink className="w-4 h-4" /> Voir la boutique
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-6 bg-white rounded-2xl border border-border p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            Description détaillée
          </h3>
          <p className="text-[#374151] whitespace-pre-line" style={{ fontSize: 14, lineHeight: 1.7 }}>
            {product.description}
          </p>
        </div>
      )}

      {/* Logistique */}
      <div className="mt-4 bg-white rounded-2xl border border-border p-5">
        <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
          <Boxes className="w-4 h-4 text-[#F97316]" /> Logistique & conditionnement
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoTile icon={Package} label="Unité de vente" value={product.unit} />
          <InfoTile icon={Boxes} label="MOQ" value={`${product.moq} ${product.unit}`} />
          <InfoTile icon={Boxes} label="Stock" value={`${product.stockQty} ${product.unit}`} />
          {product.weightKg && <InfoTile icon={Weight} label="Poids unitaire" value={`${product.weightKg} kg`} />}
          {product.origin && <InfoTile icon={MapPin} label="Origine" value={product.origin} />}
          {product.brand && <InfoTile icon={BadgeCheck} label="Marque" value={product.brand} />}
          {product.reference && <InfoTile icon={Hash} label="Référence" value={product.reference} />}
          {product.category && <InfoTile icon={Tag} label="Catégorie" value={product.category} />}
          <InfoTile icon={QrCode} label="UID de suivi" value={uid} />
        </div>
      </div>

      {/* Journal de stock */}
      <div className="mt-4 bg-white rounded-2xl border border-border p-5">
        <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
          <Boxes className="w-4 h-4 text-[#3B82F6]" /> Journal de stock
          <span className="ml-auto text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
            {productMovements.length} mouvement(s)
          </span>
        </h3>
        {productMovements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground" style={{ fontSize: 12 }}>
            Aucun mouvement enregistré. Les ventes et ajustements apparaîtront ici.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {productMovements.slice(0, 30).map((m) => (
              <MovementRow key={m.id} movement={m} unit={product.unit} />
            ))}
          </div>
        )}
      </div>

      {/* Dernières ventes */}
      {productOrders.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-border p-5">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            <Receipt className="w-4 h-4 text-[#16A34A]" /> Dernières ventes
            <span className="ml-auto text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
              {productOrders.length} commande(s)
            </span>
          </h3>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {productOrders.slice(0, 20).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-[#FAFAFA]">
                <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 text-[#15803D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
                    {o.qty} {o.unit} · {o.buyerName ?? "Acheteur anonyme"}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {new Date(o.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {PAYMENT_LABELS[o.paymentMethod]}
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#16A34A" }}>
                    +{formatPrice(o.total)} FCFA
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {SOURCE_LABELS[o.source]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sellOpen && (
        <SellDialog
          product={product}
          shopName={shop?.name}
          uid={uid}
          onClose={() => setSellOpen(false)}
        />
      )}
      {adjustOpen && (
        <AdjustStockDialog
          product={product}
          onClose={() => setAdjustOpen(false)}
        />
      )}
    </div>
  );
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  card: "Carte",
  wallet: "Wallet IPPOO",
  transfer: "Virement",
  credit: "Crédit",
};
const SOURCE_LABELS: Record<MyOrder["source"], string> = {
  scan: "QR scan",
  manual: "Vente manuelle",
  marketplace: "Marketplace",
};
const REASON_LABELS: Record<MovementReason, string> = {
  sale: "Vente",
  manual_in: "Entrée stock",
  manual_out: "Sortie stock",
  return: "Retour",
  adjustment: "Ajustement",
  initial: "Stock initial",
};

function MovementRow({ movement, unit }: { movement: MyStockMovement; unit: string }) {
  const isOut = movement.delta < 0;
  const Icon = isOut ? TrendingDown : TrendingUp;
  const color = isOut ? "#E11D2E" : "#16A34A";
  const bg = isOut ? "#FEF2F2" : "#DCFCE7";
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-white">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
          {REASON_LABELS[movement.reason]} {movement.note ? `· ${movement.note}` : ""}
        </div>
        <div className="text-muted-foreground" style={{ fontSize: 10 }}>
          {new Date(movement.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
          {movement.orderId && ` · ${movement.orderId}`}
        </div>
      </div>
      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color }}>
        {isOut ? "" : "+"}{movement.delta} {unit}
      </div>
    </div>
  );
}

/* ─── Dialog d'encaissement ──────────────────────────────────────── */

function SellDialog({
  product, shopName, uid, onClose,
}: {
  product: { id: string; name: string; stockQty: number; unit: string; price: number; moq: number; paliers?: { qty: number; price: number }[] };
  shopName?: string;
  uid: string;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");

  const paliers = (product.paliers ?? []).slice().sort((a, b) => a.qty - b.qty);
  let unitPrice = product.price;
  for (const t of paliers) if (qty >= t.qty) unitPrice = t.price;
  const total = unitPrice * qty;

  const submit = () => {
    try {
      const { invoice } = purchaseMyProduct({
        productId: product.id,
        qty,
        paymentMethod,
        buyerName: buyerName.trim() || undefined,
        buyerContact: buyerContact.trim() || undefined,
        source: "manual",
        shopName,
        productUid: uid,
      });
      toast.success(`Vente encaissée · Facture ${invoice.number}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'encaissement");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[94vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white px-5 py-4 flex items-center gap-3">
          <ShoppingCart className="w-5 h-5" />
          <div className="flex-1">
            <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Encaisser une vente</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>Stock actuel : {product.stockQty} {product.unit}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-[#FAFAFA] rounded-2xl p-3 border border-border">
            <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{product.name}</div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>UID · {uid}</div>
          </div>

          <div>
            <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
              Quantité <span className="text-muted-foreground" style={{ fontWeight: 500 }}>(max {product.stockQty})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number" min={1} max={product.stockQty}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(product.stockQty, Number(e.target.value) || 1)))}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border text-center"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}
              />
              <button
                onClick={() => setQty((q) => Math.min(product.stockQty, q + 1))}
                className="w-10 h-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Mode de paiement</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["cash", "mobile_money", "card", "wallet", "transfer"] as PaymentMethod[]).map((m) => {
                const active = paymentMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className="px-2 py-2 rounded-xl border transition"
                    style={{
                      borderColor: active ? "#16A34A" : "#E5E7EB",
                      background: active ? "#DCFCE7" : "white",
                      color: active ? "#15803D" : "#374151",
                      fontFamily: "Poppins", fontWeight: 600, fontSize: 11,
                    }}
                  >
                    {PAYMENT_LABELS[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 11 }}>Nom client (optionnel)</div>
              <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Anonyme"
                className="w-full px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }} />
            </label>
            <label className="block">
              <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 11 }}>Tél / email</div>
              <input value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} placeholder="+229 …"
                className="w-full px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }} />
            </label>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#FEF2F2] to-[#FFF7ED] border border-[#FECACA] p-4">
            <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
              <span className="text-muted-foreground">PU · {formatPrice(unitPrice)} × {qty}</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(total)} FCFA</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FECACA]">
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Total à encaisser</span>
              <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, color: "#E11D2E" }}>
                {formatPrice(total)} FCFA
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white border-t border-border p-3 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
            Annuler
          </button>
          <button
            onClick={submit}
            className="flex-1 px-4 py-2.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <FileText className="w-4 h-4" /> Encaisser & facturer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dialog d'ajustement de stock ───────────────────────────────── */

function AdjustStockDialog({
  product, onClose,
}: { product: { id: string; shopSlug: string; stockQty: number; unit: string; name: string }; onClose: () => void }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState<MovementReason>("manual_in");
  const [note, setNote] = useState("");

  const submit = () => {
    if (delta === 0) { toast.error("Quantité requise"); return; }
    if (delta < 0 && Math.abs(delta) > product.stockQty) {
      toast.error(`Sortie supérieure au stock (${product.stockQty})`); return;
    }
    addStockMovement({
      productId: product.id,
      shopSlug: product.shopSlug,
      delta,
      reason,
      note: note.trim() || undefined,
    });
    toast.success(`Stock ajusté · ${delta > 0 ? "+" : ""}${delta} ${product.unit}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white border-b border-border px-5 py-4 flex items-center gap-3">
          <Boxes className="w-5 h-5 text-[#3B82F6]" />
          <div className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            Ajuster le stock
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-muted-foreground" style={{ fontSize: 12 }}>
            Stock actuel : <strong className="text-foreground">{product.stockQty} {product.unit}</strong>
          </div>
          <div>
            <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Type de mouvement</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["manual_in", "manual_out", "return", "adjustment"] as MovementReason[]).map((r) => {
                const active = reason === r;
                return (
                  <button key={r} onClick={() => setReason(r)}
                    className="px-2 py-2 rounded-xl border transition"
                    style={{
                      borderColor: active ? "#3B82F6" : "#E5E7EB",
                      background: active ? "#DBEAFE" : "white",
                      color: active ? "#1D4ED8" : "#374151",
                      fontFamily: "Poppins", fontWeight: 600, fontSize: 11,
                    }}>
                    {REASON_LABELS[r]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
              Quantité <span className="text-muted-foreground" style={{ fontWeight: 500 }}>(positif = entrée, négatif = sortie)</span>
            </div>
            <input type="number" value={delta || ""} onChange={(e) => setDelta(Number(e.target.value) || 0)}
              placeholder="ex : 50 ou -10"
              className="w-full px-3 py-2.5 rounded-xl border border-border" style={{ fontSize: 14, fontFamily: "Poppins", fontWeight: 700 }} />
          </div>
          <label className="block">
            <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Note (optionnelle)</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Réception fournisseur, casse, inventaire…"
              className="w-full px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }} />
          </label>
        </div>
        <div className="bg-white border-t border-border p-3 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
            Annuler
          </button>
          <button onClick={submit} className="flex-1 px-4 py-2.5 rounded-xl text-white" style={{ background: "#3B82F6", fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-[#FAFAFA] p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{value}</div>
    </div>
  );
}

export default MyProductDetailPage;
