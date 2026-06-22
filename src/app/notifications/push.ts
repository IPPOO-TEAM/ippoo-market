/* ═══════════════════════════════════════════
   IPPOO - Notifications natives (Web Notification API)
   Permet d'envoyer une notification push système quand l'utilisateur
   a donné son accord. Sinon fallback silencieux (le toast sonner +
   le centre de notifications restent affichés depuis store.ts).
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";

const PERM_KEY = "ippoo:push-permission-asked";

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPushPermission(): NotificationPermission {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export function hasBeenAsked(): boolean {
  return safeGetItem(PERM_KEY) === "1";
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  safeSetItem(PERM_KEY, "1");
  let perm: NotificationPermission = Notification.permission;
  if (perm === "default") {
    try { perm = await Notification.requestPermission(); }
    catch { perm = Notification.permission; }
  }
  if (perm === "granted") {
    // Souscrit le Web Push (fire-and-forget - n'échoue jamais bloquant)
    import("./web-push").then((m) => m.subscribeWebPush().catch(() => { /* ignore */ }));
  }
  return perm;
}

export function sendNativePush(title: string, body: string, opts?: { icon?: string; tag?: string }) {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: opts?.icon,
      tag: opts?.tag,
      badge: opts?.icon,
    });
  } catch {
    /* l'environnement peut bloquer (iframe, perms) */
  }
}
