import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Users,
  Crown,
  Shield,
  TrendingUp,
  Package,
  Truck,
  Star,
  ChevronRight,
  Search,
  BadgeCheck,
  MapPin,
  Clock,
  ShoppingCart,
  MessageSquare,
  Zap,
  Target,
  Award,
  CheckCircle2,
  Factory,
  Wheat,
  Store,
  Heart,
  BarChart3,
  Handshake,
  Layers,
  Globe,
  Phone,
  FileText,
  CircleDollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatPrice, allProducts, IMAGES } from "./mock-data";
import { ProductCard } from "./product-card";
import { CouponStrip } from "./promo-widgets";

/* ═══════════════════════════════════════════
   PROFILE IMAGES
   ═══════════════════════════════════════════ */
const PROFILE_IMAGES = {
  producer: "https://images.unsplash.com/photo-1585094659595-04a44bcba305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZmFybWVyJTIwaGFydmVzdCUyMGFncmljdWx0dXJlJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzI5MzM0MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  transformer: "https://images.unsplash.com/photo-1688240817677-d28b8e232dd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcHJvY2Vzc2luZyUyMGZhY3RvcnklMjB3b3JrZXIlMjBBZnJpY2F8ZW58MXx8fHwxNzcyOTMzNDA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  distributor: "https://images.unsplash.com/photo-1646032802776-dd2806b53eb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aG9sZXNhbGUlMjB3YXJlaG91c2UlMjBkaXN0cmlidXRpb24lMjBsb2dpc3RpY3MlMjBBZnJpY2F8ZW58MXx8fHwxNzcyOTMzNDEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  buyer: "https://images.unsplash.com/photo-1567523679978-091c7be92d6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYnVzaW5lc3MlMjB3b21hbiUyMGJ1bGslMjBidXlpbmclMjBzdG9yZXxlbnwxfHx8fDE3NzI5MzM0MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  seller: "https://images.unsplash.com/photo-1759310610325-2c7cb621e5e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYnVzaW5lc3NtYW4lMjBzdWNjZXNzJTIwaGFuZHNoYWtlJTIwZGVhbHxlbnwxfHx8fDE3NzI5MzM0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  wholesaler: IMAGES.warehouse,
  community: "https://images.unsplash.com/photo-1584365132623-e273491c69d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwdGVhbXdvcmslMjBidXNpbmVzcyUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzcyOTMzNDM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ═══════════════════════════════════════════
   PROFILE TYPES DATA
   ═══════════════════════════════════════════ */
export interface ProfileType {
  slug: string;
  name: string;
  shortName: string;
  icon: typeof Users;
  color: string;
  gradient: string;
  image: string;
  tagline: string;
  description: string;
  benefits: string[];
  cta: string;
  stats: { label: string; value: string }[];
  categories: string[];
  featuredMembers: {
    id: number;
    name: string;
    avatar: string;
    specialty: string;
    location: string;
    rating: number;
    badge: string;
    products: number;
    orders: number;
  }[];
}

const profileTypes: ProfileType[] = [
  {
    slug: "producteurs",
    name: "Producteurs",
    shortName: "Producteur",
    icon: Wheat,
    color: "#16A34A",
    gradient: "linear-gradient(135deg, #16A34A, #22C55E)",
    image: PROFILE_IMAGES.producer,
    tagline: "Faites reconnaître votre originalité, sécurisez vos débouchés, vendez mieux",
    description: "Vous cultivez, vous élevez, vous fabriquez à la base. Vous êtes à l'origine du produit, et toute la chaîne démarre avec vous. Sur IPPOO, votre place est au début, là où la valeur commence. Notre rôle : transformer votre effort en ventes plus régulières, en clients plus sérieux et en revenus mieux organisés.",
    benefits: [
      "Vitrine solide pour exposer votre production",
      "Rubriques structurées qui limitent l'amalgame",
      "Commandes de gros répétées et planifiées",
      "Partenariats durables avec des acheteurs sérieux",
      "Visibilité auprès des transformateurs et distributeurs",
      "Certification qualité et traçabilité",
    ],
    cta: "Inscrivez-vous comme producteur",
    stats: [
      { label: "Producteurs actifs", value: "340+" },
      { label: "Commandes/mois", value: "1.2k" },
      { label: "Économies acheteurs", value: "~25%" },
      { label: "Zones couvertes", value: "12" },
    ],
    categories: ["Vivrier", "Alimentaire"],
    featuredMembers: [
      { id: 1, name: "AgroNord Bénin", avatar: IMAGES.vegetables, specialty: "Céréales & Vivrier", location: "Parakou", rating: 4.7, badge: "TOP", products: 45, orders: 890 },
      { id: 2, name: "Coop Vivrier Borgou", avatar: IMAGES.tubers, specialty: "Igname & Manioc", location: "Borgou", rating: 4.6, badge: "VERIFIE", products: 28, orders: 560 },
      { id: 3, name: "Soja Gold Bénin", avatar: IMAGES.vegetables, specialty: "Soja & Oléagineux", location: "Cotonou", rating: 4.5, badge: "VIP", products: 32, orders: 720 },
    ],
  },
  {
    slug: "transformateurs",
    name: "Transformateurs",
    shortName: "Transformateur",
    icon: Factory,
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #FB923C)",
    image: PROFILE_IMAGES.transformer,
    tagline: "Donnez plus de valeur à votre production et accédez à des marchés plus larges",
    description: "Vous conditionnez, vous assemblez, vous préparez, vous améliorez. Vous faites passer un produit d'un état brut à un produit prêt à vendre. Sur IPPOO, votre insertion dans la chaîne est stratégique, parce que vous reliez la production à la distribution.",
    benefits: [
      "Espace dédié mettant en valeur votre savoir-faire",
      "Visibilité auprès des distributeurs et grossistes",
      "Commandes récurrentes de groupements d'achat",
      "Crédibilité renforcée par des conditions bien posées",
      "Planification de production stabilisée",
      "Normes et certifications mises en avant",
    ],
    cta: "Créez votre profil transformateur",
    stats: [
      { label: "Transformateurs", value: "180+" },
      { label: "Produits référencés", value: "2.4k" },
      { label: "Taux de renouvellement", value: "78%" },
      { label: "Zones de livraison", value: "8" },
    ],
    categories: ["Alimentaire", "Hygiène", "Beauté"],
    featuredMembers: [
      { id: 1, name: "MoulinsAfric", avatar: IMAGES.grocery, specialty: "Farines & Céréales", location: "Cotonou", rating: 4.4, badge: "VERIFIE", products: 18, orders: 450 },
      { id: 2, name: "DairyGros Afrique", avatar: IMAGES.grocery, specialty: "Lait & Produits laitiers", location: "Porto-Novo", rating: 4.6, badge: "TOP", products: 22, orders: 380 },
      { id: 3, name: "JusNatura Bénin", avatar: IMAGES.juices, specialty: "Jus & Boissons naturels", location: "Cotonou", rating: 4.4, badge: "VERIFIE", products: 15, orders: 290 },
    ],
  },
  {
    slug: "distributeurs",
    name: "Distributeurs & Revendeurs",
    shortName: "Distributeur",
    icon: Truck,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
    image: PROFILE_IMAGES.distributor,
    tagline: "Écoulez vite et bien, sans casser vos prix",
    description: "Vous avez déjà vos fournisseurs, vos arrivages, vos marchandises à écouler. IPPOO vous met directement en face des profils qui achètent vraiment en volume : acheteurs de gros, détaillants organisés, groupements d'achat, comités d'entreprise.",
    benefits: [
      "Positionnement direct dans l'espace gros",
      "Contact avec des clients qualifiés en volume",
      "Conditions affichées clairement (prix, MOQ, zone)",
      "Commandes répétées pour tourner votre stock",
      "Meilleure trésorerie et rentabilité",
      "Réseau de partenaires B2B élargi",
    ],
    cta: "Devenez distributeur sur IPPOO",
    stats: [
      { label: "Distributeurs", value: "260+" },
      { label: "Stock roté/mois", value: "85%" },
      { label: "Clients B2B", value: "3.2k" },
      { label: "Livraisons/jour", value: "120" },
    ],
    categories: ["Alimentaire", "Boissons", "Hygiène", "Électronique"],
    featuredMembers: [
      { id: 1, name: "Ets Ahouandjinou", avatar: IMAGES.entrepreneur, specialty: "Alimentaire & Vivrier", location: "Cotonou", rating: 4.8, badge: "VIP", products: 65, orders: 1250 },
      { id: 2, name: "ProClean SARL", avatar: IMAGES.hygiene, specialty: "Hygiène & Entretien", location: "Porto-Novo", rating: 4.5, badge: "VERIFIE", products: 42, orders: 780 },
      { id: 3, name: "Boissons du Golfe", avatar: IMAGES.beverages, specialty: "Boissons & Eau", location: "Cotonou", rating: 4.5, badge: "TOP", products: 30, orders: 620 },
    ],
  },
  {
    slug: "acheteurs",
    name: "Acheteurs de gros",
    shortName: "Acheteur",
    icon: ShoppingCart,
    color: "#E11D2E",
    gradient: "linear-gradient(135deg, #E11D2E, #F43F5E)",
    image: PROFILE_IMAGES.buyer,
    tagline: "Achetez en volume, négociez mieux, sécurisez vos quantités",
    description: "Vous travaillez en volume, vous approvisionnez une activité, un point de vente, un groupement. Sur IPPOO, vous entrez dans un espace pensé pour le gros, avec des offres construites pour des acheteurs comme vous.",
    benefits: [
      "Rubrique dédiée aux acheteurs de volume",
      "Comparaison structurée des offres grossistes",
      "Publication de demandes de volume",
      "Réponses adaptées à vos quantités",
      "Accès direct aux meilleurs vendeurs",
      "Négociation facilitée et sécurisée",
    ],
    cta: "Publiez votre besoin dès maintenant",
    stats: [
      { label: "Acheteurs actifs", value: "1.8k" },
      { label: "Demandes/mois", value: "4.5k" },
      { label: "Économies moyennes", value: "~20%" },
      { label: "Temps gagné", value: "65%" },
    ],
    categories: ["Alimentaire", "Textile", "Électronique", "Matériaux"],
    featuredMembers: [
      { id: 1, name: "Mama Adjara K.", avatar: IMAGES.entrepreneur, specialty: "Alimentaire en gros", location: "Cotonou", rating: 4.8, badge: "VIP", products: 0, orders: 2100 },
      { id: 2, name: "Ibrahim Alimentation", avatar: IMAGES.grocery, specialty: "Épicerie & Vivrier", location: "Parakou", rating: 4.6, badge: "TOP", products: 0, orders: 1450 },
      { id: 3, name: "Fatou Commerce Gén.", avatar: IMAGES.market, specialty: "Multi-catégories", location: "Bohicon", rating: 4.5, badge: "VERIFIE", products: 0, orders: 980 },
    ],
  },
  {
    slug: "vendeurs",
    name: "Vendeurs de gros",
    shortName: "Vendeur",
    icon: Store,
    color: "#E8A817",
    gradient: "linear-gradient(135deg, #E8A817, #FBBF24)",
    image: PROFILE_IMAGES.seller,
    tagline: "Vendez des volumes, élargissez votre clientèle, écoulez plus vite",
    description: "Vous avez du volume, vous gérez des arrivages, et vous cherchez des acheteurs sérieux pour écouler plus vite et travailler avec des clients récurrents. Sur IPPOO, vous êtes positionné du côté de l'approvisionnement de masse.",
    benefits: [
      "Cadre structuré pour présenter vos conditions",
      "Échange avec des clients qui parlent le gros",
      "Prix, MOQ, paliers, zones affichés clairement",
      "Partenariats et commandes répétées",
      "Stabilisation de votre activité commerciale",
      "Badge vérifié et crédibilité renforcée",
    ],
    cta: "Ouvrez votre boutique vendeur",
    stats: [
      { label: "Vendeurs actifs", value: "420+" },
      { label: "Offres publiées", value: "6.8k" },
      { label: "Taux de conversion", value: "34%" },
      { label: "Fidélisation", value: "72%" },
    ],
    categories: ["Alimentaire", "Boissons", "Beauté", "Textile", "Électronique"],
    featuredMembers: [
      { id: 1, name: "Tokpa Textiles", avatar: IMAGES.textile, specialty: "Textile & Mode", location: "Cotonou", rating: 4.9, badge: "VIP", products: 85, orders: 890 },
      { id: 2, name: "TechGros Bénin", avatar: IMAGES.electronics, specialty: "Électronique", location: "Cotonou", rating: 4.7, badge: "VIP", products: 56, orders: 430 },
      { id: 3, name: "Beauty Queen", avatar: IMAGES.cosmetics, specialty: "Beauté & Cosmétiques", location: "Cotonou", rating: 4.4, badge: "TOP", products: 38, orders: 560 },
    ],
  },
  {
    slug: "grossistes",
    name: "Grossistes",
    shortName: "Grossiste",
    icon: Layers,
    color: "#7C3AED",
    gradient: "linear-gradient(135deg, #7C3AED, #A78BFA)",
    image: PROFILE_IMAGES.wholesaler,
    tagline: "Travaillez avec méthode, protégez votre position et développez votre réseau",
    description: "Vous avez du volume, des arrivages, et vous êtes capable de livrer en quantités. L'audience IPPOO ne vient pas tester : elle cherche exactement ce que vous proposez, avec une logique de commande de gros, de réassort, et de contrat d'approvisionnement.",
    benefits: [
      "Audience qualifiée (acheteurs de gros, distributeurs)",
      "Cadre structuré pour vendre sans confusion",
      "Réseaux de partenariats durables",
      "Commandes récurrentes sécurisées",
      "Protection de votre pricing et position",
      "Analytics et suivi de performance",
    ],
    cta: "Rejoignez l'espace grossistes",
    stats: [
      { label: "Grossistes", value: "150+" },
      { label: "Volume/mois", value: "850M+" },
      { label: "Partenaires", value: "2.1k" },
      { label: "Réassort auto", value: "45%" },
    ],
    categories: ["Alimentaire", "Boissons", "Hygiène", "Matériaux", "Vivrier"],
    featuredMembers: [
      { id: 1, name: "Import Céréales Plus", avatar: IMAGES.riceBags, specialty: "Céréales import", location: "Cotonou", rating: 4.7, badge: "VIP", products: 120, orders: 2300 },
      { id: 2, name: "SucreBénin SA", avatar: IMAGES.grocery, specialty: "Sucre & Farine", location: "Cotonou", rating: 4.3, badge: "VERIFIE", products: 45, orders: 1800 },
      { id: 3, name: "MatBTP Bénin", avatar: IMAGES.cement, specialty: "Matériaux BTP", location: "Cotonou", rating: 4.6, badge: "TOP", products: 65, orders: 950 },
    ],
  },
  {
    slug: "communautes",
    name: "Communautés & Groupements",
    shortName: "Communauté",
    icon: Users,
    color: "#1E3A5F",
    gradient: "linear-gradient(135deg, #1E3A5F, #16A34A)",
    image: PROFILE_IMAGES.community,
    tagline: "Seul on achète, ensemble on négocie, on économise et on sécurise",
    description: "Vous faites partie d'un groupement, ou vous voulez en créer un. Sur IPPOO, les communautés sont de vrais groupements organisés autour d'un avantage concret : acheter mieux, obtenir des prix par volume, sécuriser des quantités, organiser la livraison.",
    benefits: [
      "Achats groupés à prix négociés par volume",
      "Organisation lisible pour tous les membres",
      "Fixation des produits, quantités, délais, conditions",
      "Suivi de commande transparent pour chaque membre",
      "Meilleurs vendeurs attirés par les volumes",
      "Plus de régularité et moins de stress",
    ],
    cta: "Explorez les communautés",
    stats: [
      { label: "Groupements", value: "6" },
      { label: "Membres total", value: "488" },
      { label: "Économies", value: "~20%" },
      { label: "Achats/mois", value: "45" },
    ],
    categories: ["Alimentaire", "Textile", "Hygiène", "Électronique", "Matériaux"],
    featuredMembers: [
      { id: 1, name: "Grp. Alimentaire Dantokpa", avatar: IMAGES.grocery, specialty: "Alimentaire & Vivrier", location: "Cotonou", rating: 4.8, badge: "ACTIF", products: 0, orders: 3400 },
      { id: 2, name: "Coop. Textile Missèbo", avatar: IMAGES.textile, specialty: "Textile & Mode", location: "Cotonou", rating: 4.9, badge: "VIP", products: 0, orders: 2100 },
      { id: 3, name: "Beauté Queens Afrique", avatar: IMAGES.cosmetics, specialty: "Beauté & Cosmétiques", location: "National", rating: 4.8, badge: "VIP", products: 0, orders: 1800 },
    ],
  },
];

/* ═══════════════════════════════════════════
   HUB PAGE, All profiles
   ═══════════════════════════════════════════ */
export function ProfilesHubPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
          Circuit de Gros IPPOO
        </h3>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F]/95 to-[#E8A817]/60" />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.02) 15px, rgba(255,255,255,0.02) 30px)" }} />
        <div className="relative z-10 px-4 pt-6 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 rounded-full bg-[#E8A817] text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800 }}>
                <Globe className="w-3 h-3" /> IPPOO MARKET
              </div>
            </div>
            <h1 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px" }}>
              Votre place dans le<br />circuit de gros
            </h1>
            <p className="text-white/70" style={{ fontSize: 12, lineHeight: 1.6 }}>
              Producteur, transformateur, distributeur, acheteur, vendeur, grossiste ou groupement, trouvez votre rôle et développez votre activité.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-3">
        {/* Profile cards */}
        {profileTypes.map((profile, i) => (
          <motion.div
            key={profile.slug}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => {
              if (profile.slug === "communautes") {
                navigate("/communautes");
              } else {
                navigate(`/profils/${profile.slug}`);
              }
            }}
            className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-0">
              {/* Left image */}
              <div className="w-24 sm:w-32 shrink-0 relative overflow-hidden">
                <img src={profile.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `${profile.color}40` }} />
              </div>

              {/* Content */}
              <div className="flex-1 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${profile.color}15` }}>
                    <profile.icon className="w-4 h-4" style={{ color: profile.color }} />
                  </div>
                  <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{profile.name}</h3>
                </div>
                <p className="text-muted-foreground line-clamp-2 mb-2" style={{ fontSize: 11, lineHeight: "15px" }}>
                  {profile.tagline}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" style={{ color: profile.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{profile.stats[0].value}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <span style={{ fontSize: 10, fontWeight: 700, color: profile.color }}>Découvrir</span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: profile.color }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <CouponStrip
          code="CIRCUIT10"
          label="B2B"
          discount="-10% nouveau membre circuit"
          condition="Valable pour tout nouveau profil professionnel créé sur IPPOO"
          color="#1E3A5F"
          expiry="Offre permanente"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DETAIL PAGE, Single profile type
   ═══════════════════════════════════════════ */
export function ProfileDetailPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const profile = profileTypes.find((p) => p.slug === type);
  const [activeSection, setActiveSection] = useState<"presentation" | "boutique" | "membres">("presentation");

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Profil non trouvé</p>
        <button onClick={() => navigate("/profils")} className="mt-4 text-[#E11D2E]" style={{ fontWeight: 600 }}>
          Retour aux profils
        </button>
      </div>
    );
  }

  // Products matching this profile's categories
  const profileProducts = useMemo(() =>
    allProducts.filter((p) => profile.categories.includes(p.category) && p.inStock).slice(0, 12),
    [profile.categories]
  );

  const sections = [
    { key: "presentation" as const, label: "Présentation" },
    { key: "boutique" as const, label: "Boutique" },
    { key: "membres" as const, label: "Membres" },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${profile.color}15` }}>
            <profile.icon className="w-4 h-4" style={{ color: profile.color }} />
          </div>
          <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            {profile.name}
          </h3>
        </div>
        <button onClick={() => navigate("/messagerie")} className="p-2 rounded-xl hover:bg-muted">
          <MessageSquare className="w-5 h-5 text-[#F97316]" />
        </button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden h-48">
        <img src={profile.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: profile.gradient.replace("135deg", "to top").replace("linear-gradient", "linear-gradient") + ", transparent)" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${profile.color}E6 0%, ${profile.color}88 40%, transparent 100%)` }} />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)" }} />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800 }}>
              <profile.icon className="w-3 h-3" /> {profile.stats[0].value} {profile.stats[0].label.toLowerCase()}
            </div>
          </div>
          <h1 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px" }}>
            {profile.name}
          </h1>
          <p className="text-white/80 mt-1 line-clamp-2" style={{ fontSize: 12 }}>
            {profile.tagline}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 -mt-2 relative z-10">
        <div className="bg-white rounded-2xl border border-border p-3 grid grid-cols-4 gap-2">
          {profile.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15, color: profile.color }}>
                {stat.value}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 8, fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="sticky top-[112px] z-30 bg-white border-b border-border px-4 mt-3">
        <div className="flex gap-1 py-2">
          {sections.map((sec) => (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className="flex-1 py-2 rounded-xl text-center transition-all"
              style={{
                background: activeSection === sec.key ? profile.gradient : "#F3F4F6",
                color: activeSection === sec.key ? "#fff" : "#6B7280",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "Poppins",
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* ═══ PRÉSENTATION ═══ */}
        {activeSection === "presentation" && (
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#374151" }}>{profile.description}</p>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: profile.color }} /> Ce que IPPOO vous offre
              </h4>
              <div className="space-y-2">
                {profile.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: `${profile.color}08` }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${profile.color}20` }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: profile.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "16px" }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Target className="w-5 h-5" style={{ color: profile.color }} /> Comment ça marche
              </h4>
              <div className="space-y-3">
                {[
                  { step: 1, title: `Créez votre profil ${profile.shortName.toLowerCase()}`, desc: "Renseignez vos informations, zone, spécialités et conditions" },
                  { step: 2, title: "Publiez vos offres ou demandes", desc: "Produits, prix, quantités, paliers, délais, tout est structuré" },
                  { step: 3, title: "Connectez-vous aux bons profils", desc: "IPPOO vous met en relation avec les acteurs qui correspondent" },
                  { step: 4, title: "Sécurisez et développez", desc: "Commandes, paiement IPPOO CASH, suivi et évaluations" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: profile.color }}>
                      <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 12 }}>{item.step}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5 text-center" style={{ background: profile.gradient }}>
              <profile.icon className="w-10 h-10 text-white/80 mx-auto mb-3" />
              <h3 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>
                {profile.cta}
              </h3>
              <p className="text-white/70 mb-4" style={{ fontSize: 12 }}>
                Rejoignez les {profile.stats[0].value} {profile.name.toLowerCase()} déjà sur IPPOO
              </p>
              <button
                onClick={() => navigate(`/profils/${profile.slug}/inscription`)}
                className="bg-white px-6 py-3 rounded-xl active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: profile.color }}
              >
                Commencer maintenant
              </button>
            </div>
          </div>
        )}

        {/* ═══ BOUTIQUE ═══ */}
        {activeSection === "boutique" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
                Produits {profile.name}
              </h3>
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>{profileProducts.length} produits</span>
            </div>

            {/* Categories chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {profile.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/explorer?cat=${encodeURIComponent(cat)}`)}
                  className="shrink-0 px-3 py-1.5 rounded-xl border border-border flex items-center gap-1.5"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  <Package className="w-3 h-3" style={{ color: profile.color }} />
                  {cat}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {profileProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {profileProducts.length > 0 && (
              <button
                onClick={() => navigate(`/explorer?cat=${encodeURIComponent(profile.categories[0])}`)}
                className="w-full py-3 rounded-xl border border-border flex items-center justify-center gap-2"
                style={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins", color: profile.color }}
              >
                Voir tout le catalogue {profile.categories[0]}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <CouponStrip
              code="PRO20"
              label={profile.shortName}
              discount="-20% première commande pro"
              condition={`Réservé aux ${profile.name.toLowerCase()} inscrits sur IPPOO`}
              color={profile.color}
              expiry="Offre permanente"
            />
          </div>
        )}

        {/* ═══ MEMBRES ═══ */}
        {activeSection === "membres" && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              {profile.name} vedettes
            </h3>

            <div className="space-y-3">
              {profile.featuredMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => navigate("/vendeurs")}
                  className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="h-1" style={{ background: profile.color }} />
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                                {member.name}
                              </h4>
                              <BadgeCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                            </div>
                            <p className="text-muted-foreground" style={{ fontSize: 11 }}>{member.specialty}</p>
                          </div>
                          <span
                            className="shrink-0 px-2 py-0.5 rounded-full text-white"
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              background: member.badge === "VIP" ? "linear-gradient(135deg, #E8A817, #FBBF24)" : member.badge === "TOP" ? "#E11D2E" : "#16A34A",
                            }}
                          >
                            {member.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#F97316]" />
                            <span className="text-muted-foreground" style={{ fontSize: 10 }}>{member.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{member.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {member.products > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] rounded-lg">
                              <Package className="w-3 h-3 text-[#6B7280]" />
                              <span style={{ fontSize: 9, fontWeight: 600 }}>{member.products} produits</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] rounded-lg">
                            <ShoppingCart className="w-3 h-3 text-[#6B7280]" />
                            <span style={{ fontSize: 9, fontWeight: 600 }}>{member.orders} commandes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/vendeurs"); }}
                        className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        style={{ background: profile.gradient, fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
                      >
                        <Store className="w-4 h-4" /> Voir la boutique
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/messagerie"); }}
                        className="px-4 py-2.5 rounded-xl border border-border"
                      >
                        <MessageSquare className="w-4 h-4 text-[#F97316]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Become a member CTA */}
            <div className="rounded-2xl p-4 border-2 border-dashed" style={{ borderColor: `${profile.color}40` }}>
              <div className="text-center">
                <profile.icon className="w-8 h-8 mx-auto mb-2" style={{ color: profile.color }} />
                <h4 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                  Vous êtes {profile.shortName.toLowerCase()} ?
                </h4>
                <p className="text-muted-foreground mt-1 mb-3" style={{ fontSize: 11 }}>
                  Créez votre profil et rejoignez les {profile.stats[0].value} {profile.name.toLowerCase()} sur IPPOO
                </p>
                <button
                  onClick={() => navigate(`/profils/${profile.slug}/inscription`)}
                  className="px-5 py-2.5 rounded-xl text-white active:scale-95 transition-transform"
                  style={{ background: profile.gradient, fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
                >
                  Créer mon profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}