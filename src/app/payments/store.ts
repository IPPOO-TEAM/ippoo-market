import { logger } from "../lib/logger";
// Store centralisé pour le système de paiement IPPOO Market.
// État persistant via localStorage, abonnements pour rafraîchir l'UI.

import { pushNotification, type NotifType } from "../notifications/store";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";
import { ensureAccountId } from "../auth/account-id";
import { setPin as setPinServer, verifyPin as verifyPinServer, fetchPinStatus } from "../data/pin-server";
import { getAccessToken } from "../auth/supabase";
import { randomSaltHex, derivePin, pinMatches, legacyHashPin } from "./pin-crypto";
import { migrate as runMigrations } from "./migrations";

function mirrorPinToServer(pin: string) {
  // Fire-and-forget : ne bloque jamais l'UX locale. Permet aux endpoints
  // serveur (escrow, retrait, paiements vendeurs) de vérifier le PIN.
  void setPinServer(pin).catch((e) => {
    logger.warn(`mirror PIN to server failed: ${e?.message ?? e}`);
  });
}

import { MOBILE_PROVIDER_LABEL } from "./types";
export { MOBILE_PROVIDER_LABEL };
export type {
  PayMethod,
  MobileProvider,
  CartItem,
  OrderStatus,
  EscrowStatus,
  Order,
  Transaction,
  InvoiceLine,
  Invoice,
  StockMovement,
  Subscription,
  State,
} from "./types";

import type {
  PayMethod,
  MobileProvider,
  CartItem,
  OrderStatus,
  EscrowStatus,
  Order,
  Transaction,
  InvoiceLine,
  Invoice,
  StockMovement,
  Subscription,
  State,
} from "./types";

const LEGACY_STORAGE_KEY = "ippoo:payments";

function storageKey(): string {
  if (typeof window === "undefined") return LEGACY_STORAGE_KEY;
  try {
    return `ippoo:payments:${ensureAccountId().id}`;
  } catch {
    return LEGACY_STORAGE_KEY;
  }
}

/**
 * Version du schéma persisté. À incrémenter dès qu'une migration des
 * structures stockées dans `STORAGE_KEY` est requise. Chaque entrée du
 * registre `MIGRATIONS` transforme l'état d'une version vers la suivante.
 */
const SCHEMA_VERSION = 3;

const DEFAULT_PIN = "1234";

function defaultState(): State {
  return {
    cart: [],
    promoCode: null,
    promoDiscount: 0,
    walletBalance: 0,
    walletBlocked: 0,
    pinHash: legacyHashPin(DEFAULT_PIN),
    pinSalt: "",
    pinFailures: 0,
    pinLockedUntil: null,
    walletActivated: false,
    walletKeyHash: "",
    orders: [],
    transactions: [],
    invoices: [],
    subscription: null,
    stock: {},
    movements: [],
    processedKeys: {},
    schemaVersion: SCHEMA_VERSION,
  };
}

const PLAN_DURATIONS: Record<Subscription["planId"], number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export function activateSubscription(planId: Subscription["planId"], label: string, price: number) {
  const now = Date.now();
  const days = PLAN_DURATIONS[planId];
  // Si déjà actif, on prolonge à partir de la date d'expiration
  const base = state.subscription && state.subscription.expiresAt > now ? state.subscription.expiresAt : now;
  state.subscription = {
    planId,
    label,
    price,
    startedAt: state.subscription?.startedAt ?? now,
    expiresAt: base + days * 24 * 60 * 60 * 1000,
    autoRenew: true,
  };
  emit();
}

export function cancelSubscription() {
  if (!state.subscription) return;
  state.subscription = { ...state.subscription, autoRenew: false };
  emit();
}

export function isSubscriptionActive(): boolean {
  return !!state.subscription && state.subscription.expiresAt > Date.now();
}

function ensureSalt(): string {
  if (!state.pinSalt) {
    state.pinSalt = randomSaltHex();
    persist();
  }
  return state.pinSalt;
}

export const SERVER_SNAPSHOT: State = defaultState();
let state: State = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();


function load(): State {
  try {
    const key = storageKey();
    let raw = safeGetItem(key);
    // Migration : si rien sous la clé namespacée mais des données sous l'ancienne
    // clé globale, on les rattache au compte courant puis on purge la clé legacy
    // pour qu'aucun nouvel utilisateur n'en hérite par la suite.
    if (!raw && key !== LEGACY_STORAGE_KEY) {
      const legacy = safeGetItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        safeSetItem(key, legacy);
        raw = legacy;
      }
      safeRemoveItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = runMigrations(parsed, SCHEMA_VERSION);
    // Merge avec defaultState pour récupérer les nouveaux champs ajoutés
    // après la dernière migration sans casser l'état utilisateur.
    return { ...defaultState(), ...migrated, walletBlocked: 0 } as State;
  } catch {
    return defaultState();
  }
}

export function hydratePayments() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
  maybeAutoRenew();
  listeners.forEach((l) => l());
}

function persist() {
  safeSetItem(storageKey(), JSON.stringify(state));
}

function emit() {
  // Force une nouvelle référence pour que useSyncExternalStore détecte le
  // changement (Object.is). Sans ça, les mutations en place sur state.cart,
  // state.orders, etc. ne déclenchent aucun re-render.
  state = { ...state };
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): State {
  return state;
}

/** Synchronise le solde local depuis la source de vérité serveur (Edge Function /wallet). */
export function syncWalletFromServer(balance: number) {
  if (typeof balance !== "number" || !Number.isFinite(balance)) return;
  if (state.walletBalance === balance) return;
  state = { ...state, walletBalance: balance };
  emit();
}

function genId(prefix: string): string {
  const n = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  return `${prefix}-${n}`;
}

function nowParts(): { date: string; time: string; ts: number } {
  const d = new Date();
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { date, time, ts: d.getTime() };
}

/* ─── CART ─── */

export function addToCart(item: CartItem) {
  const existing = state.cart.find((i) => i.id === item.id);
  if (existing) {
    state.cart = state.cart.map((i) =>
      i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
    );
  } else {
    state.cart = [...state.cart, item];
  }
  emit();
}

export function removeFromCart(id: CartItem["id"]) {
  state.cart = state.cart.filter((i) => i.id !== id);
  emit();
}

export type QtyChange =
  | { ok: true; quantity: number }
  | { ok: false; reason: "moq" | "stock" | "missing"; min?: number; max?: number };

export function updateCartQty(id: CartItem["id"], delta: number): QtyChange {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return { ok: false, reason: "missing" };
  const min = item.moq ?? 1;
  const desired = item.quantity + delta;
  const stockCap = state.stock[String(id)];
  if (desired < min) {
    return { ok: false, reason: "moq", min };
  }
  if (stockCap !== undefined && desired > stockCap) {
    return { ok: false, reason: "stock", max: stockCap };
  }
  state.cart = state.cart.map((i) => (i.id === id ? { ...i, quantity: desired } : i));
  emit();
  return { ok: true, quantity: desired };
}

export function setCartQty(id: CartItem["id"], quantity: number): QtyChange {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return { ok: false, reason: "missing" };
  const min = item.moq ?? 1;
  const stockCap = state.stock[String(id)];
  if (quantity < min) return { ok: false, reason: "moq", min };
  if (stockCap !== undefined && quantity > stockCap) return { ok: false, reason: "stock", max: stockCap };
  state.cart = state.cart.map((i) => (i.id === id ? { ...i, quantity } : i));
  emit();
  return { ok: true, quantity };
}

export function setCart(items: CartItem[]) {
  state.cart = items;
  emit();
}

export function clearCart() {
  state.cart = [];
  state.promoCode = null;
  state.promoDiscount = 0;
  emit();
}

const PROMO_CODES: Record<string, number> = {
  // Codes système
  GROS10: 0.1,
  EXTRA10: 0.1,
  CASH20: 0.2,
  WELCOME5: 0.05,
  // Codes promo affichés dans l'app (synchro avec promo-widgets / promos-page)
  BIENVENUE10: 0.1,
  BIENVENUE25: 0.25,
  VIP20: 0.2,
  BEAUTY15: 0.15,
  FLASH5K: 0.05,
  LIVFREE: 0.05,
  ORANGE1000: 0.05,
};

export function applyPromo(code: string): { ok: boolean; rate?: number; amount?: number; error?: string } {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { ok: false, error: "Code requis" };
  // Anti-cumul : un seul code à la fois (sauf si on réapplique le même)
  if (state.promoCode && state.promoCode !== c) {
    return { ok: false, error: `Code ${state.promoCode} déjà actif — retirez-le avant d'en appliquer un autre` };
  }
  const subtotal = cartSubtotal();

  // 1) Codes globaux marketplace
  const rate = PROMO_CODES[c];
  if (rate) {
    state.promoCode = c;
    state.promoDiscount = Math.round(subtotal * rate);
    emit();
    return { ok: true, rate };
  }

  // 2) Codes vendeur (MyPromo) : on cherche dans tous les shopSlug présents au panier
  try {
    // import paresseux pour éviter les cycles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const promos = require("../data/my-promos") as typeof import("../data/my-promos");
    promos.hydrateMyPromos();
    const shopSlugs = new Set<string>();
    for (const it of state.cart) {
      const v = it.vendorId ?? it.seller;
      if (typeof v === "string" && v) shopSlugs.add(v);
    }
    const today = new Date().toISOString().slice(0, 10);
    for (const slug of shopSlugs) {
      const list = promos.listMyPromos(slug);
      const found = list.find((p) => p.code === c);
      if (!found) continue;
      if (!found.active) {
        return { ok: false, error: "Code désactivé par le vendeur" };
      }
      if (found.startsAt && today < found.startsAt) {
        return { ok: false, error: `Code valable à partir du ${found.startsAt}` };
      }
      if (found.endsAt && today > found.endsAt) {
        return { ok: false, error: `Code expiré (terminé le ${found.endsAt})` };
      }
      if (found.maxUses != null && found.usedCount >= found.maxUses) {
        return { ok: false, error: "Code épuisé (limite d'utilisation atteinte)" };
      }
      // Sous-total restreint aux items du shopSlug ciblé
      const subShop = state.cart
        .filter((it) => (it.vendorId ?? it.seller) === slug)
        .reduce((s, it) => s + it.price * it.quantity, 0);
      if (found.minOrder && subShop < found.minOrder) {
        return { ok: false, error: `Commande minimum ${found.minOrder.toLocaleString("fr-FR")} FCFA pour ce code` };
      }
      const discount = found.type === "percent"
        ? Math.round(subShop * (found.value / 100))
        : Math.min(found.value, subShop);
      state.promoCode = c;
      state.promoDiscount = discount;
      emit();
      return found.type === "percent"
        ? { ok: true, rate: found.value / 100 }
        : { ok: true, amount: found.value };
    }
  } catch { /* import / lookup failure */ }

  return { ok: false, error: "Code promo invalide" };
}

/** Incrémente le compteur d'usage d'un code vendeur après création de commande. */
export function consumePromoOnOrder(code: string | null | undefined) {
  if (!code) return;
  const c = code.trim().toUpperCase();
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const promos = require("../data/my-promos") as typeof import("../data/my-promos");
    promos.hydrateMyPromos();
    const shopSlugs = new Set<string>();
    for (const it of state.cart) {
      const v = it.vendorId ?? it.seller;
      if (typeof v === "string" && v) shopSlugs.add(v);
    }
    for (const slug of shopSlugs) {
      const list = promos.listMyPromos(slug);
      const found = list.find((p) => p.code === c);
      if (found) {
        promos.updateMyPromo(found.id, { usedCount: (found.usedCount ?? 0) + 1 });
        return;
      }
    }
  } catch { /* silent */ }
}

export function clearPromo() {
  state.promoCode = null;
  state.promoDiscount = 0;
  emit();
}

export function cartSubtotal(): number {
  return state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
}

/* ─── PIN ─── */

export const PIN_MAX_ATTEMPTS = 3;
export const PIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function isPinLocked(): { locked: boolean; remainingMs: number } {
  const until = state.pinLockedUntil;
  if (!until) return { locked: false, remainingMs: 0 };
  const remaining = until - Date.now();
  if (remaining <= 0) {
    // Verrou expiré : on réinitialise
    state.pinLockedUntil = null;
    state.pinFailures = 0;
    emit();
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

export type PinCheck =
  | { ok: true }
  | { ok: false; reason: "locked"; remainingMs: number }
  | { ok: false; reason: "wrong"; attemptsLeft: number; lockedNow: boolean };


/** Vérifie le PIN en gérant le compteur d'échecs et le verrouillage. */
export async function verifyPinWithLock(pin: string): Promise<PinCheck> {
  const lock = isPinLocked();
  if (lock.locked) return { ok: false, reason: "locked", remainingMs: lock.remainingMs };

  // Vérif serveur prioritaire si session + PIN serveur configuré. Fallback
  // silencieux sur la vérif locale (PBKDF2) en cas d'absence/erreur réseau.
  try {
    const token = await getAccessToken();
    if (token) {
      const status = await fetchPinStatus().catch(() => null);
      if (status?.hasPin) {
        if (status.lockedUntil && status.lockedUntil > Date.now()) {
          state.pinLockedUntil = status.lockedUntil;
          emit();
          return { ok: false, reason: "locked", remainingMs: status.lockedUntil - Date.now() };
        }
        const r = await verifyPinServer(pin);
        if (r.ok) {
          state.pinFailures = 0;
          state.pinLockedUntil = null;
          emit();
          return { ok: true };
        }
        if (r.lockedUntil && r.lockedUntil > Date.now()) {
          state.pinLockedUntil = r.lockedUntil;
          state.pinFailures = PIN_MAX_ATTEMPTS;
          emit();
          return { ok: false, reason: "locked", remainingMs: r.lockedUntil - Date.now() };
        }
        const attemptsLeft = typeof r.remaining === "number" ? r.remaining : Math.max(0, PIN_MAX_ATTEMPTS - state.pinFailures - 1);
        state.pinFailures = Math.max(state.pinFailures + 1, PIN_MAX_ATTEMPTS - attemptsLeft);
        emit();
        return { ok: false, reason: "wrong", attemptsLeft, lockedNow: attemptsLeft === 0 };
      }
    }
  } catch (e) {
    logger.warn(`verifyPin server fallback: ${(e as Error)?.message}`);
  }

  const salt = ensureSalt();
  const stored = state.pinHash;
  const match = stored !== null && (await pinMatches(pin, stored, salt));

  if (match) {
    // Migration transparente : si le hash stocké est encore legacy, on le
    // remplace immédiatement par un dérivé PBKDF2.
    if (stored && !stored.startsWith("v2:")) {
      state.pinHash = await derivePin(pin, salt);
    }
    if (state.pinFailures !== 0 || (stored && !stored.startsWith("v2:"))) {
      state.pinFailures = 0;
      emit();
    }
    return { ok: true };
  }

  state.pinFailures += 1;
  const lockedNow = state.pinFailures >= PIN_MAX_ATTEMPTS;
  if (lockedNow) {
    state.pinLockedUntil = Date.now() + PIN_LOCK_DURATION_MS;
  }
  emit();
  return {
    ok: false,
    reason: "wrong",
    attemptsLeft: Math.max(0, PIN_MAX_ATTEMPTS - state.pinFailures),
    lockedNow,
  };
}

/** Compatibilité : utilisé en interne par les paiements. */
export async function verifyPin(pin: string): Promise<boolean> {
  return (await verifyPinWithLock(pin)).ok;
}

export async function changePin(
  currentPin: string,
  nextPin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{4}$/.test(nextPin)) return { ok: false, error: "Le nouveau PIN doit contenir 4 chiffres" };
  const check = await verifyPinWithLock(currentPin);
  if (!check.ok) {
    if (check.reason === "locked") {
      return { ok: false, error: `PIN verrouillé. Réessayez dans ${Math.ceil(check.remainingMs / 60000)} min` };
    }
    if (check.lockedNow) {
      return { ok: false, error: "Trop d'échecs. PIN verrouillé pendant 15 minutes" };
    }
    return { ok: false, error: `PIN actuel incorrect. ${check.attemptsLeft} essai(s) restant(s)` };
  }
  const salt = ensureSalt();
  state.pinHash = await derivePin(nextPin, salt);
  state.pinFailures = 0;
  state.pinLockedUntil = null;
  emit();
  mirrorPinToServer(nextPin);
  return { ok: true };
}

export function resetPinLock() {
  state.pinFailures = 0;
  state.pinLockedUntil = null;
  emit();
}

/* ─── ACTIVATION COMPTE IPPOO CASH ───
   Premier setup : génère un salt unique, dérive le hash PIN PBKDF2 et une
   empreinte de "clé de compte" unique (PBKDF2 du PIN + identifiant compte +
   salt). Tant que walletActivated=false, aucun paiement n'est possible. */

export function isWalletActivated(): boolean {
  return state.walletActivated === true;
}

export async function setupWalletPin(
  pin: string,
  confirm: string,
  accountId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (state.walletActivated) {
    return { ok: false, error: "Compte déjà activé. Utilisez Paramètres pour changer le PIN." };
  }
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: "Le PIN doit contenir 4 chiffres" };
  if (pin !== confirm) return { ok: false, error: "Les deux PIN ne correspondent pas" };
  if (/^(\d)\1{3}$/.test(pin)) return { ok: false, error: "PIN trop simple (chiffres identiques)" };
  if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(pin)) {
    return { ok: false, error: "PIN trop simple (séquence évidente)" };
  }
  if (!accountId || accountId.length < 8) return { ok: false, error: "Identifiant de compte manquant" };

  const salt = randomSaltHex(16);
  state.pinSalt = salt;
  state.pinHash = await derivePin(pin, salt);
  state.walletKeyHash = await derivePin(`${pin}:${accountId}`, salt);
  state.walletActivated = true;
  state.pinFailures = 0;
  state.pinLockedUntil = null;
  emit();
  mirrorPinToServer(pin);
  return { ok: true };
}

/* ─── ABONNEMENT VIP ─── */

export type SubscriptionPayResult =
  | { ok: true; txnId: string; invoiceId: string; subscription: Subscription }
  | { ok: false; error: string };

let subscriptionInFlight = false;

export async function paySubscription(
  planId: Subscription["planId"],
  label: string,
  price: number,
  payMethod: PayMethod,
  pin?: string,
  bioVerified?: boolean,
): Promise<SubscriptionPayResult> {
  if (subscriptionInFlight) return { ok: false, error: "Paiement déjà en cours" };
  subscriptionInFlight = true;
  try {
    await new Promise((r) => setTimeout(r, 800));
    if (price <= 0) return { ok: false, error: "Montant invalide" };
    if (payMethod === "cod") return { ok: false, error: "Paiement à la livraison indisponible pour les abonnements" };

    if (payMethod === "wallet") {
      if (!bioVerified) {
        if (!pin) return { ok: false, error: "Code PIN requis" };
        const check = await verifyPinWithLock(pin);
        if (!check.ok) {
          if (check.reason === "locked")
            return { ok: false, error: `PIN verrouillé. Réessayez dans ${Math.ceil(check.remainingMs / 60000)} min` };
          if (check.lockedNow)
            return { ok: false, error: "Trop d'échecs. PIN verrouillé pendant 15 minutes" };
          return { ok: false, error: `Code PIN incorrect. ${check.attemptsLeft} essai(s) restant(s)` };
        }
      }
      const dispo = state.walletBalance - state.walletBlocked;
      if (price > dispo) return { ok: false, error: "Solde IPPOO CASH insuffisant" };
      state.walletBalance -= price;
    }

    const now = Date.now();
    const wasActive = !!state.subscription && state.subscription.expiresAt > now;
    const days = PLAN_DURATIONS[planId];
    const base = wasActive ? state.subscription!.expiresAt : now;
    const next: Subscription = {
      planId,
      label,
      price,
      startedAt: state.subscription?.startedAt ?? now,
      expiresAt: base + days * 24 * 60 * 60 * 1000,
      autoRenew: true,
    };
    state.subscription = next;

    const txnId = genId("TXN");
    const invoiceId = genId("INV");
    const { date, time, ts } = nowParts();
    const methodLabel: Record<PayMethod, string> = {
      wallet: "IPPOO CASH",
      mobile: "Mobile Money",
      card: "Carte bancaire",
      cod: "Paiement à la livraison",
      qr: "QR Code",
    };
    state.transactions = [
      {
        id: txnId,
        type: "debit",
        label: `${wasActive ? "Renouvellement" : "Abonnement"} VIP ${label}`,
        amount: -price,
        date,
        time,
        method: methodLabel[payMethod],
        status: "success",
        ref: txnId,
        ts,
      },
      ...state.transactions,
    ];
    state.invoices = [
      { id: invoiceId, orderId: txnId, total: price, date, status: "paid", ts },
      ...state.invoices,
    ];
    emit();
    return { ok: true, txnId, invoiceId, subscription: next };
  } finally {
    subscriptionInFlight = false;
  }
}

function maybeAutoRenew() {
  const sub = state.subscription;
  if (!sub) return;
  const now = Date.now();
  if (sub.expiresAt > now) return;
  if (!sub.autoRenew) return;
  const dispo = state.walletBalance - state.walletBlocked;
  if (sub.price > dispo) {
    state.subscription = { ...sub, autoRenew: false };
    emit();
    return;
  }
  state.walletBalance -= sub.price;
  const days = PLAN_DURATIONS[sub.planId];
  state.subscription = { ...sub, expiresAt: now + days * 24 * 60 * 60 * 1000 };
  const txnId = genId("TXN");
  const invoiceId = genId("INV");
  const { date, time, ts } = nowParts();
  state.transactions = [
    {
      id: txnId,
      type: "debit",
      label: `Renouvellement auto VIP ${sub.label}`,
      amount: -sub.price,
      date,
      time,
      method: "IPPOO CASH",
      status: "success",
      ref: txnId,
      ts,
    },
    ...state.transactions,
  ];
  state.invoices = [
    { id: invoiceId, orderId: txnId, total: sub.price, date, status: "paid", ts },
    ...state.invoices,
  ];
  emit();
}

/* ─── QR PAYMENTS ─── */

export type QRPayResult =
  | { ok: true; txnId: string; date: string; time: string }
  | { ok: false; error: string; deficit?: number };

let qrInFlight = false;

export async function payQR(
  vendor: string,
  amount: number,
  pin: string,
): Promise<QRPayResult> {
  if (qrInFlight) return { ok: false, error: "Paiement déjà en cours" };
  qrInFlight = true;
  try {
    await new Promise((r) => setTimeout(r, 700));
    if (!vendor.trim()) return { ok: false, error: "Vendeur requis" };
    if (!Number.isFinite(amount) || amount < 100)
      return { ok: false, error: "Montant minimum : 100 FCFA" };
    if (amount > 5_000_000) return { ok: false, error: "Plafond QR : 5 000 000 FCFA" };
    if (!pin) return { ok: false, error: "Code PIN requis" };

    const check = await verifyPinWithLock(pin);
    if (!check.ok) {
      if (check.reason === "locked")
        return { ok: false, error: `PIN verrouillé. Réessayez dans ${Math.ceil(check.remainingMs / 60000)} min` };
      if (check.lockedNow)
        return { ok: false, error: "Trop d'échecs. PIN verrouillé pendant 15 minutes" };
      return { ok: false, error: `Code PIN incorrect. ${check.attemptsLeft} essai(s) restant(s)` };
    }

    const dispo = state.walletBalance - state.walletBlocked;
    if (amount > dispo) return { ok: false, error: "Solde IPPOO CASH insuffisant" };
    state.walletBalance -= amount;

    const txnId = genId("QR");
    const { date, time, ts } = nowParts();
    state.transactions = [
      {
        id: txnId,
        type: "debit",
        label: `Paiement QR · ${vendor}`,
        amount: -amount,
        date,
        time,
        method: "QR Code",
        status: "success",
        ref: txnId,
        ts,
      },
      ...state.transactions,
    ];
    emit();
    return { ok: true, txnId, date, time };
  } finally {
    qrInFlight = false;
  }
}

/* ─── PAIEMENT INSTANTANÉ IPPOO CASH (scan QR sans friction) ─── */

export type InstantPayResult =
  | { ok: true; txnId: string; date: string; time: string }
  | { ok: false; error: string; deficit?: number };

/**
 * Débite immédiatement le solde IPPOO CASH pour un scan QR.
 * Aucun PIN, aucun écran intermédiaire — flux le plus court possible.
 * Si solde insuffisant, retourne le `deficit` pour proposer la recharge.
 */
export function payWalletInstant(opts: {
  amount: number;
  label: string;
  vendor?: string;
}): InstantPayResult {
  const amount = Math.max(0, Math.round(opts.amount));
  if (!state.walletActivated) {
    return { ok: false, error: "Active ton compte IPPOO CASH (PIN) avant de payer" };
  }
  if (!Number.isFinite(amount) || amount < 100) {
    return { ok: false, error: "Montant minimum : 100 FCFA" };
  }
  if (amount > 5_000_000) {
    return { ok: false, error: "Plafond QR : 5 000 000 FCFA" };
  }
  const dispo = state.walletBalance - state.walletBlocked;
  if (amount > dispo) {
    return { ok: false, error: "Solde IPPOO CASH insuffisant", deficit: amount - dispo };
  }
  state.walletBalance -= amount;
  const txnId = genId("QR");
  const { date, time, ts } = nowParts();
  state.transactions = [
    {
      id: txnId,
      type: "debit",
      label: opts.label,
      amount: -amount,
      date,
      time,
      method: "QR Code",
      status: "success",
      ref: txnId,
      ts,
    },
    ...state.transactions,
  ];
  emit();
  pushNotification({
    type: "payment",
    title: "Paiement IPPOO CASH confirmé",
    desc: `${opts.label} · ${amount.toLocaleString("fr-FR")} FCFA débités`,
    link: `/transactions`,
    color: "#00B341",
  });
  return { ok: true, txnId, date, time };
}

/* ─── PAIEMENTS ─── */

export type PayResult =
  | { ok: true; orderId: string; txnId: string; invoiceId?: string; fedapayRef?: string }
  | { ok: false; error: string };

export type PayInput = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  address: Order["address"];
  shippingMode: Order["shippingMode"];
  payMethod: PayMethod;
  pin?: string;
  mobileProvider?: MobileProvider;
  mobilePhone?: string;
  card?: { last4: string; brand: string };
  /** Clé d'idempotence côté client. Si omise, une clé est générée. */
  idempotencyKey?: string;
  /** Si vrai, la biométrie a déjà validé la présence : on saute le PIN. */
  bioVerified?: boolean;
};

const PROCESSED_KEYS_CAP = 100;

function rememberProcessed(key: string, result: { orderId: string; txnId: string; invoiceId?: string }) {
  const entries = Object.entries(state.processedKeys);
  if (entries.length >= PROCESSED_KEYS_CAP) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    state.processedKeys = Object.fromEntries(entries.slice(-PROCESSED_KEYS_CAP + 1));
  }
  state.processedKeys[key] = { ...result, ts: Date.now() };
}

let processInFlight: Set<string> = new Set();

export async function processPayment(input: PayInput): Promise<PayResult> {
  const idemKey = input.idempotencyKey ?? genId("IDEM");

  // 1) Déjà traité : on renvoie le résultat mémorisé sans re-débiter.
  const cached = state.processedKeys[idemKey];
  if (cached) {
    return { ok: true, orderId: cached.orderId, txnId: cached.txnId, invoiceId: cached.invoiceId };
  }
  // 2) En cours dans le même onglet : on bloque le double-clic.
  if (processInFlight.has(idemKey)) {
    return { ok: false, error: "Paiement déjà en cours" };
  }
  processInFlight.add(idemKey);

  try {
    // Latence simulée pour l'effet "réseau"
    await new Promise((r) => setTimeout(r, 800));

    if (input.total <= 0) return { ok: false, error: "Montant invalide" };
    if (!input.items.length) return { ok: false, error: "Panier vide" };

  if (input.payMethod === "wallet") {
    if (!input.bioVerified) {
      if (!input.pin) return { ok: false, error: "Code PIN requis" };
      const check = await verifyPinWithLock(input.pin);
      if (!check.ok) {
        if (check.reason === "locked")
          return { ok: false, error: `PIN verrouillé. Réessayez dans ${Math.ceil(check.remainingMs / 60000)} min` };
        if (check.lockedNow)
          return { ok: false, error: "Trop d'échecs. PIN verrouillé pendant 15 minutes" };
        return { ok: false, error: `Code PIN incorrect. ${check.attemptsLeft} essai(s) restant(s)` };
      }
    }
    const dispo = state.walletBalance - state.walletBlocked;
    if (input.total > dispo) {
      return { ok: false, error: "Solde IPPOO CASH insuffisant" };
    }
    state.walletBalance -= input.total;
  }

  // Paiement direct via Fedapay (Mobile Money / carte) — n'exige pas de solde IPPOO CASH.
  let fedapayRef: string | undefined;
  if (input.payMethod === "mobile" || input.payMethod === "card") {
    const { chargeViaFedapay } = await import("./fedapay");
    const charge = input.payMethod === "mobile"
      ? await chargeViaFedapay(input.total, {
          channel: "mobile",
          phone: input.mobilePhone ?? "",
          operator: (input.mobileProvider === "moov" ? "moov" : "mtn"),
          otp: "0000",
        })
      : await chargeViaFedapay(input.total, {
          channel: "card",
          last4: input.card?.last4 ?? "0000",
          brand: input.card?.brand ?? "visa",
        });
    if (!charge.ok) return { ok: false, error: charge.error };
    fedapayRef = charge.reference;
  }

  const orderId = genId("CMD");
  const txnId = genId("TXN");
  const invoiceId = input.payMethod === "cod" ? undefined : genId("INV");
  const { date, time, ts } = nowParts();

  // Escrow : pour tout paiement encaissé immédiatement (wallet/card/mobile/qr)
  // les fonds sont retenus jusqu'à livraison. COD n'a pas d'escrow.
  const escrowStatus: EscrowStatus = input.payMethod === "cod" ? "n/a" : "held";

  const order: Order = {
    id: orderId,
    createdAt: ts,
    items: input.items,
    subtotal: input.subtotal,
    shipping: input.shipping,
    discount: input.discount,
    total: input.total,
    address: input.address,
    shippingMode: input.shippingMode,
    payMethod: input.payMethod,
    status: "preparation",
    paid: input.payMethod !== "cod",
    txnId,
    invoiceId,
    escrowStatus,
    idempotencyKey: idemKey,
  };

  const methodLabel: Record<PayMethod, string> = {
    wallet: "IPPOO CASH",
    mobile: input.mobileProvider ? MOBILE_PROVIDER_LABEL[input.mobileProvider] : "Mobile Money",
    card: input.card ? `Carte ${input.card.brand.toUpperCase()} •••• ${input.card.last4}` : "Carte bancaire",
    cod: "Paiement à la livraison",
    qr: "QR Code",
  };

  const txn: Transaction = {
    id: txnId,
    type: "debit",
    label: `Paiement ${orderId}${fedapayRef ? ` · ${fedapayRef}` : ""}`,
    amount: -input.total,
    date,
    time,
    method: methodLabel[input.payMethod],
    status: input.payMethod === "cod" ? "pending" : "success",
    ref: orderId,
    ts,
  };

  state.orders = [order, ...state.orders];
  state.transactions = [txn, ...state.transactions];

  // Décrément du stock + journal des mouvements (un mouvement par ligne).
  const newMovements: StockMovement[] = [];
  for (const it of input.items) {
    const key = String(it.id);
    const current = state.stock[key];
    if (current !== undefined) {
      state.stock[key] = Math.max(0, current - it.quantity);
    }
    newMovements.push({
      id: genId("MVT"),
      productId: it.id,
      uid: it.uid ?? key,
      vendorId: it.vendorId,
      vendorName: it.vendorName ?? it.seller,
      delta: -it.quantity,
      reason: "sale",
      ref: orderId,
      ts,
      date,
    });
  }
  state.movements = [...newMovements, ...state.movements];

  if (invoiceId) {
    const lines: InvoiceLine[] = input.items.map((it) => ({
      productId: it.id,
      uid: it.uid ?? String(it.id),
      name: it.name,
      category: it.category,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.price,
      total: it.price * it.quantity,
      vendorId: it.vendorId,
      vendorName: it.vendorName ?? it.seller,
    }));
    const vendorAgg = new Map<string, { vendorId: string; vendorName: string; subtotal: number }>();
    for (const l of lines) {
      const key = l.vendorId ?? l.vendorName ?? "—";
      const cur = vendorAgg.get(key) ?? { vendorId: l.vendorId ?? key, vendorName: l.vendorName ?? "—", subtotal: 0 };
      cur.subtotal += l.total;
      vendorAgg.set(key, cur);
    }
    const inv: Invoice = {
      id: invoiceId,
      orderId,
      total: input.total,
      date,
      status: input.payMethod === "cod" ? "pending" : "paid",
      ts,
      lines,
      vendorRefs: Array.from(vendorAgg.values()),
      buyer: { name: input.address.name, phone: input.address.phone, city: input.address.city, line: input.address.line },
      payMethod: input.payMethod,
    };
    state.invoices = [inv, ...state.invoices];
  }

  // Nettoyage du panier après paiement réussi
  clearCart();
  rememberProcessed(idemKey, { orderId, txnId, invoiceId });
  emit();
  pushNotification({
    type: "order",
    title: input.payMethod === "cod" ? "Commande enregistrée" : "Paiement confirmé",
    desc: `${orderId} · ${input.total.toLocaleString("fr-FR")} FCFA · ${input.items.length} article${input.items.length > 1 ? "s" : ""}`,
    link: `/commande/${orderId}`,
    color: input.payMethod === "cod" ? "#FF6B00" : "#00B341",
  });

    return { ok: true, orderId, txnId, invoiceId, fedapayRef };
  } finally {
    processInFlight.delete(idemKey);
  }
}

/* ─── WALLET ─── */

export async function rechargeWallet(
  amount: number,
  method: "mobile" | "card" | "qr",
  meta?: { phone?: string; cardLast4?: string; operator?: "mtn" | "moov" | "celtis" | "wave" | "orange"; otp?: string; brand?: string },
): Promise<PayResult & { fedapayRef?: string }> {
  if (amount < 500) return { ok: false, error: "Montant minimum : 500 FCFA" };
  if (amount > 5_000_000) return { ok: false, error: "Plafond de recharge dépassé" };

  let fedapayRef: string | undefined;
  if (method === "mobile") {
    const { chargeViaFedapay } = await import("./fedapay");
    const r = await chargeViaFedapay(amount, {
      channel: "mobile",
      phone: meta?.phone ?? "",
      operator: meta?.operator ?? "mtn",
      otp: meta?.otp ?? "0000",
    });
    if (!r.ok) return { ok: false, error: r.error };
    fedapayRef = r.reference;
  } else if (method === "card") {
    const { chargeViaFedapay } = await import("./fedapay");
    const r = await chargeViaFedapay(amount, {
      channel: "card",
      last4: meta?.cardLast4 ?? "0000",
      brand: meta?.brand ?? "visa",
    });
    if (!r.ok) return { ok: false, error: r.error };
    fedapayRef = r.reference;
  } else {
    await new Promise((r) => setTimeout(r, 600));
  }

  state.walletBalance += amount;
  const txnId = genId("RCH");
  const { date, time, ts } = nowParts();
  const label =
    method === "mobile"
      ? `Recharge ${meta?.operator ? MOBILE_PROVIDER_LABEL[meta.operator] : "Mobile Money"}${meta?.phone ? ` · ${meta.phone}` : ""}`
      : method === "card"
        ? `Recharge Carte ${meta?.cardLast4 ? `****${meta.cardLast4}` : ""}`.trim()
        : "Recharge QR Code";
  const txn: Transaction = {
    id: txnId,
    type: "credit",
    label,
    amount,
    date,
    time,
    method: method === "mobile" ? "Mobile Money" : method === "card" ? "Carte" : "QR Code",
    status: "success",
    ref: txnId,
    ts,
  };
  state.transactions = [txn, ...state.transactions];
  emit();
  pushNotification({
    type: "bonus",
    title: "Recharge IPPOO CASH",
    desc: `+${amount.toLocaleString("fr-FR")} FCFA crédités · ${label}`,
    link: "/wallet",
    color: "#00B341",
  });
  return { ok: true, orderId: "", txnId, fedapayRef };
}

export async function withdrawWallet(
  amount: number,
  pin: string,
  destination: string,
): Promise<PayResult> {
  await new Promise((r) => setTimeout(r, 700));
  const check = await verifyPinWithLock(pin);
  if (!check.ok) {
    if (check.reason === "locked")
      return { ok: false, error: `PIN verrouillé. Réessayez dans ${Math.ceil(check.remainingMs / 60000)} min` };
    if (check.lockedNow)
      return { ok: false, error: "Trop d'échecs. PIN verrouillé pendant 15 minutes" };
    return { ok: false, error: `Code PIN incorrect. ${check.attemptsLeft} essai(s) restant(s)` };
  }
  if (amount < 1000) return { ok: false, error: "Montant minimum de retrait : 1 000 FCFA" };
  const dispo = state.walletBalance - state.walletBlocked;
  if (amount > dispo) return { ok: false, error: "Solde insuffisant" };
  state.walletBalance -= amount;
  const txnId = genId("WDR");
  const { date, time, ts } = nowParts();
  const txn: Transaction = {
    id: txnId,
    type: "debit",
    label: `Retrait vers ${destination}`,
    amount: -amount,
    date,
    time,
    method: "Retrait",
    status: "success",
    ref: txnId,
    ts,
  };
  state.transactions = [txn, ...state.transactions];
  emit();
  pushNotification({
    type: "payment",
    title: "Retrait IPPOO CASH",
    desc: `-${amount.toLocaleString("fr-FR")} FCFA vers ${destination}`,
    link: "/wallet",
    color: "#FF6B00",
  });
  return { ok: true, orderId: "", txnId };
}

/** Crédit "interne" (bonus, cadeau, parrainage…) sans passage par un opérateur. */
export function creditWalletBonus(amount: number, label: string, opts?: { silentNotif?: boolean }) {
  if (amount <= 0) return;
  state.walletBalance += amount;
  const txnId = genId("BNS");
  const { date, time, ts } = nowParts();
  const txn: Transaction = {
    id: txnId,
    type: "credit",
    label,
    amount,
    date,
    time,
    method: "Bonus IPPOO",
    status: "success",
    ref: txnId,
    ts,
  };
  state.transactions = [txn, ...state.transactions];
  emit();
  if (!opts?.silentNotif) {
    pushNotification({
      type: "bonus",
      title: "Bonus crédité",
      desc: `+${amount.toLocaleString("fr-FR")} FCFA · ${label}`,
      link: "/wallet",
      priority: "high",
    });
  }
}

/* ─── ORDERS ─── */

const STATUS_NOTIF: Record<OrderStatus, { title: string; type: NotifType; color: string } | null> = {
  preparation: { title: "Commande en préparation", type: "order",    color: "#FF6B00" },
  expedition:  { title: "Commande expédiée",       type: "delivery", color: "#0066FF" },
  livree:      { title: "Commande livrée",         type: "delivery", color: "#16A34A" },
  cloturee:    { title: "Commande clôturée",       type: "order",    color: "#16A34A" },
  litige:      { title: "Litige ouvert",           type: "system",   color: "#E11D2E" },
  annulee:     null,
};

export function updateOrderStatus(id: string, status: OrderStatus) {
  const before = state.orders.find((o) => o.id === id);
  state.orders = state.orders.map((o) => {
    if (o.id !== id) return o;
    let escrow = o.escrowStatus;
    // Transitions escrow : libéré dès qu'on a la preuve de livraison /
    // clôture sans litige. Le litige gèle l'escrow ; l'annulation passe par
    // cancelOrder().
    if (escrow === "held" && (status === "livree" || status === "cloturee")) {
      escrow = "released";
    }
    return { ...o, status, escrowStatus: escrow };
  });
  emit();
  if (before && before.status !== status) {
    const meta = STATUS_NOTIF[status];
    if (meta) {
      pushNotification({
        type: meta.type,
        title: meta.title,
        desc: `${id} · ${before.total.toLocaleString("fr-FR")} FCFA`,
        link: `/commande/${id}`,
        color: meta.color,
      });
    }
  }
}

export function cancelOrder(id: string): PayResult {
  const o = state.orders.find((x) => x.id === id);
  if (!o) return { ok: false, error: "Commande introuvable" };
  if (o.status !== "preparation")
    return { ok: false, error: "Cette commande ne peut plus être annulée" };
  // Remboursement automatique si payé via wallet
  if (o.paid && o.payMethod === "wallet") {
    state.walletBalance += o.total;
    const txnId = genId("RMB");
    const { date, time, ts } = nowParts();
    state.transactions = [
      {
        id: txnId,
        type: "credit",
        label: `Remboursement ${o.id}`,
        amount: o.total,
        date,
        time,
        method: "IPPOO CASH",
        status: "success",
        ref: o.id,
        ts,
      },
      ...state.transactions,
    ];
  }
  state.orders = state.orders.map((x) =>
    x.id === id
      ? {
          ...x,
          status: "annulee" as OrderStatus,
          escrowStatus: (x.escrowStatus === "held" ? "refunded" : x.escrowStatus) as EscrowStatus,
        }
      : x,
  );
  emit();
  pushNotification({
    type: "order",
    title: "Commande annulée",
    desc: o.paid && o.payMethod === "wallet"
      ? `${id} · Remboursement ${o.total.toLocaleString("fr-FR")} FCFA crédité`
      : `${id} a été annulée`,
    link: `/commande/${id}`,
    color: "#E11D2E",
  });
  return { ok: true, orderId: id, txnId: "" };
}

export function openDispute(id: string, reason: string, details?: string): PayResult {
  const o = state.orders.find((x) => x.id === id);
  if (!o) return { ok: false, error: "Commande introuvable" };
  if (o.dispute && o.dispute.status === "open")
    return { ok: false, error: "Un litige est déjà ouvert sur cette commande" };
  if (o.status === "annulee")
    return { ok: false, error: "Commande annulée : litige impossible" };
  const openedAt = Date.now();
  state.orders = state.orders.map((x) =>
    x.id === id
      ? {
          ...x,
          status: "litige" as OrderStatus,
          escrowStatus: x.escrowStatus === "held" ? "held" : x.escrowStatus,
          dispute: { reason, details, openedAt, status: "open" as const },
        }
      : x,
  );
  emit();
  pushNotification({
    type: "system",
    title: "Litige ouvert",
    desc: `${id} · ${reason}`,
    link: `/commande/${id}`,
    color: "#E11D2E",
  });
  return { ok: true, orderId: id, txnId: "" };
}

/* ─── INVENTAIRE & COMPTABILITÉ ─── */

/** Stock courant (valeur surchargée). Si non suivi, renvoie le fallback. */
export function getStock(productId: number | string, fallback = 0): number {
  const v = state.stock[String(productId)];
  return v === undefined ? fallback : v;
}

/** Définit explicitement le stock (utilisé par le vendeur lors d'un ajout/correction). */
export function setStock(
  productId: number | string,
  qty: number,
  meta?: { uid?: string; vendorId?: string; vendorName?: string; reason?: "restock" | "adjustment" },
) {
  const key = String(productId);
  const prev = state.stock[key] ?? 0;
  state.stock[key] = Math.max(0, qty);
  const delta = state.stock[key] - prev;
  if (delta !== 0) {
    const { date, ts } = nowParts();
    state.movements = [
      {
        id: genId("MVT"),
        productId,
        uid: meta?.uid ?? key,
        vendorId: meta?.vendorId,
        vendorName: meta?.vendorName,
        delta,
        reason: meta?.reason ?? (delta > 0 ? "restock" : "adjustment"),
        ts,
        date,
      },
      ...state.movements,
    ];
  }
  emit();
}

/** Récupère une facture détaillée par id. */
export function getInvoice(id: string): Invoice | undefined {
  return state.invoices.find((i) => i.id === id);
}

/** Récupère la commande associée à une facture (ou directement par orderId). */
export function getOrder(id: string): Order | undefined {
  return state.orders.find((o) => o.id === id);
}


export { vendorAccounting, platformAccounting } from "./accounting";
export type { VendorPeriod, VendorAccounting } from "./accounting";
