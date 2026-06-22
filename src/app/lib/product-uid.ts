// Identifiant unique produit + URL QR.
// Le champ `reference` posé sur chaque produit (`IPP-CAT-CUR-000123`) est utilisé
// comme UID stable : il n'a jamais deux occurrences sur la plateforme, il est
// déterministe à partir de l'id, et il sert simultanément de :
//   • numéro de suivi inventaire / stock
//   • payload du QR code (lien profond /scan/<UID>)
//   • numéro de transaction comptable côté vendeur

import { safeGetItem } from "./safe-storage";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I, anti-confusion

// Hash 32-bit déterministe basé sur l'id, utilisé en fallback si pas de reference.
function hash32(input: string | number): number {
  const s = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function toBase32(n: number, length: number): string {
  let out = "";
  let v = n >>> 0;
  for (let i = 0; i < length; i++) {
    out = ALPHABET[v % ALPHABET.length] + out;
    v = Math.floor(v / ALPHABET.length);
  }
  return out;
}

/** UID unique et stable pour un produit. Utilise `reference` si dispo, sinon dérive de l'id. */
export function productUid(product: { id: number | string; reference?: string }): string {
  if (product.reference) return product.reference;
  const h1 = hash32(product.id);
  const h2 = hash32(`ippoo:${product.id}:salt`);
  return `IPP-${toBase32(h1, 6)}-${toBase32(h2, 4)}`;
}

/** Domaine public par défaut (utilisé si l'admin n'a rien configuré). */
export const IPPOO_DEFAULT_PUBLIC_ORIGIN = "https://ippoomarket.figma.site";

/**
 * Résout le domaine public sur lequel les QR codes doivent pointer.
 * Ordre de priorité :
 *   1. valeur configurée dans le back-office (Paramètres → Domaine public)
 *   2. window.location.origin si on tourne sur un vrai domaine HTTPS public
 *      (n'importe quel hébergeur - Vercel, Netlify, Cloudflare, propre VPS…)
 *   3. domaine par défaut codé en dur (fallback ultime / SSR)
 *
 * Cette résolution se fait à chaque appel : si on change d'hébergement, les
 * nouveaux QR générés utiliseront automatiquement le nouveau domaine, sans
 * recompilation. Les QR déjà imprimés peuvent rester valables si l'admin a
 * configuré un domaine canonique pointant vers la bonne instance.
 */
export function resolvePublicOrigin(): string {
  try {
    const raw = safeGetItem("ippoo:admin-settings");
    if (raw) {
      const s = JSON.parse(raw) as { publicOrigin?: string };
      if (s.publicOrigin && /^https?:\/\/[^\s]+$/.test(s.publicOrigin)) {
        return s.publicOrigin.replace(/\/+$/, "");
      }
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname, origin } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
    // Tout origin HTTPS public (hors localhost) est considéré comme canonique.
    if (protocol === "https:" && !isLocal) {
      return origin.replace(/\/+$/, "");
    }
    // En HTTP non-local (rare en prod), on accepte aussi pour permettre les déploiements internes.
    if (protocol === "http:" && !isLocal && hostname.includes(".")) {
      return origin.replace(/\/+$/, "");
    }
  }
  return IPPOO_DEFAULT_PUBLIC_ORIGIN;
}

/**
 * URL canonique d'un QR produit.
 *
 * On utilise une URL avec query-string sur la racine plutôt qu'un chemin
 * profond (`/scan/:uid`) pour deux raisons :
 *   • la racine est servie par tout hébergeur statique, sans avoir à
 *     configurer un fallback SPA (Vercel, Netlify, GitHub Pages, figma.site…)
 *   • un visiteur externe atterrit donc toujours sur la fiche produit,
 *     même si le routage côté serveur n'est pas configuré.
 *
 * Comportement à l'ouverture (géré par Layout) :
 *   • lien ouvert hors de l'app (lecteur QR système, appareil photo) →
 *     navigation vers /produit/:id (fiche publique)
 *   • lien ouvert depuis le scanner intégré à l'app → ouvre la modale de
 *     paiement IPPOO CASH pré-remplie pour ce produit
 */
export function productScanUrl(uid: string): string {
  return `${resolvePublicOrigin()}/?ippoo=${encodeURIComponent(uid)}`;
}

/** URL canonique vers la page de règlement IPPOO CASH (encodée en racine). */
export function paymentScanUrl(params: { id: string; amount?: number; vendor?: string }): string {
  const qs = new URLSearchParams();
  qs.set("ippoo-pay", params.id);
  if (params.amount && params.amount > 0) qs.set("amt", String(params.amount));
  if (params.vendor) qs.set("to", params.vendor);
  return `${resolvePublicOrigin()}/?${qs.toString()}`;
}
