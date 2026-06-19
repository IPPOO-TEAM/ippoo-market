import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Users,
  Wheat,
  Factory,
  Truck,
  ShoppingCart,
  Store,
  Layers,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Camera,
  ChevronRight,
  Shield,
  Clock,
  Package,
  Globe,
  BadgeCheck,
  Building2,
  Briefcase,
  CircleDollarSign,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════
   PROFILE REGISTRATION CONFIG
   ═══════════════════════════════════════════ */

interface ProfileRegConfig {
  slug: string;
  name: string;
  shortName: string;
  icon: typeof Users;
  color: string;
  gradient: string;
  heroTitle: string;
  heroSubtitle: string;
  specificFields: {
    name: string;
    label: string;
    placeholder: string;
    type: "text" | "textarea" | "select" | "number";
    options?: string[];
    required?: boolean;
  }[];
  documents: string[];
  commitments: string[];
  successMessage: string;
}

const registrationConfigs: ProfileRegConfig[] = [
  {
    slug: "producteurs",
    name: "Producteur",
    shortName: "Producteur",
    icon: Wheat,
    color: "#16A34A",
    gradient: "linear-gradient(135deg, #16A34A, #22C55E)",
    heroTitle: "Inscription Producteur",
    heroSubtitle: "Faites reconnaître votre production et accédez à des acheteurs sérieux",
    specificFields: [
      { name: "typeProduction", label: "Type de production", placeholder: "Sélectionnez", type: "select", options: ["Céréales", "Tubercules & Vivrier", "Oléagineux", "Fruits & Légumes", "Élevage", "Pêche & Aquaculture", "Autre"], required: true },
      { name: "capaciteMensuelle", label: "Capacité mensuelle (tonnes)", placeholder: "Ex: 5", type: "number", required: true },
      { name: "zoneCulture", label: "Zone de culture / production", placeholder: "Ex: Borgou, Parakou", type: "text", required: true },
      { name: "certifications", label: "Certifications (si applicable)", placeholder: "Ex: Bio, HACCP, IGP...", type: "text" },
      { name: "saisons", label: "Saisons de production", placeholder: "Sélectionnez", type: "select", options: ["Toute l'année", "Saison sèche", "Saison pluvieuse", "Saisonnière"] },
      { name: "experience", label: "Années d'expérience", placeholder: "Ex: 8", type: "number" },
    ],
    documents: ["Pièce d'identité", "Attestation d'exploitation", "Photos de la production"],
    commitments: [
      "Fournir des produits conformes aux descriptions",
      "Respecter les délais de livraison convenus",
      "Communiquer en transparence sur les quantités disponibles",
      "Signaler tout problème de qualité ou de stock",
    ],
    successMessage: "Votre profil producteur est en cours de validation ! Vous recevrez une confirmation sous 48h.",
  },
  {
    slug: "transformateurs",
    name: "Transformateur",
    shortName: "Transformateur",
    icon: Factory,
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #FB923C)",
    heroTitle: "Inscription Transformateur",
    heroSubtitle: "Valorisez votre savoir-faire et connectez-vous aux distributeurs",
    specificFields: [
      { name: "typeTransformation", label: "Type de transformation", placeholder: "Sélectionnez", type: "select", options: ["Mouture & Farines", "Conditionnement", "Conserverie", "Laiterie", "Jus & Boissons", "Cosmétique", "Savonnerie", "Autre"], required: true },
      { name: "capaciteJournaliere", label: "Capacité journalière", placeholder: "Ex: 500 kg/jour", type: "text", required: true },
      { name: "normes", label: "Normes & Certifications", placeholder: "Ex: HACCP, ISO 22000...", type: "text" },
      { name: "equipements", label: "Équipements principaux", placeholder: "Décrivez vos équipements", type: "textarea" },
      { name: "matieresPremieres", label: "Matières premières utilisées", placeholder: "Ex: Soja, Maïs, Karité...", type: "text", required: true },
      { name: "employes", label: "Nombre d'employés", placeholder: "Ex: 12", type: "number" },
    ],
    documents: ["Pièce d'identité", "Registre de commerce (RCCM)", "Certificat de conformité", "Photos de l'unité de production"],
    commitments: [
      "Respecter les normes d'hygiène et de sécurité alimentaire",
      "Garantir la traçabilité des produits transformés",
      "Livrer des produits conformes aux échantillons",
      "Maintenir un stock tampon pour les commandes récurrentes",
    ],
    successMessage: "Votre profil transformateur est en cours de vérification ! Réponse sous 48h.",
  },
  {
    slug: "distributeurs",
    name: "Distributeur",
    shortName: "Distributeur",
    icon: Truck,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
    heroTitle: "Inscription Distributeur",
    heroSubtitle: "Écoulez vos stocks et accédez à une clientèle B2B qualifiée",
    specificFields: [
      { name: "typeDistribution", label: "Type de distribution", placeholder: "Sélectionnez", type: "select", options: ["Alimentaire", "Boissons", "Hygiène & Entretien", "Électronique", "Textile", "Matériaux", "Multi-catégories"], required: true },
      { name: "zoneDistribution", label: "Zone de distribution", placeholder: "Ex: Cotonou, Porto-Novo, Sud Bénin", type: "text", required: true },
      { name: "vehicules", label: "Véhicules de livraison", placeholder: "Ex: 3 camions, 5 tricycles", type: "text" },
      { name: "entrepots", label: "Capacité d'entreposage (m²)", placeholder: "Ex: 200", type: "number" },
      { name: "clientsActuels", label: "Nombre de clients actuels", placeholder: "Ex: 50", type: "number" },
      { name: "delaiLivraison", label: "Délai moyen de livraison", placeholder: "Sélectionnez", type: "select", options: ["Même jour", "24h", "48h", "3-5 jours", "Plus de 5 jours"] },
    ],
    documents: ["Pièce d'identité", "Registre de commerce (RCCM)", "Licence de distribution", "Photos de l'entrepôt"],
    commitments: [
      "Assurer la livraison dans les délais annoncés",
      "Maintenir la chaîne de froid si applicable",
      "Communiquer proactivement en cas de retard",
      "Garantir l'intégrité des marchandises livrées",
    ],
    successMessage: "Votre profil distributeur est en cours de validation ! Confirmation sous 48h.",
  },
  {
    slug: "acheteurs",
    name: "Acheteur de gros",
    shortName: "Acheteur",
    icon: ShoppingCart,
    color: "#E11D2E",
    gradient: "linear-gradient(135deg, #E11D2E, #F43F5E)",
    heroTitle: "Inscription Acheteur de gros",
    heroSubtitle: "Achetez en volume, obtenez les meilleurs prix et sécurisez vos approvisionnements",
    specificFields: [
      { name: "typeActivite", label: "Type d'activité", placeholder: "Sélectionnez", type: "select", options: ["Détaillant", "Revendeur", "Restaurant / Hôtel", "Institution (école, hôpital)", "Comité d'entreprise", "Groupement d'achat", "Autre"], required: true },
      { name: "categoriesRecherchees", label: "Catégories recherchées", placeholder: "Ex: Alimentaire, Textile, Hygiène...", type: "text", required: true },
      { name: "volumeMensuel", label: "Volume d'achat mensuel estimé (FCFA)", placeholder: "Ex: 500000", type: "number", required: true },
      { name: "frequenceAchat", label: "Fréquence d'achat", placeholder: "Sélectionnez", type: "select", options: ["Quotidien", "Hebdomadaire", "Bimensuel", "Mensuel", "Trimestriel"] },
      { name: "modePaiement", label: "Mode de paiement préféré", placeholder: "Sélectionnez", type: "select", options: ["Mobile Money (MTN/Moov)", "Virement bancaire", "IPPOO CASH", "Espèces à la livraison", "Mixte"] },
      { name: "besoinsSpecifiques", label: "Besoins spécifiques", placeholder: "Décrivez vos besoins particuliers", type: "textarea" },
    ],
    documents: ["Pièce d'identité", "Justificatif d'activité commerciale"],
    commitments: [
      "Honorer les commandes confirmées",
      "Respecter les conditions de paiement convenues",
      "Communiquer ses besoins clairement et à l'avance",
      "Évaluer les fournisseurs de manière constructive",
    ],
    successMessage: "Votre profil acheteur est activé ! Commencez à explorer les offres dès maintenant.",
  },
  {
    slug: "vendeurs",
    name: "Vendeur de gros",
    shortName: "Vendeur",
    icon: Store,
    color: "#E8A817",
    gradient: "linear-gradient(135deg, #E8A817, #FBBF24)",
    heroTitle: "Inscription Vendeur de gros",
    heroSubtitle: "Ouvrez votre boutique et développez votre clientèle B2B",
    specificFields: [
      { name: "nomBoutique", label: "Nom de la boutique", placeholder: "Ex: Ets Koffi & Fils", type: "text", required: true },
      { name: "specialites", label: "Spécialités", placeholder: "Sélectionnez", type: "select", options: ["Alimentaire", "Boissons", "Beauté & Cosmétiques", "Textile & Mode", "Électronique", "Hygiène", "Matériaux", "Equipements", "Multi-catégories"], required: true },
      { name: "moq", label: "Quantité minimum de commande (MOQ)", placeholder: "Ex: 10 cartons", type: "text", required: true },
      { name: "paliersDegressifs", label: "Proposez-vous des paliers dégressifs ?", placeholder: "Sélectionnez", type: "select", options: ["Oui", "Non", "Sur négociation"] },
      { name: "zonesLivraison", label: "Zones de livraison", placeholder: "Ex: Cotonou, Grand Nokoué, National", type: "text", required: true },
      { name: "conditionsVente", label: "Conditions de vente particulières", placeholder: "Ex: Paiement à la commande, 30% acompte...", type: "textarea" },
    ],
    documents: ["Pièce d'identité", "Registre de commerce (RCCM)", "IFU / NIF", "Photos de la boutique / stock"],
    commitments: [
      "Publier des prix transparents et honnêtes",
      "Respecter les MOQ et paliers annoncés",
      "Livrer dans les délais convenus",
      "Assurer un service après-vente de base",
    ],
    successMessage: "Votre boutique vendeur est en cours de création ! Validation sous 24h.",
  },
  {
    slug: "grossistes",
    name: "Grossiste",
    shortName: "Grossiste",
    icon: Layers,
    color: "#7C3AED",
    gradient: "linear-gradient(135deg, #7C3AED, #A78BFA)",
    heroTitle: "Inscription Grossiste",
    heroSubtitle: "Protégez votre position et développez votre réseau B2B",
    specificFields: [
      { name: "raisonSociale", label: "Raison sociale", placeholder: "Ex: Import Céréales Plus SARL", type: "text", required: true },
      { name: "secteurActivite", label: "Secteur d'activité principal", placeholder: "Sélectionnez", type: "select", options: ["Alimentaire", "Boissons", "Hygiène", "Matériaux BTP", "Vivrier", "Céréales import", "Électronique", "Multi-secteurs"], required: true },
      { name: "volumeMensuel", label: "Volume mensuel (FCFA)", placeholder: "Ex: 50000000", type: "number", required: true },
      { name: "entrepotsCapacite", label: "Capacité d'entreposage totale (m²)", placeholder: "Ex: 1000", type: "number" },
      { name: "partenaires", label: "Nombre de partenaires / clients réguliers", placeholder: "Ex: 150", type: "number" },
      { name: "importExport", label: "Activité import/export ?", placeholder: "Sélectionnez", type: "select", options: ["Import uniquement", "Export uniquement", "Import & Export", "Aucun (local uniquement)"] },
    ],
    documents: ["Pièce d'identité du dirigeant", "Registre de commerce (RCCM)", "IFU / NIF", "Statuts de l'entreprise", "Références commerciales"],
    commitments: [
      "Maintenir des prix cohérents avec le marché",
      "Assurer la disponibilité des stocks annoncés",
      "Respecter les accords de partenariat",
      "Contribuer à la transparence du marché de gros",
    ],
    successMessage: "Votre profil grossiste est soumis pour validation premium. Réponse sous 48-72h.",
  },
];

/* ═══════════════════════════════════════════
   REGISTRATION PAGE COMPONENT
   ═══════════════════════════════════════════ */

export function ProfileRegistrationPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = registrationConfigs.find((c) => c.slug === type);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCommitments, setAcceptCommitments] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Profil d'inscription non trouvé</p>
        <button onClick={() => navigate("/profils")} className="mt-4 text-[#E11D2E]" style={{ fontWeight: 600 }}>
          Retour au Circuit de Gros
        </button>
      </div>
    );
  }

  const ProfileIcon = config.icon;
  const totalSteps = 4;

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStep1Valid = !!(formData.fullName && formData.phone && formData.city);
  const isStep2Valid = config.specificFields
    .filter((f) => f.required)
    .every((f) => formData[f.name]?.trim());
  const isStep3Valid = acceptTerms && acceptCommitments;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    return true;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success(config.successMessage);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="pb-24">
        <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/profils")} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Inscription confirmée</h3>
        </div>

        <div className="px-4 py-12 max-w-md mx-auto text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${config.color}15` }}
            >
              <CheckCircle2 className="w-14 h-14" style={{ color: config.color }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, color: config.color }}>
              Bienvenue dans le circuit !
            </h2>
            <p className="text-muted-foreground mb-2" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {config.successMessage}
            </p>
            <p className="text-muted-foreground mb-8" style={{ fontSize: 12 }}>
              Un email de confirmation a été envoyé à <strong>{formData.email || "votre adresse"}</strong>.
            </p>

            <div className="bg-white rounded-2xl border border-border p-4 mb-6 text-left">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                <Clock className="w-4 h-4" style={{ color: config.color }} /> Prochaines étapes
              </h4>
              <div className="space-y-2.5">
                {[
                  "Notre équipe vérifie vos informations",
                  "Vous recevez votre badge vérifié",
                  "Votre profil est visible sur le circuit",
                  "Vous commencez à recevoir des contacts",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
                      style={{ background: config.color, fontSize: 10, fontWeight: 800 }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/profils")}
                className="flex-1 py-3 rounded-xl border border-border"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Circuit de Gros
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 rounded-xl text-white"
                style={{ background: config.gradient, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Accueil
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate(-1);
          }}
          className="p-2 rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${config.color}15` }}>
            <ProfileIcon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            {config.heroTitle}
          </h3>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full text-white" style={{ background: config.color, fontSize: 10, fontWeight: 800 }}>
          {step}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#F3F4F6]">
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: config.gradient }}
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Hero mini */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: config.gradient, opacity: 0.08 }} />
        <div className="relative px-4 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${config.color}20` }}>
            <ProfileIcon className="w-6 h-6" style={{ color: config.color }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: config.color }}>
              {step === 1 && "Informations générales"}
              {step === 2 && `Profil ${config.shortName}`}
              {step === 3 && "Documents & Engagements"}
              {step === 4 && "Récapitulatif"}
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              {step === 1 && "Vos coordonnées et localisation"}
              {step === 2 && "Détails spécifiques à votre activité"}
              {step === 3 && "Pièces justificatives et charte"}
              {step === 4 && "Vérifiez et validez votre inscription"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: General Info ═══ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
                <FormField
                  icon={<User className="w-4 h-4" style={{ color: config.color }} />}
                  label="Nom complet *"
                  name="fullName"
                  placeholder="Ex: Koffi Mensah"
                  value={formData.fullName || ""}
                  onChange={updateField}
                  color={config.color}
                />
                <FormField
                  icon={<Building2 className="w-4 h-4" style={{ color: config.color }} />}
                  label="Nom de l'entreprise / structure"
                  name="companyName"
                  placeholder="Ex: Ets Mensah & Fils"
                  value={formData.companyName || ""}
                  onChange={updateField}
                  color={config.color}
                />
                <FormField
                  icon={<Phone className="w-4 h-4" style={{ color: config.color }} />}
                  label="Téléphone *"
                  name="phone"
                  placeholder="Ex: +229 97 00 00 00"
                  value={formData.phone || ""}
                  onChange={updateField}
                  color={config.color}
                />
                <FormField
                  icon={<Mail className="w-4 h-4" style={{ color: config.color }} />}
                  label="Email"
                  name="email"
                  placeholder="Ex: koffi@email.com"
                  value={formData.email || ""}
                  onChange={updateField}
                  color={config.color}
                />
                <FormField
                  icon={<MapPin className="w-4 h-4" style={{ color: config.color }} />}
                  label="Ville / Localisation *"
                  name="city"
                  placeholder="Ex: Cotonou"
                  value={formData.city || ""}
                  onChange={updateField}
                  color={config.color}
                />
                <div>
                  <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
                    <Globe className="w-4 h-4" style={{ color: config.color }} />
                    Pays
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:outline-none"
                    style={{ fontSize: 13, focusRingColor: `${config.color}40` } as React.CSSProperties}
                    value={formData.country || "Bénin"}
                    onChange={(e) => updateField("country", e.target.value)}
                  >
                    {["Bénin", "Togo", "Côte d'Ivoire", "Burkina Faso", "Niger", "Nigeria", "Ghana", "Sénégal", "Mali", "Cameroun", "Autre"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
                    <FileText className="w-4 h-4" style={{ color: config.color }} />
                    Présentation courte
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:outline-none resize-none"
                    style={{ fontSize: 13, minHeight: 80 }}
                    placeholder="Décrivez brièvement votre activité..."
                    value={formData.bio || ""}
                    onChange={(e) => updateField("bio", e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Specific Fields ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
                {config.specificFields.map((field) => {
                  if (field.type === "select") {
                    return (
                      <div key={field.name}>
                        <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
                          <Briefcase className="w-4 h-4" style={{ color: config.color }} />
                          {field.label} {field.required && "*"}
                        </label>
                        <select
                          className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:outline-none"
                          style={{ fontSize: 13 }}
                          value={formData[field.name] || ""}
                          onChange={(e) => updateField(field.name, e.target.value)}
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (field.type === "textarea") {
                    return (
                      <div key={field.name}>
                        <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
                          <FileText className="w-4 h-4" style={{ color: config.color }} />
                          {field.label} {field.required && "*"}
                        </label>
                        <textarea
                          className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:outline-none resize-none"
                          style={{ fontSize: 13, minHeight: 80 }}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) => updateField(field.name, e.target.value)}
                        />
                      </div>
                    );
                  }
                  return (
                    <FormField
                      key={field.name}
                      icon={<Briefcase className="w-4 h-4" style={{ color: config.color }} />}
                      label={`${field.label}${field.required ? " *" : ""}`}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={updateField}
                      color={config.color}
                      type={field.type === "number" ? "number" : "text"}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Documents & Commitments ═══ */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Documents upload */}
              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
                  <Upload className="w-4 h-4" style={{ color: config.color }} /> Documents requis
                </h4>
                <div className="space-y-2.5">
                  {config.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#E5E7EB] cursor-pointer hover:border-current transition-colors"
                      style={{ borderColor: formData[`doc_${i}`] ? config.color : undefined }}
                      onClick={() => {
                        updateField(`doc_${i}`, formData[`doc_${i}`] ? "" : "uploaded");
                        if (!formData[`doc_${i}`]) toast.success(`${doc}, fichier sélectionné`);
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: formData[`doc_${i}`] ? `${config.color}20` : "#F3F4F6" }}>
                        {formData[`doc_${i}`] ? (
                          <CheckCircle2 className="w-5 h-5" style={{ color: config.color }} />
                        ) : (
                          <Camera className="w-5 h-5 text-[#9CA3AF]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 12, fontWeight: 600 }}>{doc}</p>
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                          {formData[`doc_${i}`] ? "Document ajouté" : "Appuyez pour ajouter"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground mt-3" style={{ fontSize: 10 }}>
                  Formats acceptés : JPG, PNG, PDF. Max 5 Mo par fichier.
                </p>
              </div>

              {/* Commitments */}
              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
                  <Shield className="w-4 h-4" style={{ color: config.color }} /> Engagements {config.shortName}
                </h4>
                <div className="space-y-2">
                  {config.commitments.map((commitment, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: `${config.color}08` }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.color }} />
                      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "16px" }}>{commitment}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAcceptCommitments(!acceptCommitments)}>
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={{
                        borderColor: acceptCommitments ? config.color : "#D1D5DB",
                        background: acceptCommitments ? config.color : "transparent",
                      }}
                    >
                      {acceptCommitments && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "16px" }}>
                      Je m'engage à respecter la charte {config.shortName} IPPOO
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAcceptTerms(!acceptTerms)}>
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={{
                        borderColor: acceptTerms ? config.color : "#D1D5DB",
                        background: acceptTerms ? config.color : "transparent",
                      }}
                    >
                      {acceptTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "16px" }}>
                      J'accepte les conditions générales d'utilisation d'IPPOO Market
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: Summary ═══ */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Profile summary */}
              <div className="rounded-2xl overflow-hidden border border-border">
                <div className="p-4 text-white" style={{ background: config.gradient }}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                      <ProfileIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 17 }}>
                        {formData.fullName || ","}
                      </h3>
                      <p className="text-white/80" style={{ fontSize: 12 }}>
                        {config.name} • {formData.city || ","}, {formData.country || "Bénin"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 space-y-3">
                  <SummaryRow label="Entreprise" value={formData.companyName} />
                  <SummaryRow label="Téléphone" value={formData.phone} />
                  <SummaryRow label="Email" value={formData.email} />
                  {config.specificFields.map((field) => (
                    <SummaryRow key={field.name} label={field.label} value={formData[field.name]} />
                  ))}
                  {formData.bio && <SummaryRow label="Présentation" value={formData.bio} />}
                </div>
              </div>

              {/* Documents count */}
              <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${config.color}15` }}>
                  <FileText className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 700 }}>Documents joints</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {config.documents.filter((_, i) => formData[`doc_${i}`]).length} / {config.documents.length} documents
                  </p>
                </div>
                <BadgeCheck className="w-5 h-5" style={{ color: config.color }} />
              </div>

              {/* Trust badge */}
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${config.color}08`, border: `1px solid ${config.color}20` }}>
                <Shield className="w-6 h-6 shrink-0" style={{ color: config.color }} />
                <p className="text-muted-foreground" style={{ fontSize: 11, lineHeight: "15px" }}>
                  Vos données sont protégées et traitées conformément à notre politique de confidentialité. Votre profil sera vérifié par notre équipe avant activation.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3.5 rounded-xl border border-border flex items-center justify-center gap-2"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3.5 rounded-xl text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 active:scale-[0.97]"
            style={{ background: canProceed() ? config.gradient : "#D1D5DB", fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
          >
            {step === totalSteps ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Valider mon inscription
              </>
            ) : (
              <>
                Continuer <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i + 1 === step ? 24 : 8,
                background: i + 1 <= step ? config.color : "#E5E7EB",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════ */

function FormField({
  icon,
  label,
  name,
  placeholder,
  value,
  onChange,
  color,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (name: string, value: string) => void;
  color: string;
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
        {icon}
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:outline-none"
        style={{ fontSize: 13 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#F3F4F6] last:border-0">
      <span className="text-muted-foreground shrink-0" style={{ fontSize: 11, fontWeight: 600, minWidth: 100 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
