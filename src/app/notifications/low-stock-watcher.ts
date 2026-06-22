/* ═══════════════════════════════════════════
   IPPOO - Watcher stock bas (vendeur)
   Détecte les produits publiés dont le stock passe sous
   le seuil (défaut 5) et pousse une notification locale
   par produit, en évitant les doublons via localStorage.
   ═══════════════════════════════════════════ */

import { listMyProducts, hydrateMyProducts } from "../data/my-products";
import { pushNotification } from "./store";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const SEEN_KEY = "ippoo:low-stock-seen";
const DEFAULT_THRESHOLD = 5;

function getSeen(): Record<string, number> {
  try { return JSON.parse(scopedGetItem(SEEN_KEY) || "{}"); } catch { return {}; }
}
function persistSeen(map: Record<string, number>) {
  scopedSetItem(SEEN_KEY, JSON.stringify(map));
}

export type LowStockInfo = {
  lowCount: number;
  outCount: number;
};

/** Renvoie le nombre de produits sous le seuil et déclenche une notif si nouveau. */
export function checkLowStock(shopSlug: string, threshold = DEFAULT_THRESHOLD): LowStockInfo {
  if (!shopSlug) return { lowCount: 0, outCount: 0 };
  hydrateMyProducts();
  const products = listMyProducts(shopSlug).filter((p) => p.status === "published");
  const seen = getSeen();
  let lowCount = 0;
  let outCount = 0;
  for (const p of products) {
    if (p.stockQty <= 0) {
      outCount++;
      const lastNotified = seen[p.id] ?? -1;
      if (lastNotified !== 0) {
        pushNotification({
          type: "system",
          priority: "high",
          title: "Stock épuisé",
          desc: `« ${p.name} » est en rupture. Réapprovisionnez ou marquez comme indisponible.`,
          link: `/boutique/produits?edit=${p.id}`,
          color: "#E11D2E",
        });
        seen[p.id] = 0;
      }
    } else if (p.stockQty <= threshold) {
      lowCount++;
      const lastNotified = seen[p.id] ?? -1;
      if (lastNotified > p.stockQty || lastNotified === -1) {
        pushNotification({
          type: "system",
          priority: "normal",
          title: "Stock faible",
          desc: `« ${p.name} » : ${p.stockQty} restant(s) en stock.`,
          link: `/boutique/produits?edit=${p.id}`,
          color: "#F59E0B",
        });
        seen[p.id] = p.stockQty;
      }
    } else {
      if (seen[p.id] != null) delete seen[p.id];
    }
  }
  persistSeen(seen);
  return { lowCount, outCount };
}
