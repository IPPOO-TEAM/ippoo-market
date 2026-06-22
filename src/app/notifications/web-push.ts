/* ═══════════════════════════════════════════
   IPPOO - Web Push (vraies notifications système)
   Enregistre le Service Worker, souscrit le PushManager,
   transmet l'abonnement au backend.
   ═══════════════════════════════════════════ */

import { apiFetch, ApiError } from "../api/client";
import { getAccessToken } from "../auth/supabase";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";

/**
 * Résolution de la clé VAPID publique, dans cet ordre :
 *   1. variable d'environnement Vite (VITE_IPPOO_VAPID_PUBLIC)
 *   2. paramètres back-office (Admin → Paramètres → Push)
 *   3. window globale __IPPOO_VAPID_PUBLIC__ (injectée via balise script)
 *   4. chaîne vide (push désactivé en silencieux)
 *
 * Génération de la paire VAPID (à faire une fois par environnement) :
 *   npx web-push generate-vapid-keys
 * → coller la publicKey ici (env ou settings) et la privateKey côté backend
 *   dans la fonction Edge qui appelle `webpush.sendNotification`.
 */
export function getVapidPublicKey(): string {
  try {
    const env = (import.meta as { env?: Record<string, string> }).env;
    if (env?.VITE_IPPOO_VAPID_PUBLIC) return env.VITE_IPPOO_VAPID_PUBLIC;
  } catch { /* ignore */ }
  try {
    const raw = safeGetItem("ippoo:admin-settings");
    if (raw) {
      const s = JSON.parse(raw) as { vapidPublicKey?: string };
      if (s.vapidPublicKey && s.vapidPublicKey.length > 20) return s.vapidPublicKey;
    }
  } catch { /* ignore */ }
  if (typeof window !== "undefined") {
    const w = window as unknown as { __IPPOO_VAPID_PUBLIC__?: string };
    if (w.__IPPOO_VAPID_PUBLIC__) return w.__IPPOO_VAPID_PUBLIC__;
  }
  return "";
}

/** @deprecated Utiliser getVapidPublicKey() - la valeur est désormais dynamique. */
export const VAPID_PUBLIC_KEY = getVapidPublicKey();

const SW_URL = "/sw.js";
const SUB_FLAG = "ippoo:push-subscribed";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration(SW_URL)) ??
      (await navigator.serviceWorker.register(SW_URL));
    // bridge SW → app navigation
    navigator.serviceWorker.addEventListener("message", (ev) => {
      if (ev.data?.type === "ippoo:navigate" && ev.data.url) {
        window.dispatchEvent(new CustomEvent("ippoo:navigate", { detail: ev.data.url }));
      }
    });
    return reg;
  } catch (e) {
    console.warn("[push] SW register failed:", e);
    return null;
  }
}

export async function subscribeWebPush(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  if (Notification.permission !== "granted") {
    const p = await Notification.requestPermission();
    if (p !== "granted") return null;
  }
  const reg = await registerServiceWorker();
  if (!reg) return null;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = getVapidPublicKey();
    if (!key) {
      console.warn("[push] VAPID public key non configurée - push désactivé.");
      return null;
    }
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }

  try {
    if (await getAccessToken()) {
      await apiFetch("/push/subscribe", { method: "POST", body: sub.toJSON() });
      safeSetItem(SUB_FLAG, "1");
    }
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) {
      console.warn("[push] subscribe sync failed:", e);
    }
  }
  return sub;
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!isWebPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await apiFetch("/push/unsubscribe", {
      method: "POST",
      body: { endpoint: sub.endpoint },
    });
  } catch { /* ignore */ }
  await sub.unsubscribe();
  safeRemoveItem(SUB_FLAG);
}

/** À appeler une fois la session établie pour ré-aligner l'abonnement côté serveur. */
export async function syncPushSubscription(): Promise<void> {
  if (!isWebPushSupported()) return;
  if (Notification.permission !== "granted") return;
  const reg = await registerServiceWorker();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await apiFetch("/push/subscribe", { method: "POST", body: sub.toJSON() });
  } catch { /* ignore */ }
}
