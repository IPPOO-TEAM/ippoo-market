import { toast } from "sonner";
import { haptic } from "./haptics";

export type PermissionKind =
  | "notifications"
  | "camera"
  | "microphone"
  | "geolocation"
  | "contacts"
  | "clipboard-read"
  | "clipboard-write"
  | "persistent-storage";

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export async function queryPermission(kind: PermissionKind): Promise<PermissionState> {
  try {
    if (kind === "notifications") {
      if (!("Notification" in window)) return "unsupported";
      const s = Notification.permission;
      return s === "default" ? "prompt" : (s as PermissionState);
    }
    if (kind === "persistent-storage") {
      if (!("storage" in navigator) || !navigator.storage.persisted) return "unsupported";
      return (await navigator.storage.persisted()) ? "granted" : "prompt";
    }
    if (!("permissions" in navigator)) return "unsupported";
    const res = await navigator.permissions.query({ name: kind as PermissionName });
    return res.state as PermissionState;
  } catch {
    return "unsupported";
  }
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  haptic("selection");
  try {
    switch (kind) {
      case "notifications": {
        if (!("Notification" in window)) return "unsupported";
        const r = await Notification.requestPermission();
        const state = r === "default" ? "prompt" : (r as PermissionState);
        if (state === "granted") toast.success("Notifications activées");
        else if (state === "denied") toast.error("Notifications refusées");
        return state;
      }
      case "camera": {
        if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((t) => t.stop());
        toast.success("Accès caméra accordé");
        return "granted";
      }
      case "microphone": {
        if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
        toast.success("Accès micro accordé");
        return "granted";
      }
      case "geolocation": {
        if (!navigator.geolocation) return "unsupported";
        return await new Promise<PermissionState>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => { toast.success("Position obtenue"); resolve("granted"); },
            () => { toast.error("Localisation refusée"); resolve("denied"); },
            { timeout: 8000 }
          );
        });
      }
      case "persistent-storage": {
        if (!navigator.storage?.persist) return "unsupported";
        const ok = await navigator.storage.persist();
        return ok ? "granted" : "denied";
      }
      case "clipboard-write":
      case "clipboard-read":
        return await queryPermission(kind);
      case "contacts": {
        const win = window as Window & { ContactsManager?: unknown; navigator: Navigator & { contacts?: { select: (p: string[], o?: object) => Promise<unknown> } } };
        if (!win.navigator.contacts?.select) return "unsupported";
        return "granted";
      }
      default:
        return "unsupported";
    }
  } catch {
    toast.error("Permission refusée");
    return "denied";
  }
}

export async function pickContacts(properties: string[] = ["name", "tel", "email"]) {
  const nav = navigator as Navigator & { contacts?: { select: (p: string[], o?: { multiple?: boolean }) => Promise<Array<Record<string, string[]>>> } };
  if (!nav.contacts?.select) { toast.error("Contacts non disponibles"); return []; }
  try { return await nav.contacts.select(properties, { multiple: true }); }
  catch { return []; }
}

export async function nativeShare(data: ShareData) {
  if (!navigator.share) { toast.error("Partage non supporté"); return false; }
  try { await navigator.share(data); return true; }
  catch { return false; }
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    haptic("success");
    toast.success("Copié");
    return true;
  } catch {
    return false;
  }
}

export async function pushSubscribe(vapidPublicKey?: string): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const opts: PushSubscriptionOptionsInit = { userVisibleOnly: true };
  if (vapidPublicKey) {
    const raw = atob(vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/"));
    const buf = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
    opts.applicationServerKey = buf;
  }
  try { return await reg.pushManager.subscribe(opts); }
  catch { return null; }
}
