import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, requireAdmin, getBalance, creditWallet, auditLog } from "../_shared.tsx";
import { supabase, tableReady, resetTableCache } from "../_db.tsx";

const WalletCreditSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-10_000_000).max(10_000_000),
  reason: z.string().max(120),
});

function txFromRow(r: any) {
  return { amount: Number(r.amount), reason: r.reason, meta: r.meta ?? {}, at: r.at ? Date.parse(r.at) : Date.now() };
}

async function listTx(userId: string): Promise<any[]> {
  if (await tableReady("wallet_transactions")) {
    const { data } = await supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("at", { ascending: true });
    return (data ?? []).map(txFromRow);
  }
  return (await kv.getByPrefix(`wallet-tx:${userId}:`)) ?? [];
}

export function registerWallet(app: any) {
  app.get(`${PREFIX}/wallet`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const balance = await getBalance(auth.id);
    const transactions = await listTx(auth.id);
    return c.json({ balance, transactions });
  });

  app.post(`${PREFIX}/wallet/credit`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = WalletCreditSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Paramètres invalides" }, 400);
    const balance = await creditWallet(parsed.data.userId, parsed.data.amount, parsed.data.reason, { by: auth.id });
    await auditLog(auth.id, auth.email, "wallet.credit", { userId: parsed.data.userId, amount: parsed.data.amount, reason: parsed.data.reason });
    return c.json({ ok: true, balance });
  });

  // ── Backfill admin : wallets + transactions KV → tables ──
  // Accès direct à la table KV pour récupérer les CLÉS (l'uid y est
  // encodé : `wallet:<uid>` et `wallet-tx:<uid>:<txId>`).
  app.post(`${PREFIX}/admin/migrate/wallet`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    resetTableCache("wallets"); resetTableCache("wallet_transactions");
    if (!(await tableReady("wallets")) || !(await tableReady("wallet_transactions"))) {
      return c.json({ error: "Tables wallet absentes : appliquez d'abord la migration 0004." }, 409);
    }
    let migratedWallets = 0, migratedTx = 0;
    // Soldes
    const { data: wRows } = await supabase
      .from("kv_store_cc347259").select("key,value").like("key", "wallet:%").not("key", "like", "wallet-tx:%");
    const wallets = (wRows ?? []).map((r: any) => ({
      user_id: r.key.slice("wallet:".length),
      balance: Number(r.value?.balance ?? 0),
      updated_at: new Date(r.value?.updatedAt ?? Date.now()).toISOString(),
    })).filter((w: any) => w.user_id);
    if (wallets.length) {
      const { error } = await supabase.from("wallets").upsert(wallets);
      if (!error) migratedWallets = wallets.length;
    }
    // Transactions : clé `wallet-tx:<uid>:<txId>`
    const { data: txRows } = await supabase
      .from("kv_store_cc347259").select("key,value").like("key", "wallet-tx:%");
    const txs = (txRows ?? []).map((r: any) => {
      const rest = r.key.slice("wallet-tx:".length);
      const idx = rest.indexOf(":");
      const userId = idx >= 0 ? rest.slice(0, idx) : rest;
      const txId = idx >= 0 ? rest.slice(idx + 1) : rest;
      return {
        id: `${userId}:${txId}`,
        user_id: userId,
        amount: Number(r.value?.amount ?? 0),
        reason: String(r.value?.reason ?? ""),
        meta: r.value?.meta ?? {},
        at: new Date(r.value?.at ?? Date.now()).toISOString(),
      };
    }).filter((t: any) => t.user_id);
    if (txs.length) {
      const { error } = await supabase.from("wallet_transactions").upsert(txs);
      if (!error) migratedTx = txs.length;
    }
    return c.json({ ok: true, migratedWallets, migratedTx });
  });
}
