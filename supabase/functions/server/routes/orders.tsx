import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import {
  PREFIX, requireUser, requireAdmin, getBalance, creditWallet,
  auditLog, sendToUser, logSafe, isAdminEmail, rateLimit, getCommissionRate,
  getPlatformSettings,
} from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const T_ORDERS = "orders";
const T_ITEMS = "order_items";
const T_ESCROWS = "escrows";

const OrderItemSchema = z.object({
  productId: z.string().min(1).max(80),
  vendorId: z.string().min(1).max(120),
  title: z.string().max(200),
  unitPrice: z.number().int().min(0).max(50_000_000),
  qty: z.number().int().min(1).max(999),
});
const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  shippingAddress: z.object({
    name: z.string().max(120),
    phone: z.string().max(40),
    city: z.string().max(80),
    line1: z.string().max(200),
    line2: z.string().max(200).optional(),
  }),
  paymentMethod: z.enum(["wallet", "cod", "card", "mobile-money"]),
  mobileProvider: z.enum(["mtn", "moov", "orange", "wave", "celtis"]).optional(),
  currency: z.string().max(8).optional(),
});

function newOrderId(): string {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `ORD-${Date.now().toString(36).toUpperCase()}-${hex.toUpperCase()}`;
}

const OrderStatusSchema = z.object({
  orderId: z.string().min(4).max(80),
  userId: z.string().uuid().optional(),
  status: z.enum(["preparation", "expedition", "livree", "cloturee", "litige", "annulee", "pending"]),
});

const EscrowReleaseSchema = z.object({ orderId: z.string().min(4).max(80) });

// ─── Mapping ligne SQL ↔ objet métier (forme identique au KV) ───
function orderFromRow(r: any): any {
  return {
    id: r.id,
    userId: r.user_id,
    items: r.items ?? [],
    shippingAddress: r.shipping_address ?? {},
    paymentMethod: r.payment_method,
    mobileProvider: r.mobile_provider ?? undefined,
    currency: r.currency ?? "XOF",
    vat: Number(r.vat ?? 0),
    invoiceNumber: r.invoice_number ?? undefined,
    total: Number(r.total),
    commission: Number(r.commission),
    vendorShares: r.vendor_shares ?? {},
    status: r.status,
    escrowStatus: r.escrow_status,
    createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  };
}
function orderToRow(o: any) {
  return {
    id: o.id,
    user_id: o.userId,
    shipping_address: o.shippingAddress ?? {},
    payment_method: o.paymentMethod,
    mobile_provider: o.mobileProvider ?? null,
    currency: o.currency ?? "XOF",
    vat: o.vat ?? 0,
    invoice_number: o.invoiceNumber ?? null,
    total: o.total ?? 0,
    commission: o.commission ?? 0,
    vendor_shares: o.vendorShares ?? {},
    items: o.items ?? [],
    status: o.status,
    escrow_status: o.escrowStatus,
    created_at: new Date(o.createdAt).toISOString(),
    updated_at: new Date(o.updatedAt).toISOString(),
  };
}
function escrowFromRow(r: any): any {
  return {
    orderId: r.order_id,
    userId: r.user_id,
    vendorShares: r.vendor_shares ?? {},
    total: Number(r.total),
    status: r.status,
    at: r.created_at ? Date.parse(r.created_at) : Date.now(),
    releasedAt: r.released_at ? Date.parse(r.released_at) : undefined,
  };
}

// ─── Accès données : table si dispo, sinon KV ───────────────────
async function ordersReady() { return await tableReady(T_ORDERS); }
async function escrowsReady() { return await tableReady(T_ESCROWS); }

async function saveNewOrder(order: any): Promise<void> {
  if (await ordersReady()) {
    const { error } = await supabase.from(T_ORDERS).upsert(orderToRow(order));
    if (error) { console.log(`orders insert error: ${error.message}`); }
    const rows = (order.items as any[]).map((it) => ({
      order_id: order.id, product_id: it.productId, vendor_id: it.vendorId,
      title: it.title ?? "", unit_price: it.unitPrice ?? 0, qty: it.qty ?? 1,
    }));
    if (rows.length) {
      const { error: e2 } = await supabase.from(T_ITEMS).insert(rows);
      if (e2) console.log(`order_items insert error: ${e2.message}`);
    }
    return;
  }
  await kv.set(`order:${order.userId}:${order.id}`, order);
  for (const vendorId of Object.keys(order.vendorShares ?? {})) {
    await kv.set(`order-by-vendor:${vendorId}:${order.id}`, {
      orderId: order.id, userId: order.userId, share: order.vendorShares[vendorId], at: order.createdAt,
    });
  }
}

async function saveOrder(order: any): Promise<void> {
  if (await ordersReady()) {
    const { error } = await supabase.from(T_ORDERS).upsert(orderToRow(order));
    if (error) console.log(`orders update error: ${error.message}`);
    return;
  }
  await kv.set(`order:${order.userId}:${order.id}`, order);
}

async function getOrder(userId: string, orderId: string): Promise<any | null> {
  if (await ordersReady()) {
    const { data } = await supabase.from(T_ORDERS).select("*").eq("id", orderId).maybeSingle();
    if (!data) return null;
    if (userId && data.user_id !== userId) return null;
    return orderFromRow(data);
  }
  return (await kv.get(`order:${userId}:${orderId}`)) ?? null;
}

async function getOrderById(orderId: string): Promise<any | null> {
  if (await ordersReady()) {
    const { data } = await supabase.from(T_ORDERS).select("*").eq("id", orderId).maybeSingle();
    return data ? orderFromRow(data) : null;
  }
  // KV : on ignore l'userId via un balayage (rare, chemin de repli).
  const all = (await kv.getByPrefix("order:")) ?? [];
  return all.find((o: any) => o?.id === orderId) ?? null;
}

async function listUserOrders(userId: string): Promise<any[]> {
  if (await ordersReady()) {
    const { data } = await supabase.from(T_ORDERS).select("*").eq("user_id", userId);
    return (data ?? []).map(orderFromRow);
  }
  return (await kv.getByPrefix(`order:${userId}:`)) ?? [];
}

async function listAllOrders(): Promise<any[]> {
  if (await ordersReady()) {
    const { data } = await supabase.from(T_ORDERS).select("*");
    return (data ?? []).map(orderFromRow);
  }
  return (await kv.getByPrefix("order:")) ?? [];
}

async function listVendorOrders(vendorId: string): Promise<any[]> {
  if (await ordersReady()) {
    const { data: links } = await supabase.from(T_ITEMS).select("order_id").eq("vendor_id", vendorId);
    const ids = Array.from(new Set((links ?? []).map((l: any) => l.order_id)));
    if (ids.length === 0) return [];
    const { data } = await supabase.from(T_ORDERS).select("*").in("id", ids);
    return (data ?? []).map(orderFromRow).map((o: any) => ({
      ...o,
      items: (o.items as any[]).filter((it) => it.vendorId === vendorId),
      vendorShare: (o.vendorShares ?? {})[vendorId] ?? 0,
    }));
  }
  const idx = (await kv.getByPrefix(`order-by-vendor:${vendorId}:`)) ?? [];
  const orders = await Promise.all(idx.map(async (i: any) => {
    const o = await kv.get(`order:${i.userId}:${i.orderId}`);
    if (!o) return null;
    return { ...o, items: (o.items as any[]).filter((it) => it.vendorId === vendorId), vendorShare: i.share };
  }));
  return orders.filter(Boolean);
}

async function saveEscrow(esc: any): Promise<void> {
  if (await escrowsReady()) {
    const row: any = {
      order_id: esc.orderId, user_id: esc.userId, vendor_shares: esc.vendorShares ?? {},
      total: esc.total ?? 0, status: esc.status,
      released_at: esc.releasedAt ? new Date(esc.releasedAt).toISOString() : null,
    };
    if (esc.at) row.created_at = new Date(esc.at).toISOString();
    const { error } = await supabase.from(T_ESCROWS).upsert(row);
    if (error) console.log(`escrows upsert error: ${error.message}`);
    return;
  }
  await kv.set(`escrow:${esc.orderId}`, esc);
}

async function getEscrow(orderId: string): Promise<any | null> {
  if (await escrowsReady()) {
    const { data } = await supabase.from(T_ESCROWS).select("*").eq("order_id", orderId).maybeSingle();
    return data ? escrowFromRow(data) : null;
  }
  return (await kv.get(`escrow:${orderId}`)) ?? null;
}

async function listHeldEscrows(): Promise<any[]> {
  if (await escrowsReady()) {
    const { data } = await supabase.from(T_ESCROWS).select("*").eq("status", "held");
    return (data ?? []).map(escrowFromRow);
  }
  const all = (await kv.getByPrefix("escrow:")) ?? [];
  return all.filter((e: any) => e?.status === "held");
}

export function registerOrders(app: any) {
  app.get(`${PREFIX}/orders`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = await listUserOrders(auth.id);
    return c.json({ items });
  });

  app.post(`${PREFIX}/orders`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(`order:${auth.id}`, 10, 60_000)) return c.json({ error: "Trop de commandes" }, 429);
    const parsed = OrderCreateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Commande invalide", details: parsed.error.flatten() }, 400);
    const { items, shippingAddress, paymentMethod, mobileProvider, currency } = parsed.data;
    const total = items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
    if (total <= 0) return c.json({ error: "Total invalide" }, 400);

    const settings = await getPlatformSettings();
    const expectedCurrency = settings.defaultCurrency || "XOF";
    if (currency && currency !== expectedCurrency) {
      return c.json({ error: `Devise invalide (attendue: ${expectedCurrency})` }, 400);
    }
    if (paymentMethod === "mobile-money" && !mobileProvider) {
      return c.json({ error: "Opérateur mobile money requis" }, 400);
    }

    if (paymentMethod === "wallet") {
      const balance = await getBalance(auth.id);
      if (balance < total) return c.json({ error: "Solde insuffisant", balance }, 402);
      await creditWallet(auth.id, -total, "order:debit", {});
    }

    const commissionRate = await getCommissionRate();
    const vendorShares: Record<string, number> = {};
    for (const it of items) {
      const gross = it.unitPrice * it.qty;
      const net = Math.round(gross * (1 - commissionRate));
      vendorShares[it.vendorId] = (vendorShares[it.vendorId] ?? 0) + net;
    }

    // TVA incluse dans le total (formule inversée), recalculée serveur — source de vérité.
    const vatPct = Number(settings.vatRate) || 0;
    const vat = vatPct > 0 ? Math.round((total * vatPct) / (100 + vatPct)) : 0;

    const orderId = newOrderId();
    const now = Date.now();
    const order = {
      id: orderId,
      userId: auth.id,
      items, shippingAddress, paymentMethod,
      mobileProvider: paymentMethod === "mobile-money" ? mobileProvider : undefined,
      currency: expectedCurrency,
      vat,
      total,
      commission: total - Object.values(vendorShares).reduce((a, b) => a + b, 0),
      vendorShares,
      status: "pending" as const,
      escrowStatus: "held" as const,
      createdAt: now, updatedAt: now,
    };
    await saveNewOrder(order);
    await saveEscrow({ orderId, userId: auth.id, vendorShares, total, status: "held", at: now });
    console.log(`order:created id=${orderId} ${await logSafe("user", auth.id)} total=${total}`);
    // Push de confirmation (fire-and-forget)
    sendToUser(auth.id, {
      title: "Commande confirmée",
      body: `Votre commande ${orderId} a été enregistrée (${total.toLocaleString("fr-FR")} FCFA).`,
      link: `/commandes/${orderId}`,
      tag: `order-${orderId}`,
      priority: "high",
    }).catch(() => { /* ignore */ });
    return c.json({ ok: true, order });
  });

  app.get(`${PREFIX}/orders/:orderId`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const order = await getOrder(auth.id, c.req.param("orderId"));
    if (!order) return c.json({ error: "Commande introuvable" }, 404);
    return c.json({ order });
  });

  app.get(`${PREFIX}/vendor/orders`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = (await listVendorOrders(auth.id)).sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items });
  });

  // ── Numéros de facture séquentiels (atomiques côté serveur) ──
  app.post(`${PREFIX}/invoices/number`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const scope = String(body?.scope || "").trim().slice(0, 80);
    const orderId = String(body?.orderId || "").trim().slice(0, 80);
    if (!scope) return c.json({ error: "scope requis" }, 400);
    // Si la commande a déjà un numéro, le retourner (idempotence).
    if (orderId) {
      const existing = await getOrderById(orderId);
      if (existing?.invoiceNumber) return c.json({ number: existing.invoiceNumber });
    }
    const year = new Date().getFullYear();
    const key = `invoice-seq:${scope}:${year}`;
    let seq = 1;
    if (await tableReady("invoice_sequences")) {
      const { data } = await supabase.from("invoice_sequences").select("next_seq").eq("scope", key).maybeSingle();
      seq = Number(data?.next_seq ?? 1);
      await supabase.from("invoice_sequences").upsert({ scope: key, next_seq: seq + 1, updated_at: new Date().toISOString() });
    } else {
      const cur = Number(await kv.get(key) || 0) + 1;
      await kv.set(key, cur);
      seq = cur;
    }
    const number = `${scope.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 12)}-${year}-${String(seq).padStart(5, "0")}`;
    if (orderId) {
      const order = await getOrderById(orderId);
      if (order && order.userId === auth.id) {
        order.invoiceNumber = number;
        order.updatedAt = Date.now();
        await saveOrder(order);
      }
    }
    return c.json({ number });
  });

  // ── Admin: liste de toutes les commandes ──
  app.get(`${PREFIX}/admin/orders`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = (await listAllOrders()).sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items });
  });

  // ── Mise à jour du statut d'une commande ──
  app.post(`${PREFIX}/orders/status`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = OrderStatusSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
    const isAdmin = isAdminEmail(auth.email);
    const userId = parsed.data.userId || auth.id;
    let order: any = await getOrder(userId, parsed.data.orderId);
    if (!order) order = await getOrderById(parsed.data.orderId);
    if (!order) return c.json({ error: "Commande introuvable" }, 404);
    const isOwner = order.userId === auth.id;
    const isVendor = !!order.vendorShares && Object.keys(order.vendorShares).includes(auth.id);
    if (!isAdmin && !isVendor && !isOwner) return c.json({ error: "Accès refusé" }, 403);
    if (!isAdmin && !isVendor && parsed.data.status !== "annulee") {
      return c.json({ error: "Acheteur peut seulement annuler" }, 403);
    }
    order.status = parsed.data.status;
    order.updatedAt = Date.now();
    await saveOrder(order);
    if (isAdmin) {
      await auditLog(auth.id, auth.email, "order.status", { orderId: parsed.data.orderId, status: parsed.data.status });
    }
    sendToUser(order.userId, {
      title: "Commande mise à jour",
      body: `Votre commande ${parsed.data.orderId} est maintenant: ${parsed.data.status}.`,
      link: `/commandes/${parsed.data.orderId}`,
      tag: `order-${parsed.data.orderId}`,
    }).catch(() => {});
    return c.json({ ok: true, order });
  });

  // ── Admin: escrow ──
  app.get(`${PREFIX}/admin/escrow/held`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = await listHeldEscrows();
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/escrow/release`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = EscrowReleaseSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "orderId requis" }, 400);
    const esc = await getEscrow(parsed.data.orderId);
    if (!esc) return c.json({ error: "Escrow introuvable" }, 404);
    if (esc.status !== "held") return c.json({ error: `Escrow déjà ${esc.status}` }, 409);
    for (const [vendorId, share] of Object.entries(esc.vendorShares as Record<string, number>)) {
      await creditWallet(vendorId, share, "escrow:release", { orderId: esc.orderId });
    }
    esc.status = "released";
    esc.releasedAt = Date.now();
    await saveEscrow(esc);
    const order = await getOrder(esc.userId, esc.orderId);
    if (order) {
      order.escrowStatus = "released";
      order.status = "completed";
      order.updatedAt = Date.now();
      await saveOrder(order);
    }
    await auditLog(auth.id, auth.email, "escrow.release", { orderId: esc.orderId, total: Object.values(esc.vendorShares as Record<string, number>).reduce((a, b) => a + b, 0) });
    return c.json({ ok: true });
  });

  // ── Backfill admin : copie des commandes & escrows KV vers les tables ──
  app.post(`${PREFIX}/admin/migrate/orders`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache(T_ORDERS); resetTableCache(T_ITEMS); resetTableCache(T_ESCROWS);
    if (!(await ordersReady()) || !(await escrowsReady())) {
      return c.json({ error: "Tables orders/escrows absentes : appliquez d'abord la migration 0002." }, 409);
    }
    const orders = (await kv.getByPrefix("order:")) ?? [];
    let migratedOrders = 0, migratedItems = 0, migratedEscrows = 0;
    for (const o of orders) {
      if (!o?.id) continue;
      const { error } = await supabase.from(T_ORDERS).upsert(orderToRow(o));
      if (error) { console.log(`migrate order ${o.id}: ${error.message}`); continue; }
      migratedOrders++;
      const rows = (o.items as any[] ?? []).map((it) => ({
        order_id: o.id, product_id: it.productId, vendor_id: it.vendorId,
        title: it.title ?? "", unit_price: it.unitPrice ?? 0, qty: it.qty ?? 1,
      }));
      if (rows.length) {
        await supabase.from(T_ITEMS).delete().eq("order_id", o.id);
        const { error: e2 } = await supabase.from(T_ITEMS).insert(rows);
        if (!e2) migratedItems += rows.length;
      }
    }
    const escrows = (await kv.getByPrefix("escrow:")) ?? [];
    for (const e of escrows) {
      if (!e?.orderId) continue;
      await saveEscrow(e);
      migratedEscrows++;
    }
    return c.json({ ok: true, migratedOrders, migratedItems, migratedEscrows });
  });
}
