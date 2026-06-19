/* ═══════════════════════════════════════════
   IPPOO — Watcher local pour notifications vendeur
   Détecte les transitions d'escrow vers "released"
   sur les commandes du vendeur et pousse une notif
   locale (toast + son + entrée dans le centre).
   Stocke en localStorage les ids déjà notifiés pour
   éviter les doublons entre rendus.
   ═══════════════════════════════════════════ */

import { listOrders, type OrderRecord } from "../data/orders-server";
import { pushNotification } from "./store";
import { formatPrice } from "../components/mock-data";
import { scopedGetJSON, scopedSetJSON } from "../lib/scoped-storage";

const SEEN_KEY = "ippoo:seller-escrow-seen";

function getSeen(): Set<string> {
  return new Set(scopedGetJSON<string[]>(SEEN_KEY, []));
}

function persistSeen(set: Set<string>) {
  scopedSetJSON(SEEN_KEY, Array.from(set));
}

let inflight = false;

/** Vérifie si de nouveaux escrows ont été libérés pour le vendeur identifié par `vendorKey`. */
export async function checkSellerEscrowReleases(vendorKey: string): Promise<void> {
  if (!vendorKey || inflight) return;
  inflight = true;
  try {
    const all: OrderRecord[] = await listOrders();
    const seen = getSeen();
    let touched = false;
    for (const o of all) {
      if (o.escrowStatus !== "released") continue;
      const isMine = o.items.some((it) => it.vendorId === vendorKey);
      if (!isMine) continue;
      if (seen.has(o.id)) continue;
      const share = o.vendorShares?.[vendorKey] ?? 0;
      pushNotification({
        type: "payment",
        priority: "high",
        title: "Paiement libéré",
        desc: `Commande ${o.id} : ${formatPrice(share)} FCFA crédités sur votre wallet vendeur.`,
        link: "/vendeur-comptabilite",
        color: "#16A34A",
      });
      seen.add(o.id);
      touched = true;
    }
    if (touched) persistSeen(seen);
  } catch {
    /* silent — pas critique */
  } finally {
    inflight = false;
  }
}
