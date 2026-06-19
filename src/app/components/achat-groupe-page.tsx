import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, Users, ShoppingCart, Package, ChevronDown, Plus,
  CheckCircle2, Clock, Star, Share2, QrCode,
  Shield, Truck, MapPin, Eye,
  Scissors, Scale, Image, RefreshCw, History,
  MessageSquare, CreditCard, Wallet, TrendingDown,
  Target, Lock, Phone, X, Trash2,
  ShoppingBag, type LucideIcon,
} from "lucide-react";
import { WhatsAppIcon } from "./icons/whatsapp-icon";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CouponStrip } from "./promo-widgets";
import {
  NAVY, P, GREEN, GOLD, BLUE, PURPLE, ORANGE, TEAL,
  IMG_HERO,
  catalogCategories, packsFamille,
  type Tab,
} from "./achat-groupe-data";
import {
  subscribeGroups, getGroups, createGroup as storeCreateGroup,
  joinGroup, leaveGroup, payShare, deleteGroup, markDelivered,
  currentPalierPrice, currentQty, timeLeftLabel,
  type Group,
} from "../groups/store";
import {
  subscribePublicGroups, getPublicGroups, refreshPublicGroups,
} from "../data/public-groups";
import { ensureAccountId } from "../auth/account-id";
import { useUserProfile } from "../auth/useUserProfile";

type CatalogItem = {
  name: string; unit: string; price: number; minGroup: number;
  maxDiscount: number; image: string; portions: string;
};

const deliveryOptions = [
  { label: "Point de retrait", sub: "Gratuit, 1 adresse commune", extra: 0 },
  { label: "Livraison groupée", sub: "+500 F, chez le responsable", extra: 500 },
  { label: "Livraison individuelle", sub: "+1 500 F/pers, chez chaque membre", extra: 1500 },
];

const durationOptions = [
  { hours: 24, label: "24 heures" },
  { hours: 48, label: "48 heures" },
  { hours: 72, label: "72 heures" },
  { hours: 168, label: "7 jours" },
];

export function AchatGroupePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const profile = useUserProfile();
  const me = useMemo(() => ensureAccountId(), []);
  const myName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.businessName || "Moi"
    : "Moi";

  // Souscription au store des groupements (locaux) + au registre public.
  const localGroups = useSyncExternalStore(
    (cb) => subscribeGroups(cb),
    getGroups,
    getGroups,
  );
  const remoteGroups = useSyncExternalStore(
    (cb) => subscribePublicGroups(cb),
    getPublicGroups,
    getPublicGroups,
  );
  // Refresh du registre public à l'ouverture de la page.
  useEffect(() => { refreshPublicGroups(true).catch(() => undefined); }, []);
  // Fusion : local prioritaire (état frais après une action locale), puis
  // on ajoute les groupements distants inconnus pour découverte cross-user.
  const groups = useMemo(() => {
    const seen = new Set(localGroups.map((g) => g.id));
    const merged = [...localGroups];
    for (const g of remoteGroups) if (!seen.has(g.id)) merged.push(g);
    return merged;
  }, [localGroups, remoteGroups]);

  const [activeTab, setActiveTab] = useState<Tab>("actifs");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);

  // Modales
  const [joinModal, setJoinModal] = useState<{ group: Group; qty: string } | null>(null);
  const [inviteModal, setInviteModal] = useState<Group | null>(null);

  // Formulaire de création
  const [formName, setFormName] = useState("");
  const [formZone, setFormZone] = useState("");
  const [formDuration, setFormDuration] = useState(48);
  const [formProductName, setFormProductName] = useState("");
  const [formTargetQty, setFormTargetQty] = useState("");
  const [formMaxParticipants, setFormMaxParticipants] = useState("");
  const [formMyQty, setFormMyQty] = useState("");
  const [paymentMode, setPaymentMode] = useState<"individuel" | "leader">("individuel");
  const [deliveryMode, setDeliveryMode] = useState(0);

  // Récup d'un produit du catalogue par son nom (pour pré-remplir prix / image)
  const allCatalogItems = useMemo<CatalogItem[]>(
    () => catalogCategories.flatMap((c) => c.items as CatalogItem[]),
    [],
  );
  const formProduct = useMemo(
    () => allCatalogItems.find((p) => p.name === formProductName),
    [allCatalogItems, formProductName],
  );

  // Tick automatique chaque minute pour rafraîchir "timeLeft"
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ─── Gestion deeplink ?join=GRP-... ───
  useEffect(() => {
    const joinId = params.get("join");
    if (!joinId) return;
    const g = groups.find((x) => x.id === joinId);
    if (g) {
      setJoinModal({ group: g, qty: "1" });
      setActiveTab("actifs");
    } else {
      toast.error(`Groupement ${joinId} introuvable`);
    }
    const next = new URLSearchParams(params);
    next.delete("join");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  // ─── Compteurs hero ───
  const activeGroupsList = useMemo(
    () => groups.filter((g) => g.status === "ouvert" || g.status === "complet"),
    [groups],
  );
  const totalMembers = useMemo(
    () => groups.reduce((s, g) => s + g.participants.length, 0),
    [groups],
  );
  const avgSaving = useMemo(() => {
    const all = groups
      .map((g) => {
        const cp = currentPalierPrice(g);
        return g.priceNormal > 0 ? Math.round(((g.priceNormal - cp) / g.priceNormal) * 100) : 0;
      })
      .filter((n) => n > 0);
    if (all.length === 0) return 0;
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [groups]);

  // ─── Mes groupes ───
  const myGroups = useMemo(
    () => groups.filter((g) => g.organizerId === me.id || g.participants.some((p) => p.id === me.id)),
    [groups, me.id],
  );
  const totalSpent = useMemo(
    () => myGroups.reduce((s, g) => {
      const me1 = g.participants.find((p) => p.id === me.id);
      return s + (me1?.paid ? me1.amount : 0);
    }, 0),
    [myGroups, me.id],
  );

  // ─── Handlers ───
  const handleCreate = () => {
    const name = formName.trim();
    if (!name) { toast.error("Donnez un nom à votre groupe"); return; }
    if (!formZone.trim()) { toast.error("Indiquez la zone / quartier"); return; }
    if (!formProduct) { toast.error("Sélectionnez un produit"); return; }
    const target = Number(formTargetQty);
    if (!Number.isFinite(target) || target < formProduct.minGroup) {
      toast.error(`Quantité cible : au moins ${formProduct.minGroup} ${formProduct.unit}`);
      return;
    }
    const maxP = Math.max(1, Math.min(50, Number(formMaxParticipants) || 10));
    const myQty = Math.max(0, Math.floor(Number(formMyQty) || 0));
    const discount = formProduct.maxDiscount;
    const paliers = [
      { pct: 30, price: Math.round(formProduct.price * (1 - discount * 0.4 / 100)) },
      { pct: 60, price: Math.round(formProduct.price * (1 - discount * 0.7 / 100)) },
      { pct: 100, price: Math.round(formProduct.price * (1 - discount / 100)) },
    ];
    const g = storeCreateGroup({
      name,
      product: formProduct.name,
      image: formProduct.image,
      organizer: myName,
      organizerId: me.id,
      zone: formZone.trim(),
      targetQty: target,
      maxParticipants: maxP,
      priceNormal: formProduct.price,
      paliers,
      paymentMode,
      delivery: deliveryOptions[deliveryMode].label,
      durationHours: formDuration,
      organizerQty: myQty,
    });
    toast.success(`Groupement « ${g.name} » créé`);
    setFormName(""); setFormZone(""); setFormProductName("");
    setFormTargetQty(""); setFormMaxParticipants(""); setFormMyQty("");
    setActiveTab("actifs");
    setInviteModal(g);
  };

  const handleJoinSubmit = () => {
    if (!joinModal) return;
    const qty = Math.max(1, Math.floor(Number(joinModal.qty) || 0));
    const r = joinGroup(joinModal.group.id, { id: me.id, name: myName, qty });
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(`Vous avez réservé ${qty} part(s) dans « ${joinModal.group.name} »`);
    setJoinModal(null);
    setExpandedGroup(joinModal.group.id);
  };

  const handlePay = (g: Group) => {
    const r = payShare(g.id, me.id);
    if (!r.ok) {
      if (r.deficit) {
        toast.error(`Solde insuffisant — manque ${formatPrice(r.deficit)}`, {
          action: { label: "Recharger", onClick: () => navigate("/wallet") },
        });
      } else {
        toast.error(r.error);
      }
      return;
    }
    toast.success("Part payée — ref " + r.txnId);
  };

  const handleLeave = (g: Group) => {
    const r = leaveGroup(g.id, me.id);
    if (!r.ok) { toast.error(r.error ?? "Impossible"); return; }
    toast.success("Vous avez quitté le groupement");
  };

  const handleDelete = (g: Group) => {
    if (!window.confirm(`Supprimer le groupement « ${g.name} » ?`)) return;
    deleteGroup(g.id);
    toast.success("Groupement supprimé");
  };

  const handleMarkDelivered = (g: Group) => {
    markDelivered(g.id);
    toast.success("Livraison confirmée");
  };

  // Pré-remplir le formulaire avec un pack ou un item catalogue
  const prefillFromCatalog = (item: CatalogItem) => {
    setFormProductName(item.name);
    setFormTargetQty(String(item.minGroup));
    setFormMaxParticipants("10");
    setActiveTab("creer");
    toast.info(`Formulaire pré-rempli pour ${item.name}`);
  };
  const prefillFromPack = (pack: typeof packsFamille[number]) => {
    setFormName(pack.name);
    setFormProductName("");
    setFormTargetQty("");
    setFormMaxParticipants(String(parseInt(pack.members) || 4));
    setActiveTab("creer");
    toast.info(`Personnalisez « ${pack.name} »`);
  };

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "actifs", label: "En cours", icon: Users },
    { key: "creer", label: "Créer", icon: Plus },
    { key: "mes-groupes", label: "Mes groupes", icon: History },
    { key: "packs", label: "Packs", icon: ShoppingBag },
    { key: "catalogue", label: "Catalogue", icon: Package },
    { key: "comment", label: "Guide", icon: Eye },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F8FAFC" }}>
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}12` }}>
            <Users className="w-[18px] h-[18px]" style={{ color: P }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>Achat Groupé Famille</h1>
            <p className="hidden sm:block" style={{ fontSize: 11, color: "#94A3B8" }}>Mini-centrale d'achat familiale</p>
          </div>
          <button
            onClick={() => setActiveTab("creer")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden" style={{ minHeight: 150 }}>
        <ImageWithFallback src={IMG_HERO} alt="Famille" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(225,29,46,0.90), rgba(249,115,22,0.75))" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#FFF", lineHeight: 1.15 }}>
              Achetez ensemble,<br className="sm:hidden" /> payez moins
            </p>
            <p className="mt-1.5 max-w-md" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
              Regroupez les commandes de votre famille pour débloquer les prix de gros.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { v: String(activeGroupsList.length), l: "Groupes", color: "#FCA5A5" },
              { v: String(totalMembers), l: "Membres", color: "#FBBF24" },
              { v: avgSaving > 0 ? `-${avgSaving}%` : "—", l: "Économie", color: "#86EFAC" },
            ].map((s, i) => (
              <div key={i} className="text-center px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: s.color }}>{s.v}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {tabs.map(tab => {
            const TI = tab.icon;
            const on = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap shrink-0 border" style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#64748B", borderColor: on ? P : "#E2E8F0" }}>
                <TI className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-5xl mx-auto px-4 mt-4">

        {/* ───── EN COURS ───── */}
        {activeTab === "actifs" && (
          <div className="space-y-4">
            <CouponStrip code="FAMILLE10" discount="Bonus -10% sur votre 1er groupement famille" color={P} />

            {activeGroupsList.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>Aucun groupement en cours</p>
                <p className="mt-1 mb-4" style={{ fontSize: 13, color: "#64748B" }}>
                  Lancez votre premier achat groupé en quelques secondes.
                </p>
                <button
                  onClick={() => setActiveTab("creer")}
                  className="px-4 py-2.5 rounded-xl text-white inline-flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${P}, ${ORANGE})`, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  <Plus className="w-4 h-4" /> Créer un groupement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeGroupsList.map(g => {
                  const qty = currentQty(g);
                  const pct = g.targetQty > 0 ? Math.round((qty / g.targetQty) * 100) : 0;
                  const currentPrice = currentPalierPrice(g);
                  const discount = g.priceNormal > 0 ? Math.round(((g.priceNormal - currentPrice) / g.priceNormal) * 100) : 0;
                  const isOpen = expandedGroup === g.id;
                  const myPart = g.participants.find((p) => p.id === me.id);
                  const isOrganizer = g.organizerId === me.id;

                  return (
                    <div key={g.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                      <div className="flex gap-3 p-4">
                        <ImageWithFallback src={g.image} alt={g.product} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>{g.name}</p>
                            {g.status === "verrouillé" && (
                              <span className="px-1.5 py-0.5 rounded-md shrink-0" style={{ fontSize: 9, fontWeight: 700, color: "#FFF", background: GREEN }}>VERROUILLÉ</span>
                            )}
                            {g.status === "complet" && (
                              <span className="px-1.5 py-0.5 rounded-md shrink-0" style={{ fontSize: 9, fontWeight: 700, color: "#FFF", background: ORANGE }}>OBJECTIF ATTEINT</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: "#64748B" }}>
                            {g.product} · <span style={{ fontWeight: 600 }}>{g.organizer}{isOrganizer ? " (vous)" : ""}</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3" style={{ color: "#94A3B8" }} />
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>{g.zone}</span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1.5">
                            <span style={{ fontSize: 12, color: "#94A3B8", textDecoration: "line-through" }}>{formatPrice(g.priceNormal)}</span>
                            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: P }}>{formatPrice(currentPrice)}</span>
                            {discount > 0 && <span className="px-1.5 py-0.5 rounded-lg" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: GREEN }}>-{discount}%</span>}
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pb-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 12, color: "#64748B" }}>{qty}/{g.targetQty} unités · {g.participants.length}/{g.maxParticipants} membres</span>
                          <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: g.status === "verrouillé" ? GREEN : ORANGE }}>
                            <Clock className="w-3 h-3" /> {timeLeftLabel(g)}
                          </span>
                        </div>

                        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: g.status === "verrouillé" ? GREEN : `linear-gradient(90deg, ${P}, ${ORANGE})` }} />
                          {g.paliers.map(p => (
                            <div key={p.pct} className="absolute top-0 h-full w-0.5" style={{ left: `${p.pct}%`, background: "rgba(255,255,255,0.8)" }} />
                          ))}
                        </div>

                        <div className="flex gap-1.5">
                          {g.paliers.map(p => {
                            const reached = pct >= p.pct;
                            return (
                              <div key={p.pct} className="flex-1 rounded-xl py-2 text-center border" style={{ background: reached ? `${GREEN}06` : "#FAFBFC", borderColor: reached ? `${GREEN}30` : "#E2E8F0" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: reached ? GREEN : "#94A3B8" }}>{p.pct}%</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: reached ? GREEN : "#64748B" }}>{formatPrice(p.price)}</p>
                              </div>
                            );
                          })}
                        </div>

                        <button onClick={() => setExpandedGroup(isOpen ? null : g.id)} className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg" style={{ background: "#F8FAFC", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                          {isOpen ? "Masquer les détails" : "Voir participants & détails"}
                          <ChevronDown className="w-3.5 h-3.5" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                        </button>

                        {isOpen && (
                          <div className="space-y-2.5">
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                              <div className="grid grid-cols-12 gap-1 px-3 py-2" style={{ background: "#F8FAFC" }}>
                                <span className="col-span-4" style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>MEMBRE</span>
                                <span className="col-span-3" style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>PART</span>
                                <span className="col-span-3 text-right" style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>MONTANT</span>
                                <span className="col-span-2 text-center" style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>STATUT</span>
                              </div>
                              {g.participants.length === 0 ? (
                                <div className="px-3 py-4 text-center" style={{ fontSize: 12, color: "#94A3B8" }}>
                                  Aucun participant encore. Invitez vos proches !
                                </div>
                              ) : g.participants.map((p) => (
                                <div key={p.id} className="grid grid-cols-12 gap-1 px-3 py-2.5 border-t border-gray-50 items-center">
                                  <span className="col-span-4 truncate" style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
                                    {p.name}{p.id === me.id ? " (vous)" : ""}
                                  </span>
                                  <span className="col-span-3 truncate" style={{ fontSize: 11, color: "#64748B" }}>{p.qty} u.</span>
                                  <span className="col-span-3 text-right" style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{formatPrice(p.amount)}</span>
                                  <div className="col-span-2 flex justify-center">
                                    {p.paid ? <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} /> : <Clock className="w-4 h-4" style={{ color: ORANGE }} />}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: BLUE, background: `${BLUE}08`, border: `1px solid ${BLUE}20` }}>
                                <CreditCard className="w-3 h-3" /> {g.paymentMode === "individuel" ? "Paiement individuel" : "Paiement par le leader"}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: PURPLE, background: `${PURPLE}08`, border: `1px solid ${PURPLE}20` }}>
                                <Truck className="w-3 h-3" /> {g.delivery}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CTAs contextuels */}
                        {g.status === "verrouillé" ? (
                          <div className="flex gap-2">
                            <div className="flex-1 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5" style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}20`, fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: GREEN }}>
                              <Lock className="w-4 h-4" /> Commande verrouillée
                            </div>
                            {isOrganizer && (
                              <button onClick={() => handleMarkDelivered(g)} className="py-2.5 px-3.5 rounded-xl border border-gray-200" style={{ fontSize: 12, fontWeight: 600 }}>
                                <Truck className="w-4 h-4 inline mr-1" /> Livré
                              </button>
                            )}
                          </div>
                        ) : myPart && !myPart.paid ? (
                          <div className="flex gap-2">
                            <button onClick={() => handlePay(g)} className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5" style={{ background: GREEN, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                              <Wallet className="w-4 h-4" /> Payer ma part · {formatPrice(myPart.amount)}
                            </button>
                            <button onClick={() => handleLeave(g)} className="py-2.5 px-3.5 rounded-xl border border-gray-200" title="Se retirer">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ) : myPart && myPart.paid ? (
                          <div className="flex gap-2">
                            <div className="flex-1 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5" style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}20`, fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: GREEN }}>
                              <CheckCircle2 className="w-4 h-4" /> Ma part est payée
                            </div>
                            <button onClick={() => setInviteModal(g)} className="py-2.5 px-3.5 rounded-xl border border-gray-200" title="Inviter">
                              <Share2 className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setJoinModal({ group: g, qty: "1" })} className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5" style={{ background: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                              <Users className="w-4 h-4" /> Rejoindre
                            </button>
                            <button onClick={() => setInviteModal(g)} className="py-2.5 px-3.5 rounded-xl border border-gray-200" title="Partager">
                              <Share2 className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───── CRÉER ───── */}
        {activeTab === "creer" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 border border-gray-100 bg-white" style={{ borderLeftWidth: 4, borderLeftColor: P }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                Créez un <span style={{ fontWeight: 700 }}>Groupe Famille</span>, choisissez un produit, fixez la cible et invitez vos proches. Le prix baisse automatiquement à chaque palier atteint !
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="rounded-2xl p-4 border border-gray-100 bg-white space-y-3.5">
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>Informations du groupe</p>
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Nom du groupe *</label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder='Ex: "Famille Kérékou", "Quartier Zongo"'
                      className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Zone / Quartier *</label>
                      <input
                        value={formZone}
                        onChange={(e) => setFormZone(e.target.value)}
                        placeholder="Godomey, Calavi..."
                        className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Durée *</label>
                      <select
                        value={formDuration}
                        onChange={(e) => setFormDuration(Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                        style={{ fontSize: 13 }}
                      >
                        {durationOptions.map((d) => (
                          <option key={d.hours} value={d.hours}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Produit à acheter *</label>
                    <select
                      value={formProductName}
                      onChange={(e) => setFormProductName(e.target.value)}
                      className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                      style={{ fontSize: 13 }}
                    >
                      <option value="">Sélectionner un produit</option>
                      {catalogCategories.map((c) => (
                        <optgroup key={c.name} label={c.name}>
                          {(c.items as CatalogItem[]).map((p) => (
                            <option key={p.name} value={p.name}>{p.name} · {formatPrice(p.price)}/{p.unit}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {formProduct && (
                      <p className="mt-1.5" style={{ fontSize: 11, color: "#64748B" }}>
                        Min. groupement : {formProduct.minGroup} {formProduct.unit} · Économie max -{formProduct.maxDiscount}%
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Quantité cible *</label>
                      <input
                        type="number" inputMode="numeric" min={1}
                        value={formTargetQty}
                        onChange={(e) => setFormTargetQty(e.target.value)}
                        placeholder="30"
                        className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Max membres</label>
                      <input
                        type="number" inputMode="numeric" min={1} max={50}
                        value={formMaxParticipants}
                        onChange={(e) => setFormMaxParticipants(e.target.value)}
                        placeholder="10"
                        className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Ma part</label>
                      <input
                        type="number" inputMode="numeric" min={0}
                        value={formMyQty}
                        onChange={(e) => setFormMyQty(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border border-gray-100 bg-white space-y-3">
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Mode de paiement</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["individuel", "leader"] as const).map(m => (
                      <button key={m} onClick={() => setPaymentMode(m)} className="rounded-xl p-3 text-left border" style={{ borderColor: paymentMode === m ? P : "#E2E8F0", background: paymentMode === m ? `${P}04` : "#FFF" }}>
                        <div className="flex items-center gap-2 mb-1">
                          {paymentMode === m ? <CheckCircle2 className="w-4 h-4" style={{ color: P }} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: paymentMode === m ? P : NAVY }}>{m === "individuel" ? "Individuel" : "Leader"}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>
                          {m === "individuel" ? "Chaque membre paie sa part" : "Un seul paie, les autres remboursent"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl p-4 border border-gray-100 bg-white space-y-3">
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Mode de livraison</p>
                  <div className="space-y-2">
                    {deliveryOptions.map((d, i) => (
                      <button key={i} onClick={() => setDeliveryMode(i)} className="w-full flex items-start gap-3 rounded-xl p-3 text-left border" style={{ borderColor: deliveryMode === i ? PURPLE : "#E2E8F0", background: deliveryMode === i ? `${PURPLE}04` : "#FFF" }}>
                        {deliveryMode === i ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PURPLE }} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0 mt-0.5" />}
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: deliveryMode === i ? PURPLE : NAVY }}>{d.label}</span>
                          <p style={{ fontSize: 11, color: "#64748B" }}>{d.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Récap dynamique */}
                {formProduct && Number(formTargetQty) > 0 && (
                  <div className="rounded-2xl p-4 border border-gray-100 bg-white space-y-2">
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Récapitulatif</p>
                    <div className="text-sm space-y-1" style={{ color: "#475569" }}>
                      <div className="flex justify-between"><span>Prix unitaire (sans groupement)</span><span style={{ fontWeight: 700 }}>{formatPrice(formProduct.price)}</span></div>
                      <div className="flex justify-between"><span>Prix au palier 100%</span><span style={{ fontWeight: 700, color: GREEN }}>{formatPrice(Math.round(formProduct.price * (1 - formProduct.maxDiscount / 100)))}</span></div>
                      <div className="flex justify-between"><span>Quantité cible</span><span style={{ fontWeight: 700 }}>{formTargetQty} {formProduct.unit}</span></div>
                      <div className="flex justify-between"><span>Ma part initiale</span><span style={{ fontWeight: 700 }}>{Number(formMyQty) || 0} {formProduct.unit}</span></div>
                    </div>
                  </div>
                )}

                <button onClick={handleCreate} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${P}, ${ORANGE})`, fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                  <Users className="w-5 h-5" /> Créer mon Groupe Famille
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── MES GROUPES ───── */}
        {activeTab === "mes-groupes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>Historique de mes groupes</p>
              <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: 12, fontWeight: 600, color: "#64748B", background: "#F1F5F9" }}>
                {myGroups.length} groupes
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-3.5 border border-gray-100 bg-white text-center">
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: P }}>{myGroups.length}</p>
                <p style={{ fontSize: 11, color: "#64748B" }}>Participations</p>
              </div>
              <div className="rounded-2xl p-3.5 border border-gray-100 bg-white text-center">
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: GREEN }}>{formatPrice(totalSpent)}</p>
                <p style={{ fontSize: 11, color: "#64748B" }}>Total payé</p>
              </div>
              <div className="rounded-2xl p-3.5 border border-gray-100 bg-white text-center">
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: GOLD }}>
                  ~{formatPrice(myGroups.reduce((s, g) => {
                    const p = g.participants.find((x) => x.id === me.id);
                    if (!p?.paid) return s;
                    return s + p.qty * (g.priceNormal - currentPalierPrice(g));
                  }, 0))}
                </p>
                <p style={{ fontSize: 11, color: "#64748B" }}>Économisé</p>
              </div>
            </div>

            {myGroups.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <History className="w-10 h-10 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
                <p style={{ fontSize: 13, color: "#64748B" }}>Aucun historique pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myGroups.map((g) => {
                  const p = g.participants.find((x) => x.id === me.id);
                  const isOrg = g.organizerId === me.id;
                  const role = isOrg ? "Organisateur" : "Membre";
                  const statusLabel =
                    g.status === "livré" ? "Livré"
                      : g.status === "verrouillé" ? "Verrouillé"
                      : g.status === "complet" ? "Complet"
                      : g.status === "annulé" ? "Annulé"
                      : "En cours";
                  const statusColor =
                    g.status === "livré" || g.status === "verrouillé" ? GREEN
                      : g.status === "annulé" ? "#94A3B8"
                      : ORANGE;
                  return (
                    <div key={g.id} className="rounded-2xl p-4 border border-gray-100 bg-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${statusColor}10` }}>
                        {g.status === "livré" || g.status === "verrouillé" ? <CheckCircle2 className="w-5 h-5" style={{ color: statusColor }} /> : <Clock className="w-5 h-5" style={{ color: statusColor }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>{g.name}</p>
                          <span className="px-1.5 py-0.5 rounded-md shrink-0" style={{ fontSize: 10, fontWeight: 700, color: isOrg ? PURPLE : BLUE, background: isOrg ? `${PURPLE}10` : `${BLUE}10` }}>{role}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#64748B" }}>
                          {g.product} {p ? `· ${p.qty} u.` : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(g.createdAt).toLocaleDateString("fr-FR")}</span>
                          <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: statusColor }}>{statusLabel}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>{formatPrice(p?.amount ?? 0)}</p>
                          {p?.paid && <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: GREEN }} />}
                        </div>
                        {isOrg && (g.status === "ouvert" || g.status === "annulé") && (
                          <button onClick={() => handleDelete(g)} className="p-1.5 rounded-lg hover:bg-red-50" title="Supprimer">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───── PACKS FAMILLE ───── */}
        {activeTab === "packs" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 border border-gray-100 bg-white" style={{ borderLeftWidth: 4, borderLeftColor: ORANGE }}>
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 4 }}>Packs Famille prêts à commander</p>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                Des paniers pré-composés pour démarrer rapidement un achat groupé.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packsFamille.map((pk, i) => {
                const PI = pk.icon;
                const discount = Math.round(((pk.price - pk.priceGroupe) / pk.price) * 100);
                return (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="relative" style={{ height: 120 }}>
                      <ImageWithFallback src={pk.image} alt={pk.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, rgba(0,0,0,0.55))` }} />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg" style={{ background: pk.color, fontSize: 10, fontWeight: 700, color: "#FFF" }}>
                        -{discount}%
                      </div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#FFF" }}>{pk.name}</p>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="mb-2" style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>{pk.desc}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <PI className="w-4 h-4" style={{ color: pk.color }} />
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{pk.members}</span>
                      </div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span style={{ fontSize: 12, color: "#94A3B8", textDecoration: "line-through" }}>{formatPrice(pk.price)}</span>
                        <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: P }}>{formatPrice(pk.priceGroupe)}</span>
                      </div>
                      <button onClick={() => prefillFromPack(pk)} className="w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5" style={{ background: pk.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                        <Users className="w-4 h-4" /> Lancer ce pack
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───── CATALOGUE ───── */}
        {activeTab === "catalogue" && (
          <div className="space-y-4">
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>Catalogue Famille — Produits groupables</p>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {catalogCategories.map((c, i) => {
                const CI = c.icon;
                return (
                  <button key={i} onClick={() => setSelectedCatIdx(i)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0 border" style={{ fontSize: 12, fontWeight: selectedCatIdx === i ? 700 : 500, background: selectedCatIdx === i ? `${c.color}10` : "#FFF", color: selectedCatIdx === i ? c.color : "#64748B", borderColor: selectedCatIdx === i ? c.color : "#E2E8F0" }}>
                    <CI className="w-3.5 h-3.5" /> {c.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(catalogCategories[selectedCatIdx].items as CatalogItem[]).map((item, i) => (
                <div key={i} className="rounded-2xl p-3.5 border border-gray-100 bg-white flex gap-3">
                  <ImageWithFallback src={item.image} alt={item.name} className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{item.unit} · Min. {item.minGroup} u.</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: NAVY }}>{formatPrice(item.price)}</span>
                      <span className="px-1.5 py-0.5 rounded-lg" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: GREEN }}>-{item.maxDiscount}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Scissors className="w-3 h-3 shrink-0" style={{ color: "#94A3B8" }} />
                      <p className="truncate" style={{ fontSize: 10, color: "#94A3B8" }}>{item.portions}</p>
                    </div>
                    <button onClick={() => prefillFromCatalog(item)} className="mt-2 px-3 py-1.5 rounded-lg" style={{ background: P, fontSize: 11, fontWeight: 700, color: "#FFF" }}>
                      Grouper
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4 border border-gray-100 bg-white">
              <p className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>Garde-fous qualité</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { text: "Poids minimum vérifié par lot", icon: Scale, color: GREEN },
                  { text: "Catégorie/calibre certifié (ex: poulet 1,5-2kg)", icon: Target, color: BLUE },
                  { text: "Photos réelles ou standardisées", icon: Image, color: PURPLE },
                  { text: "Politique de remplacement si non-conforme", icon: RefreshCw, color: ORANGE },
                  { text: "Contrôle fournisseur IPPOO", icon: Shield, color: GOLD },
                  { text: "Historique des commandes du groupe", icon: History, color: TEAL },
                ].map((s, i) => {
                  const SI = s.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "#FAFBFC" }}>
                      <SI className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                      <span style={{ fontSize: 12, color: "#374151" }}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ───── COMMENT ÇA MARCHE ───── */}
        {activeTab === "comment" && (
          <div className="space-y-4">
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: NAVY }}>Comment fonctionne l'Achat Groupé Famille ?</p>
            <div className="rounded-2xl p-4 sm:p-5 border border-gray-100 bg-white">
              <div className="relative">
                <div className="absolute left-5 top-6 bottom-6 w-0.5" style={{ background: "#E2E8F0" }} />
                <div className="space-y-5">
                  {[
                    { step: 1, title: "Créez votre Groupe Famille", desc: "Nom, produit, quantité cible, durée (24h à 7 jours).", icon: Plus, color: P },
                    { step: 2, title: "Invitez vos proches", desc: "Partagez le lien via WhatsApp, SMS ou QR code.", icon: Share2, color: ORANGE },
                    { step: 3, title: "Chaque membre prend sa part", desc: "1/3 de poulet, 5 kg de riz, 2L d'huile…", icon: Scissors, color: BLUE },
                    { step: 4, title: "Le prix baisse en temps réel", desc: "Plus il y a de participants, plus le prix descend.", icon: TrendingDown, color: GREEN },
                    { step: 5, title: "Cible atteinte → Verrouillage", desc: "Quand 100% des parts sont payées et la cible est atteinte.", icon: Lock, color: PURPLE },
                    { step: 6, title: "Livraison & distribution", desc: "Point de retrait, livraison groupée ou individuelle.", icon: Truck, color: TEAL },
                  ].map(s => {
                    const SI = s.icon;
                    return (
                      <div key={s.step} className="flex items-start gap-3.5 relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 bg-white border-2" style={{ borderColor: s.color }}>
                          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: s.color }}>{s.step}</span>
                        </div>
                        <div className="min-w-0 pt-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <SI className="w-4 h-4" style={{ color: s.color }} />
                            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: NAVY }}>{s.title}</p>
                          </div>
                          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={() => setActiveTab("creer")} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${P}, ${ORANGE})`, fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
              <Plus className="w-5 h-5" /> Créer mon premier Groupe Famille
            </button>
          </div>
        )}
      </div>

      {/* ═══ JOIN MODAL ═══ */}
      {joinModal && (
        <Modal onClose={() => setJoinModal(null)} title={`Rejoindre « ${joinModal.group.name} »`}>
          <p style={{ fontSize: 13, color: "#475569" }}>
            Indiquez la quantité que vous souhaitez réserver. Le montant sera calculé selon le palier de prix en cours.
          </p>
          <div className="mt-3">
            <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Ma part (unités)
            </label>
            <input
              type="number" inputMode="numeric" min={1}
              value={joinModal.qty}
              onChange={(e) => setJoinModal({ ...joinModal, qty: e.target.value })}
              className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
              style={{ fontSize: 14 }}
              autoFocus
            />
            <p className="mt-1.5" style={{ fontSize: 12, color: "#64748B" }}>
              Coût estimé : {formatPrice((Number(joinModal.qty) || 0) * currentPalierPrice(joinModal.group))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => setJoinModal(null)} className="py-2.5 rounded-xl border border-gray-200" style={{ fontSize: 13, fontWeight: 600 }}>
              Annuler
            </button>
            <button onClick={handleJoinSubmit} className="py-2.5 rounded-xl text-white" style={{ background: P, fontSize: 13, fontWeight: 700 }}>
              Confirmer
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ INVITE MODAL ═══ */}
      {inviteModal && (
        <InviteModal group={inviteModal} onClose={() => setInviteModal(null)} />
      )}
    </div>
  );
}

/* ═══ MODAL générique ═══ */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══ INVITE MODAL ═══ */
function InviteModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/achat-groupe?join=${group.id}`;
  const message = `Rejoignez mon groupement « ${group.name} » sur IPPOO pour ${group.product} : ${link}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(link).then(
      () => toast.success("Lien copié"),
      () => toast.error("Impossible de copier"),
    );
  };

  return (
    <Modal onClose={onClose} title="Inviter les membres">
      <div className="space-y-3">
        <div className="flex justify-center">
          <img src={qrUrl} alt="QR Code" className="w-44 h-44 rounded-xl border border-gray-200" />
        </div>
        <div className="p-3 rounded-xl bg-gray-50 break-all" style={{ fontSize: 12 }}>{link}</div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            className="py-2.5 rounded-xl text-white text-center inline-flex items-center justify-center gap-1.5"
            style={{ background: "#25D366", fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
          >
            <WhatsAppIcon size={16} filled={false} className="text-white" /> WhatsApp
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(message)}`}
            className="py-2.5 rounded-xl text-white text-center inline-flex items-center justify-center gap-1.5"
            style={{ background: "#3B82F6", fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
          >
            <Phone className="w-4 h-4" /> SMS
          </a>
        </div>
        <button onClick={copyLink} className="w-full py-2.5 rounded-xl border border-gray-200" style={{ fontSize: 13, fontWeight: 600 }}>
          Copier le lien d'invitation
        </button>
      </div>
    </Modal>
  );
}
