import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Settings,
  Globe,
  Bell,
  Lock,
  Smartphone,
  Moon,
  Eye,
  Trash2,
  ChevronRight,
  Shield,
  HelpCircle,
  ArrowLeft,
  Download,
  X,
  LogOut,
  MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import { setCurrentLanguage, SUPPORTED_LANGUAGES } from "../i18n";
import { usePayments } from "../payments/usePayments";
import { Switch } from "./ui-kit/Switch";
import { PermissionsPanel } from "../native/PermissionsPanel";
import { changePin, isPinLocked, resetPinLock, verifyPinWithLock, PIN_MAX_ATTEMPTS } from "../payments/store";
import { KeyRound, Fingerprint } from "lucide-react";
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  hasBiometricCredential,
  getPublicProfile,
  registerBiometric,
  clearBiometric,
} from "../auth/biometric";
import { pinValid } from "../payments/validators";
import { getSupabase, getSession } from "../auth/supabase";
import { getUserKv } from "../data/user-kv";
import { listOrders } from "../data/orders-server";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import {
  Section, RowSelect, RowToggle, RowAction,
  PasswordModal, PinModal, DevicesModal, HelpModal, ConfirmModal,
  type Device,
} from "./parametres-modals";



const STORAGE_KEY = "ippoo:settings";
const DEFAULTS = {
  langue: "Français",
  devise: "FCFA (XOF)",
  notifPush: true,
  notifSMS: true,
  notifEmail: false,
  notifPromos: true,
  notifCommandes: true,
  notifPaiements: true,
  darkMode: false,
  twoFA: true,
  reduceMotion: false,
  largeText: false,
};

const loadSettings = (): typeof DEFAULTS => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = safeGetItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

export function ParametresPage() {
  const navigate = useNavigate();
  const [s, setS] = useState(loadSettings);
  const [showPwd, setShowPwd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const payState = usePayments();
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [bioReady, setBioReady] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
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
  const toggleBio = async () => {
    if (bioBusy) return;
    if (bioEnrolled) {
      clearBiometric();
      setBioEnrolled(false);
      toast.success("Empreinte biométrique désactivée sur cet appareil");
      return;
    }
    setBioBusy(true);
    try {
      const fullName = (window.prompt("Ton nom complet (prénom + nom)") || "").trim();
      if (!fullName) { setBioBusy(false); return; }
      const parts = fullName.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ");
      const organization = (window.prompt("Ton comité ou ton organisation (facultatif)") || "").trim();
      await registerBiometric({ firstName, lastName, organization });
      setBioEnrolled(true);
      toast.success("Empreinte biométrique enregistrée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enrôlement biométrique");
    } finally {
      setBioBusy(false);
    }
  };

  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const sess = await getSession();
      if (dead || !sess) return;
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      const browser = /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : /Edg\//.test(ua) ? "Edge" : "Navigateur";
      const platform = /Windows/i.test(ua) ? "Windows" : /Mac OS X/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Linux/i.test(ua) ? "Linux" : "Inconnu";
      setDevices([
        {
          id: sess.access_token.slice(0, 12),
          name: `${browser} sur ${platform}${isMobile ? " (mobile)" : ""}`,
          location: typeof navigator !== "undefined" ? navigator.language || "-" : "-",
          lastSeen: "À l'instant",
          current: true,
        },
      ]);
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", !!s.darkMode);
  }, [s.darkMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.scrollBehavior = s.reduceMotion ? "auto" : "";
    document.documentElement.classList.toggle("reduce-motion", !!s.reduceMotion);
    document.documentElement.classList.toggle("large-text", !!s.largeText);
  }, [s.reduceMotion, s.largeText]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(s));
  }, [s]);

  const update = <K extends keyof typeof s>(key: K, value: (typeof s)[K], silent = false) => {
    setS((prev) => ({ ...prev, [key]: value }));
    if (!silent) toast.success("Paramètre mis à jour");
  };

  const exportData = async () => {
    const tid = toast.loading("Préparation de l'export…");
    try {
      const [sess, addresses, team, preferences, orders] = await Promise.all([
        getSession(),
        getUserKv<unknown>("addresses").catch(() => null),
        getUserKv<unknown>("team").catch(() => null),
        getUserKv<unknown>("preferences").catch(() => null),
        listOrders().catch(() => []),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: sess?.user ? { id: sess.user.id, email: sess.user.email, createdAt: sess.user.created_at } : null,
        settings: s,
        wallet: { balance: payState.walletBalance, transactions: payState.transactions, subscription: payState.subscription },
        addresses,
        team,
        preferences,
        orders,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ippoo-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Données exportées", { id: tid });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'export", { id: tid });
    }
  };

  const revokeDevice = async (_id: string) => {
    try {
      await getSupabase().auth.signOut({ scope: "others" });
      toast.success("Sessions distantes révoquées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la révocation");
    }
  };

  const logoutAll = async () => {
    setConfirmLogoutAll(false);
    try {
      await getSupabase().auth.signOut({ scope: "others" });
      toast.success("Toutes les autres sessions ont été déconnectées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la déconnexion");
    }
  };

  const deleteAccount = async () => {
    setConfirmDelete(false);
    const tid = toast.loading("Envoi de la demande…");
    try {
      const sb = getSupabase();
      const sess = await getSession();
      const email = sess?.user?.email;
      if (email) {
        const subject = encodeURIComponent("[IPPOO] Demande de suppression de compte");
        const body = encodeURIComponent(`Bonjour,\n\nJe demande la suppression définitive de mon compte ${email} (ID ${sess?.user?.id ?? ""}).\n\nMerci.`);
        try { window.open(`mailto:privacy@ippoo.com?subject=${subject}&body=${body}`, "_blank"); } catch {}
      }
      await sb.auth.signOut();
      toast.success("Demande de suppression envoyée. Tu seras déconnecté.", { id: tid });
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la demande", { id: tid });
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-[#374151] to-[#1F2937] px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
            <Settings className="w-6 h-6" /> PARAMÈTRES
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>Langue, notifications, sécurité et préférences</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Section icon={<Globe className="w-5 h-5 text-[#3B82F6]" />} title="Langue & Devise">
          <RowSelect
            label="Langue"
            value={s.langue}
            options={SUPPORTED_LANGUAGES}
            onChange={(v) => {
              update("langue", v, true);
              setCurrentLanguage(v);
              toast.success(`Langue : ${v}`);
            }}
          />
          <RowSelect
            label="Devise"
            value={s.devise}
            options={["FCFA (XOF)", "EUR (€)", "USD ($)", "NGN (₦)", "GHS (₵)"]}
            onChange={(v) => update("devise", v)}
          />
        </Section>

        <Section icon={<Bell className="w-5 h-5 text-[#FF6B00]" />} title="Notifications">
          <RowToggle
            label="Notifications push"
            sub="Activer les notifications instantanées"
            value={s.notifPush}
            onChange={(v) => update("notifPush", v)}
          />
          <RowToggle
            label="Notifications SMS"
            sub="Confirmations et alertes urgentes"
            value={s.notifSMS}
            onChange={(v) => update("notifSMS", v)}
          />
          <RowToggle
            label="Notifications email"
            sub="Rapports et récapitulatifs"
            value={s.notifEmail}
            onChange={(v) => update("notifEmail", v)}
          />
          <div className="border-t border-[#F3F4F6] my-3" />
          <p className="text-muted-foreground mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Catégories</p>
          <RowToggle label="Commandes & livraisons" value={s.notifCommandes} onChange={(v) => update("notifCommandes", v)} disabled={!s.notifPush && !s.notifSMS && !s.notifEmail} />
          <RowToggle label="Paiements & facturation" value={s.notifPaiements} onChange={(v) => update("notifPaiements", v)} disabled={!s.notifPush && !s.notifSMS && !s.notifEmail} />
          <RowToggle label="Promotions & offres" value={s.notifPromos} onChange={(v) => update("notifPromos", v)} disabled={!s.notifPush && !s.notifSMS && !s.notifEmail} />
        </Section>

        <Section icon={<Shield className="w-5 h-5 text-[#E11D2E]" />} title="Sécurité">
          <RowAction
            icon={Lock}
            label="Modifier le mot de passe"
            onClick={() => setShowPwd(true)}
          />
          {bioReady && (
            <RowAction
              icon={Fingerprint}
              label="Empreinte biométrique"
              value={bioBusy ? "…" : bioEnrolled ? (bioProfile ? `${bioProfile.firstName} ${bioProfile.lastName}`.trim() || "Activée" : "Activée") : "Désactivée"}
              onClick={toggleBio}
            />
          )}
          <RowAction
            icon={KeyRound}
            label="Code PIN du wallet"
            value={payState.pinLockedUntil && payState.pinLockedUntil > Date.now() ? "Verrouillé" : "Modifier"}
            onClick={() => setShowPin(true)}
          />
          <RowToggle
            label="Authentification 2FA"
            sub="Code SMS à chaque connexion"
            value={s.twoFA}
            onChange={(v) => update("twoFA", v)}
          />
          <RowAction
            icon={MonitorSmartphone}
            label="Appareils connectés"
            value={`${devices.length} appareil${devices.length > 1 ? "s" : ""}`}
            onClick={() => setShowDevices(true)}
          />
          <RowAction
            icon={Download}
            label="Exporter mes données"
            onClick={exportData}
          />
        </Section>

        <Section icon={<Eye className="w-5 h-5 text-[#6B7280]" />} title="Accessibilité">
          <RowToggle
            label="Réduire les animations"
            sub="Désactive les transitions et mouvements"
            value={s.reduceMotion}
            onChange={(v) => update("reduceMotion", v)}
          />
          <RowToggle
            label="Texte agrandi"
            sub="Augmente la taille de police"
            value={s.largeText}
            onChange={(v) => update("largeText", v)}
          />
        </Section>

        <Section icon={<Moon className="w-5 h-5 text-[#6B7280]" />} title="Apparence">
          <RowToggle
            label="Mode sombre"
            sub="Bascule l'interface en thème sombre"
            value={s.darkMode}
            onChange={(v) => update("darkMode", v)}
          />
        </Section>

        <Section icon={<Smartphone className="w-5 h-5 text-[#3B82F6]" />} title="Permissions de l'application">
          <PermissionsPanel />
        </Section>

        <Section icon={<HelpCircle className="w-5 h-5 text-[#00B341]" />} title="Aide & légal">
          {[
            { id: "faq", label: "Centre d'aide / FAQ", action: () => navigate("/aide") },
            { id: "cgu", label: "Conditions générales d'utilisation", action: () => navigate("/legal/cgu") },
            { id: "privacy", label: "Politique de confidentialité", action: () => navigate("/legal/confidentialite") },
            { id: "contact", label: "Nous contacter", action: () => navigate("/messagerie") },
          ].map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between py-2 border-b border-[#F3F4F6]"
            >
              <span style={{ fontSize: 14 }}>{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
          <p className="text-muted-foreground mt-3" style={{ fontSize: 11 }}>
            IPPOO Market · Version 1.0.0 · Build 2026.04
          </p>
        </Section>

        <button
          onClick={() => setConfirmLogoutAll(true)}
          className="w-full py-3 bg-[#FFF7ED] text-[#F97316] rounded-2xl flex items-center justify-center gap-2"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          <LogOut className="w-5 h-5" /> Déconnecter toutes les autres sessions
        </button>

        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full py-3 bg-[#FEF2F2] text-[#E11D2E] rounded-2xl flex items-center justify-center gap-2 mb-6"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          <Trash2 className="w-5 h-5" /> Supprimer mon compte
        </button>
      </div>

      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} />}
      {showPin && <PinModal onClose={() => setShowPin(false)} />}
      {showDevices && (
        <DevicesModal
          devices={devices}
          onClose={() => setShowDevices(false)}
          onRevoke={revokeDevice}
        />
      )}
      {showHelp && (
        <HelpModal kind={showHelp} onClose={() => setShowHelp(null)} />
      )}
      {confirmLogoutAll && (
        <ConfirmModal
          title="Déconnecter toutes les sessions ?"
          message={`${devices.filter((d) => !d.current).length} appareil(s) seront déconnectés. Tu resteras connecté sur cet appareil.`}
          confirmLabel="Déconnecter"
          confirmColor="#F97316"
          onCancel={() => setConfirmLogoutAll(false)}
          onConfirm={logoutAll}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Supprimer définitivement le compte ?"
          message="Cette action est irréversible. Toutes tes commandes, ton wallet et tes données seront effacés sous 30 jours."
          confirmLabel="Supprimer"
          confirmColor="#E11D2E"
          requireTyping
          typingPhrase="SUPPRIMER"
          requirePin
          onCancel={() => setConfirmDelete(false)}
          onConfirm={deleteAccount}
        />
      )}
    </div>
  );
}

