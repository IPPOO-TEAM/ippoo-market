import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Send,
  Search,
  FileText,
  CheckCheck,
  Check,
  ArrowLeft,
  Phone,
  Video,
  Smile,
  Mic,
  Package,
  BadgeCheck,
  Crown,
  Star,
  X,
  Plus,
  Shield,
  CreditCard,
  ChevronRight,
  Store,
  Zap,
  Inbox,
  SquarePen,
  Tag,
  MoreVertical,
  Pin,
  PinOff,
  BellOff,
  Bell,
  MailOpen,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ProductBubble, OrderBubble, PaymentBubble, VoiceBubble } from "./messaging/bubbles";
import { ActionSheet } from "./messaging/action-sheet";
import {
  conversations, allChatData, quickRepliesMap, defaultQuickReplies,
  badgeConfig, msgTypeIcon,
  type Conversation, type ChatMessage,
} from "./messaging-data";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";
import { mirrorOutgoingMessage } from "../messaging/server-sync";

const CONV_STORAGE_KEY = "ippoo:messaging:conversations";
const CHAT_STORAGE_KEY = "ippoo:messaging:chat-map";
const PENDING_CONTACT_KEY = "ippoo:messaging:pending-contact";

type PendingContact = {
  sellerName: string;
  sellerSlug?: string;
  avatar?: string;
  product?: { id: number | string; name: string; price: number; image: string; moq?: string };
};

function loadConvs(): Conversation[] {
  try {
    const raw = scopedGetItem(CONV_STORAGE_KEY);
    if (!raw) return [...conversations];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Conversation[];
  } catch { /* noop */ }
  return [...conversations];
}

function loadChatMap(): Record<number, ChatMessage[]> {
  try {
    const raw = scopedGetItem(CHAT_STORAGE_KEY);
    if (!raw) return { ...allChatData };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<number, ChatMessage[]>;
  } catch { /* noop */ }
  return { ...allChatData };
}


/* ═══════════════════════════════════════════════════
   ONLINE STORIES ROW (mobile)
   ═══════════════════════════════════════════════════ */
function OnlineStoriesRow({ convs, onSelect }: { convs: Conversation[]; onSelect: (conv: Conversation) => void }) {
  const onlineConvs = convs.filter((c) => c.online);
  return (
    <div className="px-3 py-3 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {onlineConvs.map((conv) => {
        const b = badgeConfig[conv.badge];
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className="flex flex-col items-center gap-1 shrink-0"
            style={{ width: 62 }}
          >
            <div className="relative">
              <div
                className={`w-[58px] h-[58px] rounded-full p-[2px] ${conv.unread > 0 ? "" : ""}`}
                style={{
                  background: conv.unread > 0 ? "#0084FF" : "transparent",
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-[2px] border-white">
                  <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#31A24C] rounded-full border-[2.5px] border-white" />
            </div>
            <span className="text-center truncate w-full" style={{ fontSize: 12, fontWeight: 500, color: "#050505" }}>
              {conv.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CONVERSATION CARD (mobile-optimized)
   ═══════════════════════════════════════════════════ */
function ConversationCard({
  conv,
  isSelected,
  onSelect,
  onAction,
}: {
  conv: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: "pin" | "mute" | "unread" | "delete") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);
  const b = badgeConfig[conv.badge];
  const msgPrev = msgTypeIcon[conv.lastMsgType];
  const hasUnread = conv.unread > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(); }}
      className={`w-full flex items-center gap-3 px-3 py-2 mx-1 my-0.5 rounded-2xl active:bg-[#E4E6EB] transition-colors cursor-pointer ${
        isSelected ? "bg-[#E7F3FF]" : "bg-white hover:bg-[#F2F2F2]"
      }`}
    >
      {/* Avatar (Messenger 60px circle) */}
      <div className="relative shrink-0">
        <div className="w-[56px] h-[56px] rounded-full overflow-hidden">
          <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
        </div>
        {conv.online && (
          <div className="absolute bottom-0.5 right-0.5 w-[13px] h-[13px] bg-[#31A24C] rounded-full border-[2.5px] border-white" />
        )}
        {conv.pinned && (
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#0084FF] border-2 border-white">
            <Pin className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Row 1: name + badge */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="truncate flex-1"
            style={{
              fontSize: 15,
              fontWeight: hasUnread ? 700 : 500,
              fontFamily: "Poppins",
              color: "#050505",
            }}
          >
            {conv.name}
          </span>
          <b.icon className="w-3 h-3 shrink-0" style={{ color: b.bg }} />
        </div>

        {/* Row 2: message preview + time */}
        <div className="flex items-center gap-1">
          {conv.lastSenderMe && (
            <span className="shrink-0" style={{ fontSize: 13, color: hasUnread ? "#050505" : "#65676B", fontWeight: hasUnread ? 600 : 400 }}>Vous :</span>
          )}
          {msgPrev.icon && !conv.lastSenderMe && (
            <msgPrev.icon className="w-3.5 h-3.5 shrink-0" style={{ color: hasUnread ? "#050505" : "#65676B" }} strokeWidth={2} />
          )}
          <p
            className="truncate flex-1"
            style={{
              fontSize: 13,
              lineHeight: "17px",
              color: hasUnread ? "#050505" : "#65676B",
              fontWeight: hasUnread ? 600 : 400,
            }}
          >
            {conv.lastMessage}
          </p>
          <span className="shrink-0" style={{ fontSize: 13, color: hasUnread ? "#050505" : "#65676B", fontWeight: hasUnread ? 600 : 400 }}>
            · {conv.time}
          </span>
        </div>
      </div>

      {/* Unread dot (Messenger blue) */}
      {hasUnread && (
        <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#0084FF]" />
      )}
      {conv.muted && !hasUnread && (
        <BellOff className="w-3.5 h-3.5 shrink-0 text-[#65676B]" />
      )}

      {/* 3-dot menu */}
      <span
        role="button"
        tabIndex={0}
        aria-label="Options de la conversation"
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setMenuOpen((v) => !v); } }}
        className="shrink-0 w-7 h-7 rounded-full hover:bg-black/5 active:scale-95 relative cursor-pointer flex items-center justify-center"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
        {menuOpen && (
          <span
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-xl z-30 overflow-hidden"
          >
            <ConvMenuItem
              icon={conv.pinned ? PinOff : Pin}
              label={conv.pinned ? "Désépingler" : "Épingler"}
              onClick={() => { setMenuOpen(false); onAction("pin"); }}
            />
            <ConvMenuItem
              icon={conv.muted ? Bell : BellOff}
              label={conv.muted ? "Réactiver son" : "Sourdine"}
              onClick={() => { setMenuOpen(false); onAction("mute"); }}
            />
            <ConvMenuItem
              icon={MailOpen}
              label={conv.unread > 0 ? "Marquer comme lu" : "Marquer comme non lu"}
              onClick={() => { setMenuOpen(false); onAction("unread"); }}
            />
            <ConvMenuItem
              icon={Trash2}
              label="Supprimer"
              danger
              onClick={() => { setMenuOpen(false); onAction("delete"); }}
            />
          </span>
        )}
      </span>
    </div>
  );
}

function ConvMenuItem({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left ${danger ? "text-[#DC2626]" : "text-foreground"}`}
      style={{ fontSize: 12.5, fontWeight: 600 }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#F0F2F5] rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            className="w-2 h-2 rounded-full bg-[#65676B]"
          />
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function MessagingPage() {
  const navigate = useNavigate();
  const [convList, setConvList] = useState<Conversation[]>(() => loadConvs());
  const initialConvs = convList;
  const [selectedId, setSelectedId] = useState<number>(initialConvs[0]?.id ?? 0);
  const selectedConv = convList.find((c) => c.id === selectedId) ?? convList[0];
  const hasConversations = convList.length > 0;
  const [newMessage, setNewMessage] = useState("");
  const [showConvList, setShowConvList] = useState(true);
  const [chatMap, setChatMap] = useState<Record<number, ChatMessage[]>>(() => loadChatMap());
  const chatMessages = chatMap[selectedId] ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [typingFor, setTypingFor] = useState<number | null>(null);
  const [convFilter, setConvFilter] = useState<"all" | "unread" | "vendors" | "support">("all");
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [callType, setCallType] = useState<null | "audio" | "video">(null);
  const [recording, setRecording] = useState<{ startedAt: number; elapsed: number } | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Tick le compteur d'enregistrement vocal pendant que l'on appuie sur le micro.
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      setRecording((r) => (r ? { ...r, elapsed: Math.floor((Date.now() - r.startedAt) / 1000) } : r));
    }, 250);
    return () => clearInterval(t);
  }, [recording?.startedAt]);

  // Note : la durée de l'appel est gérée à l'intérieur de CallOverlay ; on
  // n'auto-ferme plus l'overlay ici (raccrocher déclenche endCall).

  const scrollToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    // Scroll local au conteneur uniquement - évite que la page entière scrolle
    // (ce qui décalerait le header sticky à chaque message / ouverture clavier).
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [chatMessages.length, typingFor, scrollToBottom]);

  // Verrouille le scroll du document pendant que la messagerie est montée
  // pour empêcher tout déplacement du header lors du focus de l'input
  // ou de l'ouverture du clavier virtuel.
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Persist conversations & chat map to localStorage.
  useEffect(() => { scopedSetItem(CONV_STORAGE_KEY, JSON.stringify(convList)); }, [convList]);
  useEffect(() => { scopedSetItem(CHAT_STORAGE_KEY, JSON.stringify(chatMap)); }, [chatMap]);

  // Lit un contact en attente (déposé depuis une fiche produit / boutique)
  // et crée/sélectionne la conversation correspondante.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try { raw = window.sessionStorage.getItem(PENDING_CONTACT_KEY); } catch { return; }
    if (!raw) return;
    try { window.sessionStorage.removeItem(PENDING_CONTACT_KEY); } catch { /* noop */ }
    let payload: PendingContact;
    try { payload = JSON.parse(raw) as PendingContact; } catch { return; }
    if (!payload?.sellerName) return;

    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const existing = convList.find(
      (c) => c.name.toLowerCase() === payload.sellerName.toLowerCase(),
    );

    const productMsg: ChatMessage | null = payload.product ? {
      id: Date.now(), sender: "me", type: "product",
      product: {
        name: payload.product.name,
        price: payload.product.price,
        image: payload.product.image,
        moq: payload.product.moq ?? "1 unité",
      },
      text: `Bonjour, je suis intéressé(e) par "${payload.product.name}". Est-il toujours disponible ?`,
      time: now, read: false, delivered: false,
    } : null;

    if (existing) {
      setSelectedId(existing.id);
      setShowConvList(false);
      if (productMsg) {
        appendToConv(existing.id, productMsg);
        setConvList((prev) => prev.map((c) => (c.id === existing.id ? {
          ...c, lastMessage: productMsg.text ?? payload.product!.name,
          lastMsgType: "product", lastSenderMe: true, time: now, unread: 0,
        } : c)));
      }
      return;
    }

    const newId = Math.max(0, ...convList.map((c) => c.id)) + 1;
    const newConv: Conversation = {
      id: newId,
      name: payload.sellerName,
      avatar: payload.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.sellerName)}`,
      category: "Vendeur",
      lastMessage: productMsg?.text ?? "Nouvelle conversation",
      lastMsgType: productMsg ? "product" : "text",
      lastSenderMe: true,
      time: now,
      unread: 0,
      online: true,
      pinned: false,
      muted: false,
      badge: "VERIFIE",
    } as Conversation;
    setConvList((prev) => [newConv, ...prev]);
    setChatMap((prev) => ({ ...prev, [newId]: productMsg ? [productMsg] : [] }));
    setSelectedId(newId);
    setShowConvList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = useCallback((id: number) => {
    setConvList((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }, []);

  const selectConversation = useCallback((conv: Conversation) => {
    setSelectedId(conv.id);
    setChatMap((prev) => (prev[conv.id] ? prev : { ...prev, [conv.id]: allChatData[conv.id] ?? [] }));
    setShowConvList(false);
    setShowActions(false);
    markRead(conv.id);
  }, [markRead]);

  const touchConv = (id: number, lastMessage: string) => {
    setConvList((prev) => prev.map((c) => (c.id === id ? {
      ...c,
      lastMessage,
      lastMsgType: "text",
      lastSenderMe: true,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      unread: 0,
    } : c)));
  };

  const appendToConv = (id: number, msg: ChatMessage) => {
    setChatMap((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), msg] }));
  };

  const patchInConv = (id: number, msgId: number, patch: Partial<ChatMessage>) => {
    setChatMap((prev) => ({
      ...prev,
      [id]: (prev[id] ?? []).map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
    }));
  };

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const convId = selectedId;
    const msg: ChatMessage = {
      id: Date.now(), sender: "me", type: "text", text: trimmed,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      read: false, delivered: false,
    };
    appendToConv(convId, msg);
    touchConv(convId, trimmed);
    const conv = convList.find((c) => c.id === convId);
    if (conv) {
      void mirrorOutgoingMessage({
        convNumericId: convId,
        otherName: conv.name,
        otherAvatar: conv.avatar,
        text: trimmed,
      });
    }
    setNewMessage("");
    inputRef.current?.focus();
    setTimeout(() => patchInConv(convId, msg.id, { delivered: true }), 600);
    setTimeout(() => patchInConv(convId, msg.id, { read: true }), 1800);
    setTimeout(() => setTypingFor(convId), 1300);
    setTimeout(() => {
      setTypingFor((cur) => (cur === convId ? null : cur));
      const replies = [
        "Bien reçu ! Je m'en occupe tout de suite.",
        "Merci, je reviens vers vous dans quelques minutes.",
        "D'accord, je vérifie la disponibilité en stock.",
        "Parfait ! Je prépare votre devis.",
      ];
      const reply: ChatMessage = {
        id: Date.now() + 1, sender: "them", type: "text",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        read: true,
      };
      appendToConv(convId, reply);
      setConvList((prev) => prev.map((c) => (c.id === convId ? {
        ...c, lastMessage: reply.text ?? "", lastMsgType: "text", lastSenderMe: false,
        time: reply.time,
      } : c)));
    }, 3200);
  };

  const sendMessage = () => sendText(newMessage);
  const sendQuickReply = (text: string) => sendText(text);

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startRecording = () => setRecording({ startedAt: Date.now(), elapsed: 0 });
  const cancelRecording = () => setRecording(null);
  const stopRecording = () => {
    if (!recording) return;
    const secs = Math.max(1, recording.elapsed);
    const mm = Math.floor(secs / 60).toString().padStart(1, "0");
    const ss = (secs % 60).toString().padStart(2, "0");
    const duration = `${mm}:${ss}`;
    const convId = selectedId;
    const msg: ChatMessage = {
      id: Date.now(), sender: "me", type: "voice", voiceDuration: duration,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      read: false, delivered: false,
    };
    appendToConv(convId, msg);
    setConvList((prev) => prev.map((c) => (c.id === convId ? {
      ...c, lastMessage: `Message vocal · ${duration}`, lastMsgType: "voice", lastSenderMe: true,
      time: msg.time, unread: 0,
    } : c)));
    setRecording(null);
    setTimeout(() => patchInConv(convId, msg.id, { delivered: true, read: true }), 900);
  };

  const pushAttachmentMsg = (msg: ChatMessage, preview: string, prevType: Conversation["lastMsgType"]) => {
    const convId = selectedId;
    appendToConv(convId, msg);
    setConvList((prev) => prev.map((c) => (c.id === convId ? {
      ...c, lastMessage: preview, lastMsgType: prevType, lastSenderMe: true, time: msg.time, unread: 0,
    } : c)));
    setTimeout(() => patchInConv(convId, msg.id, { delivered: true }), 700);
  };

  const handleImageFile = (file: File, source: "camera" | "gallery") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image attendu");
      return;
    }
    const url = URL.createObjectURL(file);
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    pushAttachmentMsg(
      {
        id: Date.now(), sender: "me", type: "image", imageUrl: url,
        text: source === "camera" ? "📷 Photo capturée" : undefined,
        time: now, read: false, delivered: false,
      },
      source === "camera" ? "Photo capturée" : "Photo envoyée",
      "image",
    );
  };

  const handleDocumentFile = (file: File) => {
    const sizeKb = Math.round(file.size / 1024);
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${sizeKb} Ko`;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    pushAttachmentMsg(
      {
        id: Date.now(), sender: "me", type: "text",
        text: `Document joint · ${sizeLabel}`, attachment: file.name,
        time: now, read: false, delivered: false,
      },
      `Document : ${file.name}`,
      "document",
    );
  };

  const sendLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Géolocalisation indisponible sur cet appareil");
      return;
    }
    toast.info("Récupération de votre position…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        pushAttachmentMsg(
          {
            id: Date.now(), sender: "me", type: "text",
            text: `📍 Ma position : https://maps.google.com/?q=${lat},${lng}`,
            time: now, read: false, delivered: false,
          },
          "Localisation envoyée",
          "text",
        );
      },
      (err) => toast.error(err.message || "Position refusée"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleAction = (action: string) => {
    setShowActions(false);
    if (action === "camera") { cameraInputRef.current?.click(); return; }
    if (action === "gallery") { galleryInputRef.current?.click(); return; }
    if (action === "document") { documentInputRef.current?.click(); return; }
    if (action === "location") { sendLocation(); return; }
    if (action === "product") {
      toast.info("Sélectionnez un produit à partager");
      navigate("/explorer");
      return;
    }
    if (action === "invoice") {
      toast.info("Créez une facture depuis la facturation");
      navigate("/facturation");
      return;
    }
    if (action === "qr") {
      toast.info("Générez ou scannez un QR de paiement");
      navigate("/scanner");
      return;
    }
  };

  const openVendorProfile = () => {
    navigate(`/vendeur/${selectedConv.name.toLowerCase().replace(/\s+/g, "-")}`);
  };

  const handleConvAction = (conv: Conversation, action: "pin" | "mute" | "unread" | "delete") => {
    if (action === "delete") {
      setConvList((prev) => prev.filter((c) => c.id !== conv.id));
      setChatMap((prev) => {
        const next = { ...prev };
        delete next[conv.id];
        return next;
      });
      if (selectedId === conv.id) {
        const remaining = convList.filter((c) => c.id !== conv.id);
        if (remaining.length > 0) setSelectedId(remaining[0].id);
        setShowConvList(true);
      }
      return;
    }
    setConvList((prev) => prev.map((c) => {
      if (c.id !== conv.id) return c;
      if (action === "pin") return { ...c, pinned: !c.pinned };
      if (action === "mute") return { ...c, muted: !c.muted };
      if (action === "unread") return { ...c, unread: c.unread > 0 ? 0 : Math.max(1, c.unread + 1) };
      return c;
    }));
  };

  const endCall = (type: "audio" | "video") => {
    const convId = selectedId;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const label = type === "video" ? "Appel vidéo terminé" : "Appel vocal terminé";
    const msg: ChatMessage = {
      id: Date.now(), sender: "system", type: "system",
      text: label, time: now, read: true,
    };
    appendToConv(convId, msg);
    setConvList((prev) => prev.map((c) => (c.id === convId ? {
      ...c, lastMessage: label, lastMsgType: "text", lastSenderMe: false, time: now,
    } : c)));
    setCallType(null);
  };

  const filteredConvs = convList
    .filter((c) => {
      if (convFilter === "unread") return c.unread > 0;
      if (convFilter === "vendors") return c.badge !== "SUPPORT" && c.badge !== "SYSTEM";
      if (convFilter === "support") return c.badge === "SUPPORT" || c.badge === "SYSTEM";
      return true;
    })
    .filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
    });

  const sortedConvs = [...filteredConvs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    return 0;
  });

  const totalUnread = convList.reduce((s, c) => s + c.unread, 0);
  const unreadCount = convList.filter((c) => c.unread > 0).length;
  const quickReplies = selectedConv ? (quickRepliesMap[selectedConv.id] || defaultQuickReplies) : defaultQuickReplies;
  const badgeInfo = selectedConv ? badgeConfig[selectedConv.badge] : badgeConfig.SYSTEM;

  // Split sorted into unread and read
  const unreadConvs = sortedConvs.filter((c) => c.unread > 0);
  const readConvs = sortedConvs.filter((c) => c.unread === 0);

  return (
    <div
      className="flex flex-col bg-white overflow-hidden"
      style={{
        height: "calc(100dvh - var(--ippoo-top-h, 64px) - var(--ippoo-bottom-h, 0px))",
      }}
    >
      {/* ═════════════════════ MOBILE INBOX HEADER (Messenger style) ═════════════════════ */}
      <div className={`${showConvList ? "block" : "hidden lg:block"}`}>
        <div className="bg-white px-4 pt-3 pb-2 border-b border-[#E4E6EB]">
          <div className="max-w-5xl mx-auto">
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="p-1.5 rounded-full text-[#050505] hover:bg-[#F2F2F2] transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#050505" }}>
                  Discussions
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-9 h-9 rounded-full bg-[#F0F2F5] flex items-center justify-center hover:bg-[#E4E6EB] transition-all"
                  aria-label="Rechercher"
                >
                  <Search className="w-[18px] h-[18px] text-[#050505]" />
                </button>
                <button
                  onClick={() => setShowNewConv(true)}
                  className="w-9 h-9 rounded-full bg-[#F0F2F5] flex items-center justify-center hover:bg-[#E4E6EB] transition-all"
                  aria-label="Nouvelle conversation"
                >
                  <SquarePen className="w-[18px] h-[18px] text-[#050505]" />
                </button>
              </div>
            </div>

            {/* Search bar (animated) */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative pb-3">
                    <Search className="absolute left-3 top-[14px] w-4 h-4 text-[#65676B]" />
                    <input
                      type="text"
                      placeholder="Rechercher dans Messenger"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-full bg-[#F0F2F5] text-[#050505] placeholder:text-[#65676B] border-none focus:bg-[#E4E6EB]"
                      style={{ fontSize: 14 }}
                      autoFocus
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-[14px]">
                        <X className="w-4 h-4 text-[#65676B]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter chips (pill style) */}
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: "none" }}>
              {([
                { key: "all" as const, label: "Tout", count: convList.length },
                { key: "unread" as const, label: "Non lus", count: unreadCount },
                { key: "vendors" as const, label: "Vendeurs", count: convList.filter((c) => c.badge !== "SUPPORT" && c.badge !== "SYSTEM").length },
                { key: "support" as const, label: "Support", count: convList.filter((c) => c.badge === "SUPPORT" || c.badge === "SYSTEM").length },
              ]).map((f) => {
                const active = convFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setConvFilter(f.key)}
                    className="shrink-0 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 600,
                      background: active ? "#E7F3FF" : "#F0F2F5",
                      color: active ? "#0084FF" : "#050505",
                    }}
                  >
                    <span>{f.label}</span>
                    {f.key === "unread" && unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white"
                        style={{ fontSize: 10, fontWeight: 800, background: "#0084FF" }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════ BODY ═════════════════════ */}
      <div className="flex-1 min-h-0 flex max-w-5xl mx-auto w-full overflow-hidden relative">
        {/* ═══ CONVERSATION LIST ═══ */}
        <div className={`w-full lg:w-[360px] lg:border-r border-border bg-white shrink-0 flex-col min-h-0 ${!showConvList ? "hidden lg:flex" : "flex"}`}>
          {/* Online stories row */}
          <OnlineStoriesRow convs={convList} onSelect={selectConversation} />

          {/* Divider */}
          <div className="h-[1px] bg-[#E4E6EB] mx-4" />

          {/* Conversation list */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Unread section */}
            {unreadConvs.length > 0 && (
              <>
                <div className="px-4 pt-2 pb-1">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#050505" }}>
                    Non lus
                  </span>
                </div>
                {unreadConvs.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConv.id === conv.id}
                    onSelect={() => selectConversation(conv)}
                    onAction={(a) => handleConvAction(conv, a)}
                  />
                ))}
              </>
            )}

            {/* Read section */}
            {readConvs.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#050505" }}>
                    Plus tôt
                  </span>
                </div>
                {readConvs.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConv.id === conv.id}
                    onSelect={() => selectConversation(conv)}
                    onAction={(a) => handleConvAction(conv, a)}
                  />
                ))}
              </>
            )}

            {sortedConvs.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Aucune conversation</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                  {searchQuery ? "Aucun résultat pour cette recherche" : "Commencez par contacter un vendeur"}
                </p>
              </div>
            )}

            <div className="h-4" />
          </div>

          {/* FAB New Message (mobile only) - Messenger blue */}
          <button
            onClick={() => setShowNewConv(true)}
            className="lg:hidden absolute right-4 bottom-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform z-20"
            style={{ background: "linear-gradient(135deg, #00C6FF, #0084FF)", boxShadow: "0 6px 16px rgba(0,132,255,0.4)" }}
            aria-label="Nouvelle conversation"
          >
            <SquarePen className="w-6 h-6" />
          </button>
        </div>

        {/* ═══ CHAT AREA ═══ */}
        {!selectedConv ? (
          <div className={`flex-1 min-h-0 flex-col items-center justify-center bg-white p-8 text-center ${showConvList ? "hidden lg:flex" : "flex"}`}>
            <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-3">
              <Inbox className="w-8 h-8 text-[#65676B]" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#050505" }}>Aucune conversation</p>
            <p className="text-muted-foreground mt-1 max-w-xs" style={{ fontSize: 13 }}>
              Contactez un vendeur depuis sa boutique ou une fiche produit pour démarrer une discussion.
            </p>
          </div>
        ) : (
        <div className={`flex-1 min-h-0 flex-col bg-white ${showConvList ? "hidden lg:flex" : "flex"}`}>
          {/* Chat header (Messenger style) */}
          <div className="px-2 py-2 bg-white border-b border-[#E4E6EB] flex items-center gap-2">
            <button onClick={() => setShowConvList(true)} className="p-1.5 hover:bg-[#F2F2F2] rounded-full lg:hidden active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6 text-[#0084FF]" />
            </button>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden">
                <img src={selectedConv.avatar} alt={selectedConv.name} className="w-full h-full object-cover" />
              </div>
              {selectedConv.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31A24C] rounded-full border-2 border-white" />
              )}
            </div>
            <button type="button" className="flex-1 min-w-0 text-left" onClick={openVendorProfile}>
              <div className="flex items-center gap-1">
                <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "#050505" }}>{selectedConv.name}</p>
                <badgeInfo.icon className="w-3 h-3 shrink-0" style={{ color: badgeInfo.bg }} />
              </div>
              <p style={{ fontSize: 12, color: "#65676B" }}>
                {selectedConv.online ? "Actif·ve maintenant" : "Hors ligne"}
              </p>
            </button>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setCallType("audio")} aria-label="Appel vocal" className="w-9 h-9 hover:bg-[#F2F2F2] rounded-full active:scale-95 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#0084FF]" />
              </button>
              <button onClick={() => setCallType("video")} aria-label="Appel vidéo" className="w-9 h-9 hover:bg-[#F2F2F2] rounded-full active:scale-95 hidden sm:flex items-center justify-center">
                <Video className="w-5 h-5 text-[#0084FF]" />
              </button>
              <button
                onClick={() => navigate(`/vendeur/${selectedConv.name.toLowerCase().replace(/\s/g, "-")}`)}
                className="w-9 h-9 hover:bg-[#F2F2F2] rounded-full active:scale-95 flex items-center justify-center"
              >
                <Store className="w-5 h-5 text-[#0084FF]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-1 bg-white">
            {chatMessages.map((msg) => {
              if (msg.date) {
                return (
                  <div key={`date-${msg.id}`}>
                    <div className="flex items-center justify-center my-3">
                      <span className="px-2.5 py-1" style={{ fontSize: 11, fontWeight: 600, color: "#65676B" }}>
                        {msg.date}
                      </span>
                    </div>
                    {msg.type === "system" && (
                      <div className="flex justify-center mb-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F2F5]">
                          <Shield className="w-3 h-3 text-[#65676B]" />
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#65676B" }}>{msg.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const isMine = msg.sender === "me";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 ${
                      isMine
                        ? "text-white rounded-3xl rounded-br-md"
                        : "text-[#050505] rounded-3xl rounded-bl-md"
                    }`}
                    style={{
                      background: isMine
                        ? "linear-gradient(135deg, #00C6FF 0%, #0084FF 100%)"
                        : "#F0F2F5",
                    }}
                  >
                    {msg.type === "text" && msg.text && <p style={{ fontSize: 14.5, lineHeight: "20px" }}>{msg.text}</p>}
                    {msg.type === "product" && msg.product && (
                      <div>
                        {msg.text && <p style={{ fontSize: 13, lineHeight: "19px", marginBottom: 8 }}>{msg.text}</p>}
                        <ProductBubble product={msg.product} sender={msg.sender} />
                      </div>
                    )}
                    {msg.type === "order" && msg.order && <OrderBubble order={msg.order} sender={msg.sender} />}
                    {msg.type === "payment" && msg.payment && <PaymentBubble payment={msg.payment} sender={msg.sender} />}
                    {msg.type === "image" && msg.imageUrl && (
                      <div>
                        <div className="rounded-xl overflow-hidden mb-1.5" style={{ maxWidth: 240 }}>
                          <img src={msg.imageUrl} alt="" className="w-full h-40 object-cover" />
                        </div>
                        {msg.text && <p style={{ fontSize: 12, lineHeight: "17px", opacity: 0.9 }}>{msg.text}</p>}
                      </div>
                    )}
                    {msg.type === "voice" && msg.voiceDuration && <VoiceBubble duration={msg.voiceDuration} sender={msg.sender} />}
                    {msg.attachment && (
                      <div className={`mt-2 flex items-center gap-2 rounded-2xl px-2.5 py-2 ${isMine ? "bg-white/20" : "bg-white"}`}>
                        <FileText className="w-4 h-4" />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{msg.attachment}</span>
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <div className="flex items-end ml-1 mb-0.5">
                      {msg.read ? <CheckCheck className="w-3.5 h-3.5 text-[#0084FF]" />
                      : msg.delivered ? <CheckCheck className="w-3.5 h-3.5 text-[#65676B]" />
                      : <Check className="w-3.5 h-3.5 text-[#65676B]" />}
                    </div>
                  )}
                </motion.div>
              );
            })}
            {typingFor === selectedId && <TypingIndicator />}
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 overflow-x-auto flex gap-1.5 bg-white border-t border-[#E4E6EB]" style={{ scrollbarWidth: "none" }}>
            {quickReplies.map((text, i) => (
              <button key={i} onClick={() => sendQuickReply(text)}
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#F0F2F5] text-[#0084FF] hover:bg-[#E7F3FF] active:scale-95 transition-all"
                style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                {text}
              </button>
            ))}
          </div>

          {/* Input bar (Messenger style) */}
          <div className="relative px-2 py-2 bg-white border-t border-[#E4E6EB]">
            <AnimatePresence>
              {showActions && <ActionSheet onClose={() => setShowActions(false)} onAction={handleAction} />}
            </AnimatePresence>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f, "camera");
                e.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f, "gallery");
                e.target.value = "";
              }}
            />
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleDocumentFile(f);
                e.target.value = "";
              }}
            />
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmoji(false)} />
              )}
            </AnimatePresence>
            {recording ? (
              <RecordingBar
                elapsed={recording.elapsed}
                onCancel={cancelRecording}
                onSend={stopRecording}
              />
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => { setShowActions(!showActions); setShowEmoji(false); }} aria-label="Joindre" className="w-9 h-9 hover:bg-[#F2F2F2] rounded-full active:scale-95 transition-all flex items-center justify-center shrink-0">
                  <motion.div animate={{ rotate: showActions ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="w-6 h-6 text-[#0084FF]" />
                  </motion.div>
                </button>
                <div className="flex-1 relative">
                  <input ref={inputRef} type="text" placeholder="Aa"
                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendMessage(); }}
                    className="w-full px-4 py-2 rounded-full bg-[#F0F2F5] border-none pr-10 focus:bg-[#E4E6EB] transition-colors"
                    style={{ fontSize: 14.5 }} />
                  <button onClick={() => { setShowEmoji((v) => !v); setShowActions(false); }}
                    aria-label="Emojis"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 hover:bg-black/5 rounded-full flex items-center justify-center">
                    <Smile className={`w-5 h-5 ${showEmoji ? "text-[#0084FF]" : "text-[#65676B]"}`} />
                  </button>
                </div>
                {newMessage.trim() ? (
                  <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={sendMessage}
                    aria-label="Envoyer"
                    className="w-9 h-9 rounded-full text-white active:scale-90 transition-transform flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #00C6FF, #0084FF)" }}>
                    <Send className="w-[18px] h-[18px]" />
                  </motion.button>
                ) : (
                  <button
                    onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                    onPointerUp={stopRecording}
                    onPointerCancel={cancelRecording}
                    onPointerLeave={() => { if (recording) cancelRecording(); }}
                    aria-label="Maintenir pour enregistrer un message vocal"
                    className="w-9 h-9 rounded-full hover:bg-[#F2F2F2] active:scale-95 transition-all touch-none select-none flex items-center justify-center shrink-0"
                  >
                    <Mic className="w-5 h-5 text-[#0084FF]" />
                  </button>
                )}
              </div>
            )}
            {/* Safe area spacer mobile */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
        )}
      </div>

      {/* ═════════ OVERLAYS ═════════ */}
      <AnimatePresence>
        {callType && selectedConv && (
          <CallOverlay
            type={callType}
            name={selectedConv.name}
            avatar={selectedConv.avatar}
            onClose={() => endCall(callType)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showNewConv && (
          <NewConversationSheet
            convs={convList}
            onClose={() => setShowNewConv(false)}
            onPick={(c) => { setShowNewConv(false); selectConversation(c); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMOJI PICKER (popover compact)
   ═══════════════════════════════════════════════════ */
function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const emojis = [
    "😀","😁","😂","🤣","😊","😍","🥰","😘","😎","🤩",
    "🙏","👍","👎","👏","🙌","💪","🤝","✌️","👌","🤞",
    "❤️","🔥","🎉","✨","⭐","💯","✅","❌","⚡","💡",
    "📦","🚚","🛒","💳","💰","🧾","📍","📞","📷","🎁",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-border rounded-2xl shadow-xl p-3 z-30"
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Emojis</span>
        <button onClick={onClose} aria-label="Fermer" className="p-1 hover:bg-muted rounded-md">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            className="text-xl p-1 rounded-md hover:bg-muted active:scale-95"
          >
            {e}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   RECORDING BAR (barre de capture vocale)
   ═══════════════════════════════════════════════════ */
function RecordingBar({ elapsed, onCancel, onSend }: { elapsed: number; onCancel: () => void; onSend: () => void }) {
  const mm = Math.floor(elapsed / 60).toString().padStart(1, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  return (
    <div className="flex items-center gap-2">
      <button onClick={onCancel} aria-label="Annuler" className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] active:scale-95">
        <X className="w-5 h-5" />
      </button>
      <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FEF2F2]">
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block"
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>Enregistrement…</span>
        <span className="ml-auto tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>{mm}:{ss}</span>
      </div>
      <button
        onPointerUp={onSend}
        onClick={onSend}
        aria-label="Envoyer"
        className="w-9 h-9 rounded-full text-white active:scale-90 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #00C6FF, #0084FF)" }}
      >
        <Send className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALL OVERLAY (simulation d'appel)
   ═══════════════════════════════════════════════════ */
function CallOverlay({ type, name, avatar, onClose }: { type: "audio" | "video"; name: string; avatar: string; onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Appel ${type === "video" ? "vidéo" : "vocal"}`}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mb-6"
      >
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </motion.div>
      <p className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{name}</p>
      <p className="text-white/60 mb-2" style={{ fontSize: 13 }}>
        {type === "video" ? "Appel vidéo en cours" : "Appel vocal en cours"}
      </p>
      <p className="text-white tabular-nums mb-10" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>{mm}:{ss}</p>
      <div className="flex items-center gap-6">
        {type === "video" && (
          <button
            onClick={() => setCam((c) => !c)}
            aria-label={cam ? "Désactiver la caméra" : "Activer la caméra"}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${cam ? "bg-white/15 text-white" : "bg-white text-[#0F172A]"}`}
          >
            <Video className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Raccrocher"
          className="w-16 h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center active:scale-95"
          style={{ boxShadow: "0 10px 30px rgba(220,38,38,0.5)" }}
        >
          <Phone className="w-6 h-6" style={{ transform: "rotate(135deg)" }} />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Réactiver le micro" : "Couper le micro"}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${muted ? "bg-white text-[#0F172A]" : "bg-white/15 text-white"}`}
        >
          <Mic className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   NEW CONVERSATION SHEET
   ═══════════════════════════════════════════════════ */
function NewConversationSheet({ convs, onClose, onPick }: { convs: Conversation[]; onClose: () => void; onPick: (c: Conversation) => void }) {
  const [q, setQ] = useState("");
  const filtered = convs.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-label="Nouvelle conversation"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85dvh] flex flex-col"
      >
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Nouvelle conversation</p>
            <button onClick={onClose} aria-label="Fermer" className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un contact…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none"
              style={{ fontSize: 13 }}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-6 text-muted-foreground" style={{ fontSize: 13 }}>
              Aucun contact trouvé
            </div>
          ) : filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted active:bg-muted/70 text-left"
            >
              <div className="relative">
                <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-full object-cover" />
                {c.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#16A34A] rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</p>
                <p className="truncate text-muted-foreground" style={{ fontSize: 12 }}>{c.category ?? c.lastMessage}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}