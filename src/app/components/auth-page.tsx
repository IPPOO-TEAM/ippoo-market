import { logger } from "../lib/logger";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ChevronLeft, QrCode, Fingerprint, Building2, ShieldCheck } from "lucide-react";
import { PhoneInput } from "./phone-input";
import { toast } from "sonner";
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  hasBiometricCredential,
  getPublicProfile,
  registerBiometric,
  loginBiometric,
  type BioPublicProfile,
} from "../auth/biometric";
import { claimWelcomeGift, hasClaimedWelcome } from "../notifications/welcome";
import { getSupabase } from "../auth/supabase";
import { SignupWizard } from "./signup-wizard";
import { validateEmail, validatePhone, validateMinLen, validateRequired, compose, validateForm } from "../lib/validators";

type Mode = "login" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const initial: Mode =
    (params.get("mode") as Mode) ||
    (location.pathname.includes("inscription") ? "signup" : "login");
  const [mode, setMode] = useState<Mode>(initial);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bioReady, setBioReady] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [bioProfile, setBioProfile] = useState<BioPublicProfile | null>(null);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported = isBiometricSupported() && (await isPlatformAuthenticatorAvailable());
      if (cancelled) return;
      setBioReady(supported);
      const enrolled = hasBiometricCredential();
      setBioEnrolled(enrolled);
      setBioProfile(enrolled ? getPublicProfile() : null);
    })();
    return () => { cancelled = true; };
  }, []);

  const splitName = (full: string): { firstName: string; lastName: string } => {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] || "", lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "login") {
      const errs = validateForm({ email, password }, {
        email: validateEmail,
        password: validateMinLen(6, "Mot de passe"),
      });
      const first = Object.values(errs)[0];
      if (first) return toast.error(first);
    } else {
      const errs = validateForm({ name, email, phone, password }, {
        name: compose(validateRequired("Nom complet"), validateMinLen(2, "Nom complet")),
        email: validateEmail,
        phone: validatePhone,
        password: validateMinLen(6, "Mot de passe"),
      });
      const first = Object.values(errs)[0];
      if (first) return toast.error(first);
      if (password !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas");
      if (!accept) return toast.error("Tu dois accepter les conditions");
    }

    setLoading(true);
    (async () => {
      const sb = getSupabase();
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          logger.warn(`Login error for ${email}: ${error.message}`);
          toast.error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : `Connexion échouée : ${error.message}`);
          return;
        }
      } else {
        // Inscription : crée le compte serveur (auto-confirm) puis ouvre la session.
        const { signupAndSignIn } = await import("../auth/signup-server");
        const result = await signupAndSignIn({ email, password, name: name.trim() });
        if (!result.ok) {
          setLoading(false);
          toast.error(result.error);
          return;
        }
      }
      // Proposer l'enrôlement biométrique à l'inscription si disponible
      if (mode === "signup" && bioReady && !bioEnrolled) {
        try {
          const { firstName, lastName } = splitName(name);
          await registerBiometric({
            firstName,
            lastName,
            organization: organization.trim(),
            email,
            phone,
          });
          setBioEnrolled(true);
          setBioProfile({ firstName, lastName, organization: organization.trim() });
          toast.success("Empreinte biométrique enregistrée");
        } catch (err) {
          // pas bloquant : on continue même si l'utilisateur refuse
          const msg = err instanceof Error ? err.message : "Biométrie ignorée";
          toast.message(msg);
        }
      }
      setLoading(false);
      toast.success(mode === "login" ? "Connecté avec succès" : "Compte créé. Bienvenue !");
      if (mode === "signup" && !hasClaimedWelcome()) {
        const { firstName } = splitName(name);
        claimWelcomeGift(firstName);
      }
      navigate(params.get("redirect") || "/profil", { replace: true });
    })();
  };

  const handleBiometricLogin = async () => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const pub = await loginBiometric();
      setBioProfile(pub);
      toast.success(`Bienvenue ${pub.firstName}`);
      navigate(params.get("redirect") || "/profil", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de la vérification";
      toast.error(msg);
    } finally {
      setBioBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FFF7ED] py-6 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-3"
          style={{ fontSize: 13 }}
        >
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>

        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6">
          <div className="flex gap-2 p-1 bg-[#F3F4F6] rounded-xl mb-5">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  mode === m ? "bg-white text-[#E11D2E]" : "text-muted-foreground"
                }`}
                style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: 600 }}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Carte biométrique : UNIQUEMENT nom, prénom, organisation */}
          {mode === "login" && bioReady && bioEnrolled && bioProfile && (
            <div className="mb-5 rounded-2xl border-2 border-[#E11D2E]/20 bg-gradient-to-br from-[#FFF7ED] to-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E11D2E]/10 flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-[#E11D2E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                    {bioProfile.firstName} {bioProfile.lastName}
                  </p>
                  {bioProfile.organization && (
                    <p className="truncate flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                      <Building2 className="w-3 h-3" /> {bioProfile.organization}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={bioBusy}
                className="w-full py-2.5 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                <Fingerprint className="w-4 h-4" />
                {bioBusy ? "Vérification…" : "Se connecter avec mon empreinte"}
              </button>
              <p className="text-center text-muted-foreground mt-2 flex items-center justify-center gap-1" style={{ fontSize: 10 }}>
                <ShieldCheck className="w-3 h-3" /> Aucune autre donnée n'est exposée
              </p>
            </div>
          )}

          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, lineHeight: "28px" }}>
            {mode === "login" ? "Connectez-vous" : "Créer un compte"}
          </h1>
          <p className="text-muted-foreground mb-5 mt-1" style={{ fontSize: 13 }}>
            {mode === "login"
              ? "Accédez à votre espace IPPOO Market — Bénin."
              : "Choisissez votre profil ci-dessous pour démarrer."}
          </p>

          {mode === "signup" ? (
            <SignupWizard />
          ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field icon={Mail} placeholder="Email" type="email" value={email} onChange={setEmail} />
            <PhoneInput value={phone} onChange={setPhone} showValidation />
            <PasswordField
              icon={Lock}
              placeholder="Mot de passe"
              value={password}
              onChange={setPassword}
              show={showPwd}
              toggle={() => setShowPwd(!showPwd)}
            />

            {(
              <button
                type="button"
                onClick={() => {
                  const e = window.prompt("Email du compte à réinitialiser");
                  if (!e) return;
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Email invalide"); return; }
                  toast.success(`Lien de réinitialisation envoyé à ${e}`);
                }}
                className="text-[#E11D2E] hover:underline"
                style={{ fontSize: 12 }}
              >
                Mot de passe oublié ?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
            >
              {loading ? "Patiente..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          )}

          {mode === "login" && (
          <>
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {mode === "login" && bioReady && !bioEnrolled && (
            <button
              type="button"
              onClick={() => toast.message("Crée un compte pour activer la connexion biométrique sur cet appareil.")}
              className="w-full mb-2 py-2.5 rounded-xl border-2 border-dashed border-[#E11D2E]/40 text-[#E11D2E] flex items-center justify-center gap-2"
              style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: 700 }}
            >
              <Fingerprint className="w-4 h-4" />
              Activer la connexion biométrique
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/scanner")}
            className="w-full mb-2 py-2.5 rounded-xl border-2 border-[#E11D2E] text-[#E11D2E] flex items-center justify-center gap-2 hover:bg-[#E11D2E]/5"
            style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: 700 }}
          >
            <QrCode className="w-4 h-4" />
            {mode === "login" ? "Se connecter par QR Code" : "S'inscrire par QR Code"}
          </button>

          </>
          )}

          <p className="text-center text-muted-foreground mt-5" style={{ fontSize: 12 }}>
            {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[#E11D2E] hover:underline"
              style={{ fontWeight: 600 }}
            >
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}

function Field({
  icon: Icon,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  icon: typeof Mail;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}

function PasswordField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  show,
  toggle,
}: {
  icon: typeof Lock;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted"
      >
        {show ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}
