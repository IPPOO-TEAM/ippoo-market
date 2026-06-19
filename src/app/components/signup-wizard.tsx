import { logger } from "../lib/logger";
/* ═══════════════════════════════════════════
   IPPOO Market — Wizard d'inscription multi-étapes
   Couvre toutes les sections : identité, pro, logistique, paiements,
   documents. Les étapes pro/logistique/docs sont sautées pour les
   acheteurs. À la fin, déclenche le cadeau de bienvenue.
   ═══════════════════════════════════════════ */

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { signupAndSignIn } from "../auth/signup-server";
import { validateEmail as vEmail, validatePhone as vPhone, validateMinLen, validateRequired } from "../lib/validators";
import { publishMyVendor } from "../data/public-vendors";
import ippooLogo from "../../imports/ippo_market.png";

import {
  getSubsectors,
  getNiches,
  type CircuitId,
  type JuridicalForm,
} from "../data/sectors";
import {
  saveUserProfile,
  type AccountType,
  type DeliveryMethod,
  type PaymentMethod,
} from "../auth/user-profile";
import { claimWelcomeGift, hasClaimedWelcome } from "../notifications/welcome";
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  hasBiometricCredential,
  registerBiometric,
} from "../auth/biometric";
import {
  StepType, StepPerso, StepPro, StepLocalisation,
  StepLogistique, StepDocs, StepRecap,
  type RecapData,
} from "./signup/steps";

type Step = "type" | "perso" | "localisation" | "pro" | "logistique" | "docs" | "recap";

const ALL_STEPS: Step[] = ["type", "perso", "localisation", "pro", "logistique", "docs", "recap"];

function stepsFor(type: AccountType | null): Step[] {
  if (!type) return ["type"];
  if (type === "acheteur") return ["type", "perso", "localisation", "recap"];
  return ALL_STEPS;
}

const STEP_LABELS: Record<Step, string> = {
  type: "Type de compte",
  perso: "Informations personnelles",
  localisation: "Pays, région & ville",
  pro: "Activité professionnelle",
  logistique: "Logistique",
  docs: "Documents justificatifs",
  recap: "Récapitulatif",
};



export function SignupWizard() {
  const navigate = useNavigate();

  // état global
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const steps = useMemo(() => stepsFor(accountType), [accountType]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  // A. Personnel
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [accept, setAccept] = useState(false);

  // A bis. Localisation
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  // B. Pro
  const [businessName, setBusinessName] = useState("");
  const [juridicalForm, setJuridicalForm] = useState<JuridicalForm | "">("");
  const [rccm, setRccm] = useState("");
  const [ifu, setIfu] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [subsectorId, setSubsectorId] = useState("");
  const [niche, setNiche] = useState("");
  const [circuit, setCircuit] = useState<CircuitId | "">("");
  const [description, setDescription] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // C. Logistique
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [openingHours, setOpeningHours] = useState("");
  const [processingDelay, setProcessingDelay] = useState("");

  // D. Paiement
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");

  // E. Documents
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [shopPhoto, setShopPhoto] = useState<string | undefined>(undefined);
  const [certificate, setCertificate] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  const subsectors = getSubsectors(sectorId);
  const niches = getNiches(sectorId, subsectorId);

  function validateStep(): string | null {
    switch (step) {
      case "type":
        if (!accountType) return "Sélectionne un type de compte";
        return null;
      case "perso": {
        const checks: Array<string | null> = [
          validateRequired("Prénom")(firstName),
          validateRequired("Nom")(lastName),
          vEmail(email),
          vPhone(phone),
          validateMinLen(6, "Mot de passe")(password),
        ];
        const first = checks.find((e) => e);
        if (first) return first;
        if (password !== confirmPassword) return "Les mots de passe ne correspondent pas";
        if (!accept) return "Tu dois accepter les conditions générales";
        return null;
      }
      case "localisation":
        if (!country) return "Sélectionne ton pays";
        if (!region.trim()) return "Indique ta région / département";
        if (!city.trim()) return "Indique ta ville";
        return null;
      case "pro":
        if (!businessName.trim()) return "Nom de l'entreprise / magasin requis";
        if (!juridicalForm) return "Forme juridique requise";
        if (!sectorId) return "Choisis ton secteur d'activité";
        if (!subsectorId) return "Choisis un sous-secteur";
        if (!niche) return "Choisis ta niche / métier";
        if (!circuit) return "Choisis ton circuit";
        if (!fullAddress.trim()) return "Adresse requise";
        return null;
      case "logistique":
        if (deliveryMethods.length === 0) return "Sélectionne au moins une méthode de livraison";
        return null;
      case "docs":
        // tous facultatifs
        return null;
      case "recap":
        return null;
    }
  }

  const goNext = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const submit = async () => {
    if (!accountType) return;
    const err = validateStep();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      // Crée le compte côté serveur (auto-confirm) puis ouvre la session.
      const result = await signupAndSignIn({
        email: email.trim(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      saveUserProfile({
        accountType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar,
        businessName: businessName.trim() || undefined,
        juridicalForm: juridicalForm || undefined,
        rccm: rccm.trim() || undefined,
        ifu: ifu.trim() || undefined,
        sectorId: sectorId || undefined,
        subsectorId: subsectorId || undefined,
        niche: niche || undefined,
        circuit: circuit || undefined,
        description: description.trim() || undefined,
        fullAddress: fullAddress.trim() || undefined,
        country: country || undefined,
        region: region.trim() || undefined,
        city: city.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        deliveryMethods: deliveryMethods.length ? deliveryMethods : undefined,
        openingHours: openingHours.trim() || undefined,
        processingDelay: processingDelay.trim() || undefined,
        logo,
        shopPhoto,
        certificate,
      });

      // Publication dans l'annuaire public si vendeur (non bloquant).
      if (accountType !== "acheteur") {
        try {
          await publishMyVendor({
            name: businessName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
            city: city.trim() || undefined,
            niche: niche || subsectorId || undefined,
            description: description.trim() || undefined,
            logo,
            shopPhoto,
            avatar,
            accountType,
            whatsapp: whatsapp.trim() || undefined,
            phone: phone.trim() || undefined,
            createdAt: Date.now(),
          });
        } catch (e) {
          logger.warn(`publishMyVendor failed: ${e}`);
        }
      }

      // Tentative biométrie (non bloquant)
      try {
        if (isBiometricSupported() && (await isPlatformAuthenticatorAvailable()) && !hasBiometricCredential()) {
          await registerBiometric({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            organization: businessName.trim(),
            email: email.trim(),
            phone: phone.trim(),
          });
          toast.success("Empreinte biométrique enregistrée");
        }
      } catch {
        /* l'utilisateur a refusé, on continue */
      }

      if (!hasClaimedWelcome()) claimWelcomeGift(firstName.trim());
      toast.success("Compte créé. Bienvenue sur IPPOO !");
      navigate(accountType && accountType !== "acheteur" ? "/boutique" : "/profil", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-white">
      {/* Header sticky avec logo + progression */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#F3F4F6]">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src={ippooLogo} alt="IPPOO" className="w-7 h-7 rounded-lg object-contain" />
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>Créer un compte</span>
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>
              {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="h-1 rounded-full bg-[#F3F4F6] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #E11D2E 0%, #F97316 100%)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1.5 text-muted-foreground" style={{ fontSize: 11 }}>
            {STEP_LABELS[step]}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 pb-44">
        <div>
          {/* (header déplacé en haut) */}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              {step === "type" && (
                <StepType
                  current={accountType}
                  onChange={(t) => { setAccountType(t); }}
                  onContinue={goNext}
                />
              )}
              {step === "perso" && (
                <StepPerso
                  firstName={firstName} setFirstName={setFirstName}
                  lastName={lastName} setLastName={setLastName}
                  email={email} setEmail={setEmail}
                  phone={phone} setPhone={setPhone}
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showPwd={showPwd} setShowPwd={setShowPwd}
                  avatar={avatar} setAvatar={setAvatar}
                  accept={accept} setAccept={setAccept}
                />
              )}
              {step === "pro" && (
                <StepPro
                  businessName={businessName} setBusinessName={setBusinessName}
                  juridicalForm={juridicalForm} setJuridicalForm={setJuridicalForm}
                  rccm={rccm} setRccm={setRccm}
                  ifu={ifu} setIfu={setIfu}
                  sectorId={sectorId} setSectorId={(v) => { setSectorId(v); setSubsectorId(""); setNiche(""); }}
                  subsectorId={subsectorId} setSubsectorId={(v) => { setSubsectorId(v); setNiche(""); }}
                  niche={niche} setNiche={setNiche}
                  circuit={circuit} setCircuit={setCircuit}
                  description={description} setDescription={setDescription}
                  fullAddress={fullAddress} setFullAddress={setFullAddress}
                  whatsapp={whatsapp} setWhatsapp={setWhatsapp}
                  subsectors={subsectors}
                  niches={niches}
                />
              )}
              {step === "logistique" && (
                <StepLogistique
                  deliveryMethods={deliveryMethods} setDeliveryMethods={setDeliveryMethods}
                  openingHours={openingHours} setOpeningHours={setOpeningHours}
                  processingDelay={processingDelay} setProcessingDelay={setProcessingDelay}
                />
              )}
              {step === "localisation" && (
                <StepLocalisation
                  country={country} setCountry={setCountry}
                  region={region} setRegion={setRegion}
                  city={city} setCity={setCity}
                />
              )}
              {step === "docs" && (
                <StepDocs
                  logo={logo} setLogo={setLogo}
                  shopPhoto={shopPhoto} setShopPhoto={setShopPhoto}
                  certificate={certificate} setCertificate={setCertificate}
                />
              )}
              {step === "recap" && accountType && (
                <StepRecap
                  accountType={accountType}
                  data={{
                    firstName, lastName, email, phone,
                    businessName, juridicalForm, rccm, ifu,
                    sectorId, subsectorId, niche, circuit, description,
                    fullAddress, country, region, city, whatsapp,
                    deliveryMethods, openingHours, processingDelay,
                    paymentMethods, mobileMoneyNumber,
                    logo, shopPhoto, certificate, avatar,
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation sticky en bas — z-[60] pour passer au-dessus de la bottom nav globale (z-50) */}
          <div
            className="fixed left-0 right-0 z-[60] bg-white/95 backdrop-blur border-t border-[#F3F4F6] px-4 py-3"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)" }}
          >
          <div className="max-w-xl mx-auto flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={goPrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border hover:bg-muted"
                style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            {stepIndex < steps.length - 1 ? (
              <button
                onClick={goNext}
                className="ml-auto flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white"
                style={{
                  background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
                  fontFamily: "Poppins",
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: "0 6px 14px rgba(232,32,42,.3)",
                }}
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #1FB36B 0%, #16A34A 100%)",
                  fontFamily: "Poppins",
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: "0 6px 14px rgba(31,179,107,.3)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Création…" : "Créer mon compte"}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>

    </div>
  );
}

