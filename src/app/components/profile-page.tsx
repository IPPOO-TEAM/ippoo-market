import { logger } from "../lib/logger";
import {
  User,
  Crown,
  MapPin,
  Shield,
  Globe,
  ChevronRight,
  LogOut,
  BadgeCheck,
  FileText,
  Camera,
  Building2,
  Phone,
  Mail,
  Lock,
  Smartphone,
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { IMAGES } from "./mock-data";
import { setCurrentLanguage, getCurrentLangLabel } from "../i18n";
import { SpinWheelTeaser, LoyaltyPointsBadge, CouponStrip } from "./promo-widgets";
import { usePayments } from "../payments/usePayments";
import { Switch } from "./ui-kit/Switch";
import { cancelSubscription } from "../payments/store";
import { Sparkles, CalendarDays, Fingerprint } from "lucide-react";
import { useEffect } from "react";
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  hasBiometricCredential,
  getPublicProfile,
  clearBiometric,
} from "../auth/biometric";
import { ensureAccountId, resetAccountId, type AccountId } from "../auth/account-id";
import { MemberCard } from "./member-card";
import { CreditCard } from "lucide-react";
import { useUserProfile } from "../auth/useUserProfile";
import { ACCOUNT_TYPE_LABELS, DELIVERY_LABELS, PAYMENT_LABELS, isSeller, isBusiness, isBuyer, patchUserProfile } from "../auth/user-profile";
import { Truck, Wallet } from "lucide-react";
import { fileToCompressedDataUrl } from "../data/shop-assets";
import { uploadUserFile, getUserFile, type UserFileKind } from "../data/user-files";
import { getSupabase, getAccessToken } from "../auth/supabase";
import { useSession } from "../auth/useSession";
import { getUserKv, setUserKv } from "../data/user-kv";
import { listOrders } from "../data/orders-server";
import { Store as StoreIcon } from "lucide-react";

import type { Address, Doc, TeamMember } from "./profile/types";
import { Section, Row, SyncBadge } from "./profile/profile-primitives";
import {
  EditInfoModal,
  AddressModal,
  PasswordModal,
  PrefModal,
  TeamModal,
  ConfirmModal,
} from "./profile/profile-modals-basic";
import {
  EditProModal,
  EditLogisticsModal,
  EditPaymentsModal,
  EditDocModal,
} from "./profile/profile-modals-pro";
import { ShopBrandingPanel } from "./profile/shop-branding-panel";

export function ProfilePage() {
  const { session } = useSession();
  const syncOn = !!session;
  const [syncing, setSyncing] = useState<null | "addresses" | "team" | "preferences">(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const userProfile = useUserProfile();
  const seller = isSeller(userProfile);
  const buyer = isBuyer(userProfile);
  const business = isBusiness(userProfile);
  const accountTypeLabel = userProfile ? ACCOUNT_TYPE_LABELS[userProfile.accountType] : null;

  const [avatar, setAvatar] = useState<string>(userProfile?.avatar || "");
  const [info, setInfo] = useState(() => ({
    name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    company: userProfile?.businessName || "",
    city: userProfile?.city || "",
  }));

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [docs, setDocs] = useState<Doc[]>([
    { id: "d1", label: "Pièce d'identité", status: "missing" },
    { id: "d2", label: "Registre de commerce", status: "missing" },
    { id: "d3", label: "Justificatif d'adresse", status: "missing" },
  ]);

  const [twoFA, setTwoFA] = useState(false);
  const [bioReady, setBioReady] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  useEffect(() => {
    let dead = false;
    (async () => {
      const ok = isBiometricSupported() && (await isPlatformAuthenticatorAvailable());
      if (dead) return;
      setBioReady(ok);
      setBioEnrolled(hasBiometricCredential());
    })();
    return () => { dead = true; };
  }, []);
  const bioProfile = bioEnrolled ? getPublicProfile() : null;
  const [account, setAccount] = useState<AccountId | null>(null);
  useEffect(() => { setAccount(ensureAccountId()); }, []);
  const regenerateAccountQr = () => {
    if (!window.confirm("Régénérer ton identifiant IPPOO ? Les anciens QR de connexion seront invalidés.")) return;
    setAccount(resetAccountId());
    toast.success("Nouvel identifiant IPPOO généré");
  };
  const [prefs, setPrefs] = useState(() => ({
    language: getCurrentLangLabel(),
    currency: "FCFA (XOF)",
    notifications: "Non configuré",
  }));
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const [editInfo, setEditInfo] = useState(false);
  const [editAddr, setEditAddr] = useState<Address | null>(null);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPref, setShowPref] = useState<keyof typeof prefs | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmCancelSub, setConfirmCancelSub] = useState(false);
  const [editPro, setEditPro] = useState(false);
  const [editLogistics, setEditLogistics] = useState(false);
  const [editPayments, setEditPayments] = useState(false);
  const [editDoc, setEditDoc] = useState<null | "logo" | "shopPhoto" | "certificate">(null);

  const payState = usePayments();
  const sub = payState.subscription;
  const subActive = !!sub && sub.expiresAt > Date.now();
  const daysLeft = sub ? Math.max(0, Math.ceil((sub.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
  const renewalDate = sub ? new Date(sub.expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";

  // Récupère l'avatar + collections owner-based au montage si session
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!session) return;
      const [url, addr, tm, pr, security, orders] = await Promise.all([
        getUserFile("avatar"),
        getUserKv<Address[]>("addresses"),
        getUserKv<TeamMember[]>("team"),
        getUserKv<typeof prefs>("preferences"),
        getUserKv<{ twoFA?: boolean }>("security"),
        listOrders().catch(() => [] as Awaited<ReturnType<typeof listOrders>>),
      ]);
      if (dead) return;
      if (url) setAvatar(url);
      if (addr && Array.isArray(addr)) setAddresses(addr);
      if (tm && Array.isArray(tm)) setTeam(tm);
      if (pr && typeof pr === "object") setPrefs((p) => ({ ...p, ...pr }));
      if (security && typeof security.twoFA === "boolean") setTwoFA(security.twoFA);
      const totalSpent = (orders ?? []).filter((o) => o.status === "cloturee" || o.status === "livree").reduce((s, o) => s + (o.total || 0), 0);
      setLoyaltyPoints(Math.floor(totalSpent / 100));
    })();
    return () => { dead = true; };
  }, [session]);

  // Push debouncé (500ms) - évite un round-trip serveur par frappe lors d'édits rapides
  const hydratedRef = useRef({ addresses: false, team: false, preferences: false });
  const timersRef = useRef<{ [k: string]: ReturnType<typeof setTimeout> | undefined }>({});
  const schedulePush = (
    label: "addresses" | "team" | "preferences",
    value: unknown,
  ) => {
    if (!session) return;
    if (!hydratedRef.current[label]) { hydratedRef.current[label] = true; return; }
    if (timersRef.current[label]) clearTimeout(timersRef.current[label]);
    setSyncing(label);
    timersRef.current[label] = setTimeout(() => {
      setUserKv(label, value)
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          logger.warn(`${label} sync error: ${msg}`);
          if (/401|Session invalide|Authentification requise/i.test(msg)) {
            setSessionExpired(true);
          } else {
            toast.error(`Synchro ${label} échouée`);
          }
        })
        .finally(() => setSyncing((s) => (s === label ? null : s)));
    }, 500);
  };
  useEffect(() => { schedulePush("addresses", addresses); }, [addresses, session]);
  useEffect(() => { schedulePush("team", team); }, [team, session]);
  useEffect(() => { schedulePush("preferences", prefs); }, [prefs, session]);
  useEffect(() => () => {
    Object.values(timersRef.current).forEach((t) => t && clearTimeout(t));
  }, []);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choisis une image");
    if (file.size > 4 * 1024 * 1024) return toast.error("Image trop lourde (max 4 Mo)");
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 512);
      setAvatar(dataUrl);
      const token = await getAccessToken();
      if (!token) {
        toast.warning("Photo affichée localement. Connectez-vous pour la synchroniser.");
        return;
      }
      const url = await uploadUserFile("avatar", dataUrl);
      if (url) setAvatar(url);
      toast.success("Photo de profil synchronisée ☁️");
    } catch (err) {
      logger.warn(`Avatar upload error: ${err}`);
      toast.error(`Erreur d'envoi : ${err instanceof Error ? err.message : "inconnue"}`);
    }
  };

  // Map id KYC interne → kind serveur owner-based
  const KYC_KIND: Record<string, UserFileKind> = { d1: "kyc-id", d2: "kyc-rccm", d3: "kyc-shop" };
  const kycInput = useRef<HTMLInputElement>(null);
  const kycPending = useRef<string | null>(null);

  const uploadDoc = (id: string) => {
    kycPending.current = id;
    kycInput.current?.click();
  };

  const onKycFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = kycPending.current;
    kycPending.current = null;
    if (e.target) e.target.value = "";
    if (!file || !id) return;
    const kind = KYC_KIND[id];
    if (!kind) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Fichier trop lourd (max 10 Mo)");
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1600);
      const token = await getAccessToken();
      if (!token) { toast.error("Connectez-vous pour téléverser ce document"); return; }
      await uploadUserFile(kind, dataUrl);
      setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "pending" } : d)));
      toast.success("Document envoyé ☁️ - vérification sous 24-48h.");
    } catch (err) {
      logger.warn(`KYC upload error (${id}/${kind}): ${err}`);
      toast.error(`Envoi échoué : ${err instanceof Error ? err.message : "inconnue"}`);
    }
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    toast.success("Adresse par défaut mise à jour");
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Adresse supprimée");
  };

  const logout = async () => {
    setConfirmLogout(false);
    try { await getSupabase().auth.signOut(); } catch (e) { logger.warn(`Logout error: ${e}`); }
    toast.success("Déconnecté");
    navigate("/connexion");
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
      <input ref={kycInput} type="file" accept="image/*,application/pdf" hidden onChange={onKycFile} />

      <div className="bg-gradient-to-br from-[#FF6A00] to-[#FF4400] px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
            </button>
            <SyncBadge online={syncOn} busy={!!syncing} email={session?.user?.email} onConnect={() => navigate("/connexion")} />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-white">
                <img src={avatar} alt={info.name} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Changer la photo"
                className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full flex items-center justify-center"
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E11D2E]" />
              </button>
            </div>
            <div className="text-white min-w-0">
              <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: "clamp(18px, 5vw, 22px)" }}>{info.name}</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                {(() => {
                  const active = !!sub && sub.expiresAt > Date.now();
                  const expired = !!sub && sub.expiresAt <= Date.now();
                  if (!active && !expired) return null;
                  const bg = active
                    ? "linear-gradient(135deg, #E8A817, #FBBF24)"
                    : "linear-gradient(135deg, #9CA3AF, #6B7280)";
                  return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: bg }}>
                      <Crown className="w-3 h-3 text-white" />
                      <span style={{ fontSize: 11, color: "#FFFFFF", fontWeight: 600 }}>
                        {active ? `VIP ${sub!.label}` : "VIP expiré"}
                      </span>
                    </div>
                  );
                })()}
                {docs.every((d) => d.status === "verified") && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20">
                    <BadgeCheck className="w-3 h-3" />
                    <span style={{ fontSize: 10, fontWeight: 600 }}>Vérifié KYC</span>
                  </div>
                )}
                {accountTypeLabel && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[#E11D2E]">
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{accountTypeLabel}</span>
                  </div>
                )}
              </div>
              <p className="text-white/70 mt-1" style={{ fontSize: 12 }}>
                {userProfile?.createdAt
                  ? `Membre depuis ${new Date(userProfile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
                  : "Membre IPPOO"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Infos */}
        <Section icon={<User className="w-5 h-5 text-[#E11D2E]" />} title="Informations personnelles">
          {[
            { icon: User, label: "Nom complet", value: info.name },
            { icon: Mail, label: "Email", value: info.email },
            { icon: Phone, label: "Téléphone", value: info.phone },
            ...(buyer ? [] : [{ icon: Building2, label: "Entreprise", value: info.company }]),
            { icon: MapPin, label: "Ville", value: info.city },
          ].map((item) => (
            <Row key={item.label} icon={item.icon} label={item.label} value={item.value} onClick={() => setEditInfo(true)} />
          ))}
          <button onClick={() => setEditInfo(true)} className="mt-4 text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
            Modifier le profil <ChevronRight className="w-4 h-4" />
          </button>
        </Section>

        {/* Activité pro - vendeurs / entreprises / organisations */}
        {seller && userProfile && (userProfile.sectorId || userProfile.niche || userProfile.circuit) && (
          <Section icon={<Building2 className="w-5 h-5 text-[#F97316]" />} title="Mon activité">
            {userProfile.businessName && (
              <Row icon={Building2} label="Raison sociale" value={userProfile.businessName} />
            )}
            {userProfile.niche && (
              <Row icon={BadgeCheck} label="Métier / Niche" value={userProfile.niche} />
            )}
            {userProfile.circuit && (
              <Row icon={Users} label="Circuit" value={userProfile.circuit} />
            )}
            {userProfile.description && (
              <p className="text-muted-foreground mt-3" style={{ fontSize: 12 }}>
                {userProfile.description}
              </p>
            )}
            <button onClick={() => setEditPro(true)} className="mt-3 text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
              Modifier l'activité <ChevronRight className="w-4 h-4" />
            </button>
          </Section>
        )}

        {/* Branding boutique - vendeurs */}
        {seller && (
          <Section icon={<StoreIcon className="w-5 h-5 text-[#E8A817]" />} title="Branding boutique">
            <ShopBrandingPanel shopName={userProfile?.businessName || userProfile?.firstName || ""} />
          </Section>
        )}

        {/* Logistique - vendeurs */}
        {seller && userProfile?.deliveryMethods && userProfile.deliveryMethods.length > 0 && (
          <Section icon={<Truck className="w-5 h-5 text-[#3B82F6]" />} title="Logistique">
            <div className="flex flex-wrap gap-2 mb-2">
              {userProfile.deliveryMethods.map((m) => (
                <span key={m} className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8]" style={{ fontSize: 12, fontWeight: 600 }}>
                  {DELIVERY_LABELS[m]}
                </span>
              ))}
            </div>
            {userProfile.openingHours && (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>Horaires : {userProfile.openingHours}</p>
            )}
            {userProfile.processingDelay && (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>Délai de traitement : {userProfile.processingDelay}</p>
            )}
            <button onClick={() => setEditLogistics(true)} className="mt-3 text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
              Modifier la logistique <ChevronRight className="w-4 h-4" />
            </button>
          </Section>
        )}

        {/* Paiements acceptés - vendeurs */}
        {seller && userProfile?.paymentMethods && userProfile.paymentMethods.length > 0 && (
          <Section icon={<Wallet className="w-5 h-5 text-[#16A34A]" />} title="Paiements acceptés">
            <div className="flex flex-wrap gap-2">
              {userProfile.paymentMethods.map((m) => (
                <span key={m} className="px-2.5 py-1 rounded-lg bg-[#F0FDF4] text-[#15803D]" style={{ fontSize: 12, fontWeight: 600 }}>
                  {PAYMENT_LABELS[m]}
                </span>
              ))}
            </div>
            {userProfile.mobileMoneyNumber && (
              <p className="text-muted-foreground mt-2" style={{ fontSize: 12 }}>Mobile Money : {userProfile.mobileMoneyNumber}</p>
            )}
            <button onClick={() => setEditPayments(true)} className="mt-3 text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
              Modifier les paiements <ChevronRight className="w-4 h-4" />
            </button>
          </Section>
        )}

        {/* Documents pro - vendeurs */}
        {seller && userProfile && (
          <Section icon={<FileText className="w-5 h-5 text-[#F97316]" />} title="Documents pro">
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "logo", src: userProfile.logo, label: "Logo" },
                { key: "shopPhoto", src: userProfile.shopPhoto, label: "Boutique" },
                { key: "certificate", src: userProfile.certificate, label: "Certificat" },
              ] as { key: "logo" | "shopPhoto" | "certificate"; src?: string; label: string }[]).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setEditDoc(d.key)}
                  className="rounded-xl overflow-hidden border border-border bg-[#F3F4F6] text-left hover:border-[#E11D2E] transition-colors"
                >
                  <div className="aspect-square overflow-hidden bg-white flex items-center justify-center">
                    {d.src ? (
                      <img src={d.src} alt={d.label} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-center py-1.5" style={{ fontSize: 11, fontWeight: 600 }}>{d.label}</p>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-3" style={{ fontSize: 11 }}>
              Touchez une vignette pour ajouter ou remplacer le document.
            </p>
          </Section>
        )}

        {/* KYC - vendeurs / entreprises / organisations uniquement */}
        {seller && (
        <Section icon={<BadgeCheck className="w-5 h-5 text-[#16A34A]" />} title="Vérification (KYC/KYB)">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span style={{ fontSize: 14 }}>{doc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-lg"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: doc.status === "verified" ? "#16A34A" : doc.status === "pending" ? "#F97316" : "#9CA3AF",
                    background: doc.status === "verified" ? "#F0FDF4" : doc.status === "pending" ? "#FFF7ED" : "#F3F4F6",
                  }}
                >
                  {doc.status === "verified" ? "Vérifié" : doc.status === "pending" ? "En cours" : "Manquant"}
                </span>
                {doc.status !== "verified" && (
                  <button
                    onClick={() => uploadDoc(doc.id)}
                    aria-label={`Téléverser ${doc.label}`}
                    className="p-1 text-[#E11D2E] hover:bg-[#FEF2F2] rounded-lg"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Section>
        )}

        {/* Adresses */}
        <Section icon={<MapPin className="w-5 h-5 text-[#F97316]" />} title="Mes adresses">
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={`p-3 rounded-xl ${addr.isDefault ? "bg-[#FFF7ED] border border-[#F97316]/20" : "bg-[#F3F4F6]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{addr.label}</span>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 bg-[#F97316] text-white rounded-lg shrink-0" style={{ fontSize: 10, fontWeight: 700 }}>Par défaut</span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>{addr.details}</p>
                <div className="flex gap-3 mt-2" style={{ fontSize: 12 }}>
                  {!addr.isDefault && (
                    <button onClick={() => setDefaultAddress(addr.id)} className="text-[#E11D2E]">Définir par défaut</button>
                  )}
                  <button onClick={() => setEditAddr(addr)} className="text-[#3B82F6]">Modifier</button>
                  {addresses.length > 1 && (
                    <button onClick={() => deleteAddress(addr.id)} className="text-muted-foreground hover:text-[#E11D2E] flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddAddr(true)} className="mt-3 text-[#E11D2E] flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
            <Plus className="w-4 h-4" /> Ajouter une adresse
          </button>
        </Section>

        {/* Carte membre IPPOO */}
        {account && (
          <MemberCard
            data={{
              accountId: account.id,
              prettyId: account.pretty,
              qrPayload: account.qrPayload,
              fullName: info.name,
              organization: bioProfile?.organization || info.company,
              city: info.city,
              avatar,
              memberSince: userProfile?.createdAt
                ? new Date(userProfile.createdAt).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
                : "01/25",
              expiresOn: sub
                ? new Date(sub.expiresAt).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
                : "-/-",
              planName: sub ? sub.label.toUpperCase() : "MEMBRE",
              role: "member",
              bioEnabled: bioEnrolled,
              subscriptionStatus: sub
                ? (sub.expiresAt > Date.now() ? "active" : "expired")
                : "none",
              subscriptionExpiresAt: sub?.expiresAt,
            }}
            onRegenerate={regenerateAccountQr}
          />
        )}

        {/* Sécurité */}
        <Section icon={<Shield className="w-5 h-5 text-[#E11D2E]" />} title="Sécurité">
          <Row icon={Lock} label="Mot de passe" value="Modifier" onClick={() => setShowPwd(true)} />
          <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span style={{ fontSize: 14 }}>Authentification 2FA</span>
            </div>
            <Switch
              checked={twoFA}
              onChange={(v) => {
                setTwoFA(v);
                if (session) {
                  setUserKv("security", { twoFA: v })
                    .then(() => toast.success(`2FA ${v ? "activée" : "désactivée"}`))
                    .catch(() => toast.error("Échec de la synchronisation"));
                } else {
                  toast.warning("Connectez-vous pour synchroniser ce réglage");
                }
              }}
              label="Authentification 2FA"
            />
          </div>
          <Row
            icon={Smartphone}
            label="Appareils connectés"
            value="Gérer"
            onClick={() => navigate("/parametres")}
          />
          {bioReady && (
            <div className="py-2 border-b border-[#F3F4F6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Fingerprint className="w-4 h-4 text-[#E11D2E] shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: 14 }}>Connexion biométrique</p>
                    {bioEnrolled && bioProfile ? (
                      <p className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
                        {`${bioProfile.firstName} ${bioProfile.lastName}`.trim()}
                        {bioProfile.organization ? ` · ${bioProfile.organization}` : ""}
                      </p>
                    ) : (
                      <p className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
                        Active-la dans Paramètres pour des paiements en un toucher.
                      </p>
                    )}
                  </div>
                </div>
                {bioEnrolled ? (
                  <button
                    onClick={() => {
                      clearBiometric();
                      setBioEnrolled(false);
                      toast.success("Empreinte désactivée sur cet appareil");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-[#E11D2E]"
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/parametres")}
                    className="px-3 py-1.5 rounded-lg bg-[#FF6A00] text-white"
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    Activer
                  </button>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* Abonnement VIP */}
        <Section icon={<Sparkles className="w-5 h-5 text-[#F0B429]" />} title="Abonnement VIP">
          {subActive && sub ? (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-[#F0B429]/40">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F0B429]" />
                  <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>VIP {sub.label}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#16A34A] text-white" style={{ fontSize: 10, fontWeight: 800 }}>ACTIF</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CalendarDays className="w-4 h-4 text-[#F0B429]" />
                <span style={{ fontSize: 13 }}>
                  Renouvellement le <strong>{renewalDate}</strong>
                </span>
              </div>
              <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""} · {sub.autoRenew ? "Renouvellement automatique" : "Renouvellement manuel"}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate("/vip")}
                  className="flex-1 py-2 rounded-xl bg-[#F0B429] text-white"
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  Gérer
                </button>
                <button
                  onClick={() => setConfirmCancelSub(true)}
                  className="flex-1 py-2 rounded-xl bg-white border border-border text-foreground"
                  style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-[#F3F4F6] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontSize: 13, fontWeight: 600 }}>Aucun abonnement actif</p>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                  Débloquez les avantages VIP dès 1 500 FCFA / mois.
                </p>
              </div>
              <button
                onClick={() => navigate("/vip")}
                className="shrink-0 px-3 py-2 rounded-xl bg-[#F0B429] text-white"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
              >
                S'abonner
              </button>
            </div>
          )}
        </Section>

        {/* Promos */}
        <div className="space-y-2 mb-4">
          {loyaltyPoints > 0 && (
            <LoyaltyPointsBadge
              points={loyaltyPoints}
              level={loyaltyPoints >= 50000 ? "OR" : loyaltyPoints >= 10000 ? "ARGENT" : "BRONZE"}
            />
          )}
          <SpinWheelTeaser />
          {!(docs.every((d) => d.status === "verified") && addresses.length > 0) && (
            <CouponStrip code="PROFIL10" label="Profil" discount="Gagnez 1 000 points" condition="Complétez votre profil en vérifiant votre justificatif d'adresse" color="#E11D2E" expiry="Offre permanente" />
          )}
        </div>

        {/* Préférences */}
        <Section icon={<Globe className="w-5 h-5 text-[#E8A817]" />} title="Préférences">
          {(["language", "currency", "notifications"] as const).map((k) => (
            <button key={k} onClick={() => setShowPref(k)} className="w-full flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span style={{ fontSize: 14 }}>{k === "language" ? "Langue" : k === "currency" ? "Devise" : "Notifications"}</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span style={{ fontSize: 12 }}>{prefs[k]}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </Section>

        {/* B2B - entreprises & organisations uniquement */}
        {business && (
        <Section icon={<Users className="w-5 h-5 text-[#3B82F6]" />} title="Gestion utilisateurs (Entreprise)">
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Ajoutez des employés à votre compte, attribuez des rôles et définissez des limites d'achat.
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>{team.length} membre(s) actif(s)</p>
          <button onClick={() => setShowTeam(true)} className="mt-3 px-4 py-2 bg-[#3B82F6] text-white rounded-xl" style={{ fontSize: 13, fontWeight: 600 }}>
            Gérer les utilisateurs
          </button>
        </Section>
        )}

        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full py-3 bg-[#FEF2F2] text-[#E11D2E] rounded-2xl flex items-center justify-center gap-2 mt-4 mb-6"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          <LogOut className="w-5 h-5" /> Déconnexion
        </button>
      </div>

      {editInfo && (
        <EditInfoModal
          info={info}
          onClose={() => setEditInfo(false)}
          onSave={(v) => {
            setInfo(v);
            setEditInfo(false);
            toast.success("Profil mis à jour");
          }}
        />
      )}

      {(showAddAddr || editAddr) && (
        <AddressModal
          initial={editAddr}
          onClose={() => {
            setShowAddAddr(false);
            setEditAddr(null);
          }}
          onSave={(addr) => {
            if (editAddr) {
              setAddresses((prev) => prev.map((a) => (a.id === editAddr.id ? { ...addr, id: editAddr.id } : a)));
              toast.success("Adresse modifiée");
            } else {
              const id = `a${Date.now()}`;
              const isFirst = addresses.length === 0;
              setAddresses((prev) => [...prev, { ...addr, id, isDefault: isFirst || addr.isDefault }]);
              toast.success("Adresse ajoutée");
            }
            setShowAddAddr(false);
            setEditAddr(null);
          }}
        />
      )}

      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} />}

      {showPref && (
        <PrefModal
          field={showPref}
          current={prefs[showPref]}
          onClose={() => setShowPref(null)}
          onSave={(v) => {
            setPrefs((p) => ({ ...p, [showPref]: v }));
            if (showPref === "language") setCurrentLanguage(v);
            setShowPref(null);
            toast.success("Préférence mise à jour");
          }}
        />
      )}

      {showTeam && (
        <TeamModal
          team={team}
          onClose={() => setShowTeam(false)}
          onChange={setTeam}
        />
      )}

      {confirmLogout && (
        <ConfirmModal
          title="Se déconnecter ?"
          message="Tu devras te reconnecter pour accéder à ton compte."
          onCancel={() => setConfirmLogout(false)}
          onConfirm={logout}
        />
      )}

      {sessionExpired && (
        <ConfirmModal
          title="Session expirée"
          message="Ta session a expiré. Reconnecte-toi pour synchroniser tes modifications sur tous tes appareils."
          onCancel={() => setSessionExpired(false)}
          onConfirm={() => { setSessionExpired(false); navigate("/connexion"); }}
        />
      )}

      {editDoc && userProfile && (
        <EditDocModal
          field={editDoc}
          current={userProfile[editDoc]}
          onClose={() => setEditDoc(null)}
          onSave={(dataUrl) => {
            patchUserProfile({ [editDoc]: dataUrl } as Partial<import("../auth/user-profile").UserProfile>);
            setEditDoc(null);
            toast.success("Document mis à jour");
          }}
          onRemove={() => {
            patchUserProfile({ [editDoc]: undefined } as Partial<import("../auth/user-profile").UserProfile>);
            setEditDoc(null);
            toast.success("Document supprimé");
          }}
        />
      )}

      {editLogistics && userProfile && (
        <EditLogisticsModal
          profile={userProfile}
          onClose={() => setEditLogistics(false)}
          onSave={(patch) => {
            patchUserProfile(patch);
            setEditLogistics(false);
            toast.success("Logistique mise à jour");
          }}
        />
      )}

      {editPayments && userProfile && (
        <EditPaymentsModal
          profile={userProfile}
          onClose={() => setEditPayments(false)}
          onSave={(patch) => {
            patchUserProfile(patch);
            setEditPayments(false);
            toast.success("Paiements mis à jour");
          }}
        />
      )}

      {editPro && userProfile && (
        <EditProModal
          profile={userProfile}
          onClose={() => setEditPro(false)}
          onSave={(patch) => {
            patchUserProfile(patch);
            setEditPro(false);
            toast.success("Activité mise à jour");
          }}
        />
      )}

      {confirmCancelSub && (
        <ConfirmModal
          title="Annuler l'abonnement ?"
          message="Vous garderez vos avantages VIP jusqu'à la date de renouvellement, puis votre abonnement ne sera pas reconduit."
          onCancel={() => setConfirmCancelSub(false)}
          onConfirm={() => {
            cancelSubscription();
            setConfirmCancelSub(false);
            toast.success("Renouvellement automatique désactivé");
          }}
        />
      )}
    </div>
  );
}

