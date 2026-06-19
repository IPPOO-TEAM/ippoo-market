import { Crown, Star, BadgeCheck, Shield, Zap, Camera, Mic, Tag, CreditCard, FileText, Package, type LucideIcon } from "lucide-react";

/* ─── TYPES ─── */
export type Badge = "VIP" | "VERIFIE" | "TOP" | "SUPPORT" | "SYSTEM";
export type MsgType = "text" | "product" | "order" | "payment" | "image" | "voice" | "system";
export type LastMsgType = "text" | "image" | "voice" | "product" | "payment" | "document" | "order";

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMsgType: LastMsgType;
  time: string;
  unread: number;
  online: boolean;
  badge: Badge;
  category?: string;
  pinned?: boolean;
  muted?: boolean;
  lastSenderMe?: boolean;
}

export interface ChatMessage {
  id: number;
  sender: "me" | "them" | "system";
  type: MsgType;
  text?: string;
  time: string;
  read: boolean;
  delivered?: boolean;
  attachment?: string;
  product?: { name: string; price: number; image: string; moq: string };
  order?: { id: string; status: string; amount: number; items: number };
  payment?: { amount: number; method: string; status: string; ref: string };
  imageUrl?: string;
  voiceDuration?: string;
  date?: string;
}

/* ─── DATA ─── */
// Pas de conversations pré-remplies : un nouvel utilisateur démarre avec une
// boîte vide. Les conversations apparaissent dès qu'il contacte un vendeur ou
// reçoit un message via l'API messagerie.
export const conversations: Conversation[] = [];

export const allChatData: Record<number, ChatMessage[]> = {};

export const quickRepliesMap: Record<number, string[]> = {};
export const defaultQuickReplies = ["Bonjour !", "Stock dispo ?", "Envoyez un devis", "Merci !"];

/* ─── BADGE CONFIG ─── */
export const badgeConfig: Record<Badge, { bg: string; label: string; icon: typeof Crown }> = {
  VIP: { bg: "#E8A817", label: "VIP", icon: Crown },
  TOP: { bg: "#16A34A", label: "TOP", icon: Star },
  VERIFIE: { bg: "#3B82F6", label: "Vérifié", icon: BadgeCheck },
  SUPPORT: { bg: "#6366F1", label: "Support", icon: Shield },
  SYSTEM: { bg: "#9CA3AF", label: "Système", icon: Zap },
};

/* ─── MESSAGE TYPE ICON PREVIEW ─── */
export const msgTypeIcon: Record<LastMsgType, { icon: LucideIcon | null; label: string }> = {
  text: { icon: null, label: "" },
  image: { icon: Camera, label: "Photo" },
  voice: { icon: Mic, label: "Vocal" },
  product: { icon: Tag, label: "Produit" },
  payment: { icon: CreditCard, label: "Paiement" },
  document: { icon: FileText, label: "Document" },
  order: { icon: Package, label: "Commande" },
};
