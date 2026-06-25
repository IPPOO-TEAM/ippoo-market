import * as kv from "../kv_store.tsx";
import {
  PREFIX, supabase, requireAdmin, auditLog, isAdminEmail,
  ADMIN_PASSWORD, issueAdminToken, verifyAdminToken,
  rateLimit, clientKey, ADMIN_TOKEN_TTL_MS,
} from "../_shared.tsx";
import { tableReady, resetTableCache } from "../_db.tsx";

// ─── Helpers table-aware pour les stats (orders/escrows/kyc migrés) ──
async function loadOrdersForStats(): Promise<any[]> {
  if (await tableReady("orders")) {
    const { data } = await supabase.from("orders").select("total,status,created_at");
    return (data ?? []).map((r: any) => ({ total: Number(r.total), status: r.status, createdAt: r.created_at ? Date.parse(r.created_at) : 0 }));
  }
  return (await kv.getByPrefix("order:")) ?? [];
}
async function loadEscrowsForStats(): Promise<any[]> {
  if (await tableReady("escrows")) {
    const { data } = await supabase.from("escrows").select("total,status");
    return (data ?? []).map((r: any) => ({ total: Number(r.total), status: r.status }));
  }
  return (await kv.getByPrefix("escrow:")) ?? [];
}
async function loadKycForStats(): Promise<any[]> {
  if (await tableReady("kyc")) {
    const { data } = await supabase.from("kyc").select("status");
    return data ?? [];
  }
  return (await kv.getByPrefix("kyc:")) ?? [];
}

export function registerAdmin(app: any) {
  /* ── Login admin AUTONOME (email+password serveur) ──
     POST /admin/login { email, password }
     → 200 { token, email, expiresAt } si email ∈ IPPOO_ADMIN_EMAILS et
       password === IPPOO_ADMIN_PASSWORD.
     → 401 sinon. Rate-limit 5 tentatives/min/IP. */
  app.post(`${PREFIX}/admin/login`, async (c: any) => {
    if (!rateLimit(clientKey(c, "admin-login"), 5, 60_000)) {
      return c.json({ error: "Trop de tentatives, patientez une minute." }, 429);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      if (!email || !password) return c.json({ error: "Email et mot de passe requis" }, 400);
      if (!isAdminEmail(email)) return c.json({ error: "Identifiants invalides" }, 401);
      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return c.json({ error: "Identifiants invalides" }, 401);
      }
      const token = await issueAdminToken(email);
      await auditLog(`admin:${email}`, email, "admin.login");
      return c.json({ token, email, expiresAt: Date.now() + ADMIN_TOKEN_TTL_MS });
    } catch (e) {
      console.log(`admin/login exception: ${e}`);
      return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  /* ── whoami : valide le token admin courant ── */
  app.get(`${PREFIX}/admin/whoami`, async (c: any) => {
    const token = c.req.header("x-admin-token") || c.req.header("X-Admin-Token") ||
                  c.req.header("Authorization")?.split(" ")[1];
    const email = await verifyAdminToken(token);
    if (!email) return c.json({ isAdmin: false, email: null }, 401);
    return c.json({ isAdmin: true, email, id: `admin:${email}` });
  });

  /* ── logout (best-effort, le token est auto-portant donc côté client) ── */
  app.post(`${PREFIX}/admin/logout`, async (c: any) => {
    const token = c.req.header("x-admin-token") || c.req.header("Authorization")?.split(" ")[1];
    const email = await verifyAdminToken(token);
    if (email) await auditLog(`admin:${email}`, email, "admin.logout");
    return c.json({ ok: true });
  });

  // ── Liste utilisateurs (Supabase Auth) ──
  app.get(`${PREFIX}/admin/users`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const perPage = Math.min(200, parseInt(c.req.query("perPage") || "100"));
    try {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
      const users = (data?.users ?? []).map((u: any) => ({
        id: u.id, email: u.email, createdAt: u.created_at, lastSignInAt: u.last_sign_in_at,
        emailConfirmed: !!u.email_confirmed_at, metadata: u.user_metadata ?? {}, isAdmin: isAdminEmail(u.email),
      }));
      await auditLog(auth.id, auth.email, "users.list", { page, perPage, count: users.length });
      return c.json({ users, page, perPage });
    } catch (e: any) {
      console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  app.post(`${PREFIX}/admin/users/ban`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({}));
    const userId = String(body.userId || "");
    const banDurationHours = Math.max(1, Math.min(24 * 365, parseInt(body.hours || "168")));
    if (!userId) return c.json({ error: "userId requis" }, 400);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: `${banDurationHours}h` } as any);
      if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
      await auditLog(auth.id, auth.email, "users.ban", { userId, hours: banDurationHours });
      return c.json({ ok: true });
    } catch (e: any) {
      console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  app.post(`${PREFIX}/admin/users/unban`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({}));
    const userId = String(body.userId || "");
    if (!userId) return c.json({ error: "userId requis" }, 400);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" } as any);
      if (error) { console.log(`admin route supabase error: ${error.message}`); return c.json({ error: "Erreur serveur" }, 500); }
      await auditLog(auth.id, auth.email, "users.unban", { userId });
      return c.json({ ok: true });
    } catch (e: any) {
      console.log(`admin route exception: ${e}`); return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  // ── Vendeurs (overlay modération, KV `vendor:`) ──
  app.get(`${PREFIX}/admin/vendors`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = (await kv.getByPrefix("vendor:")) ?? [];
    await auditLog(auth.id, auth.email, "vendors.list", { count: items.length });
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/vendors/suspend`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({}));
    const ownerId = String(body.ownerId || "");
    const suspended = !!body.suspended;
    if (!ownerId) return c.json({ error: "ownerId requis" }, 400);
    const key = `vendor:${ownerId}`;
    const v = await kv.get(key);
    if (!v) return c.json({ error: "vendeur introuvable" }, 404);
    v.suspended = suspended;
    v.shopStatus = suspended ? "closed" : (v.shopStatus === "closed" ? "open" : v.shopStatus);
    v.updatedAt = Date.now();
    await kv.set(key, v);
    await auditLog(auth.id, auth.email, suspended ? "vendors.suspend" : "vendors.unsuspend", { ownerId });
    return c.json({ ok: true });
  });

  // ── Produits (overlay modération, KV `product:`) ──
  app.get(`${PREFIX}/admin/products`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = (await kv.getByPrefix("product:")) ?? [];
    await auditLog(auth.id, auth.email, "products.list", { count: items.length });
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/products/hide`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({}));
    const productId = String(body.productId || "");
    const hidden = !!body.hidden;
    if (!productId) return c.json({ error: "productId requis" }, 400);
    const all = (await kv.getByPrefix("product:")) ?? [];
    const found = all.find((p: any) => String(p?.id) === productId);
    if (!found) return c.json({ error: "produit introuvable" }, 404);
    const key = `product:${found.ownerId}:${found.id}`;
    found.hidden = hidden;
    found.updatedAt = Date.now();
    await kv.set(key, found);
    await auditLog(auth.id, auth.email, hidden ? "products.hide" : "products.unhide", { productId });
    return c.json({ ok: true });
  });

  // ── Dashboard stats (orders/escrow/kyc table-aware) ──
  app.get(`${PREFIX}/admin/stats`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const [orders, escrows, vendors, products, kycs] = await Promise.all([
      loadOrdersForStats(),
      loadEscrowsForStats(),
      kv.getByPrefix("vendor:"),
      kv.getByPrefix("product:"),
      loadKycForStats(),
    ]);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last30 = now - 30 * dayMs;
    const last7 = now - 7 * dayMs;
    const ordersArr = orders ?? [];
    const escrowsArr = escrows ?? [];
    const orders30 = ordersArr.filter((o: any) => (o?.createdAt ?? 0) >= last30);
    const orders7 = ordersArr.filter((o: any) => (o?.createdAt ?? 0) >= last7);
    const sum = (arr: any[], k: string) => arr.reduce((s, o) => s + (Number(o?.[k]) || 0), 0);
    let usersCount = 0;
    try {
      const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      usersCount = (data as any)?.total ?? (data?.users?.length ?? 0);
    } catch { usersCount = 0; }
    return c.json({
      users: usersCount,
      vendors: (vendors ?? []).length,
      products: (products ?? []).length,
      orders: {
        total: ordersArr.length, last30: orders30.length, last7: orders7.length,
        gmvTotal: sum(ordersArr, "total"), gmv30: sum(orders30, "total"), gmv7: sum(orders7, "total"),
      },
      escrow: {
        held: escrowsArr.filter((e: any) => e?.status === "held").length,
        released: escrowsArr.filter((e: any) => e?.status === "released").length,
        heldAmount: escrowsArr.filter((e: any) => e?.status === "held").reduce((s, e: any) => s + (Number(e?.total) || 0), 0),
      },
      kyc: {
        pending: (kycs ?? []).filter((k: any) => !k?.status || k?.status === "pending").length,
        approved: (kycs ?? []).filter((k: any) => k?.status === "approved").length,
        rejected: (kycs ?? []).filter((k: any) => k?.status === "rejected").length,
      },
      generatedAt: now,
    });
  });

  // ── Audit log (table audit_log si dispo) ──
  app.get(`${PREFIX}/admin/audit`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (await tableReady("audit_log")) {
      const { data } = await supabase.from("audit_log").select("*").order("ts", { ascending: false }).limit(500);
      const items = (data ?? []).map((r: any) => ({ id: r.id, ts: Number(r.ts), adminId: r.admin_id, adminEmail: r.admin_email, action: r.action, meta: r.meta }));
      return c.json({ items });
    }
    const items = (await kv.getByPrefix("audit:")) ?? [];
    items.sort((a: any, b: any) => (b?.ts ?? 0) - (a?.ts ?? 0));
    return c.json({ items: items.slice(0, 500) });
  });

  // ── Categories CRUD (table `categories`) ──
  app.get(`${PREFIX}/admin/categories`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (await tableReady("categories")) {
      const { data } = await supabase.from("categories").select("data").order("sort_order", { ascending: true });
      return c.json({ items: (data ?? []).map((r: any) => r.data) });
    }
    const items = (await kv.getByPrefix("category:")) ?? [];
    items.sort((a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/categories/upsert`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    if (!body || typeof body.name !== "string") return c.json({ error: "name required" }, 400);
    const id = String(body.id || `c${Date.now().toString(36)}`);
    const cat = {
      id, name: String(body.name),
      slug: String(body.slug || body.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      icon: String(body.icon || "Tag"), color: String(body.color || "#0F172A"),
      active: body.active !== false, sortOrder: Number(body.sortOrder ?? Date.now()),
    };
    if (await tableReady("categories")) {
      await supabase.from("categories").upsert({ id, data: cat, sort_order: cat.sortOrder });
    } else {
      await kv.set(`category:${id}`, cat);
    }
    await auditLog(auth.id, auth.email ?? null, "category.upsert", { id, name: cat.name });
    return c.json({ category: cat });
  });

  app.post(`${PREFIX}/admin/categories/delete`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { id } = await c.req.json().catch(() => ({} as any));
    if (!id) return c.json({ error: "id required" }, 400);
    if (await tableReady("categories")) await supabase.from("categories").delete().eq("id", id);
    else await kv.del(`category:${id}`);
    await auditLog(auth.id, auth.email ?? null, "category.delete", { id });
    return c.json({ ok: true });
  });

  // ── Payouts (table `payouts`) ──
  app.get(`${PREFIX}/admin/payouts`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (await tableReady("payouts")) {
      const { data } = await supabase.from("payouts").select("data").order("created_at", { ascending: false });
      return c.json({ items: (data ?? []).map((r: any) => r.data) });
    }
    const items = (await kv.getByPrefix("payout:")) ?? [];
    items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/payouts/create`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    if (!body?.vendorId || typeof body.amount !== "number") return c.json({ error: "vendorId, amount required" }, 400);
    const id = `po_${Date.now().toString(36)}`;
    const payout = {
      id, vendorId: String(body.vendorId), vendorName: String(body.vendorName || body.vendorId),
      amount: Math.max(0, Number(body.amount)), method: String(body.method || "mobile_money"),
      status: "pending", createdAt: Date.now(), updatedAt: Date.now(),
    };
    if (await tableReady("payouts")) {
      await supabase.from("payouts").upsert({ id, vendor_id: payout.vendorId, amount: payout.amount, status: payout.status, data: payout, created_at: payout.createdAt, updated_at: payout.updatedAt });
    } else {
      await kv.set(`payout:${id}`, payout);
    }
    await auditLog(auth.id, auth.email ?? null, "payout.create", { id, vendorId: payout.vendorId, amount: payout.amount });
    return c.json({ payout });
  });

  app.post(`${PREFIX}/admin/payouts/status`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { id, status } = await c.req.json().catch(() => ({} as any));
    if (!id || !status) return c.json({ error: "id, status required" }, 400);
    const useTable = await tableReady("payouts");
    const cur: any = useTable ? (await supabase.from("payouts").select("data").eq("id", id).maybeSingle()).data?.data : await kv.get(`payout:${id}`);
    if (!cur) return c.json({ error: "not found" }, 404);
    const next = { ...cur, status, updatedAt: Date.now() };
    if (useTable) await supabase.from("payouts").upsert({ id, vendor_id: next.vendorId, amount: next.amount, status, data: next, created_at: next.createdAt, updated_at: next.updatedAt });
    else await kv.set(`payout:${id}`, next);
    await auditLog(auth.id, auth.email ?? null, "payout.status", { id, status });
    return c.json({ payout: next });
  });

  // ── Subscriptions (lecture KV inchangée) ──
  app.get(`${PREFIX}/admin/subscriptions`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const items = (await kv.getByPrefix("subscription:")) ?? [];
    items.sort((a: any, b: any) => (b?.updatedAt ?? b?.createdAt ?? 0) - (a?.updatedAt ?? a?.createdAt ?? 0));
    return c.json({ items });
  });

  // ── Plans (table `plans`) ──
  app.post(`${PREFIX}/admin/subscriptions/upsert-plan`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    if (!body?.id || typeof body.priceMonthly !== "number") return c.json({ error: "id, priceMonthly required" }, 400);
    const plan = {
      id: String(body.id), label: String(body.label || body.id),
      priceMonthly: Number(body.priceMonthly), priceYearly: Number(body.priceYearly ?? body.priceMonthly * 10),
      features: Array.isArray(body.features) ? body.features.map(String) : [],
      active: body.active !== false, updatedAt: Date.now(),
    };
    if (await tableReady("plans")) await supabase.from("plans").upsert({ id: plan.id, data: plan, updated_at: plan.updatedAt });
    else await kv.set(`plan:${plan.id}`, plan);
    await auditLog(auth.id, auth.email ?? null, "plan.upsert", { id: plan.id });
    return c.json({ plan });
  });

  app.get(`${PREFIX}/admin/plans`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (await tableReady("plans")) {
      const { data } = await supabase.from("plans").select("data");
      return c.json({ items: (data ?? []).map((r: any) => r.data) });
    }
    const items = (await kv.getByPrefix("plan:")) ?? [];
    return c.json({ items });
  });

  // ── Promotions (table `promos`) ──
  app.get(`${PREFIX}/admin/promos`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (await tableReady("promos")) {
      const { data } = await supabase.from("promos").select("data").order("created_at", { ascending: false });
      return c.json({ items: (data ?? []).map((r: any) => r.data) });
    }
    const items = (await kv.getByPrefix("promo:")) ?? [];
    items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items });
  });

  app.post(`${PREFIX}/admin/promos/upsert`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({} as any));
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return c.json({ error: "code requis" }, 400);
    const useTable = await tableReady("promos");
    const existing: any = useTable ? (await supabase.from("promos").select("data").eq("code", code).maybeSingle()).data?.data : await kv.get(`promo:${code}`);
    const promo = {
      code, label: String(body.label || code),
      type: body.type === "amount" ? "amount" : "percent",
      value: Math.max(0, Number(body.value ?? 0)), minAmount: Number(body.minAmount ?? 0),
      maxUses: body.maxUses == null ? null : Math.max(0, Number(body.maxUses)),
      uses: existing?.uses ?? 0, active: body.active !== false,
      expiresAt: body.expiresAt ? Number(body.expiresAt) : null,
      createdAt: existing?.createdAt ?? Date.now(), updatedAt: Date.now(),
    };
    if (useTable) await supabase.from("promos").upsert({ code, data: promo, active: promo.active, created_at: promo.createdAt, updated_at: promo.updatedAt });
    else await kv.set(`promo:${code}`, promo);
    await auditLog(auth.id, auth.email ?? null, "promo.upsert", { code });
    return c.json({ promo });
  });

  app.post(`${PREFIX}/admin/promos/delete`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { code } = await c.req.json().catch(() => ({} as any));
    if (!code) return c.json({ error: "code requis" }, 400);
    const CODE = String(code).toUpperCase();
    if (await tableReady("promos")) await supabase.from("promos").delete().eq("code", CODE);
    else await kv.del(`promo:${CODE}`);
    await auditLog(auth.id, auth.email ?? null, "promo.delete", { code });
    return c.json({ ok: true });
  });

  app.post(`${PREFIX}/admin/promos/toggle`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const { code } = await c.req.json().catch(() => ({} as any));
    const CODE = String(code).toUpperCase();
    const useTable = await tableReady("promos");
    const cur: any = useTable ? (await supabase.from("promos").select("data").eq("code", CODE).maybeSingle()).data?.data : await kv.get(`promo:${CODE}`);
    if (!cur) return c.json({ error: "introuvable" }, 404);
    const next = { ...cur, active: !cur.active, updatedAt: Date.now() };
    if (useTable) await supabase.from("promos").upsert({ code: CODE, data: next, active: next.active, created_at: next.createdAt, updated_at: next.updatedAt });
    else await kv.set(`promo:${CODE}`, next);
    await auditLog(auth.id, auth.email ?? null, "promo.toggle", { code, active: next.active });
    return c.json({ promo: next });
  });

  // ── Backfill admin : KV → tables (audit/categories/promos/payouts/plans) ──
  app.post(`${PREFIX}/admin/migrate/admin`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    ["audit_log", "categories", "promos", "payouts", "plans"].forEach(resetTableCache);
    const out: Record<string, number | string> = {};

    if (await tableReady("audit_log")) {
      const legacy = (await kv.getByPrefix("audit:")) ?? [];
      const rows = legacy.filter((a: any) => a?.id).map((a: any) => ({ id: a.id, ts: a.ts ?? 0, admin_id: a.adminId ?? null, admin_email: a.adminEmail ?? null, action: a.action, meta: a.meta ?? null }));
      if (rows.length) { const { error } = await supabase.from("audit_log").upsert(rows); out.audit = error ? error.message : rows.length; } else out.audit = 0;
    } else out.audit = "table absente";

    if (await tableReady("categories")) {
      const legacy = (await kv.getByPrefix("category:")) ?? [];
      const rows = legacy.filter((x: any) => x?.id).map((x: any) => ({ id: x.id, data: x, sort_order: x.sortOrder ?? 0 }));
      if (rows.length) { const { error } = await supabase.from("categories").upsert(rows); out.categories = error ? error.message : rows.length; } else out.categories = 0;
    } else out.categories = "table absente";

    if (await tableReady("promos")) {
      const legacy = (await kv.getByPrefix("promo:")) ?? [];
      const rows = legacy.filter((x: any) => x?.code).map((x: any) => ({ code: x.code, data: x, active: x.active !== false, created_at: x.createdAt ?? 0, updated_at: x.updatedAt ?? 0 }));
      if (rows.length) { const { error } = await supabase.from("promos").upsert(rows); out.promos = error ? error.message : rows.length; } else out.promos = 0;
    } else out.promos = "table absente";

    if (await tableReady("payouts")) {
      const legacy = (await kv.getByPrefix("payout:")) ?? [];
      const rows = legacy.filter((x: any) => x?.id).map((x: any) => ({ id: x.id, vendor_id: x.vendorId, amount: x.amount ?? 0, status: x.status ?? "pending", data: x, created_at: x.createdAt ?? 0, updated_at: x.updatedAt ?? 0 }));
      if (rows.length) { const { error } = await supabase.from("payouts").upsert(rows); out.payouts = error ? error.message : rows.length; } else out.payouts = 0;
    } else out.payouts = "table absente";

    if (await tableReady("plans")) {
      const legacy = (await kv.getByPrefix("plan:")) ?? [];
      const rows = legacy.filter((x: any) => x?.id).map((x: any) => ({ id: x.id, data: x, updated_at: x.updatedAt ?? 0 }));
      if (rows.length) { const { error } = await supabase.from("plans").upsert(rows); out.plans = error ? error.message : rows.length; } else out.plans = 0;
    } else out.plans = "table absente";

    return c.json({ ok: true, ...out });
  });

  // ── Import en masse (seed catalogue + toutes données plateforme) ──
  // Body : { items: [{ key: string, value: any }, ...] } (max 500 / appel).
  // Écrit dans le KV (kv_store_cc347259) en upsert. Idempotent.
  app.post(`${PREFIX}/admin/seed`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    try {
      const body = await c.req.json().catch(() => ({}));
      const items = Array.isArray(body?.items) ? body.items : [];
      if (items.length === 0) return c.json({ ok: true, written: 0 });
      if (items.length > 500) return c.json({ error: "Max 500 items par appel" }, 413);
      const keys: string[] = [];
      const values: any[] = [];
      for (const it of items) {
        if (!it || typeof it.key !== "string" || it.key.length === 0) continue;
        keys.push(it.key);
        values.push(it.value ?? null);
      }
      if (keys.length === 0) return c.json({ ok: true, written: 0 });
      await kv.mset(keys, values);
      return c.json({ ok: true, written: keys.length });
    } catch (e: any) {
      console.log(`admin/seed error: ${e?.message ?? e}`);
      return c.json({ error: "Erreur d'import" }, 500);
    }
  });
}
