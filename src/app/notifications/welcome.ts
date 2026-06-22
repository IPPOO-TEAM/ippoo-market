/* ═══════════════════════════════════════════
   IPPOO - Message de bienvenue
   Notification informationnelle envoyée une fois après la 1ère
   inscription. Aucun crédit, aucun coupon, aucun cadeau simulé : le
   compte démarre vierge et l'utilisateur recharge lui-même son
   IPPOO CASH depuis la page /wallet.
   ═══════════════════════════════════════════ */

import { pushNotification } from "./store";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const WELCOME_KEY = "ippoo:welcome-claimed";

export function hasClaimedWelcome(): boolean {
  return scopedGetItem(WELCOME_KEY) === "1";
}

/** Marque la bienvenue comme délivrée et publie une notification simple. */
export function claimWelcomeGift(firstName?: string): boolean {
  if (hasClaimedWelcome()) return false;
  scopedSetItem(WELCOME_KEY, "1");
  const greet = firstName ? `Bienvenue ${firstName} !` : "Bienvenue sur IPPOO !";
  pushNotification({
    type: "welcome",
    title: greet,
    desc: "Complétez votre profil, rechargez votre IPPOO CASH et explorez le marché pour démarrer.",
    link: "/profil",
    priority: "high",
  });
  return true;
}
