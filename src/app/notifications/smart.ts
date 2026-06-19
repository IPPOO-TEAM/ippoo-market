/* ═══════════════════════════════════════════
   IPPOO — Notifications intelligentes
   Émet périodiquement des notifications contextuelles (promos, jeux,
   cadeaux, cashback) pour animer l'expérience utilisateur.
   - Intervalle aléatoire 90s–180s en session active
   - Première salve 8s après démarrage pour effet "vivant"
   - Évite les doublons immédiats
   ═══════════════════════════════════════════ */

import { pushNotification, type NotifType } from "./store";

type SmartTemplate = {
  type: NotifType;
  title: string;
  desc: string;
  link?: string;
  priority?: "low" | "normal" | "high";
};

const TEMPLATES: SmartTemplate[] = [
  { type: "promo", title: "Flash -25% Cosmétiques",     desc: "Pendant 2 h seulement, profitez de -25% sur la beauté.",    link: "/promos",  priority: "high" },
  { type: "promo", title: "Méga-deal Alimentaire",      desc: "Économisez jusqu'à 30% sur les produits du quotidien.",     link: "/promos",  priority: "normal" },
  { type: "promo", title: "Livraison offerte aujourd'hui", desc: "Plus de frais de port sur toutes vos commandes !",       link: "/boutique", priority: "high" },
  { type: "bonus", title: "Cashback débloqué",          desc: "+2 500 FCFA crédités sur votre IPPOO CASH.",                link: "/wallet",  priority: "high" },
  { type: "bonus", title: "Bonus parrainage",           desc: "Un de vos filleuls a fait son 1er achat : +5 000 FCFA.",    link: "/parrainage", priority: "high" },
  { type: "gift",  title: "Cadeau surprise 🎁",          desc: "Ouvrez-le maintenant dans votre boîte cadeaux.",            link: "/profil",  priority: "high" },
  { type: "gift",  title: "Coupon offert",              desc: "Un coupon -10% est disponible pour votre prochain achat.",  link: "/promos",  priority: "normal" },
  { type: "game",  title: "Roue de la fortune dispo",   desc: "Votre tour gratuit du jour vous attend.",                   link: "/jeux",    priority: "normal" },
  { type: "win",   title: "Vous avez gagné !",          desc: "Bravo ! Vous remportez 1 500 FCFA à la Roue.",              link: "/wallet",  priority: "high" },
  { type: "vip",   title: "Avantage VIP GOLD",          desc: "Un nouvel avantage vient d'être ajouté à votre statut.",    link: "/vip",     priority: "normal" },
  { type: "order", title: "Votre colis approche",       desc: "Sortie de l'entrepôt, livraison estimée demain.",           link: "/commandes", priority: "normal" },
];

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let lastIndex = -1;

function pickTemplate(): SmartTemplate {
  let i = Math.floor(Math.random() * TEMPLATES.length);
  if (i === lastIndex) i = (i + 1) % TEMPLATES.length;
  lastIndex = i;
  return TEMPLATES[i];
}

function scheduleNext() {
  const delay = 90_000 + Math.floor(Math.random() * 90_000); // 90s–180s
  timer = setTimeout(tick, delay);
}

function tick() {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    scheduleNext();
    return;
  }
  const t = pickTemplate();
  pushNotification({
    type: t.type,
    title: t.title,
    desc: t.desc,
    link: t.link,
    priority: t.priority ?? "normal",
  });
  scheduleNext();
}

export function startSmartNotifications() {
  if (started || typeof window === "undefined") return;
  started = true;
  timer = setTimeout(tick, 8_000); // première salve 8s après démarrage
}

export function stopSmartNotifications() {
  if (timer) clearTimeout(timer);
  timer = null;
  started = false;
}
