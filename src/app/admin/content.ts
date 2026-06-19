// Store CMS pour les contenus éditoriaux de la marketplace.

import { useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export type FaqItem = { id: string; question: string; answer: string };
export type Banner = { id: string; title: string; subtitle: string; ctaLabel: string; ctaUrl: string; bgColor: string; active: boolean; imageUrl?: string };
export type AnnouncementBar = { active: boolean; message: string; bgColor: string; textColor: string; link: string };
export type NavItem = { id: string; label: string; url: string; visible: boolean };
export type FooterLink = { id: string; label: string; url: string };
export type FooterColumn = { id: string; title: string; links: FooterLink[] };
export type Testimonial = { id: string; author: string; role: string; quote: string; rating: number; avatarUrl: string; active: boolean };
export type SeoMeta = {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl: string;
  indexable: boolean;
};

export type ContentState = {
  brand: {
    name: string;
    tagline: string;
    description: string;
    logoUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
  };
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    tiktok: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    bgGradient: string;
    imageUrl?: string;
  };
  announcement: AnnouncementBar;
  banners: Banner[];
  faq: FaqItem[];
  legal: {
    termsTitle: string;
    termsBody: string;
    privacyTitle: string;
    privacyBody: string;
  };
  emails: {
    welcomeSubject: string;
    welcomeBody: string;
    orderConfirmSubject: string;
    orderConfirmBody: string;
  };
  seo: SeoMeta;
  navigation: NavItem[];
  footer: { columns: FooterColumn[]; copyright: string; newsletterTitle: string; newsletterCta: string };
  testimonials: Testimonial[];
  meta: { lastUpdated: number; version: number };
};

const KEY = "ippoo:content";

function defaultState(): ContentState {
  return {
    brand: {
      name: "IPPOO Market",
      tagline: "La marketplace B2B de l'Afrique de l'Ouest",
      description: "Achetez en gros, vendez en confiance, livré dans toute l'UEMOA.",
      logoUrl: "",
    },
    contact: {
      email: "contact@ippoo.market",
      phone: "+229 99 00 00 00",
      whatsapp: "+229 99 00 00 00",
      address: "Cotonou, Bénin",
      hours: "Lun – Sam, 8h – 19h",
    },
    social: {
      facebook: "https://facebook.com/ippoo.market",
      instagram: "https://instagram.com/ippoo.market",
      linkedin: "https://linkedin.com/company/ippoo",
      youtube: "",
      tiktok: "",
    },
    hero: {
      title: "Le grossiste numérique de l'Afrique de l'Ouest",
      subtitle: "Plus de 5 000 produits B2B, livrés en 24-72h dans toute l'UEMOA.",
      ctaPrimary: "Commencer à acheter",
      ctaSecondary: "Devenir vendeur",
      bgGradient: "linear-gradient(135deg, #E11D2E 0%, #FF6B00 100%)",
    },
    announcement: {
      active: true,
      message: "🎉 Livraison gratuite dès 50 000 FCFA d'achat !",
      bgColor: "#0F172A",
      textColor: "#FFFFFF",
      link: "/promos",
    },
    banners: [
      { id: "b1", title: "Promo grossistes", subtitle: "−10 % avec le code GROS10", ctaLabel: "En profiter", ctaUrl: "/promos", bgColor: "#E11D2E", active: true },
      { id: "b2", title: "Devenir vendeur", subtitle: "0 frais d'inscription, 8 % de commission", ctaLabel: "S'inscrire", ctaUrl: "/devenir-vendeur", bgColor: "#F0B429", active: true },
    ],
    faq: [
      { id: "f1", question: "Comment passer une commande ?", answer: "Ajoutez vos produits au panier, choisissez votre adresse de livraison et payez avec IPPOO CASH, Mobile Money, carte ou à la livraison." },
      { id: "f2", question: "Quels sont les délais de livraison ?", answer: "24h en livraison express, 48-72h en standard dans toute l'UEMOA." },
      { id: "f3", question: "Comment devenir vendeur ?", answer: "Cliquez sur \"Devenir vendeur\" et déposez vos justificatifs (KYC/KYB). Validation sous 48h." },
      { id: "f4", question: "Puis-je annuler une commande ?", answer: "Oui, tant qu'elle est encore en préparation. Le remboursement est immédiat sur IPPOO CASH." },
    ],
    legal: {
      termsTitle: "Conditions générales d'utilisation",
      termsBody: "Bienvenue sur IPPOO Market. En utilisant notre plateforme, vous acceptez les présentes conditions…",
      privacyTitle: "Politique de confidentialité",
      privacyBody: "Nous respectons votre vie privée. Vos données personnelles sont traitées conformément à la loi n°2017-20 du Bénin…",
    },
    emails: {
      welcomeSubject: "Bienvenue sur IPPOO Market !",
      welcomeBody: "Bonjour {{nom}},\n\nMerci d'avoir rejoint IPPOO Market. Profitez de votre code WELCOME5 pour 5 % de réduction sur votre première commande.",
      orderConfirmSubject: "Votre commande {{orderId}} est confirmée",
      orderConfirmBody: "Bonjour {{nom}},\n\nVotre commande {{orderId}} d'un montant de {{total}} FCFA a bien été enregistrée.\n\nSuivi : ippoo.market/commande/{{orderId}}",
    },
    seo: {
      title: "IPPOO Market — Marketplace B2B de l'Afrique de l'Ouest",
      description: "Achetez en gros, vendez en confiance. Plus de 5 000 produits B2B livrés en 24-72h dans toute l'UEMOA.",
      keywords: "marketplace, B2B, Afrique, UEMOA, grossiste, IPPOO",
      ogImageUrl: "",
      twitterHandle: "@ippoomarket",
      canonicalUrl: "https://ippoo.market",
      indexable: true,
    },
    navigation: [
      { id: "n1", label: "Accueil", url: "/", visible: true },
      { id: "n2", label: "Explorer", url: "/explorer", visible: true },
      { id: "n3", label: "Vendeurs", url: "/vendeurs", visible: true },
      { id: "n4", label: "Promos", url: "/promos", visible: true },
      { id: "n5", label: "Aide", url: "/aide", visible: true },
    ],
    footer: {
      columns: [
        {
          id: "fc1",
          title: "Découvrir",
          links: [
            { id: "fl1", label: "À propos", url: "/blog" },
            { id: "fl2", label: "Devenir vendeur", url: "/devenir-vendeur" },
            { id: "fl3", label: "Comité d'entreprise", url: "/comite-entreprise" },
          ],
        },
        {
          id: "fc2",
          title: "Aide",
          links: [
            { id: "fl4", label: "Centre d'aide", url: "/aide" },
            { id: "fl5", label: "SAV", url: "/sav" },
            { id: "fl6", label: "Nous contacter", url: "/aide" },
          ],
        },
        {
          id: "fc3",
          title: "Légal",
          links: [
            { id: "fl7", label: "CGU", url: "/cgu" },
            { id: "fl8", label: "Confidentialité", url: "/confidentialite" },
            { id: "fl9", label: "Cookies", url: "/cookies" },
          ],
        },
      ],
      copyright: "© 2026 IPPOO Market. Tous droits réservés.",
      newsletterTitle: "Restez informé",
      newsletterCta: "S'abonner",
    },
    testimonials: [
      { id: "t1", author: "Aminata Hounsou", role: "Acheteuse · Porto-Novo", quote: "IPPOO m'a permis de doubler mes marges en accédant directement aux grossistes.", rating: 5, avatarUrl: "", active: true },
      { id: "t2", author: "Koffi Mensah", role: "Vendeur · Cotonou", quote: "Les paiements protégés rassurent mes clients, mes ventes ont décollé.", rating: 5, avatarUrl: "", active: true },
    ],
    meta: { lastUpdated: Date.now(), version: 1 },
  };
}

const SERVER_SNAPSHOT: ContentState = defaultState();
let state: ContentState = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): ContentState {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return mergeDeep(defaultState(), parsed);
  } catch {
    return defaultState();
  }
}

export function hydrateContent() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());
}

function mergeDeep<T>(base: T, override: Partial<T>): T {
  const baseRec = base as Record<string, unknown>;
  const overrideRec = (override ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = Array.isArray(base)
    ? [...(base as unknown[])] as unknown as Record<string, unknown>
    : { ...baseRec };
  for (const k of Object.keys(overrideRec)) {
    const v = overrideRec[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = mergeDeep(baseRec[k] ?? {}, v as Partial<unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

function persist() {
  safeSetItem(KEY, JSON.stringify(state));
}

function bumpMeta() {
  state.meta = { lastUpdated: Date.now(), version: (state.meta?.version ?? 0) + 1 };
}

function emit() { bumpMeta(); persist(); listeners.forEach((l) => l()); }

export function subscribeContent(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getContentState(): ContentState { return state; }

export function useContent(): ContentState {
  return useSyncExternalStore(subscribeContent, getContentState, () => SERVER_SNAPSHOT);
}

export function updateContent<K extends keyof ContentState>(section: K, value: ContentState[K]) {
  state = { ...state, [section]: value };
  emit();
}

export function resetContent() {
  state = defaultState();
  emit();
}

/* ─── Banners ─── */
export function upsertBanner(banner: Banner) {
  const exists = state.banners.some((b) => b.id === banner.id);
  state.banners = exists ? state.banners.map((b) => (b.id === banner.id ? banner : b)) : [...state.banners, banner];
  emit();
}

export function deleteBanner(id: string) {
  state.banners = state.banners.filter((b) => b.id !== id);
  emit();
}

/* ─── FAQ ─── */
export function upsertFaq(item: FaqItem) {
  const exists = state.faq.some((f) => f.id === item.id);
  state.faq = exists ? state.faq.map((f) => (f.id === item.id ? item : f)) : [...state.faq, item];
  emit();
}

export function deleteFaq(id: string) {
  state.faq = state.faq.filter((f) => f.id !== id);
  emit();
}

/* ─── Section reset / bulk ─── */
export function resetSection<K extends keyof ContentState>(section: K) {
  const def = defaultState();
  state = { ...state, [section]: def[section] };
  emit();
}

export function exportContent(): string {
  return JSON.stringify(state, null, 2);
}

export function importContent(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return { ok: false, error: "JSON invalide" };
    state = mergeDeep(defaultState(), parsed);
    emit();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur d'import" };
  }
}

/* ─── Navigation ─── */
export function upsertNav(item: NavItem) {
  const exists = state.navigation.some((n) => n.id === item.id);
  state.navigation = exists
    ? state.navigation.map((n) => (n.id === item.id ? item : n))
    : [...state.navigation, item];
  emit();
}

export function deleteNav(id: string) {
  state.navigation = state.navigation.filter((n) => n.id !== id);
  emit();
}

export function reorderNav(ids: string[]) {
  const map = new Map(state.navigation.map((n) => [n.id, n]));
  state.navigation = ids.map((id) => map.get(id)).filter(Boolean) as NavItem[];
  emit();
}

/* ─── Footer ─── */
export function upsertFooterColumn(col: FooterColumn) {
  const exists = state.footer.columns.some((c) => c.id === col.id);
  state.footer.columns = exists
    ? state.footer.columns.map((c) => (c.id === col.id ? col : c))
    : [...state.footer.columns, col];
  state.footer = { ...state.footer };
  emit();
}

export function deleteFooterColumn(id: string) {
  state.footer = { ...state.footer, columns: state.footer.columns.filter((c) => c.id !== id) };
  emit();
}

/* ─── Testimonials ─── */
export function upsertTestimonial(t: Testimonial) {
  const exists = state.testimonials.some((x) => x.id === t.id);
  state.testimonials = exists
    ? state.testimonials.map((x) => (x.id === t.id ? t : x))
    : [...state.testimonials, t];
  emit();
}

export function deleteTestimonial(id: string) {
  state.testimonials = state.testimonials.filter((t) => t.id !== id);
  emit();
}
