/* ═══════════════════════════════════════════
   IPPOO - Adaptateur Storefront
   Convertit les produits/vendeurs publiés côté serveur
   (PublicProduct / PublicVendor) vers le format utilisé
   par les pages du storefront (mock-data shape).
   Permet de fusionner catalogue serveur + données mock
   en attendant la migration complète.
   ═══════════════════════════════════════════ */

import { useEffect, useSyncExternalStore } from "react";
import {
  PublicProduct,
  getPublicProducts,
  subscribePublicProducts,
  refreshPublicProducts,
  hashProductIdToNumber,
} from "./public-products";
import {
  PublicVendor,
  getPublicVendors,
  subscribePublicVendors,
  refreshPublicVendors,
} from "./public-vendors";
import { IMAGES } from "../components/mock-data-images";

export type StorefrontProduct = {
  id: number;
  serverId: string;
  ownerId: string;
  name: string;
  image: string;
  price: number;
  moq: number;
  unit: string;
  seller: string;
  rating: number;
  category: string;
  inStock: boolean;
  paliers?: Array<{ qty: number; price: number }>;
  shopId?: string;
  vendorId?: string;
  catalogId?: string;
  brand?: string;
  description?: string;
  stockQty?: number;
};

export type StorefrontVendor = {
  id: number;
  ownerId: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  orders: number;
  deliveryRate: number;
  badge: string;
  location: string;
};

function fallbackImage(category?: string): string {
  const map: Record<string, string> = {
    "Alimentaire": IMAGES.riceBags,
    "Boissons": IMAGES.palmOil,
    "Hygiène": IMAGES.hygiene,
    "Textile": IMAGES.textile,
    "Électronique": IMAGES.electronics,
  };
  return (category && map[category]) || IMAGES.market;
}

export function publicProductToStorefront(p: PublicProduct, vendorName?: string): StorefrontProduct {
  return {
    id: hashProductIdToNumber(p.id),
    serverId: p.id,
    ownerId: p.ownerId,
    name: p.name,
    image: p.image || fallbackImage(p.category),
    price: p.price,
    moq: p.moq ?? 1,
    unit: p.unit || "pièce",
    seller: vendorName || p.shopSlug || "Vendeur",
    rating: 4.5,
    category: p.category || "Divers",
    inStock: (p.stockQty ?? 1) > 0,
    shopId: p.shopSlug,
    vendorId: p.ownerId,
    brand: p.brand,
    description: p.description,
    stockQty: p.stockQty,
  };
}

export function publicVendorToStorefront(v: PublicVendor): StorefrontVendor {
  const id = Math.abs(hashProductIdToNumber(v.ownerId ?? v.name));
  return {
    id,
    ownerId: v.ownerId ?? "",
    name: v.name,
    avatar: v.avatar || v.logo || IMAGES.marketVendor,
    category: v.niche || "Divers",
    rating: 4.6,
    orders: 0,
    deliveryRate: 95,
    badge: "NOUVEAU",
    location: v.city || "Cotonou",
  };
}

/* ─── Hooks ─── */

export function useStorefrontProducts(): StorefrontProduct[] {
  useEffect(() => { void refreshPublicProducts(); void refreshPublicVendors(); }, []);
  const products = useSyncExternalStore(subscribePublicProducts, getPublicProducts, getPublicProducts);
  const vendors = useSyncExternalStore(subscribePublicVendors, getPublicVendors, getPublicVendors);
  const vendorByOwner = new Map(vendors.map((v) => [v.ownerId, v.name] as const));
  return products.map((p) => publicProductToStorefront(p, vendorByOwner.get(p.ownerId)));
}

export function useStorefrontVendors(): StorefrontVendor[] {
  useEffect(() => { void refreshPublicVendors(); }, []);
  const vendors = useSyncExternalStore(subscribePublicVendors, getPublicVendors, getPublicVendors);
  return vendors.map(publicVendorToStorefront);
}
