import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Star,
  ShoppingCart,
  Truck,
  Zap,
  Package,
  ImageOff,
  BadgeCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { formatPrice } from "./mock-data";

interface Palier {
  qty: number;
  price: number;
}

interface ProductCardProps {
  id: number | string;
  name: string;
  image: string;
  price: number;
  moq: number;
  unit: string;
  seller: string;
  rating: number;
  category: string;
  inStock: boolean;
  paliers: Palier[];
  reference?: string;
  variant?: "grid" | "list";
}

export function ProductCard({
  id,
  name,
  image,
  price,
  moq,
  unit,
  seller,
  rating,
  inStock,
  paliers,
  reference,
  variant = "grid",
}: ProductCardProps) {
  const navigate = useNavigate();
  const lotPrice = paliers.length > 0 ? paliers[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[1.1rem] overflow-hidden border border-border cursor-pointer group flex flex-col"
      onClick={() => navigate(`/produit/${id}`)}
    >
      {/* Image - square */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ProductImage src={image} alt={name} />
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span
              className="text-white px-3 py-1 bg-[#E11D2E] rounded-lg"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              Rupture
            </span>
          </div>
        )}
        {inStock && (
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#00B341]/90 backdrop-blur-sm text-white rounded-lg flex items-center gap-0.5"
            style={{ fontSize: 9, fontWeight: 700 }}
          >
            <Package className="w-2.5 h-2.5" /> En stock
          </div>
        )}
        <div
          className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-0.5"
          style={{ fontSize: 10, fontWeight: 600 }}
        >
          <Star className="w-2.5 h-2.5 fill-[#F0B429] text-[#F0B429]" />
          {rating}
        </div>
      </div>

      {/* Content — compact Alibaba style */}
      <div className="p-2 flex flex-col flex-1 gap-1">
        {/* Prix */}
        <div className="flex items-baseline gap-1">
          <span className="text-[#FF4400]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>
            {formatPrice(price)}
          </span>
          <span className="text-[#757575]" style={{ fontSize: 10 }}>/ {unit}</span>
        </div>

        {/* Titre 2 lignes */}
        <h4
          className="line-clamp-2 text-[#111827]"
          style={{ fontFamily: "Poppins", fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}
        >
          {name}
        </h4>

        {/* Ligne meta : MOQ + vendeur */}
        <div className="flex items-center justify-between text-[#757575] gap-1" style={{ fontSize: 10 }}>
          <span className="truncate">Min. {moq} {unit}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Star className="w-2.5 h-2.5 fill-[#FF6A00] text-[#FF6A00]" />
            {rating.toFixed(1)}
          </span>
        </div>

        {/* CTA compact */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.success(`${name} ajouté au panier !`);
          }}
          data-haptic="success"
          className={`w-full mt-auto py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors press-feedback ${
            inStock
              ? "bg-[#FF6A00] text-white hover:bg-[#FF4400]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          style={{ fontFamily: "Poppins", fontSize: 11, fontWeight: 700, minHeight: 30 }}
          disabled={!inStock}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Commander
        </button>
      </div>
    </motion.div>
  );
}
/* ────────────────────────────────────────────
   Image robuste : placeholder doux si src vide
   ou si l'URL distante (Unsplash, etc.) échoue.
   ──────────────────────────────────────────── */
function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const valid = typeof src === "string" && src.trim().length > 0;
  if (!valid || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] text-muted-foreground">
        <ImageOff className="w-6 h-6 opacity-60" />
        <span style={{ fontSize: 10, fontWeight: 600 }}>Image indisponible</span>
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
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
}
