/* ═══════════════════════════════════════════
   IPPOO — Wallet serveur (Edge Function)
   Récupère le solde et l'historique de transactions depuis la
   source de vérité côté serveur. Le store local /payments reste
   utilisé pour l'UI offline / fallback.
   ═══════════════════════════════════════════ */

import { apiFetch } from "../api/client";

export type WalletTx = {
  amount: number;
  reason: string;
  meta?: Record<string, unknown>;
  at: number;
};

export type WalletSnapshot = {
  balance: number;
  transactions: WalletTx[];
};

export async function fetchWallet(): Promise<WalletSnapshot> {
  return apiFetch<WalletSnapshot>("/wallet");
}
