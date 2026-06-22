// Données simulées pour le back-office IPPOO Market.
// État persistant via localStorage, abonnements pour rafraîchir l'UI.
import { logAudit } from "./audit";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export type AdminVendor = {
  id: string;
  name: string;
  city: string;
  category: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "suspended" | "rejected";
  joined: number;
  revenue: number;
  rating: number;
  products: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  vendorId: string;
  vendor: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "out_of_stock" | "blocked";
  createdAt: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "vendor" | "admin" | "support";
  kyc: "verified" | "pending" | "missing";
  city: string;
  joined: number;
  totalSpent: number;
  status: "active" | "suspended";
};

export type AdminTicket = {
  id: string;
  subject: string;
  user: string;
  orderId?: string;
  category: "livraison" | "paiement" | "produit" | "compte" | "autre";
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: number;
  updatedAt: number;
};

export type AdminPromo = {
  code: string;
  rate: number;
  uses: number;
  maxUses: number;
  expiresAt: number;
  active: boolean;
  scope: "global" | "category" | "vendor";
};

export type AdminState = {
  vendors: AdminVendor[];
  products: AdminProduct[];
  users: AdminUser[];
  tickets: AdminTicket[];
  promos: AdminPromo[];
};

const KEY = "ippoo:admin";

function defaultState(): AdminState {
  return {
    vendors: [],
    products: [],
    users: [],
    tickets: [],
    promos: [],
  };
}

let state: AdminState = load();
const listeners = new Set<() => void>();

function load(): AdminState {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function persist() {
  safeSetItem(KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribeAdmin(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAdminState(): AdminState {
  return state;
}

/* ─── HYDRATION serveur ─── */
let hydrated = false;
let hydrating: Promise<void> | null = null;

export function hydrateAdmin(force = false): Promise<void> {
  if (hydrating) return hydrating;
  if (hydrated && !force) return Promise.resolve();
  hydrating = (async () => {
    try {
      const [
        { listAdminUsers, listAdminVendors, listAdminProducts, listAdminTickets, listAdminPromos },
      ] = await Promise.all([import("../data/admin-server")]);
      const [users, vendors, products, tickets, promos] = await Promise.all([
        listAdminUsers().catch(() => []),
        listAdminVendors().catch(() => []),
        listAdminProducts().catch(() => []),
        listAdminTickets().catch(() => []),
        listAdminPromos().catch(() => []),
      ]);
      state = {
        vendors: vendors.map((v: any): AdminVendor => ({
          id: v.ownerId || "",
          name: v.name || "-",
          city: v.city || "",
          category: v.niche || "",
          email: v.email || "",
          phone: "",
          status: v.suspended ? "suspended" : "approved",
          joined: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
          revenue: 0,
          rating: 0,
          products: 0,
        })),
        products: products.map((p: any): AdminProduct => ({
          id: String(p.id ?? ""),
          name: p.name || "-",
          vendorId: p.ownerId || "",
          vendor: p.ownerId || "",
          category: p.category || "",
          price: Number(p.price || 0),
          stock: Number(p.stock || 0),
          status: p.hidden ? "blocked" : (p.stock === 0 ? "out_of_stock" : "active"),
          createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
        })),
        users: users.map((u: any): AdminUser => ({
          id: u.id,
          name: (u.metadata?.name as string) || (u.email ? u.email.split("@")[0] : "-"),
          email: u.email || "",
          phone: "",
          role: u.isAdmin ? "admin" : "buyer",
          kyc: "missing",
          city: "",
          joined: u.createdAt ? new Date(u.createdAt).getTime() : Date.now(),
          totalSpent: 0,
          status: u.banned ? "suspended" : "active",
        })),
        tickets: tickets.map((t: any): AdminTicket => ({
          id: t.id,
          subject: t.subject || "-",
          user: t.userEmail || t.userId || "-",
          orderId: undefined,
          category: (t.category as AdminTicket["category"]) || "autre",
          priority: t.priority || "normal",
          status: t.status || "open",
          createdAt: t.createdAt || Date.now(),
          updatedAt: t.updatedAt || Date.now(),
        })),
        promos: promos.map((p: any): AdminPromo => ({
          code: p.code,
          rate: p.type === "percent" ? Number(p.value || 0) / 100 : 0,
          uses: Number(p.uses || 0),
          maxUses: Number(p.maxUses || 0),
          expiresAt: p.expiresAt || 0,
          active: !!p.active,
          scope: "global",
        })),
      };
      hydrated = true;
      emit();
    } catch {
      /* keep cached state */
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

/* ─── VENDORS ─── */
export function setVendorStatus(id: string, status: AdminVendor["status"]) {
  const v = state.vendors.find((x) => x.id === id);
  state.vendors = state.vendors.map((v) => (v.id === id ? { ...v, status } : v));
  emit();
  if (v) logAudit("vendor.status", v.name, { id, status });
}

/* ─── PRODUCTS ─── */
export function createProduct(p: Omit<AdminProduct, "id" | "createdAt"> & { id?: string }): AdminProduct {
  const id = p.id || `P${Date.now().toString().slice(-6)}`;
  const product: AdminProduct = { ...p, id, createdAt: Date.now() };
  state.products = [product, ...state.products];
  emit();
  logAudit("product.create", product.name, { id, vendor: product.vendor, price: product.price });
  return product;
}

export function updateProduct(id: string, patch: Partial<AdminProduct>) {
  const before = state.products.find((p) => p.id === id);
  state.products = state.products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
  if (before) logAudit("product.update", before.name, { id, fields: Object.keys(patch).join(",") });
}

export function setProductStatus(id: string, status: AdminProduct["status"]) {
  const p = state.products.find((x) => x.id === id);
  state.products = state.products.map((p) => (p.id === id ? { ...p, status } : p));
  emit();
  if (p) logAudit("product.status", p.name, { id, status });
}

export function deleteProduct(id: string) {
  const p = state.products.find((x) => x.id === id);
  state.products = state.products.filter((p) => p.id !== id);
  emit();
  if (p) logAudit("product.delete", p.name, { id });
}

/* ─── USERS ─── */
export function setUserStatus(id: string, status: AdminUser["status"]) {
  const u = state.users.find((x) => x.id === id);
  state.users = state.users.map((u) => (u.id === id ? { ...u, status } : u));
  emit();
  if (u) logAudit("user.status", u.name, { id, status });
}

export function setUserKyc(id: string, kyc: AdminUser["kyc"]) {
  const u = state.users.find((x) => x.id === id);
  state.users = state.users.map((u) => (u.id === id ? { ...u, kyc } : u));
  emit();
  if (u) logAudit("user.kyc", u.name, { id, kyc });
}

/* ─── TICKETS ─── */
export function setTicketStatus(id: string, status: AdminTicket["status"]) {
  const t = state.tickets.find((x) => x.id === id);
  state.tickets = state.tickets.map((t) => (t.id === id ? { ...t, status, updatedAt: Date.now() } : t));
  emit();
  if (t) logAudit("ticket.status", t.subject, { id, status });
}

export function setTicketPriority(id: string, priority: AdminTicket["priority"]) {
  const t = state.tickets.find((x) => x.id === id);
  state.tickets = state.tickets.map((t) => (t.id === id ? { ...t, priority, updatedAt: Date.now() } : t));
  emit();
  if (t) logAudit("ticket.priority", t.subject, { id, priority });
}

/* ─── PROMOS ─── */
export function togglePromo(code: string) {
  const p = state.promos.find((x) => x.code === code);
  state.promos = state.promos.map((p) => (p.code === code ? { ...p, active: !p.active } : p));
  emit();
  if (p) logAudit("promo.toggle", code, { active: !p.active });
}

export function deletePromo(code: string) {
  state.promos = state.promos.filter((p) => p.code !== code);
  emit();
  logAudit("promo.delete", code);
}

export function createPromo(promo: AdminPromo): { ok: true } | { ok: false; error: string } {
  if (!/^[A-Z0-9]{3,16}$/.test(promo.code)) return { ok: false, error: "Code invalide (3-16 lettres/chiffres)" };
  if (state.promos.some((p) => p.code === promo.code)) return { ok: false, error: "Ce code existe déjà" };
  if (promo.rate <= 0 || promo.rate > 0.9) return { ok: false, error: "Taux invalide (0-90%)" };
  state.promos = [promo, ...state.promos];
  emit();
  logAudit("promo.create", promo.code, { rate: promo.rate, scope: promo.scope });
  return { ok: true };
}
