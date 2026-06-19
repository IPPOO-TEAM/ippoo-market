import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  Users,
  ShoppingCart,
  Package,
  TrendingDown,
  Shield,
  ChevronRight,
  CheckCircle2,
  Star,
  Truck,
  ClipboardList,
  BarChart3,
  Handshake,
  Award,
  Zap,
  Heart,
  FileText,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Target,
  Layers,
  BadgeCheck,
  Percent,
  CalendarDays,
  Gift,
  Briefcase,
  HeadphonesIcon,
  Repeat,
  PieChart,
  CircleDollarSign,
  Megaphone,
  Sofa,
  Wrench,
  Monitor,
  Home,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, IMAGES } from "./mock-data";
import { CouponStrip } from "./promo-widgets";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

/* ═══════════════════════════════════════════
   IMAGES
   ═══════════════════════════════════════════ */
const CE_IMG = {
  hero: "https://images.unsplash.com/photo-1758518729685-f88df7890776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBvZmZpY2UlMjBtZWV0aW5nJTIwdGVhbSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3Mjk5ODUwMHww&ixlib=rb-4.1.0&q=80&w=1080",
  warehouse: "https://images.unsplash.com/photo-1768176136613-96a7bfc0049e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjB3aG9sZXNhbGUlMjBidWxrJTIwc3VwcGx5JTIwY2hhaW58ZW58MXx8fHwxNzcyOTk4NTAxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  team: "https://images.unsplash.com/photo-1573167101669-476636b96cea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYnVzaW5lc3MlMjB0ZWFtJTIwY29sbGFib3JhdGlvbiUyMG9mZmljZXxlbnwxfHx8fDE3NzI5OTg1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  employees: "https://images.unsplash.com/photo-1758691737487-29b4fae83e95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGVtcGxveWVlcyUyMGdyb3VwJTIwZGl2ZXJzZSUyMHdvcmtwbGFjZXxlbnwxfHx8fDE3NzI5OTkyODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  handshake: "https://images.unsplash.com/photo-1758599543152-a73184816eba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kc2hha2UlMjBidXNpbmVzcyUyMGRlYWwlMjBwYXJ0bmVyc2hpcHxlbnwxfHx8fDE3NzI5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  gifts: "https://images.unsplash.com/photo-1671749999622-4087a86868cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaWZ0JTIwYm94ZXMlMjBjb3Jwb3JhdGUlMjBwcmVzZW50JTIwaG9saWRheXxlbnwxfHx8fDE3NzI5OTkyODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  shelves: "https://images.unsplash.com/photo-1760463921652-78b38572da45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbml6ZWQlMjBzaGVsdmVzJTIwcHJvZHVjdHMlMjBzdXBlcm1hcmtldCUyMGRpc3BsYXl8ZW58MXx8fHwxNzcyOTk4NTE0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  logistics: "https://images.unsplash.com/photo-1680034977375-3d83ee017e52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGJveGVzJTIwcGFja2FnZXMlMjBsb2dpc3RpY3MlMjBvcmdhbml6ZWR8ZW58MXx8fHwxNzcyOTk4NTE1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  cart: "https://images.unsplash.com/photo-1768159067462-99258c5ae574?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9wcGluZyUyMGNhcnQlMjBncm9jZXJpZXMlMjBvcmdhbml6ZWQlMjBiYXNrZXR8ZW58MXx8fHwxNzcyOTk5Mjg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ═══════════════════════════════════════════ */
const P = "#4338CA";
const PL = "#EEF2FF";
const A1 = "#0EA5E9";
const A2 = "#16A34A";
const GOLD = "#E8A817";
const RED = "#E11D2E";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const stats = [
  { value: "47", label: "CE partenaires", icon: Building2, color: P },
  { value: "12 000+", label: "Membres servis", icon: Users, color: A1 },
  { value: "-25%", label: "Économies moy.", icon: TrendingDown, color: A2 },
  { value: "98%", label: "Satisfaction", icon: Star, color: GOLD },
];

const ceTypes: { icon: LucideIcon; name: string; color: string }[] = [
  { icon: Building2, name: "Comités d'entreprise", color: P },
  { icon: Users, name: "Amicales du personnel", color: A1 },
  { icon: Handshake, name: "Associations internes", color: A2 },
  { icon: Briefcase, name: "Coopératives", color: "#7C3AED" },
  { icon: Shield, name: "Syndicats & Mutuelles", color: "#EC4899" },
  { icon: Megaphone, name: "Groupements associatifs", color: "#F97316" },
];

const advantages: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: TrendingDown, title: "Prix négociés en volume", desc: "Jusqu'à -30% sur le catalogue grâce à la puissance d'achat collective.", color: RED },
  { icon: Package, title: "Catégories adaptées", desc: "Alimentaire, hygiène, textile, équipements, calibré pour vos membres.", color: "#F97316" },
  { icon: ClipboardList, title: "Gestion structurée", desc: "Tableau de bord dédié : commandes, budgets, historiques, rapports.", color: P },
  { icon: Truck, title: "Livraison organisée", desc: "Points de retrait internes ou livraison planifiée sur site.", color: A2 },
  { icon: Shield, title: "Conformité garantie", desc: "Facturation conforme, traçabilité et compatibilité comptable.", color: "#7C3AED" },
  { icon: Heart, title: "Avantages visibles", desc: "Économies réelles, produits utiles, satisfaction des membres.", color: "#EC4899" },
  { icon: HeadphonesIcon, title: "Référent dédié", desc: "Un interlocuteur unique pour accompagner votre structure.", color: A1 },
  { icon: Repeat, title: "Commandes récurrentes", desc: "Programmez des approvisionnements automatiques mensuels.", color: GOLD },
];

const howItWorks = [
  { step: 1, title: "Inscription", desc: "Formulaire en ligne. Validation sous 48h.", icon: FileText, color: P },
  { step: 2, title: "Catalogue personnalisé", desc: "Catégories et prix adaptés à votre volume.", icon: Layers, color: A1 },
  { step: 3, title: "Commandes groupées", desc: "Collectez les besoins et commandez en lot.", icon: ShoppingCart, color: "#F97316" },
  { step: 4, title: "Livraison & Distribution", desc: "Réception et distribution à vos membres.", icon: Truck, color: A2 },
];

const categories = [
  { name: "Alimentaire", icon: Package, color: RED, products: 18, discount: "20-30%" },
  { name: "Hygiène", icon: Shield, color: A2, products: 12, discount: "15-25%" },
  { name: "Beauté", icon: Heart, color: "#EC4899", products: 14, discount: "18-28%" },
  { name: "Boissons", icon: Zap, color: "#F97316", products: 10, discount: "15-22%" },
  { name: "Textile", icon: Layers, color: GOLD, products: 10, discount: "20-35%" },
  { name: "Électronique", icon: Zap, color: "#3B82F6", products: 8, discount: "12-22%" },
  { name: "Équipements", icon: Target, color: "#7C3AED", products: 6, discount: "15-25%" },
  { name: "Matériaux", icon: Package, color: "#78716C", products: 6, discount: "10-18%" },
  { name: "Mobilier", icon: Sofa, color: "#0D9488", products: 8, discount: "15-28%" },
  { name: "Biens d'équip.", icon: Wrench, color: "#6366F1", products: 10, discount: "12-25%" },
  { name: "Bureau", icon: Monitor, color: "#2563EB", products: 9, discount: "15-22%" },
  { name: "Maison", icon: Home, color: "#D97706", products: 12, discount: "18-30%" },
  { name: "Hommes", icon: UserCircle, color: "#1E40AF", products: 10, discount: "15-25%" },
  { name: "Femmes", icon: UserCircle, color: "#DB2777", products: 14, discount: "18-30%" },
];

const useCases = [
  { icon: CalendarDays, title: "Approvisionnement mensuel", desc: "Produits de première nécessité pour les foyers de vos membres : riz, huile, sucre, savons.", color: RED },
  { icon: Gift, title: "Campagnes de fin d'année", desc: "Paniers cadeaux, lots festifs, produits de fête à prix négociés pour vos collaborateurs.", color: GOLD },
  { icon: Briefcase, title: "Fournitures", desc: "Papeterie, hygiène bureau, consommables, commandez en gros pour votre organisation.", color: P },
  { icon: Star, title: "Récompenses & Incentives", desc: "Bons d'achat, lots d'honneur, packs cadeaux pour vos événements internes.", color: "#EC4899" },
  { icon: Package, title: "Rentrée scolaire", desc: "Kits scolaires, fournitures, uniformes, aidez vos membres à préparer la rentrée.", color: "#3B82F6" },
  { icon: Truck, title: "Événements d'entreprise", desc: "Boissons, snacks, décoration, goodies, tout pour vos team buildings et célébrations.", color: "#F97316" },
];

const testimonials = [
  { name: "CE Banque Atlantique", role: "450 membres · Cotonou", quote: "Nos membres ont accès à des produits de première nécessité à des prix imbattables. L'organisation est impeccable.", rating: 5, savings: "2.4M FCFA/an", color: P },
  { name: "Amicale SBEE", role: "280 membres · National", quote: "La centrale d'achat IPPOO a transformé notre fonctionnement. Nos campagnes de fin d'année sont un vrai service apprécié.", rating: 5, savings: "1.8M FCFA/an", color: A1 },
  { name: "CE Port Autonome", role: "620 membres · Cotonou", quote: "Plus de 600 membres, des commandes groupées fluides et un tableau de bord qui fait gagner un temps énorme.", rating: 5, savings: "3.1M FCFA/an", color: A2 },
  { name: "Coopérative SONEB", role: "340 membres · Porto-Novo", quote: "Nos collaborateurs sont ravis des économies réalisées. Le référent dédié IPPOO comprend nos contraintes.", rating: 5, savings: "2.0M FCFA/an", color: GOLD },
];

const partnerCEs = [
  "Banque Atlantique", "SBEE", "Port Autonome", "SONEB", "Bénin Télécom",
  "Moov Africa", "MTN Bénin", "CNSS", "BOA Bénin", "Société Générale",
  "Ecobank", "SOBEMAP",
];

const faqItems = [
  { q: "Qui peut s'inscrire ?", a: "Tout CE, amicale, association interne, coopérative ou structure représentant un groupe organisé." },
  { q: "Nombre minimum de membres ?", a: "Pas de minimum strict. Meilleures conditions à partir de 30 membres actifs." },
  { q: "Comment sont calculés les prix ?", a: "Prix négociés selon le volume. Plus vous commandez, plus les remises augmentent. Tarifs transparents." },
  { q: "Engagement obligatoire ?", a: "Aucun. Commandez quand vous voulez : mensuel, trimestriel ou ponctuel." },
  { q: "Comment se fait la livraison ?", a: "Point de retrait interne ou livraison sur site selon vos quantités." },
  { q: "Peut-on personnaliser les packs ?", a: "Oui, créez vos propres packs adaptés aux besoins spécifiques de vos membres." },
  { q: "Y a-t-il un référent dédié ?", a: "Oui, chaque CE partenaire dispose d'un interlocuteur unique pour l'accompagnement." },
];

const savingsData = [
  { members: "50", monthly: "425 000", annual: "5 100 000" },
  { members: "150", monthly: "1 200 000", annual: "14 400 000" },
  { members: "300", monthly: "2 250 000", annual: "27 000 000" },
  { members: "500+", monthly: "3 750 000", annual: "45 000 000" },
];

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export function ComiteEntreprisePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <Building2 className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Comités d'Entreprise</h1>
        </div>
        <button onClick={() => navigate("/comite-entreprise/approvisionnement")} className="px-3 py-1.5 rounded-lg" style={{ background: P, fontSize: 12, fontWeight: 700, color: "#FFF" }}>
          Mon Espace CE
        </button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <ImageWithFallback src={CE_IMG.hero} alt="CE" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(67,56,202,0.88) 0%, rgba(14,165,233,0.75) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 self-start mb-2.5">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>PROGRAMME CE & AMICALES</span>
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#FFF", lineHeight: 1.15, marginBottom: 4 }}>
            Nos Centrales d'achat<br/>internes pour vous
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.4, maxWidth: 320 }}>
            Approvisionnement en gros organisé, prix négociés, gestion structurée, au cœur de votre organisation.
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s, i) => {
            const SIcon = s.icon;
            return (
              <div key={i} className="rounded-xl py-3 px-2 text-center" style={{ background: "#FFF" }}>
                <SIcon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.2 }}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Intro */}
        <div className="rounded-xl p-4" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            Vous représentez un <span style={{ fontWeight: 700 }}>groupe de personnes</span> et vous cherchez une solution simple pour offrir à vos membres des avantages concrets ? IPPOO transforme des <span style={{ fontWeight: 700, color: P }}>besoins dispersés en volumes</span>, et des volumes en meilleures conditions, avec une logique qui profite à tout le monde.
          </p>
        </div>

        {/* Who is this for */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5" style={{ color: P }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Pour qui ?</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ceTypes.map((t, i) => {
              const TIcon = t.icon;
              return (
                <div key={i} className="rounded-xl py-3.5 px-2 text-center" style={{ background: "#FFF" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: `${t.color}10` }}>
                    <TIcon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", lineHeight: 1.25 }}>{t.name}</p>
                </div>
              );
            })}
          </div>
        </section>

        <CouponStrip code="CE-IPPOO" discount="-15% 1ère commande CE" color={P} />

        {/* Advantages, 2 col grid */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5" style={{ color: GOLD }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Vos avantages</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {advantages.map((adv, i) => {
              const AIcon = adv.icon;
              return (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "#FFF", borderLeft: `4px solid ${adv.color}` }}>
                  <AIcon className="w-5 h-5 mb-1.5" style={{ color: adv.color }} />
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E", lineHeight: 1.2, marginBottom: 3 }}>{adv.title}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{adv.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5" style={{ color: A1 }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Comment ça marche</span>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#FFF" }}>
            <div className="relative">
              <div className="absolute left-[20px] top-[22px] bottom-[22px] w-0.5" style={{ background: "#E5E7EB" }} />
              <div className="space-y-4">
                {howItWorks.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <div key={s.step} className="flex items-start gap-3.5 relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10" style={{ background: `${s.color}12`, border: `2px solid ${s.color}` }}>
                        <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: s.color }}>{s.step}</span>
                      </div>
                      <div className="min-w-0 pt-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <SIcon className="w-4 h-4" style={{ color: s.color }} />
                          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>{s.title}</p>
                        </div>
                        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Image: warehouse */}
        <div className="rounded-xl overflow-hidden relative" style={{ height: 140 }}>
          <ImageWithFallback src={CE_IMG.warehouse} alt="Entrepôt" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 100%)" }} />
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ maxWidth: 220 }}>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#FFF", lineHeight: 1.2 }}>Votre place dans la chaîne est puissante</p>
            <p className="mt-1" style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Besoins dispersés → volumes → meilleures conditions.</p>
          </div>
        </div>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" style={{ color: "#F97316" }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Catégories disponibles</span>
            </div>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{categories.reduce((a, c) => a + c.products, 0)} produits</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat, i) => {
              const CIcon = cat.icon;
              return (
                <div key={i} className="rounded-xl py-3 px-2 text-center" style={{ background: "#FFF" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: `${cat.color}10` }}>
                    <CIcon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                  </div>
                  <p className="truncate" style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E" }}>{cat.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: A2 }}>{cat.discount}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5" style={{ color: P }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Cas d'usage</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {useCases.map((uc, i) => {
              const UCIcon = uc.icon;
              return (
                <div key={i} className="rounded-xl p-3.5 flex gap-2.5 items-start" style={{ background: "#FFF" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${uc.color}10` }}>
                    <UCIcon className="w-4.5 h-4.5" style={{ color: uc.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: "#1A1A2E", lineHeight: 1.25, marginBottom: 2 }}>{uc.title}</p>
                    <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.35 }}>{uc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Approvisionnement */}
        <button
          onClick={() => navigate("/comite-entreprise/approvisionnement")}
          className="w-full rounded-xl p-4 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${P}, ${A1})` }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#FFF" }}>Espace Approvisionnement CE</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Catalogue, packs, commandes, tableau de bord</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>

        {/* Savings simulator */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5" style={{ color: A2 }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Simulateur d'économies</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "#FFF" }}>
            <div className="grid grid-cols-3 text-center py-2.5" style={{ background: `${A2}10`, fontSize: 11, fontWeight: 700, color: "#374151" }}>
              <span>Membres</span><span>Économie/mois</span><span>Économie/an</span>
            </div>
            {savingsData.map((row, i) => (
              <div key={i} className="grid grid-cols-3 text-center py-3 border-t border-gray-50">
                <span style={{ fontSize: 14, fontWeight: 700, color: P }}>{row.members}</span>
                <span style={{ fontSize: 12, color: "#374151" }}>{row.monthly}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: A2 }}>{row.annual}</span>
              </div>
            ))}
            <div className="px-4 py-2.5" style={{ background: `${A2}08` }}>
              <p className="text-center" style={{ fontSize: 11, color: "#6B7280" }}>*Estimations basées sur une commande mensuelle moyenne, économies en FCFA</p>
            </div>
          </div>
        </section>

        {/* Image: gifts */}
        <div className="rounded-xl overflow-hidden relative" style={{ height: 130 }}>
          <ImageWithFallback src={CE_IMG.gifts} alt="Cadeaux CE" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(232,168,23,0.8), rgba(249,115,22,0.7))" }} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <Gift className="w-7 h-7 text-white mx-auto mb-1.5" />
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#FFF" }}>Campagnes de fin d'année</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>Paniers cadeaux, lots festifs, prix CE exclusifs</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5" style={{ color: GOLD }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Ils nous font confiance</span>
          </div>
          <div className="space-y-2.5">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "#FFF", borderLeft: `4px solid ${t.color}` }}>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#E8A817]" style={{ color: "#E8A817" }} />
                  ))}
                </div>
                <p className="mb-3" style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>{t.role}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 700, color: A2, background: `${A2}10` }}>
                    {t.savings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner CE strip */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-5 h-5" style={{ color: P }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>CE partenaires</span>
          </div>
          <div className="rounded-xl p-3.5 flex flex-wrap gap-2" style={{ background: "#FFF" }}>
            {partnerCEs.map((ce, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg" style={{ fontSize: 12, fontWeight: 600, color: P, background: PL }}>
                {ce}
              </span>
            ))}
          </div>
        </section>

        {/* Image: team */}
        <div className="rounded-xl overflow-hidden relative" style={{ height: 130 }}>
          <ImageWithFallback src={CE_IMG.employees} alt="Équipe" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(67,56,202,0.75), rgba(14,165,233,0.65))" }} />
          <div className="absolute inset-0 flex items-center p-4">
            <div>
              <HeadphonesIcon className="w-6 h-6 text-white mb-1.5" />
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#FFF", lineHeight: 1.2 }}>Un référent dédié</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>Votre interlocuteur unique pour un accompagnement personnalisé.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" style={{ color: P }} />
            <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Questions fréquentes</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "#FFF" }}>
            {faqItems.map((faq, i) => (
              <div key={i} className={i > 0 ? "border-t border-gray-100" : ""}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" style={{ color: P }} />
                  <span className="flex-1" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 shrink-0 text-gray-400 ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3.5 pt-0 pl-12">
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact + CTA */}
        <div className="rounded-xl p-4" style={{ background: "#FFF" }}>
          <p className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Rejoindre le programme</p>
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4" style={{ color: P }} />
              <p style={{ fontSize: 13, color: "#374151" }}>+229 97 00 00 00</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" style={{ color: P }} />
              <p style={{ fontSize: 13, color: "#374151" }}>ce@ippoo-market.com</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" style={{ color: P }} />
              <p style={{ fontSize: 13, color: "#374151" }}>Lun-Ven : 8h - 18h</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate("/comite-entreprise/inscription")}
              className="flex-1 py-3 rounded-xl text-white"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg, ${A2}, #059669)` }}
            >
              Inscrire mon CE
            </button>
            <button
              onClick={() => navigate("/comite-entreprise/approvisionnement")}
              className="flex-1 py-3 rounded-xl border-2"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14, borderColor: P, color: P }}
            >
              Espace CE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CE REGISTRATION PAGE
   ═══════════════════════════════════════════ */
export function CERegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    structureName: "", structureType: "", sector: "", city: "",
    memberCount: "", contactName: "", contactRole: "", phone: "", email: "",
    categories: [] as string[],
    frequency: "", deliveryMode: "", budget: "", notes: "",
  });

  const structureTypes = ["Comité d'entreprise", "Amicale du personnel", "Association interne", "Coopérative", "Syndicat", "Mutuelle", "Autre"];
  const categoryOptions = ["Alimentaire & Vivrier", "Boissons", "Hygiène & Entretien", "Beauté & Cosmétiques", "Textile & Mode", "Électronique", "Équipements", "Matériaux", "Mobilier", "Équipements", "Bureau", "Maison", "Hommes", "Femmes"];
  const frequencies = ["Hebdomadaire", "Bi-mensuel", "Mensuel", "Trimestriel", "Ponctuel"];
  const deliveryModes = ["Point de retrait interne", "Livraison sur site", "Retrait entrepôt IPPOO", "Mixte"];
  const budgets = ["< 500 000 FCFA/mois", "500K - 1M FCFA/mois", "1M - 3M FCFA/mois", "3M - 5M FCFA/mois", "> 5M FCFA/mois"];

  const totalSteps = 4;
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  };

  const handleSubmit = () => {
    if (!form.structureName.trim() || !form.contactName.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Champs obligatoires manquants (structure, contact, téléphone, email)");
      return;
    }
    const ref = `CE-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    try {
      const raw = safeGetItem("ippoo:ce-requests");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ ref, ...form, createdAt: Date.now(), status: "pending" });
      safeSetItem("ippoo:ce-requests", JSON.stringify(list));
    } catch { /* quota */ }
    setSubmitted({ ref });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FFF7ED" }}>
        <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center" style={{ border: `1px solid ${PL}` }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${A2}15` }}>
            <CheckCircle2 className="w-9 h-9" style={{ color: A2 }} />
          </div>
          <h2 className="mt-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>Inscription en cours de validation</h2>
          <p className="mt-2" style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
            Votre demande <strong style={{ color: P }}>{submitted.ref}</strong> a bien été reçue.<br/>
            Notre équipe partenariats CE vous contactera sous <strong>48 heures ouvrées</strong> par téléphone ou email pour finaliser votre activation.
          </p>
          <div className="mt-4 rounded-xl p-3 text-left" style={{ background: PL }}>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: P, marginBottom: 6 }}>Prochaines étapes</p>
            <ul className="space-y-1.5" style={{ fontSize: 12, color: "#374151" }}>
              <li>• Appel de validation du référent CE</li>
              <li>• Signature de la convention partenariat</li>
              <li>• Activation de votre espace dédié</li>
              <li>• Première commande groupée planifiée</li>
            </ul>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => navigate("/comite-entreprise")} className="flex-1 py-3 rounded-xl text-white" style={{ background: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
              Retour CE
            </button>
            <button onClick={() => navigate("/")} className="flex-1 py-3 rounded-xl border-2" style={{ borderColor: "#E5E7EB", fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#6B7280" }}>
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Inscription CE</h1>
        </div>
        <span className="px-3 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 700, color: P, background: PL }}>Étape {step}/{totalSteps}</span>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < step ? P : "#E5E7EB" }} />
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5" style={{ color: P }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Votre structure</span>
            </div>
            <InputField label="Nom de la structure *" value={form.structureName} onChange={v => setForm({...form, structureName: v})} placeholder="Ex: CE Banque Atlantique" />
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Type de structure *</label>
              <div className="flex flex-wrap gap-2">
                {structureTypes.map(t => (
                  <button key={t} onClick={() => setForm({...form, structureType: t})} className="py-2 px-3.5 rounded-xl" style={{ fontSize: 13, background: form.structureType === t ? `${P}12` : "#FFF", border: form.structureType === t ? `2px solid ${P}` : "1px solid #E5E7EB", fontWeight: form.structureType === t ? 700 : 400, color: form.structureType === t ? P : "#374151" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <InputField label="Secteur d'activité" value={form.sector} onChange={v => setForm({...form, sector: v})} placeholder="Bancaire, Énergie, Portuaire..." />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Ville *" value={form.city} onChange={v => setForm({...form, city: v})} placeholder="Cotonou" />
              <InputField label="Nb. de membres *" value={form.memberCount} onChange={v => setForm({...form, memberCount: v})} placeholder="150" type="number" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" style={{ color: A1 }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Contact référent</span>
            </div>
            <InputField label="Nom complet *" value={form.contactName} onChange={v => setForm({...form, contactName: v})} placeholder="Jean-Pierre Agossou" />
            <InputField label="Fonction *" value={form.contactRole} onChange={v => setForm({...form, contactRole: v})} placeholder="Président du CE, Secrétaire..." />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Téléphone *" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="+229 97 XX XX XX" type="tel" />
              <InputField label="Email *" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="contact@structure.com" type="email" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5" style={{ color: "#F97316" }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Besoins d'approvisionnement</span>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Catégories souhaitées</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)} className="py-2 px-3 rounded-xl flex items-center gap-1.5" style={{ fontSize: 13, background: form.categories.includes(cat) ? `${P}12` : "#FFF", border: form.categories.includes(cat) ? `2px solid ${P}` : "1px solid #E5E7EB", fontWeight: form.categories.includes(cat) ? 700 : 400, color: form.categories.includes(cat) ? P : "#374151" }}>
                    {form.categories.includes(cat) && <CheckCircle2 className="w-4 h-4" style={{ color: P }} />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Fréquence</label>
              <div className="flex flex-wrap gap-2">
                {frequencies.map(f => (
                  <button key={f} onClick={() => setForm({...form, frequency: f})} className="py-2 px-3.5 rounded-xl" style={{ fontSize: 13, background: form.frequency === f ? `${A1}12` : "#FFF", border: form.frequency === f ? `2px solid ${A1}` : "1px solid #E5E7EB", fontWeight: form.frequency === f ? 700 : 400, color: form.frequency === f ? A1 : "#374151" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Budget mensuel estimé</label>
              <div className="space-y-1.5">
                {budgets.map(b => (
                  <button key={b} onClick={() => setForm({...form, budget: b})} className="w-full py-2.5 px-3.5 rounded-xl text-left" style={{ fontSize: 13, background: form.budget === b ? `${A2}10` : "#FFF", border: form.budget === b ? `2px solid ${A2}` : "1px solid #E5E7EB", fontWeight: form.budget === b ? 700 : 400, color: form.budget === b ? A2 : "#374151" }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5" style={{ color: A2 }} />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Logistique & Finalisation</span>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Mode de livraison</label>
              <div className="flex flex-wrap gap-2">
                {deliveryModes.map(d => (
                  <button key={d} onClick={() => setForm({...form, deliveryMode: d})} className="py-2 px-3.5 rounded-xl" style={{ fontSize: 13, background: form.deliveryMode === d ? `${A2}12` : "#FFF", border: form.deliveryMode === d ? `2px solid ${A2}` : "1px solid #E5E7EB", fontWeight: form.deliveryMode === d ? 700 : 400, color: form.deliveryMode === d ? A2 : "#374151" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Notes complémentaires</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Contraintes, besoins particuliers..." className="w-full rounded-xl py-3 px-4 border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 13, minHeight: 100, background: "#FFF" }} />
            </div>

            {/* Recap */}
            <div className="rounded-xl p-4" style={{ background: PL }}>
              <p className="mb-2.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: P }}>Récapitulatif</p>
              <div className="space-y-1.5">
                {form.structureName && <RL label="Structure" value={form.structureName} />}
                {form.structureType && <RL label="Type" value={form.structureType} />}
                {form.memberCount && <RL label="Membres" value={form.memberCount} />}
                {form.city && <RL label="Ville" value={form.city} />}
                {form.contactName && <RL label="Contact" value={form.contactName} />}
                {form.phone && <RL label="Tél." value={form.phone} />}
                {form.frequency && <RL label="Fréquence" value={form.frequency} />}
                {form.budget && <RL label="Budget" value={form.budget} />}
                {form.deliveryMode && <RL label="Livraison" value={form.deliveryMode} />}
              </div>
              {form.categories.length > 0 && (
                <div className="mt-2">
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Catégories : </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{form.categories.join(", ")}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl border-2" style={{ borderColor: "#E5E7EB", fontSize: 14, fontWeight: 600, color: "#6B7280" }}>
              Retour
            </button>
          )}
          <button
            onClick={() => step < totalSteps ? setStep(step + 1) : handleSubmit()}
            className="flex-1 py-3 rounded-xl text-white"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, background: step < totalSteps ? P : `linear-gradient(135deg, ${A2}, #059669)` }}
          >
            {step < totalSteps ? "Suivant" : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl py-2.5 px-4 border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 14, background: "#FFF" }} />
    </div>
  );
}

function RL({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ fontSize: 12, color: "#6B7280", minWidth: 70 }}>{label} :</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{value}</span>
    </div>
  );
}