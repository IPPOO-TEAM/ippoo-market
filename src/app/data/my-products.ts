/* ═══════════════════════════════════════════
   IPPOO - Produits du vendeur (store local)
   CRUD + persistance localStorage + abonnements
   (useSyncExternalStore). Indexé par shopSlug
   pour supporter plusieurs boutiques par compte.
   ═══════════════════════════════════════════ */

import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";
import { publishMyProduct as publishPublicProduct, unpublishMyProduct as unpublishPublicProduct } from "./public-products";

function syncPublicProduct(p: MyProduct): void {
  if (p.status === "published") {
    publishPublicProduct({
      id: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      moq: p.moq,
      category: p.category,
      image: p.images?.[0] ?? p.image,
      brand: p.brand,
      description: p.description,
      stockQty: p.stockQty,
      shopSlug: p.shopSlug,
    }).catch(() => undefined);
  } else {
    unpublishPublicProduct(p.id).catch(() => undefined);
  }
}

export type MyProductStatus = "draft" | "published" | "out_of_stock";

export type PriceTier = { qty: number; price: number };

export type MyProduct = {
  id: string;
  shopSlug: string;
  name: string;
  /** Description longue (markdown léger : retours à la ligne respectés). */
  description?: string;
  /** Points-clés / arguments commerciaux (1 par ligne dans l'UI). */
  highlights?: string[];
  price: number;
  /** Paliers dégressifs optionnels (gros / semi-gros). */
  paliers?: PriceTier[];
  moq: number;
  unit: string;
  stockQty: number;
  category?: string;
  /** Marque ou maison du produit. */
  brand?: string;
  /** Référence interne / SKU. */
  reference?: string;
  /** Pays / région d'origine. */
  origin?: string;
  /** Poids unitaire en kg (logistique). */
  weightKg?: number;
  /** Galerie d'images (data URLs). La première sert de visuel principal. */
  images?: string[];
  /** Vidéos de présentation (data URLs). */
  videos?: string[];
  /** @deprecated remplacé par images[0]. Conservé pour compat ancien stockage. */
  image?: string;
  status: MyProductStatus;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "ippoo:my-products";
const MOVEMENTS_KEY = "ippoo:my-movements";
const ORDERS_KEY = "ippoo:my-orders";
const INVOICES_KEY = "ippoo:my-invoices";

let items: MyProduct[] = [];
let movements: MyStockMovement[] = [];
let orders: MyOrder[] = [];
let invoices: MyInvoice[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
let snapshot = "[]";

export const SERVER_SNAPSHOT = "[]";

/* ─── Inventaire & ventes ─────────────────────────────── */

export type MovementReason = "sale" | "manual_in" | "manual_out" | "return" | "adjustment" | "initial";

export type MyStockMovement = {
  id: string;
  productId: string;
  shopSlug: string;
  delta: number;          // négatif = sortie, positif = entrée
  reason: MovementReason;
  note?: string;
  orderId?: string;
  ts: number;
};

export type PaymentMethod = "cash" | "mobile_money" | "card" | "wallet" | "transfer" | "credit";

export type MyOrder = {
  id: string;
  shopSlug: string;
  productId: string;
  productName: string;
  productRef?: string;
  productUid?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  buyerName?: string;
  buyerContact?: string;
  paymentMethod: PaymentMethod;
  source: "scan" | "manual" | "marketplace";
  status: "paid" | "pending" | "refunded";
  ts: number;
};

export type MyInvoice = {
  id: string;
  orderId: string;
  shopSlug: string;
  number: string;          // FAC-YYYYMMDD-XXXX
  productName: string;
  productRef?: string;
  productUid?: string;
  category?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  buyerName?: string;
  buyerContact?: string;
  paymentMethod: PaymentMethod;
  sellerShopSlug: string;
  sellerShopName?: string;
  ts: number;
};

function migrate(raw: unknown): MyProduct {
  const p = (raw ?? {}) as Record<string, unknown>;
  const isStr = (s: unknown): s is string => typeof s === "string" && s.length > 0;
  const images: string[] = Array.isArray(p.images)
    ? (p.images as unknown[]).filter(isStr)
    : (isStr(p.image) ? [p.image] : []);
  const videos: string[] = Array.isArray(p.videos)
    ? (p.videos as unknown[]).filter(isStr)
    : [];
  const highlights: string[] | undefined = Array.isArray(p.highlights)
    ? (p.highlights as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : undefined;
  const paliers: PriceTier[] | undefined = Array.isArray(p.paliers)
    ? (p.paliers as Array<{ qty?: unknown; price?: unknown }>)
        .map((t) => ({ qty: Number(t.qty) || 0, price: Number(t.price) || 0 }))
        .filter((t) => t.qty > 0 && t.price > 0)
        .sort((a, b) => a.qty - b.qty)
    : undefined;
  return {
    id: String(p.id),
    shopSlug: String(p.shopSlug),
    name: String(p.name ?? ""),
    description: p.description ? String(p.description) : undefined,
    highlights,
    price: Number(p.price) || 0,
    paliers,
    moq: Number(p.moq) || 1,
    unit: String(p.unit ?? "unité"),
    stockQty: Number(p.stockQty) || 0,
    category: p.category ? String(p.category) : undefined,
    brand: p.brand ? String(p.brand) : undefined,
    reference: p.reference ? String(p.reference) : undefined,
    origin: p.origin ? String(p.origin) : undefined,
    weightKg: typeof p.weightKg === "number" ? p.weightKg : (p.weightKg ? Number(p.weightKg) : undefined),
    images,
    videos,
    status: (p.status as MyProductStatus) ?? "draft",
    createdAt: Number(p.createdAt) || Date.now(),
    updatedAt: Number(p.updatedAt) || Date.now(),
  };
}

function emit() {
  scopedSetItem(STORAGE_KEY, JSON.stringify(items));
  scopedSetItem(MOVEMENTS_KEY, JSON.stringify(movements));
  scopedSetItem(ORDERS_KEY, JSON.stringify(orders));
  scopedSetItem(INVOICES_KEY, JSON.stringify(invoices));
  snapshot = JSON.stringify({ items, movements, orders, invoices });
  listeners.forEach((l) => l());
}

export function hydrateMyProducts() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (raw) items = (JSON.parse(raw) as unknown[]).map(migrate);
  } catch { items = []; }
  try {
    const raw = scopedGetItem(MOVEMENTS_KEY);
    if (raw) movements = JSON.parse(raw) as MyStockMovement[];
  } catch { movements = []; }
  try {
    const raw = scopedGetItem(ORDERS_KEY);
    if (raw) orders = JSON.parse(raw) as MyOrder[];
  } catch { orders = []; }
  try {
    const raw = scopedGetItem(INVOICES_KEY);
    if (raw) invoices = JSON.parse(raw) as MyInvoice[];
  } catch { invoices = []; }
  snapshot = JSON.stringify({ items, movements, orders, invoices });
  listeners.forEach((l) => l());
  // Republie en arrière-plan les produits déjà publiés afin que le
  // comparateur cross-utilisateurs voie immédiatement le catalogue vendeur.
  for (const p of items) {
    if (p.status === "published") syncPublicProduct(p);
  }
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getMyProductsSnapshot(): string {
  return snapshot;
}

export function listMyProducts(shopSlug: string): MyProduct[] {
  return items.filter((p) => p.shopSlug === shopSlug);
}

export function getMyProduct(id: string): MyProduct | undefined {
  return items.find((p) => p.id === id);
}

function newProductId(): string {
  const existing = new Set(items.map((p) => p.id));
  for (let i = 0; i < 8; i++) {
    const uid = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
    const id = `MP-${uid.replace(/-/g, "").slice(0, 22).toUpperCase()}`;
    if (!existing.has(id)) return id;
  }
  throw new Error("Impossible de générer un identifiant produit unique");
}

export function addMyProduct(input: Omit<MyProduct, "id" | "createdAt" | "updatedAt">): MyProduct {
  const now = Date.now();
  const p: MyProduct = {
    ...input,
    images: input.images ?? [],
    videos: input.videos ?? [],
    id: newProductId(),
    createdAt: now,
    updatedAt: now,
  };
  items = [p, ...items];
  emit();
  syncPublicProduct(p);
  return p;
}

export function updateMyProduct(id: string, patch: Partial<MyProduct>) {
  let updated: MyProduct | undefined;
  items = items.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...patch, updatedAt: Date.now() };
    return updated;
  });
  emit();
  if (updated) syncPublicProduct(updated);
}

export function deleteMyProduct(id: string) {
  items = items.filter((p) => p.id !== id);
  movements = movements.filter((m) => m.productId !== id);
  orders = orders.filter((o) => o.productId !== id);
  invoices = invoices.filter((inv) => inv.orderId.split(":")[0] !== id);
  emit();
  unpublishPublicProduct(id).catch(() => undefined);
}

/* ─── Mouvements de stock ─────────────────────────────── */

export function listMyMovements(shopSlug: string): MyStockMovement[] {
  return movements
    .filter((m) => m.shopSlug === shopSlug)
    .sort((a, b) => b.ts - a.ts);
}

export function listMyMovementsForProduct(productId: string): MyStockMovement[] {
  return movements
    .filter((m) => m.productId === productId)
    .sort((a, b) => b.ts - a.ts);
}

export function addStockMovement(input: Omit<MyStockMovement, "id" | "ts">): MyStockMovement {
  const now = Date.now();
  const mv: MyStockMovement = {
    ...input,
    id: `MV-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: now,
  };
  movements = [mv, ...movements];
  const product = items.find((p) => p.id === input.productId);
  if (product) {
    const nextStock = Math.max(0, product.stockQty + input.delta);
    items = items.map((p) =>
      p.id === product.id
        ? {
            ...p,
            stockQty: nextStock,
            status: nextStock === 0 && p.status === "published" ? "out_of_stock" : (nextStock > 0 && p.status === "out_of_stock" ? "published" : p.status),
            updatedAt: now,
          }
        : p,
    );
  }
  emit();
  return mv;
}

/* ─── Commandes & factures ────────────────────────────── */

export function listMyOrders(shopSlug: string): MyOrder[] {
  return orders.filter((o) => o.shopSlug === shopSlug).sort((a, b) => b.ts - a.ts);
}

export function listMyInvoices(shopSlug: string): MyInvoice[] {
  return invoices.filter((inv) => inv.shopSlug === shopSlug).sort((a, b) => b.ts - a.ts);
}

export function listAllInvoices(): MyInvoice[] {
  return invoices.slice().sort((a, b) => b.ts - a.ts);
}

export function listAllOrders(): MyOrder[] {
  return orders.slice().sort((a, b) => b.ts - a.ts);
}

export function listAllMovements(): MyStockMovement[] {
  return movements.slice().sort((a, b) => b.ts - a.ts);
}

export function getMyOrder(id: string): MyOrder | undefined {
  return orders.find((o) => o.id === id);
}

export function getMyInvoiceByOrder(orderId: string): MyInvoice | undefined {
  return invoices.find((inv) => inv.orderId === orderId);
}

function genInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FAC-${y}${m}${day}-${rand}`;
}

export type PurchaseInput = {
  productId: string;
  qty: number;
  paymentMethod?: PaymentMethod;
  buyerName?: string;
  buyerContact?: string;
  source?: "scan" | "manual" | "marketplace";
  shopName?: string;
  productUid?: string;
};

export type PurchaseResult = {
  order: MyOrder;
  invoice: MyInvoice;
  movement: MyStockMovement;
};

/**
 * Encaisse une vente : décrémente le stock, génère la commande,
 * la facture et le mouvement de stock en une seule opération.
 * Lève si le produit n'existe pas ou si le stock est insuffisant.
 */
export function purchaseMyProduct(input: PurchaseInput): PurchaseResult {
  const product = items.find((p) => p.id === input.productId);
  if (!product) throw new Error("Produit introuvable");
  if (input.qty <= 0) throw new Error("Quantité invalide");
  if (product.stockQty < input.qty) throw new Error(`Stock insuffisant (disponible : ${product.stockQty})`);

  const paliers = (product.paliers ?? []).slice().sort((a, b) => a.qty - b.qty);
  let unitPrice = product.price;
  for (const t of paliers) {
    if (input.qty >= t.qty) unitPrice = t.price;
  }
  const total = unitPrice * input.qty;
  const now = Date.now();
  const orderId = `ORD-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const order: MyOrder = {
    id: orderId,
    shopSlug: product.shopSlug,
    productId: product.id,
    productName: product.name,
    productRef: product.reference,
    productUid: input.productUid,
    qty: input.qty,
    unit: product.unit,
    unitPrice,
    total,
    buyerName: input.buyerName,
    buyerContact: input.buyerContact,
    paymentMethod: input.paymentMethod ?? "cash",
    source: input.source ?? "manual",
    status: "paid",
    ts: now,
  };
  const invoice: MyInvoice = {
    id: `INV-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orderId,
    shopSlug: product.shopSlug,
    number: genInvoiceNumber(),
    productName: product.name,
    productRef: product.reference,
    productUid: input.productUid,
    category: product.category,
    qty: input.qty,
    unit: product.unit,
    unitPrice,
    total,
    buyerName: input.buyerName,
    buyerContact: input.buyerContact,
    paymentMethod: order.paymentMethod,
    sellerShopSlug: product.shopSlug,
    sellerShopName: input.shopName,
    ts: now,
  };
  orders = [order, ...orders];
  invoices = [invoice, ...invoices];
  const movement: MyStockMovement = {
    id: `MV-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    productId: product.id,
    shopSlug: product.shopSlug,
    delta: -input.qty,
    reason: "sale",
    orderId,
    ts: now,
  };
  movements = [movement, ...movements];
  const nextStock = Math.max(0, product.stockQty - input.qty);
  items = items.map((p) =>
    p.id === product.id
      ? {
          ...p,
          stockQty: nextStock,
          status: nextStock === 0 && p.status === "published" ? "out_of_stock" : p.status,
          updatedAt: now,
        }
      : p,
  );
  emit();
  return { order, invoice, movement };
}

/**
 * Résout un UID QR vers un produit vendeur (toutes boutiques).
 * Compare le productUid (helper externe) et la référence brute.
 */
export function findMyProductByUid(
  uid: string,
  computeUid: (p: MyProduct) => string,
): MyProduct | undefined {
  const norm = uid.trim();
  return items.find((p) => computeUid(p) === norm || (p.reference && p.reference === norm));
}
