// Store de notifications persistant. Pattern aligné sur payments/store.ts :
// abonnements + localStorage + emit().

import { createElement } from "react";
import { toast } from "sonner";
import {
  CreditCard, Package, Flame, Coins, Truck, Bell, Gift, Gamepad2, Trophy, Crown, Sparkles,
} from "lucide-react";
import { sendNativePush } from "./push";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

export type NotifType =
  | "payment"
  | "order"
  | "promo"
  | "bonus"
  | "delivery"
  | "system"
  | "gift"
  | "game"
  | "win"
  | "vip"
  | "welcome";

export type NotifPriority = "low" | "normal" | "high";

export type Notif = {
  id: string;
  type: NotifType;
  title: string;
  desc: string;
  ts: number;
  read: boolean;
  link?: string;
  color?: string;
  priority?: NotifPriority;
  icon?: string; // emoji ou caractère
};

const STORAGE_KEY = "ippoo:notifications";

function defaultNotifs(): Notif[] {
  return [];
}

let notifs: Notif[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

export const SERVER_SNAPSHOT: Notif[] = [];

function load(): Notif[] {
  try {
    const raw = scopedGetItem(STORAGE_KEY);
    if (!raw) return defaultNotifs();
    const parsed = JSON.parse(raw) as Notif[];
    if (!Array.isArray(parsed)) return defaultNotifs();
    return parsed;
  } catch {
    return defaultNotifs();
  }
}

function persist() {
  scopedSetItem(STORAGE_KEY, JSON.stringify(notifs));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function hydrateNotifications() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  notifs = load();
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getNotifs(): Notif[] {
  return notifs;
}

function genId(): string {
  return `N-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

const TYPE_DEFAULTS: Record<NotifType, { icon: string; color: string }> = {
  payment:  { icon: "credit-card", color: "#1FB36B" },
  order:    { icon: "package",     color: "#0066FF" },
  promo:    { icon: "flame",       color: "#E11D2E" },
  bonus:    { icon: "coins",       color: "#F0B429" },
  delivery: { icon: "truck",       color: "#7C3AED" },
  system:   { icon: "bell",        color: "#5A5F6A" },
  gift:     { icon: "gift",        color: "#FF3D8D" },
  game:     { icon: "gamepad",     color: "#7C3AED" },
  win:      { icon: "trophy",      color: "#F0B429" },
  vip:      { icon: "crown",       color: "#D6A400" },
  welcome:  { icon: "sparkles",    color: "#E8202A" },
};

const TYPE_LUCIDE: Record<NotifType, React.ComponentType<any>> = {
  payment: CreditCard,
  order: Package,
  promo: Flame,
  bonus: Coins,
  delivery: Truck,
  system: Bell,
  gift: Gift,
  game: Gamepad2,
  win: Trophy,
  vip: Crown,
  welcome: Sparkles,
};

export function pushNotification(n: Omit<Notif, "id" | "ts" | "read"> & { read?: boolean; silent?: boolean }) {
  const defaults = TYPE_DEFAULTS[n.type] ?? TYPE_DEFAULTS.system;
  const item: Notif = {
    id: genId(),
    ts: Date.now(),
    read: n.read ?? false,
    type: n.type,
    title: n.title,
    desc: n.desc,
    link: n.link,
    color: n.color ?? defaults.color,
    priority: n.priority ?? "normal",
    icon: n.icon ?? defaults.icon,
  };
  notifs = [item, ...notifs].slice(0, 200); // cap historique
  emit();

  if (!n.silent && typeof window !== "undefined") {
    void import("./sound").then((m) => m.playNotificationSound(m.flavorForNotif(item.type, item.priority))).catch(() => {});
    const toastTitle = item.title;
    const LucideIcon = TYPE_LUCIDE[item.type] ?? Bell;
    const iconNode = createElement(LucideIcon, { className: "w-5 h-5", strokeWidth: 2.4, style: { color: item.color } });
    const link = item.link;
    const action = link
      ? {
          label: "Ouvrir",
          onClick: () => {
            markRead(item.id);
            window.dispatchEvent(new CustomEvent("ippoo:navigate", { detail: link }));
          },
        }
      : undefined;
    const toastOpts = {
      description: item.desc,
      duration: item.priority === "high" ? 7000 : 4500,
      action,
      icon: iconNode,
      onAutoClose: () => { /* no-op */ },
      onDismiss: () => { /* no-op */ },
    } as const;

    if (item.type === "win" || item.type === "gift" || item.type === "welcome" || item.type === "bonus") {
      toast.success(toastTitle, toastOpts);
    } else if (item.type === "promo" || item.type === "vip") {
      toast(toastTitle, toastOpts);
    } else {
      toast.info(toastTitle, toastOpts);
    }

    if (item.priority === "high") {
      sendNativePush(item.title, item.desc, { tag: item.id });
    }
  }
}

export function markRead(id: string) {
  let changed = false;
  notifs = notifs.map((n) => {
    if (n.id === id && !n.read) { changed = true; return { ...n, read: true }; }
    return n;
  });
  if (changed) emit();
}

export function markAllRead() {
  if (notifs.every((n) => n.read)) return;
  notifs = notifs.map((n) => ({ ...n, read: true }));
  emit();
}

export function removeNotification(id: string) {
  const next = notifs.filter((n) => n.id !== id);
  if (next.length === notifs.length) return;
  notifs = next;
  emit();
}

export function clearAllNotifications() {
  if (notifs.length === 0) return;
  notifs = [];
  emit();
}

export function unreadCount(): number {
  return notifs.reduce((s, n) => s + (n.read ? 0 : 1), 0);
}

/** Format relatif court ("Il y a 2 h", "Hier", "12 mai"). */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d} j`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
