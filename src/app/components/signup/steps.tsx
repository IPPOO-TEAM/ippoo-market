import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  Clock,
  FileText,
  ImageIcon,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  Users,
} from "lucide-react";
import {
  ACCOUNT_TYPE_DESC,
  ACCOUNT_TYPE_LABELS,
  DELIVERY_LABELS,
  type AccountType,
  type DeliveryMethod,
  type PaymentMethod,
} from "../../auth/user-profile";
import {
  SECTORS,
  CIRCUITS,
  JURIDICAL_FORMS,
  getSubsectors,
  getNiches,
  type CircuitId,
  type JuridicalForm,
} from "../../data/sectors";
import { PhoneInput } from "../phone-input";
import { PaymentLogo, PAYMENT_PROVIDER_LABEL, PAYMENT_PROVIDER_HINT } from "../payment-logos";
import {
  FileUpload, RecapBlock, RecapRow,
  FieldRaw, PasswordRaw, SelectRaw, TextareaRaw,
} from "./wizard-primitives";

export const COUNTRIES: { code: string; label: string }[] = [
  { code: "BJ", label: "Bénin" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "TG", label: "Togo" },
  { code: "BF", label: "Burkina Faso" },
  { code: "ML", label: "Mali" },
  { code: "NE", label: "Niger" },
  { code: "GN", label: "Guinée" },
  { code: "GH", label: "Ghana" },
  { code: "NG", label: "Nigéria" },
  { code: "CM", label: "Cameroun" },
  { code: "GA", label: "Gabon" },
  { code: "CD", label: "RD Congo" },
  { code: "CG", label: "Congo" },
  { code: "FR", label: "France" },
  { code: "OTHER", label: "Autre" },
];

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Lecture du fichier impossible"));
    r.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────── */
/* Étape : type de compte                       */
/* ─────────────────────────────────────────── */

type RoleVisual = {
  Icon: typeof ShoppingBag;
  gradient: string;
  ring: string;
  hint: string;
};

const ROLE_VISUALS: Record<AccountType, RoleVisual> = {
  acheteur: {
    Icon: ShoppingBag,
    gradient: "linear-gradient(135deg,#16A34A 0%, #1FB36B 100%)",
    ring: "#16A34A",
    hint: "Parcours rapide : email, téléphone, paiement.",
  },
  vendeur_individuel: {
    Icon: User,
    gradient: "linear-gradient(135deg,#E11D2E 0%, #F97316 100%)",
    ring: "#E11D2E",
    hint: "Profil simple sans RCCM/IFU obligatoires.",
  },
  entreprise: {
    Icon: Building2,
    gradient: "linear-gradient(135deg,#1A1A2E 0%, #4A1942 100%)",
    ring: "#1A1A2E",
    hint: "Boutique complète, documents juridiques requis.",
  },
  organisation: {
    Icon: Users,
    gradient: "linear-gradient(135deg,#0E73C6 0%, #005BAA 100%)",
    ring: "#0E73C6",
    hint: "Coopératives, GIE, associations.",
  },
};

export function StepType({ current, onChange, onContinue }: { current: AccountType | null; onChange: (t: AccountType) => void; onContinue: () => void }) {
  const types: AccountType[] = ["acheteur", "vendeur_individuel", "entreprise", "organisation"];
  return (
    <div>
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>
        Quel est votre profil ?
      </h2>
      <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
        Chaque profil a son propre parcours d'inscription. Vous ne verrez que les étapes utiles.
      </p>
      <div className="grid grid-cols-1 gap-2.5">
        {types.map((t) => {
          const active = current === t;
          const v = ROLE_VISUALS[t];
          const Icon = v.Icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              aria-pressed={active}
              className="text-left p-4 rounded-2xl transition-all"
              style={{
                background: active ? "#FFFFFF" : "#F9FAFB",
                border: active ? `1.5px solid ${v.ring}` : "1px solid transparent",
                boxShadow: active ? `0 6px 18px ${v.ring}22` : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: v.gradient }}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </p>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {ACCOUNT_TYPE_DESC[t]}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1" style={{ fontSize: 10.5, color: v.ring, fontWeight: 600 }}>
                    <ShieldCheck className="w-3 h-3" /> {v.hint}
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: active ? v.ring : "#D1D5DB", background: active ? v.ring : "transparent" }}
                >
                  {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bouton "Continuer" visible directement après le choix du profil */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!current}
        className="mt-5 w-full flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
          fontFamily: "Poppins",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: current ? "0 8px 18px rgba(232,32,42,.3)" : "none",
        }}
      >
        Continuer
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : infos personnelles                   */
/* ─────────────────────────────────────────── */

type StepPersoProps = {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showPwd: boolean; setShowPwd: (v: boolean) => void;
  avatar: string | undefined; setAvatar: (v: string | undefined) => void;
  accept: boolean; setAccept: (v: boolean) => void;
};

export function StepPerso(p: StepPersoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      p.setAvatar(await readFileAsDataURL(f));
    } catch {
      toast.error("Impossible de lire la photo");
    }
  };
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Informations personnelles</h2>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden bg-[#F3F4F6]"
        >
          {p.avatar ? (
            <img src={p.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 12, fontWeight: 600 }}>Photo de profil</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>Optionnel · JPG / PNG</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FieldRaw icon={User} placeholder="Prénom" value={p.firstName} onChange={p.setFirstName} />
        <FieldRaw icon={User} placeholder="Nom" value={p.lastName} onChange={p.setLastName} />
      </div>
      <FieldRaw icon={Mail} type="email" placeholder="Email" value={p.email} onChange={p.setEmail} />
      <PhoneInput label="Téléphone" value={p.phone} onChange={p.setPhone} showValidation />
      <PasswordRaw value={p.password} onChange={p.setPassword} show={p.showPwd} toggle={() => p.setShowPwd(!p.showPwd)} placeholder="Mot de passe" />
      <PasswordRaw value={p.confirmPassword} onChange={p.setConfirmPassword} show={p.showPwd} toggle={() => p.setShowPwd(!p.showPwd)} placeholder="Confirmer le mot de passe" />
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#E11D2E]" checked={p.accept} onChange={(e) => p.setAccept(e.target.checked)} />
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          J'accepte les{" "}
          <a href="/legal/cgu" target="_blank" rel="noopener noreferrer" className="text-[#E11D2E] underline">
            conditions générales d'utilisation
          </a>{" "}
          et la{" "}
          <a href="/legal/confidentialite" target="_blank" rel="noopener noreferrer" className="text-[#E11D2E] underline">
            politique de confidentialité
          </a>
          .
        </span>
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : pro (vendeurs / entreprises)         */
/* ─────────────────────────────────────────── */

type StepProProps = {
  businessName: string; setBusinessName: (v: string) => void;
  juridicalForm: JuridicalForm | ""; setJuridicalForm: (v: JuridicalForm | "") => void;
  rccm: string; setRccm: (v: string) => void;
  ifu: string; setIfu: (v: string) => void;
  sectorId: string; setSectorId: (v: string) => void;
  subsectorId: string; setSubsectorId: (v: string) => void;
  niche: string; setNiche: (v: string) => void;
  circuit: CircuitId | ""; setCircuit: (v: CircuitId | "") => void;
  description: string; setDescription: (v: string) => void;
  fullAddress: string; setFullAddress: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  subsectors: { id: string; label: string }[];
  niches: string[];
};

export function StepPro(p: StepProProps) {
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Activité professionnelle</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 6 }}>
        Ces informations construisent ta fiche boutique sur le marketplace.
      </p>

      <FieldRaw icon={Building2} placeholder="Nom de l'entreprise / magasin" value={p.businessName} onChange={p.setBusinessName} />

      <SelectRaw
        label="Forme juridique"
        value={p.juridicalForm}
        onChange={(v) => p.setJuridicalForm(v as JuridicalForm)}
        options={JURIDICAL_FORMS.map((j) => ({ value: j.id, label: j.label }))}
        placeholder="Sélectionner…"
      />

      <div className="grid grid-cols-2 gap-2">
        <FieldRaw icon={FileText} placeholder="RCCM" value={p.rccm} onChange={p.setRccm} />
        <FieldRaw icon={FileText} placeholder="IFU" value={p.ifu} onChange={p.setIfu} />
      </div>

      <SelectRaw
        label="Secteur d'activité"
        value={p.sectorId}
        onChange={p.setSectorId}
        options={SECTORS.map((s) => ({ value: s.id, label: s.label }))}
        placeholder="Choisir un secteur"
      />

      <SelectRaw
        label="Sous-secteur"
        value={p.subsectorId}
        onChange={p.setSubsectorId}
        options={p.subsectors.map((s) => ({ value: s.id, label: s.label }))}
        placeholder={p.sectorId ? "Choisir un sous-secteur" : "Choisis d'abord un secteur"}
        disabled={!p.sectorId}
      />

      <SelectRaw
        label="Niche / métier"
        value={p.niche}
        onChange={p.setNiche}
        options={p.niches.map((n) => ({ value: n, label: n }))}
        placeholder={p.subsectorId ? "Choisir une niche" : "Choisis d'abord un sous-secteur"}
        disabled={!p.subsectorId}
      />

      <div>
        <label style={{ fontSize: 11, color: "#5A5F6A", letterSpacing: 0.6 }}>CIRCUIT</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {CIRCUITS.map((c) => {
            const active = p.circuit === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => p.setCircuit(c.id)}
                className={`text-left p-2.5 rounded-xl transition-all ${
                  active ? "bg-white border border-[#E11D2E]" : "bg-[#F9FAFB] border border-transparent hover:border-[#E11D2E]/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>{c.label}</p>
                    <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{c.description}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#E11D2E] shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <TextareaRaw
        label="Description de l'activité"
        placeholder="En quelques lignes, présente ton activité, tes produits ou services phares…"
        value={p.description}
        onChange={p.setDescription}
        rows={3}
      />

      <FieldRaw icon={MapPin} placeholder="Adresse complète (ex. Carré 1234, Cotonou)" value={p.fullAddress} onChange={p.setFullAddress} />
      <PhoneInput label="WhatsApp professionnel" value={p.whatsapp} onChange={p.setWhatsapp} />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : localisation (pays / région / ville)  */
/* ─────────────────────────────────────────── */

type StepLocProps = {
  country: string; setCountry: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  city: string; setCity: (v: string) => void;
};

export function StepLocalisation(p: StepLocProps) {
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Où es-tu basé(e) ?</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Cela permet d'afficher les vendeurs, produits et livraisons proches de toi.
      </p>
      <SelectRaw
        label="Pays"
        value={p.country}
        onChange={p.setCountry}
        options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
        placeholder="Sélectionner un pays"
      />
      <FieldRaw icon={MapPin} placeholder="Région / Département / État" value={p.region} onChange={p.setRegion} />
      <FieldRaw icon={MapPin} placeholder="Ville (ex. Cotonou, Abidjan, Dakar)" value={p.city} onChange={p.setCity} />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : logistique                           */
/* ─────────────────────────────────────────── */

type StepLogProps = {
  deliveryMethods: DeliveryMethod[]; setDeliveryMethods: (v: DeliveryMethod[]) => void;
  openingHours: string; setOpeningHours: (v: string) => void;
  processingDelay: string; setProcessingDelay: (v: string) => void;
};

export function StepLogistique(p: StepLogProps) {
  const toggle = (m: DeliveryMethod) => {
    p.setDeliveryMethods(
      p.deliveryMethods.includes(m)
        ? p.deliveryMethods.filter((x) => x !== m)
        : [...p.deliveryMethods, m],
    );
  };
  const items: DeliveryMethod[] = ["perso", "partenaires", "retrait"];
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Logistique</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Comment tes clients reçoivent-ils leurs commandes ? Tu peux cocher plusieurs options.
      </p>
      <div className="space-y-2">
        {items.map((m) => {
          const active = p.deliveryMethods.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                active ? "bg-white border border-[#E11D2E]" : "bg-[#F9FAFB] border border-transparent"
              }`}
            >
              <Truck className="w-5 h-5 text-[#E11D2E]" />
              <span className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                {DELIVERY_LABELS[m]}
              </span>
              {active && <Check className="w-5 h-5 text-[#E11D2E]" />}
            </button>
          );
        })}
      </div>
      <FieldRaw icon={Clock} placeholder="Horaires d'ouverture (ex. Lun–Sam 8h–18h)" value={p.openingHours} onChange={p.setOpeningHours} />
      <FieldRaw icon={Clock} placeholder="Délai de traitement (ex. 24–48h)" value={p.processingDelay} onChange={p.setProcessingDelay} />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : paiement                             */
/* ─────────────────────────────────────────── */

type StepPayProps = {
  paymentMethods: PaymentMethod[]; setPaymentMethods: (v: PaymentMethod[]) => void;
  mobileMoneyNumber: string; setMobileMoneyNumber: (v: string) => void;
};

export function StepPaiement(p: StepPayProps) {
  const toggle = (m: PaymentMethod) => {
    p.setPaymentMethods(
      p.paymentMethods.includes(m)
        ? p.paymentMethods.filter((x) => x !== m)
        : [...p.paymentMethods, m],
    );
  };
  const items: PaymentMethod[] = ["mtn", "moov", "celtis", "carte", "livraison"];
  const needsMoMo = items.slice(0, 3).some((m) => p.paymentMethods.includes(m));
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Moyens de paiement</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Sélectionne les comptes que tu utilises (ou acceptes en tant que vendeur).
      </p>
      <div className="space-y-2">
        {items.map((m) => {
          const active = p.paymentMethods.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              aria-pressed={active}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                active ? "bg-white border border-[#E11D2E]" : "bg-[#F9FAFB] border border-transparent hover:border-[#E11D2E]/40"
              }`}
            >
              <PaymentLogo method={m} size={40} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                  {PAYMENT_PROVIDER_LABEL[m]}
                </p>
                <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                  {PAYMENT_PROVIDER_HINT[m]}
                </p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: active ? "#E11D2E" : "#D1D5DB", background: active ? "#E11D2E" : "transparent" }}
              >
                {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
      {needsMoMo && (
        <PhoneInput label="Numéro Mobile Money" value={p.mobileMoneyNumber} onChange={p.setMobileMoneyNumber} showValidation />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : documents                            */
/* ─────────────────────────────────────────── */

type StepDocsProps = {
  logo: string | undefined; setLogo: (v: string | undefined) => void;
  shopPhoto: string | undefined; setShopPhoto: (v: string | undefined) => void;
  certificate: string | undefined; setCertificate: (v: string | undefined) => void;
};

export function StepDocs(p: StepDocsProps) {
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Documents justificatifs</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Tu pourras toujours les ajouter plus tard depuis ton espace.
      </p>
      <FileUpload label="Logo de l'entreprise" value={p.logo} onChange={p.setLogo} icon={<ImageIcon className="w-5 h-5" />} />
      <FileUpload label="Photo de la boutique / atelier" value={p.shopPhoto} onChange={p.setShopPhoto} icon={<ImageIcon className="w-5 h-5" />} />
      <FileUpload label="Certificat / Autorisation (produits sensibles)" value={p.certificate} onChange={p.setCertificate} icon={<FileText className="w-5 h-5" />} accept="image/*,application/pdf" />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Étape : récapitulatif                        */
/* ─────────────────────────────────────────── */

export interface RecapData {
  firstName: string; lastName: string; email: string; phone: string;
  businessName?: string; juridicalForm?: string; rccm?: string; ifu?: string;
  sectorId?: string; subsectorId?: string; niche?: string; circuit?: string; description?: string;
  fullAddress?: string; country?: string; region?: string; city?: string; whatsapp?: string;
  deliveryMethods?: DeliveryMethod[]; openingHours?: string; processingDelay?: string;
  paymentMethods?: PaymentMethod[]; mobileMoneyNumber?: string;
  logo?: string; shopPhoto?: string; certificate?: string; avatar?: string;
}

export function StepRecap({ accountType, data }: { accountType: AccountType; data: RecapData }) {
  const seller = accountType !== "acheteur";
  return (
    <div className="space-y-3">
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Récapitulatif</h2>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Vérifie tes informations avant de valider la création de ton compte.
      </p>

      <RecapBlock title={ACCOUNT_TYPE_LABELS[accountType]}>
        <RecapRow label="Nom" value={`${data.firstName} ${data.lastName}`} />
        <RecapRow label="Email" value={data.email} />
        <RecapRow label="Téléphone" value={data.phone} />
        <RecapRow label="Localisation" value={[COUNTRIES.find((c) => c.code === data.country)?.label, data.region, data.city].filter(Boolean).join(" · ")} />
      </RecapBlock>

      {seller && (
        <RecapBlock title="Activité professionnelle">
          <RecapRow label="Entreprise" value={data.businessName} />
          <RecapRow label="Forme juridique" value={JURIDICAL_FORMS.find((j) => j.id === data.juridicalForm)?.label} />
          <RecapRow label="RCCM" value={data.rccm} />
          <RecapRow label="IFU" value={data.ifu} />
          <RecapRow label="Secteur" value={SECTORS.find((s) => s.id === data.sectorId)?.label} />
          <RecapRow label="Sous-secteur" value={getSubsectors(data.sectorId ?? "").find((s) => s.id === data.subsectorId)?.label} />
          <RecapRow label="Niche" value={data.niche} />
          <RecapRow label="Circuit" value={CIRCUITS.find((c) => c.id === data.circuit)?.label} />
          <RecapRow label="Adresse" value={data.fullAddress} />
          {data.whatsapp && <RecapRow label="WhatsApp" value={data.whatsapp} />}
        </RecapBlock>
      )}

      {seller && data.deliveryMethods && data.deliveryMethods.length > 0 && (
        <RecapBlock title="Logistique">
          <RecapRow label="Livraison" value={data.deliveryMethods.map((m: DeliveryMethod) => DELIVERY_LABELS[m]).join(", ")} />
          {data.openingHours && <RecapRow label="Horaires" value={data.openingHours} />}
          {data.processingDelay && <RecapRow label="Délai" value={data.processingDelay} />}
        </RecapBlock>
      )}

      {data.paymentMethods && data.paymentMethods.length > 0 && (
        <RecapBlock title="Paiements">
          <RecapRow label="Comptes" value={data.paymentMethods.map((m: PaymentMethod) => PAYMENT_PROVIDER_LABEL[m]).join(", ")} />
          {data.mobileMoneyNumber && <RecapRow label="Mobile Money" value={data.mobileMoneyNumber} />}
        </RecapBlock>
      )}

      {seller && (data.logo || data.shopPhoto || data.certificate) && (
        <RecapBlock title="Documents">
          {data.logo && <RecapRow label="Logo" value="✓ Ajouté" />}
          {data.shopPhoto && <RecapRow label="Photo boutique" value="✓ Ajoutée" />}
          {data.certificate && <RecapRow label="Certificat" value="✓ Ajouté" />}
        </RecapBlock>
      )}

      <p className="text-center text-muted-foreground mt-2 flex items-center justify-center gap-1" style={{ fontSize: 11 }}>
        <Sparkles className="w-3 h-3 text-[#E11D2E]" /> Un cadeau de bienvenue t'attend à la validation !
      </p>
    </div>
  );
}

