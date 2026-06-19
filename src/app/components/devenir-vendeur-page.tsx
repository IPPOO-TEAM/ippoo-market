import { logger } from "../lib/logger";
import { useEffect, useState, useRef } from "react";
import { useUserProfile } from "../auth/useUserProfile";
import { fileToCompressedDataUrl, uploadShopAsset, slugifyShopName } from "../data/shop-assets";
import { getSupabase, getAccessToken } from "../auth/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { useNavigate } from "react-router";
import { saveUserProfile, getUserProfile } from "../auth/user-profile";
import { publishMyVendor } from "../data/public-vendors";
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  ArrowRight,
  Crown,
  Star,
  Package,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Truck,
  Users,
  BadgeCheck,
  Camera,
  Upload,
  MapPin,
  Phone,
  Mail,
  FileText,
  BarChart3,
  Globe,
  Zap,
  MessageSquare,
  Gift,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { IMAGES } from "./mock-data";
import { CouponStrip } from "./promo-widgets";

/* ═══════════════════════════════════════════
   MOCK TESTIMONIALS
   ═══════════════════════════════════════════ */
const testimonials = [
  {
    name: "Mama Tokpa",
    role: "Alimentaire · Cotonou",
    avatar: IMAGES.entrepreneur,
    quote: "Depuis que je suis sur IPPOO, mes commandes ont triplé. Les acheteurs de gros me trouvent directement et le paiement est sécurisé.",
    rating: 5,
    revenue: "3.2M FCFA/mois",
  },
  {
    name: "TechGros Bénin",
    role: "Électronique · Cotonou",
    avatar: IMAGES.electronics,
    quote: "La visibilité sur IPPOO est incomparable. Je reçois des commandes de tout le Bénin et même de la sous-région.",
    rating: 5,
    revenue: "5.8M FCFA/mois",
  },
  {
    name: "ProClean SARL",
    role: "Hygiène · Porto-Novo",
    avatar: IMAGES.hygiene,
    quote: "Le paiement protégé IPPOO m'a permis de travailler sereinement avec de nouveaux clients. Zéro impayé depuis 8 mois.",
    rating: 4,
    revenue: "2.1M FCFA/mois",
  },
];

const advantages = [
  { icon: Globe, title: "Visibilité nationale", desc: "Soyez trouvé par des acheteurs de tout le Bénin et de la sous-région", color: "#3B82F6" },
  { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Paiement protégé : recevez vos fonds après livraison confirmée", color: "#16A34A" },
  { icon: Users, title: "Clients qualifiés", desc: "Acheteurs de gros, groupements, distributeurs, pas du détail", color: "#E11D2E" },
  { icon: BarChart3, title: "Tableau de bord", desc: "Statistiques de vente, suivi de commandes, gestion de stock", color: "#F97316" },
  { icon: Truck, title: "Logistique simplifiée", desc: "Réseau de livraison IPPOO ou vos propres moyens", color: "#7C3AED" },
  { icon: Crown, title: "Programme VIP vendeur", desc: "Commissions réduites, badges, support prioritaire", color: "#E8A817" },
  { icon: MessageSquare, title: "Messagerie intégrée", desc: "Négociez directement avec vos acheteurs dans l'app", color: "#EC4899" },
  { icon: Gift, title: "Promos & Marketing", desc: "Outils promo intégrés : flash sales, coupons, jours de marché", color: "#059669" },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Gratuit",
    color: "#16A34A",
    features: ["Jusqu'à 20 produits", "Commission 8%", "Support email", "Badge basique"],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    price: "15 000 FCFA/mois",
    color: "#3B82F6",
    features: ["Produits illimités", "Commission 5%", "Support prioritaire", "Badge Pro vérifié", "Analytics avancés", "Promos personnalisées"],
    cta: "Essai gratuit 30 jours",
    popular: true,
  },
  {
    name: "VIP",
    price: "45 000 FCFA/mois",
    color: "#E8A817",
    features: ["Produits illimités", "Commission 3%", "Support dédié 24/7", "Badge VIP Gold", "Analytics premium", "Place en Jours de Marché", "Boost de visibilité", "Accès groupements"],
    cta: "Devenir VIP",
    popular: false,
  },
];

/* ═══════════════════════════════════════════
   REGISTRATION FORM
   ═══════════════════════════════════════════ */
function RegistrationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState<string>("");
  const [banner, setBanner] = useState<string>("");
  // Bufferisé en mémoire jusqu'à création du compte
  const [logoBuf, setLogoBuf] = useState<string>("");
  const [bannerBuf, setBannerBuf] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  async function handleFile(kind: "logo" | "banner", file: File | undefined | null) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast.error("Veuillez choisir une image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image trop lourde (max 8 Mo)"); return; }
    try {
      setUploading(kind);
      const dataUrl = await fileToCompressedDataUrl(file, kind === "banner" ? 1600 : 512);
      // Aperçu immédiat + buffer pour upload après création du compte
      if (kind === "logo") { setLogo(dataUrl); setLogoBuf(dataUrl); }
      else { setBanner(dataUrl); setBannerBuf(dataUrl); }
      toast.success(kind === "logo" ? "Logo prêt (envoi à la création)" : "Bannière prête (envoi à la création)");
    } catch (e) {
      logger.warn(`Branding upload error (${kind}): ${e}`);
      toast.error(`Lecture échouée : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setUploading(null);
    }
  }

  async function submitRegistration() {
    if (!email.trim() || !password.trim()) { toast.error("Email et mot de passe requis (étape 1)"); setStep(1); return; }
    if (password.length < 6) { toast.error("Mot de passe d'au moins 6 caractères"); setStep(1); return; }
    if (!shopName.trim()) { toast.error("Nom de boutique requis (étape 1)"); setStep(1); return; }
    setSubmitting(true);
    try {
      // 1) Création du compte côté serveur (email auto-confirmé)
      const signupRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cc347259/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password, name: fullName }),
      });
      if (!signupRes.ok) {
        const { error } = await signupRes.json().catch(() => ({ error: "Inscription échouée" }));
        throw new Error(error || "Inscription échouée");
      }
      // 2) Signin pour obtenir une session
      const { error: signinErr } = await getSupabase().auth.signInWithPassword({ email, password });
      if (signinErr) throw new Error(`Connexion échouée : ${signinErr.message}`);
      // 3) Upload des assets bufferisés en propriétaire authentifié
      const slug = slugifyShopName(shopName);
      if (logoBuf) await uploadShopAsset(slug, "logo", logoBuf);
      if (bannerBuf) await uploadShopAsset(slug, "banner", bannerBuf);
      const token = await getAccessToken();
      // 4) Persiste localement le profil vendeur pour débloquer /boutique immédiatement
      const existing = getUserProfile();
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      saveUserProfile({
        ...(existing ?? {}),
        accountType: existing?.accountType && existing.accountType !== "acheteur"
          ? existing.accountType
          : "vendeur_individuel",
        firstName: firstName || existing?.firstName || "Vendeur",
        lastName: rest.join(" ") || existing?.lastName || "",
        email: email.trim(),
        phone: existing?.phone || "",
        businessName: shopName.trim(),
        logo: logoBuf || existing?.logo,
        shopPhoto: bannerBuf || existing?.shopPhoto,
        shopStatus: existing?.shopStatus ?? "open",
      });
      // 5) Publie le vendeur côté annuaire public (best-effort, ne bloque pas la navigation)
      publishMyVendor({
        name: shopName.trim(),
        logo: logoBuf || undefined,
        shopPhoto: bannerBuf || undefined,
        accountType: "vendeur_individuel",
        shopStatus: "open",
        createdAt: Date.now(),
      }).catch(() => undefined);
      toast.success(`🎉 Compte vendeur créé${token ? " · branding synchronisé ☁️" : ""}. Vérification sous 24-72h.`);
      onSuccess();
    } catch (e) {
      logger.warn(`Registration submit error: ${e}`);
      toast.error(`${e instanceof Error ? e.message : "Erreur d'inscription"}`);
    } finally {
      setSubmitting(false);
    }
  }
  const TOTAL = 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Inscription vendeur, Étape {step}/{TOTAL}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#E8A817" : "#E5E7EB" }} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Informations de base</h4>
              <input type="text" placeholder="Nom de la boutique" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <input type="text" placeholder="Nom complet du gérant" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <input type="tel" placeholder="Téléphone (+229)" className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <input type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                Votre compte sera créé à l'étape finale ; vous pourrez gérer votre branding depuis n'importe quel appareil.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Votre activité</h4>
              <select className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }}>
                <option>Catégorie principale</option>
                <option>Alimentaire & Vivrier</option>
                <option>Textile & Mode</option>
                <option>Beauté & Cosmétiques</option>
                <option>Électronique</option>
                <option>Hygiène & Entretien</option>
                <option>Boissons</option>
                <option>Matériaux de construction</option>
                <option>Multi-catégories</option>
              </select>
              <select className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }}>
                <option>Type de profil</option>
                <option>Producteur</option>
                <option>Transformateur</option>
                <option>Distributeur / Revendeur</option>
                <option>Vendeur de gros</option>
                <option>Grossiste</option>
              </select>
              <input type="text" placeholder="Localisation / Marché principal" className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
              <textarea placeholder="Description de votre activité (spécialités, capacités, expérience...)" rows={3} className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none resize-none" style={{ fontSize: 13 }} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Brandez votre boutique</h4>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Logo et bannière s'afficheront sur votre espace boutique. Vous pouvez les modifier plus tard.
              </p>

              {/* Aperçu live façon boutique */}
              <div className="rounded-2xl overflow-hidden border border-border">
                <div className="relative h-28 bg-gradient-to-br from-[#E8A817] to-[#F97316]">
                  {banner && <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <button
                    type="button"
                    onClick={() => bannerInput.current?.click()}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur flex items-center gap-1.5"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    <Camera className="w-3.5 h-3.5" /> {banner ? "Changer bannière" : "Bannière"}
                  </button>
                </div>
                <div className="relative px-3 pb-3 -mt-8">
                  <button
                    type="button"
                    onClick={() => logoInput.current?.click()}
                    className="relative w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#E8A817,#F97316)" }}
                    aria-label="Téléverser le logo"
                  >
                    {logo
                      ? <img src={logo} alt="" className="w-full h-full object-cover" />
                      : <Store className="w-6 h-6 text-white" />
                    }
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center border-2 border-white">
                      <Camera className="w-2.5 h-2.5" />
                    </span>
                  </button>
                  <p className="mt-2" style={{ fontSize: 13, fontWeight: 800, fontFamily: "Poppins" }}>
                    {shopName || "Nom de votre boutique"}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Aperçu de votre espace
                  </p>
                </div>
              </div>

              <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => handleFile("logo", e.target.files?.[0])} />
              <input ref={bannerInput} type="file" accept="image/*" hidden onChange={(e) => handleFile("banner", e.target.files?.[0])} />

              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={uploading === "logo"} onClick={() => logoInput.current?.click()} className="py-2.5 rounded-xl border border-border flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ fontSize: 12, fontWeight: 700 }}>
                  <Upload className="w-3.5 h-3.5" /> {uploading === "logo" ? "Envoi…" : logo ? "Changer logo" : "Téléverser logo"}
                </button>
                <button type="button" disabled={uploading === "banner"} onClick={() => bannerInput.current?.click()} className="py-2.5 rounded-xl border border-border flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ fontSize: 12, fontWeight: 700 }}>
                  <Upload className="w-3.5 h-3.5" /> {uploading === "banner" ? "Envoi…" : banner ? "Changer bannière" : "Téléverser bannière"}
                </button>
              </div>
              <p className="text-muted-foreground text-center" style={{ fontSize: 10 }}>
                Logo : carré, ≥ 256px · Bannière : paysage, ≥ 1200×400 · 8 Mo max
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Documents de vérification</h4>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Pour protéger les acheteurs et renforcer votre crédibilité, nous vérifions votre identité.
              </p>
              {[
                { label: "Pièce d'identité (CNI/Passeport)", required: true },
                { label: "Registre de commerce (RCCM)", required: false },
                { label: "IFU / Numéro fiscal", required: false },
                { label: "Photo de votre commerce / stock", required: true },
              ].map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-xl">
                  <Upload className="w-5 h-5 text-[#E8A817]" />
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{doc.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 10 }}>{doc.required ? "Requis" : "Optionnel (recommandé)"}</p>
                  </div>
                  <button className="px-3 py-1 bg-white rounded-lg border border-border" style={{ fontSize: 11, fontWeight: 600 }}>
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Choisissez votre plan</h4>
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className="relative rounded-xl p-3 border-2 cursor-pointer"
                  style={{ borderColor: plan.popular ? plan.color : "#E5E7EB" }}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 800, background: plan.color }}>
                      RECOMMANDÉ
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: plan.color }}>{plan.name}</h5>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{plan.price}</p>
                    </div>
                    <input type="radio" name="plan" defaultChecked={plan.popular} className="w-5 h-5" style={{ accentColor: plan.color }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plan.features.slice(0, 3).map((f, j) => (
                      <span key={j} className="px-2 py-0.5 bg-[#F3F4F6] rounded-lg" style={{ fontSize: 9, fontWeight: 500 }}>
                        {f}
                      </span>
                    ))}
                    {plan.features.length > 3 && (
                      <span className="px-2 py-0.5 bg-[#F3F4F6] rounded-lg text-muted-foreground" style={{ fontSize: 9, fontWeight: 500 }}>
                        +{plan.features.length - 3} avantages
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-border"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Retour
              </button>
            )}
            {step < TOTAL ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-xl text-white bg-[#E8A817]"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Suivant
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={submitRegistration}
                className="flex-1 py-3 rounded-xl text-white bg-gradient-to-r from-[#E8A817] to-[#F97316] flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
              >
                <Store className="w-4 h-4" /> {submitting ? "Création…" : "Créer ma boutique"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export function DevenirVendeurPage() {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const isSellerAccount = !!userProfile && userProfile.accountType !== "acheteur";
  const [showRegistration, setShowRegistration] = useState(false);

  // Si le compte est déjà vendeur, on redirige directement vers la boutique.
  useEffect(() => {
    if (isSellerAccount) {
      navigate("/boutique", { replace: true });
    }
  }, [isSellerAccount, navigate]);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
          Devenir vendeur
        </h3>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={IMAGES.entrepreneur} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#E8A817]/95 to-[#F97316]/85" />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(255,255,255,0.03) 12px, rgba(255,255,255,0.03) 24px)" }} />

        <div className="relative z-10 px-4 py-8 sm:py-12 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, lineHeight: "28px" }}>
              Vendez en gros<br />sur IPPOO Market
            </h1>
            <p className="text-white/80 max-w-md mx-auto mb-5" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Rejoignez des centaines de vendeurs. Publiez vos produits, recevez des commandes en volume, sécurisez vos paiements.
            </p>
            <button
              onClick={() => setShowRegistration(true)}
              className="px-8 py-3 bg-white text-[#E8A817] rounded-xl active:scale-95 transition-transform"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
            >
              Commencer maintenant <ArrowRight className="inline w-5 h-5 ml-1" />
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">
        {/* Stats band */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "420+", label: "Vendeurs", color: "#E8A817" },
            { value: "6.8k", label: "Produits", color: "#16A34A" },
            { value: "34%", label: "Conversion", color: "#3B82F6" },
            { value: "72%", label: "Fidélisation", color: "#E11D2E" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-2.5 text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: s.color }}>{s.value}</p>
              <p className="text-muted-foreground" style={{ fontSize: 9 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            <Zap className="w-5 h-5 text-[#E8A817]" /> Comment ça marche
          </h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Inscrivez-vous", desc: "Renseignez vos informations et téléversez vos documents", color: "#E8A817", icon: FileText },
              { step: 2, title: "Vérification sous 24-72h", desc: "Notre équipe vérifie votre profil pour protéger la communauté", color: "#3B82F6", icon: ShieldCheck },
              { step: 3, title: "Publiez vos produits", desc: "Photos, prix par palier, MOQ, conditions, tout est structuré", color: "#16A34A", icon: Package },
              { step: 4, title: "Recevez des commandes", desc: "Clients qualifiés, paiement sécurisé, notifications en temps réel", color: "#E11D2E", icon: TrendingUp },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.step * 0.1 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: item.color }}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 700 }}>ÉTAPE {item.step}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Advantages grid */}
        <div>
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Pourquoi vendre sur IPPOO ?
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {advantages.map((adv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-border p-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${adv.color}15` }}>
                  <adv.icon className="w-4.5 h-4.5" style={{ color: adv.color }} />
                </div>
                <h4 style={{ fontSize: 12, fontWeight: 700 }}>{adv.title}</h4>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10, lineHeight: "14px" }}>{adv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Nos offres vendeur
          </h3>
          <div className="space-y-3">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-2xl border-2 overflow-hidden"
                style={{ borderColor: plan.popular ? plan.color : "#E5E7EB" }}
              >
                {plan.popular && (
                  <div className="py-1 text-center text-white" style={{ background: plan.color, fontSize: 10, fontWeight: 800 }}>
                    ⭐ RECOMMANDÉ, ESSAI GRATUIT 30 JOURS
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: plan.color }}>{plan.name}</h4>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{plan.price}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}15` }}>
                      {plan.name === "Starter" && <Store className="w-5 h-5" style={{ color: plan.color }} />}
                      {plan.name === "Pro" && <TrendingUp className="w-5 h-5" style={{ color: plan.color }} />}
                      {plan.name === "VIP" && <Crown className="w-5 h-5" style={{ color: plan.color }} />}
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: plan.color }} />
                        <span style={{ fontSize: 12 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="w-full py-2.5 rounded-xl text-white active:scale-95 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div>
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Ils vendent sur IPPOO
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="shrink-0 bg-white rounded-2xl border border-border p-4 w-72"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#E8A817]">
                    <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 700 }}>
                      {t.name} <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: 10 }}>{t.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-2" style={{ fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                    ))}
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-[#16A34A]/10" style={{ fontSize: 10, fontWeight: 700, color: "#16A34A" }}>
                    {t.revenue}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-gradient-to-r from-[#E8A817] to-[#F97316] rounded-2xl p-6 text-center">
          <Store className="w-12 h-12 text-white/80 mx-auto mb-3" />
          <h3 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20 }}>
            Prêt à vendre ?
          </h3>
          <p className="text-white/70 mb-4 max-w-sm mx-auto" style={{ fontSize: 12 }}>
            Inscription gratuite, 0 frais cachés. Commencez à recevoir des commandes sous 72h.
          </p>
          <button
            onClick={() => setShowRegistration(true)}
            className="bg-white text-[#E8A817] px-8 py-3 rounded-xl active:scale-95 transition-transform"
            style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
          >
            Ouvrir ma boutique <ArrowRight className="inline w-5 h-5 ml-1" />
          </button>
        </div>

        <CouponStrip
          code="VENDEUR50"
          label="Nouveau vendeur"
          discount="50% sur l'abonnement Pro le 1er mois"
          condition="Valable pour tout nouveau vendeur inscrit en mars 2026"
          color="#E8A817"
          expiry="Fin mars 2026"
        />
      </div>

      {/* Registration modal */}
      <AnimatePresence>
        {showRegistration && (
          <RegistrationModal
            onClose={() => setShowRegistration(false)}
            onSuccess={() => {
              setShowRegistration(false);
              navigate("/boutique", { replace: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}