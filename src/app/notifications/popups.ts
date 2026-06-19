/* ═══════════════════════════════════════════
   IPPOO — Popups dynamiques in-app
   File d'attente de popups marketing/promo affichées par PromoPopupHost.
   Persistance "déjà vu" pour éviter les doublons.
   ═══════════════════════════════════════════ */

export type PopupCta = {
  label: string;
  link?: string;
  variant?: "primary" | "secondary";
};

export type Popup = {
  id: string;
  /** Identifiant stable (pour éviter de re-jouer un popup déjà vu). */
  key: string;
  kind: "promo" | "bonus" | "welcome" | "vip" | "game" | "info" | "system";
  title: string;
  subtitle?: string;
  /** Liste de "tickets" affichés en grille (max 4). */
  tickets?: { tag?: string; value: string; caption?: string; tone?: "gold" | "red" | "violet" | "green" }[];
  ctas?: PopupCta[];
  /** Couleurs du dégradé d'en-tête. */
  gradient?: [string, string];
  /** Emoji/icone décoratif en haut à droite. */
  emoji?: string;
  /** Si true, ne se rejoue pas une fois fermé. */
  oneShot?: boolean;
};

import { scopedGetItem, scopedSetItem, scopedRemoveItem } from "../lib/scoped-storage";

const SEEN_KEY = "ippoo:popups-seen";

let queue: Popup[] = [];
const listeners = new Set<() => void>();

function loadSeen(): Set<string> {
  try {
    const raw = scopedGetItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(s: Set<string>) {
  scopedSetItem(SEEN_KEY, JSON.stringify([...s]));
}

export function subscribePopups(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getCurrentPopup(): Popup | null {
  return queue[0] ?? null;
}

function emit() { listeners.forEach((l) => l()); }

export function showPopup(p: Popup) {
  if (p.oneShot) {
    const seen = loadSeen();
    if (seen.has(p.key)) return;
  }
  // Évite les doublons consécutifs
  if (queue.some((q) => q.key === p.key)) return;
  queue = [...queue, p];
  emit();
}

export function dismissCurrent() {
  const cur = queue[0];
  if (!cur) return;
  if (cur.oneShot) {
    const seen = loadSeen();
    seen.add(cur.key);
    saveSeen(seen);
  }
  queue = queue.slice(1);
  emit();
}

/** Réinitialise l'historique "déjà vu" (utile en debug). */
export function resetPopupHistory() {
  scopedRemoveItem(SEEN_KEY);
}

/* ─── Popups de bienvenue par défaut ─── */
export function seedWelcomePopups() {
  showPopup({
    id: "welcome-bonus",
    key: "welcome-bonus-v1",
    kind: "welcome",
    title: "Bienvenue sur IPPOO",
    subtitle: "Active ton compte pour débloquer tes cadeaux de bienvenue",
    gradient: ["#E11D2E", "#F97316"],
    tickets: [
      { tag: "Nouveau", value: "5 000 FCFA", caption: "Bonus de bienvenue", tone: "gold" },
      { tag: "Promo", value: "-20%", caption: "Sur ta 1ère commande", tone: "red" },
      { tag: "Cadeau", value: "Livraison", caption: "Offerte dès 25 000 FCFA", tone: "violet" },
      { tag: "VIP", value: "1 mois", caption: "Essai abonnement offert", tone: "green" },
    ],
    ctas: [
      { label: "Activer mes cadeaux", link: "/wallet", variant: "primary" },
      { label: "Plus tard", variant: "secondary" },
    ],
    oneShot: true,
  });
}
