/* ═══════════════════════════════════════════
   IPPOO - Admin serveur (Edge Function)
   Endpoints réservés aux emails listés dans IPPOO_ADMIN_EMAILS.
   ═══════════════════════════════════════════ */

import { apiFetch } from "../api/client";

/* ── Whoami (vérification serveur du rôle admin) ── */
export type WhoamiResult = { isAdmin: boolean; email: string | null; id: string };

export async function adminWhoami(): Promise<WhoamiResult> {
  return apiFetch<WhoamiResult>("/admin/whoami");
}

/* ── Escrow ── */
export type EscrowReleaseResult = { ok: true };

export async function releaseEscrow(orderId: string): Promise<EscrowReleaseResult> {
  return apiFetch<EscrowReleaseResult>("/admin/escrow/release", {
    method: "POST",
    body: { orderId },
  });
}

/* ── KYC ── */
export type KycPending = {
  userId?: string;
  status?: string;
  reason?: string;
  decidedAt?: number;
  decidedBy?: string;
};

export async function listPendingKyc(): Promise<KycPending[]> {
  const j = await apiFetch<{ items: KycPending[] }>("/admin/kyc/pending");
  return j.items ?? [];
}

export async function decideKyc(input: {
  userId: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<{ kyc: KycPending }> {
  return apiFetch<{ kyc: KycPending }>("/admin/kyc/decision", {
    method: "POST",
    body: input,
  });
}

/* ── Utilisateurs ── */
export type AdminUser = {
  id: string;
  email?: string;
  createdAt?: string;
  lastSignInAt?: string;
  emailConfirmed?: boolean;
  metadata?: Record<string, any>;
  isAdmin?: boolean;
  banned?: boolean;
};

export async function listAdminUsers(page = 1, perPage = 100): Promise<AdminUser[]> {
  const j = await apiFetch<{ users: AdminUser[] }>(`/admin/users?page=${page}&perPage=${perPage}`);
  return j.users ?? [];
}

export async function banUser(userId: string, hours = 168): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/users/ban", { method: "POST", body: { userId, hours } });
}

export async function unbanUser(userId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/users/unban", { method: "POST", body: { userId } });
}

/* ── Vendeurs ── */
export type AdminVendor = {
  ownerId?: string;
  name?: string;
  niche?: string;
  city?: string;
  email?: string;
  suspended?: boolean;
  shopStatus?: "open" | "vacation" | "closed";
  createdAt?: number;
  updatedAt?: number;
  description?: string;
};

export async function listAdminVendors(): Promise<AdminVendor[]> {
  const j = await apiFetch<{ items: AdminVendor[] }>("/admin/vendors");
  return j.items ?? [];
}

export async function suspendVendor(ownerId: string, suspended: boolean): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/vendors/suspend", { method: "POST", body: { ownerId, suspended } });
}

/* ── Produits ── */
export type AdminProduct = {
  id?: string | number;
  ownerId?: string;
  name?: string;
  price?: number;
  category?: string;
  stock?: number;
  hidden?: boolean;
  createdAt?: number;
  updatedAt?: number;
  image?: string;
};

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const j = await apiFetch<{ items: AdminProduct[] }>("/admin/products");
  return j.items ?? [];
}

export async function hideProduct(productId: string, hidden: boolean): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/products/hide", { method: "POST", body: { productId, hidden } });
}

/* ── Stats / KPI ── */
export type AdminStats = {
  users: number;
  vendors: number;
  products: number;
  orders: {
    total: number;
    last30: number;
    last7: number;
    gmvTotal: number;
    gmv30: number;
    gmv7: number;
  };
  escrow: { held: number; released: number; heldAmount: number };
  kyc: { pending: number; approved: number; rejected: number };
  generatedAt: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

/* ── Audit ── */
export type AuditEntry = {
  id: string;
  ts: number;
  adminId: string;
  adminEmail: string | null;
  action: string;
  meta?: any;
};

export async function listAuditLog(): Promise<AuditEntry[]> {
  const j = await apiFetch<{ items: AuditEntry[] }>("/admin/audit");
  return j.items ?? [];
}

/* ── Categories ── */
export type AdminCategoryServer = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  active: boolean;
  sortOrder: number;
};

export async function listAdminCategories(): Promise<AdminCategoryServer[]> {
  const j = await apiFetch<{ items: AdminCategoryServer[] }>("/admin/categories");
  return j.items ?? [];
}

export async function upsertAdminCategory(c: Partial<AdminCategoryServer> & { name: string }): Promise<AdminCategoryServer> {
  const j = await apiFetch<{ category: AdminCategoryServer }>("/admin/categories/upsert", { method: "POST", body: c });
  return j.category;
}

export async function deleteAdminCategory(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/categories/delete", { method: "POST", body: { id } });
}

/* ── Payouts ── */
export type AdminPayout = {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  method: string;
  status: "pending" | "processing" | "paid" | "failed";
  createdAt: number;
  updatedAt: number;
};

export async function listAdminPayouts(): Promise<AdminPayout[]> {
  const j = await apiFetch<{ items: AdminPayout[] }>("/admin/payouts");
  return j.items ?? [];
}

export async function createAdminPayout(input: { vendorId: string; vendorName?: string; amount: number; method?: string }): Promise<AdminPayout> {
  const j = await apiFetch<{ payout: AdminPayout }>("/admin/payouts/create", { method: "POST", body: input });
  return j.payout;
}

export async function setAdminPayoutStatus(id: string, status: AdminPayout["status"]): Promise<AdminPayout> {
  const j = await apiFetch<{ payout: AdminPayout }>("/admin/payouts/status", { method: "POST", body: { id, status } });
  return j.payout;
}

/* ── Plans ── */
export type AdminPlan = {
  id: string;
  label: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  active: boolean;
  updatedAt: number;
};

export async function listAdminPlans(): Promise<AdminPlan[]> {
  const j = await apiFetch<{ items: AdminPlan[] }>("/admin/plans");
  return j.items ?? [];
}

export async function upsertAdminPlan(p: Partial<AdminPlan> & { id: string; priceMonthly: number }): Promise<AdminPlan> {
  const j = await apiFetch<{ plan: AdminPlan }>("/admin/subscriptions/upsert-plan", { method: "POST", body: p });
  return j.plan;
}

/* ── Abonnés actifs ── */
export type AdminSubscription = {
  userId: string;
  userEmail: string | null;
  planId: string;
  label?: string;
  price: number;
  startedAt: number;
  expiresAt: number;
  autoRenew?: boolean;
  updatedAt?: number;
};

export async function listAdminSubscriptions(): Promise<AdminSubscription[]> {
  const j = await apiFetch<{ items: AdminSubscription[] }>("/admin/subscriptions");
  return j.items ?? [];
}

/* ── Reviews ── */
export type Review = {
  id: string;
  targetType: string;
  targetId: string;
  rating: number;
  comment: string;
  userId: string;
  userEmail: string | null;
  status: "active" | "hidden";
  createdAt: number;
};

export async function listReviews(targetType: string, targetId: string): Promise<Review[]> {
  const j = await apiFetch<{ items: Review[] }>(`/reviews/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`);
  return j.items ?? [];
}

export async function createReview(input: { targetType: string; targetId: string; rating: number; comment?: string }): Promise<Review> {
  const j = await apiFetch<{ review: Review }>("/reviews/create", { method: "POST", body: input });
  return j.review;
}

export async function listAdminReviews(): Promise<Review[]> {
  const j = await apiFetch<{ items: Review[] }>("/admin/reviews");
  return j.items ?? [];
}

export async function moderateReview(input: { targetType: string; targetId: string; id: string; action: "hide" | "show" | "delete" }): Promise<{ ok?: true; review?: Review }> {
  return apiFetch<{ ok?: true; review?: Review }>("/admin/reviews/moderate", { method: "POST", body: input });
}

/* ── Promos ── */
export type AdminPromo = {
  code: string;
  label: string;
  type: "percent" | "amount";
  value: number;
  minAmount: number;
  maxUses: number | null;
  uses: number;
  active: boolean;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export async function listAdminPromos(): Promise<AdminPromo[]> {
  const j = await apiFetch<{ items: AdminPromo[] }>("/admin/promos");
  return j.items ?? [];
}

export async function upsertAdminPromo(p: Partial<AdminPromo> & { code: string }): Promise<AdminPromo> {
  const j = await apiFetch<{ promo: AdminPromo }>("/admin/promos/upsert", { method: "POST", body: p });
  return j.promo;
}

export async function deleteAdminPromo(code: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/admin/promos/delete", { method: "POST", body: { code } });
}

export async function toggleAdminPromo(code: string): Promise<AdminPromo> {
  const j = await apiFetch<{ promo: AdminPromo }>("/admin/promos/toggle", { method: "POST", body: { code } });
  return j.promo;
}

/* ── Support tickets ── */
export type AdminTicket = {
  id: string;
  userId: string;
  userEmail: string | null;
  subject: string;
  message: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: number;
  updatedAt: number;
  replies: Array<{ at: number; from: "user" | "admin"; text: string }>;
};

export async function listAdminTickets(): Promise<AdminTicket[]> {
  const j = await apiFetch<{ items: AdminTicket[] }>("/admin/tickets");
  return j.items ?? [];
}

export async function updateAdminTicket(input: {
  id: string;
  status?: AdminTicket["status"];
  priority?: AdminTicket["priority"];
  reply?: string;
}): Promise<AdminTicket> {
  const j = await apiFetch<{ ticket: AdminTicket }>("/admin/tickets/update", { method: "POST", body: input });
  return j.ticket;
}

export async function createSupportTicket(input: { subject: string; message: string; category?: string }): Promise<AdminTicket> {
  const j = await apiFetch<{ ticket: AdminTicket }>("/support/tickets", { method: "POST", body: input });
  return j.ticket;
}
