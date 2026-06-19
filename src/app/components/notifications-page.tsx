import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  BellRing,
  BellOff,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Wrench,
  ChevronRight,
  Inbox,
  Flame,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useNotifications } from "../notifications/useNotifications";
import { StaggerList, StaggerItem } from "./anim";
import { NotifIllustration } from "./notif-illustration";
import {
  clearAllNotifications,
  markAllRead,
  markRead,
  relativeTime,
  removeNotification,
  type Notif,
  type NotifType,
} from "../notifications/store";
import {
  getPushPermission,
  isPushSupported,
  requestPushPermission,
} from "../notifications/push";

type FilterKey = "all" | "unread" | NotifType;

const FILTERS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "all",      label: "Toutes",      Icon: Inbox },
  { key: "unread",   label: "Non lues",    Icon: BellRing },
  { key: "order",    label: "Commandes",   Icon: Package },
  { key: "delivery", label: "Livraisons",  Icon: Truck },
  { key: "payment",  label: "Paiements",   Icon: CreditCard },
  { key: "promo",    label: "Promos",      Icon: Flame },
  { key: "bonus",    label: "Bonus",       Icon: Wallet },
];

function groupByDay(items: Notif[]): { label: string; items: Notif[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const groups: Record<string, Notif[]> = { "Aujourd'hui": [], "Hier": [], "Cette semaine": [], "Plus ancien": [] };
  for (const n of items) {
    if (n.ts >= startOfToday) groups["Aujourd'hui"].push(n);
    else if (n.ts >= startOfYesterday) groups["Hier"].push(n);
    else if (n.ts >= startOfWeek) groups["Cette semaine"].push(n);
    else groups["Plus ancien"].push(n);
  }
  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifs = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (isPushSupported()) setPermission(getPushPermission());
  }, []);

  const unreadTotal = notifs.reduce((s, n) => s + (n.read ? 0 : 1), 0);
  const filtered =
    filter === "all"
      ? notifs
      : filter === "unread"
        ? notifs.filter((n) => !n.read)
        : notifs.filter((n) => n.type === filter);
  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const handleAllRead = () => {
    if (unreadTotal === 0) return;
    markAllRead();
    toast.success("Toutes les notifications ont été lues");
  };

  const handleDelete = (id: string) => {
    removeNotification(id);
    toast.success("Notification supprimée");
  };

  const handleClearAll = () => {
    if (notifs.length === 0) return;
    clearAllNotifications();
    toast.success("Historique vidé");
  };

  const defaultLinkFor = (t: NotifType): string => {
    switch (t) {
      case "payment": return "/wallet";
      case "order":   return "/commandes";
      case "delivery":return "/commandes";
      case "promo":   return "/promos";
      case "bonus":   return "/wallet";
      case "gift":    return "/wallet";
      case "win":     return "/wallet";
      case "vip":     return "/vip";
      case "game":    return "/jeux";
      case "welcome": return "/wallet";
      case "system":
      default:        return "/profil";
    }
  };

  const open = (n: Notif) => {
    markRead(n.id);
    const target = n.link || defaultLinkFor(n.type);
    navigate(target);
  };

  const activatePush = async () => {
    const p = await requestPushPermission();
    setPermission(p);
    if (p === "granted") toast.success("Notifications push activées");
    else if (p === "denied") toast.error("Notifications refusées — autorise-les dans les réglages du navigateur");
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-[#FF6B00] via-[#E11D2E] to-[#9333EA] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/80 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24 }}>
                <BellRing className="w-6 h-6" /> Notifications
              </h1>
              <p className="text-white/85 mt-1" style={{ fontSize: 13 }}>
                {unreadTotal > 0
                  ? `${unreadTotal} nouvelle${unreadTotal > 1 ? "s" : ""} à découvrir`
                  : "Tout est à jour"}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleAllRead}
                disabled={unreadTotal === 0}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 backdrop-blur"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Tout lire
              </button>
              <button
                onClick={handleClearAll}
                disabled={notifs.length === 0}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 backdrop-blur"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                <Wrench className="w-3 h-3" /> Vider
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Bandeau d'activation push */}
        {isPushSupported() && permission !== "granted" && (
          <motion.button
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={activatePush}
            disabled={permission === "denied"}
            className="w-full mb-4 rounded-2xl bg-gradient-to-r from-[#FFF7E0] to-[#FFEDD5] border border-[#F0B429]/30 p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow text-left disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F0B429] to-[#F97316] flex items-center justify-center text-white shrink-0">
              {permission === "denied" ? <BellOff className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 800, color: "#92410E" }}>
                {permission === "denied" ? "Notifications désactivées" : "Active les notifications push"}
              </p>
              <p className="mt-0.5" style={{ fontSize: 11, color: "#92410E", opacity: 0.85 }}>
                {permission === "denied"
                  ? "Autorise-les dans les réglages du navigateur."
                  : "Reçois cashback, promos flash et confirmations même app fermée."}
              </p>
            </div>
            {permission !== "denied" && <ChevronRight className="w-4 h-4 text-[#92410E]" />}
          </motion.button>
        )}

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
          {FILTERS.map((tab) => {
            const count =
              tab.key === "all"
                ? notifs.length
                : tab.key === "unread"
                  ? unreadTotal
                  : notifs.filter((n) => n.type === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 px-3.5 py-2 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white border-transparent shadow-sm"
                    : "bg-white text-foreground border-border hover:border-[#E11D2E]/40"
                }`}
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                <tab.Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                {tab.label}
                <span
                  className={`px-1.5 rounded-md ${active ? "bg-white/25" : "bg-muted text-muted-foreground"}`}
                  style={{ fontSize: 10, fontWeight: 800 }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Liste groupée */}
        {grouped.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {group.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>{group.items.length}</span>
            </div>
            <StaggerList className="space-y-2.5">
              {group.items.map((notif) => (
                <NotifCard
                  key={notif.id}
                  notif={notif}
                  onOpen={() => open(notif)}
                  onDelete={() => handleDelete(notif.id)}
                />
              ))}
            </StaggerList>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Aucune notification</h3>
            <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
              {filter === "all" ? "Tu es à jour ! Reviens plus tard." : "Aucun élément dans ce filtre."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({
  notif,
  onOpen,
  onDelete,
}: {
  notif: Notif;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const color = notif.color || "#FF6B00";
  const unread = !notif.read;
  const isHero = notif.type === "win" || notif.type === "gift" || notif.type === "welcome" || notif.type === "bonus" || notif.type === "promo";
  const ctaLabel =
    notif.type === "promo" ? "Voir l'offre"
    : notif.type === "bonus" || notif.type === "win" ? "Voir mon solde"
    : notif.type === "delivery" || notif.type === "order" ? "Suivre la commande"
    : notif.type === "payment" ? "Voir la transaction"
    : notif.type === "vip" ? "Découvrir VIP"
    : "Ouvrir";

  if (isHero) {
    return (
      <StaggerItem
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
        role="button"
        tabIndex={0}
        className="relative cursor-pointer rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/60"
        style={{ background: `linear-gradient(120deg, ${color}, ${shade(color, -25)})` }}
      >
        {unread && <span className="absolute top-2 right-2 inline-block w-2 h-2 rounded-full bg-white shadow ring-2 ring-white/40 animate-pulse" />}
        <div className="p-4 pr-3 text-white flex items-center gap-3">
          <NotifIllustration type={notif.type} color={color} hero />
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, lineHeight: "18px" }}>
              {notif.title}
            </p>
            <p className="opacity-90 line-clamp-2" style={{ fontSize: 12, lineHeight: "16px" }}>
              {notif.desc}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="opacity-85" style={{ fontSize: 10 }}>{relativeTime(notif.ts)}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[color:inherit]" style={{ fontSize: 11, fontWeight: 700, color }}>
                {ctaLabel} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Supprimer"
            className="p-1 hover:bg-white/15 rounded-lg shrink-0 self-start"
          >
            <Trash2 className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </StaggerItem>
    );
  }

  return (
    <StaggerItem
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      role="button"
      tabIndex={0}
      className="bg-white rounded-2xl border border-border p-3.5 flex items-start gap-3 cursor-pointer transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/40"
      style={unread ? { boxShadow: `0 4px 14px -8px ${color}55, 0 1px 0 rgba(15,23,42,0.02)` } : undefined}
    >
      <NotifIllustration type={notif.type} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate" style={{ fontSize: 13, fontWeight: unread ? 800 : 600 }}>
            {notif.title}
          </p>
          {unread && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
        </div>
        <p className="text-muted-foreground line-clamp-2 mt-0.5" style={{ fontSize: 12, lineHeight: "16px" }}>
          {notif.desc}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>{relativeTime(notif.ts)}</span>
          <span className="inline-flex items-center gap-1 text-[color:inherit]" style={{ fontSize: 11, fontWeight: 700, color }}>
            {ctaLabel} <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Supprimer"
        className="p-1 hover:bg-muted rounded-lg shrink-0"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </button>
    </StaggerItem>
  );
}

/** Assombrit ou éclaircit une couleur hex de `amount` (négatif = plus sombre). */
function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
