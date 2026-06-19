import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  Plus,
  Search,
  BadgeCheck,
  MapPin,
  Clock,
  ShoppingCart,
  MessageSquare,
  Zap,
  Target,
  Heart,
  Award,
  CheckCircle2,
  UserPlus,
  BarChart3,
  Handshake,
  CircleDollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatPrice, IMAGES } from "./mock-data";
import { CouponStrip, FlashPromoBanner } from "./promo-widgets";

/* ═══════════════════════════════════════════
   IMAGES
   ═══════════════════════════════════════════ */
const IMG = {
  community: "https://images.unsplash.com/photo-1749938505996-93a421dd09c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwY29tbXVuaXR5JTIwbWFya2V0JTIwZ3JvdXAlMjBidXlpbmd8ZW58MXx8fHwxNzcyOTMzMzk5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  cooperative: "https://images.unsplash.com/photo-1603767311377-f870f682ab90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tZW4lMjBncm91cCUyMHNhdmluZ3MlMjB0b250aW5lJTIwY29vcGVyYXRpdmV8ZW58MXx8fHwxNzcyOTMzNDIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  teamwork: "https://images.unsplash.com/photo-1584365132623-e273491c69d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwdGVhbXdvcmslMjBidXNpbmVzcyUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzcyOTMzNDM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ═══════════════════════════════════════════
   MOCK COMMUNITIES
   ═══════════════════════════════════════════ */
const communities = [
  {
    id: 1,
    name: "Groupement Alimentaire Dantokpa",
    avatar: IMAGES.grocery,
    category: "Alimentaire & Vivrier",
    members: 147,
    location: "Cotonou",
    rating: 4.8,
    badge: "ACTIF" as const,
    color: "#E11D2E",
    monthlyVolume: 4500000,
    activeGroupBuys: 3,
    description: "Premier groupement d'achat alimentaire de Cotonou. Riz, huile, sucre, farine, commandes groupées hebdomadaires.",
    leader: "Mama Adjara K.",
    leaderAvatar: IMAGES.entrepreneur,
    savings: 18,
  },
  {
    id: 2,
    name: "Coopérative Textile Missèbo",
    avatar: IMAGES.textile,
    category: "Textile & Mode",
    members: 89,
    location: "Cotonou",
    rating: 4.9,
    badge: "VIP" as const,
    color: "#F0B429",
    monthlyVolume: 8200000,
    activeGroupBuys: 2,
    description: "Couturières et revendeuses textile. Achats groupés de wax, bazin, dentelle, prix imbattables par volume.",
    leader: "Tokpa Adélaïde M.",
    leaderAvatar: IMAGES.entrepreneur,
    savings: 25,
  },
  {
    id: 3,
    name: "Réseau Hygiène Pro Bénin",
    avatar: IMAGES.hygiene,
    category: "Hygiène & Entretien",
    members: 63,
    location: "Porto-Novo",
    rating: 4.6,
    badge: "ACTIF" as const,
    color: "#16A34A",
    monthlyVolume: 2800000,
    activeGroupBuys: 1,
    description: "Détaillants et nettoyeurs professionnels. Savons, détergents, produits d'entretien, livraison groupée.",
    leader: "ProClean Rachida B.",
    leaderAvatar: IMAGES.market,
    savings: 15,
  },
  {
    id: 4,
    name: "Tech Revendeurs Cotonou",
    avatar: IMAGES.electronics,
    category: "Électronique",
    members: 42,
    location: "Cotonou",
    rating: 4.7,
    badge: "ACTIF" as const,
    color: "#3B82F6",
    monthlyVolume: 6500000,
    activeGroupBuys: 2,
    description: "Revendeurs d'accessoires tech. Chargeurs, câbles, écouteurs, coques, imports groupés depuis Chine/Dubaï.",
    leader: "Cédric TechGros",
    leaderAvatar: IMAGES.businessman,
    savings: 22,
  },
  {
    id: 5,
    name: "Groupement BTP Parakou",
    avatar: IMAGES.cement,
    category: "Matériaux de construction",
    members: 35,
    location: "Parakou",
    rating: 4.5,
    badge: "NOUVEAU" as const,
    color: "#78716C",
    monthlyVolume: 12000000,
    activeGroupBuys: 1,
    description: "Entrepreneurs BTP du Nord. Ciment, fer, tôles, commandes massives à prix négociés.",
    leader: "Jean-Pierre MatBTP",
    leaderAvatar: IMAGES.businessman,
    savings: 12,
  },
  {
    id: 6,
    name: "Beauté Queens Afrique",
    avatar: IMAGES.cosmetics,
    category: "Beauté & Cosmétiques",
    members: 112,
    location: "National",
    rating: 4.8,
    badge: "VIP" as const,
    color: "#EC4899",
    monthlyVolume: 5400000,
    activeGroupBuys: 4,
    description: "Salons de beauté et revendeuses cosmétiques. Crèmes, mèches, vernis, prix de gros exclusifs.",
    leader: "Awa Beauty Queen",
    leaderAvatar: IMAGES.entrepreneur,
    savings: 20,
  },
];

const activeGroupBuys = [
  {
    id: 1,
    product: "Riz Parfumé 25kg, Lot 500 sacs",
    image: IMAGES.grocery,
    community: "Groupement Alimentaire Dantokpa",
    unitPrice: 12800,
    targetQty: 500,
    currentQty: 387,
    deadline: "12 Mars 2026",
    participants: 34,
    savings: 15,
    color: "#E11D2E",
  },
  {
    id: 2,
    product: "Tissu Wax Hollandais 12 yards, Lot 200",
    image: IMAGES.textile,
    community: "Coopérative Textile Missèbo",
    unitPrice: 22000,
    targetQty: 200,
    currentQty: 156,
    deadline: "15 Mars 2026",
    participants: 28,
    savings: 22,
    color: "#F0B429",
  },
  {
    id: 3,
    product: "Câbles USB-C x50, Commande groupée 1000",
    image: IMAGES.electronics,
    community: "Tech Revendeurs Cotonou",
    unitPrice: 19000,
    targetQty: 1000,
    currentQty: 620,
    deadline: "10 Mars 2026",
    participants: 18,
    savings: 24,
    color: "#3B82F6",
  },
  {
    id: 4,
    product: "Beurre de karité brut 10kg, Lot 100",
    image: IMAGES.skincare,
    community: "Beauté Queens Afrique",
    unitPrice: 18500,
    targetQty: 100,
    currentQty: 82,
    deadline: "14 Mars 2026",
    participants: 22,
    savings: 16,
    color: "#EC4899",
  },
];

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type Tab = "decouvrir" | "achats" | "creer";

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function CommunitiesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("decouvrir");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<typeof communities[0] | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery]);

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const visibleCommunities = filteredCommunities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCommunities.length;

  const tabs = [
    { key: "decouvrir" as const, label: "Communautés", icon: Users },
    { key: "achats" as const, label: "Achats groupés", icon: ShoppingCart },
    { key: "creer" as const, label: "Créer", icon: Plus },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            Communautés IPPOO
          </h3>
          <button
            onClick={() => toast.success("Invitations envoyées !")}
            className="p-2 rounded-xl bg-[#16A34A]/10"
          >
            <UserPlus className="w-5 h-5 text-[#16A34A]" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={IMG.community} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/90 via-[#1E3A5F]/80 to-[#16A34A]/70" />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.03) 12px, rgba(255,255,255,0.03) 24px)" }} />

        <div className="relative z-10 px-4 pt-6 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 rounded-full bg-[#16A34A] text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800 }}>
                <Users className="w-3 h-3" /> {communities.reduce((a, c) => a + c.members, 0)} MEMBRES
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 700 }}>
                <Zap className="w-3 h-3" /> {activeGroupBuys.length} ACHATS EN COURS
              </div>
            </div>
            <h1 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, lineHeight: "28px" }}>
              Ensemble on négocie,<br />on économise, on sécurise
            </h1>
            <p className="text-white/80" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Rejoignez un groupement ou créez le vôtre. Achetez en volume, obtenez les meilleurs prix, organisez vos livraisons.
            </p>

            {/* Stats row */}
            <div className="flex gap-3 mt-4">
              {[
                { value: `${communities.length}`, label: "Groupements", icon: Users },
                { value: "~20%", label: "Économies", icon: TrendingUp },
                { value: "48h", label: "Livraison", icon: Truck },
              ].map((s, i) => (
                <div key={i} className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                  <s.icon className="w-4 h-4 text-[#FBBF24] mx-auto mb-1" />
                  <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>{s.value}</p>
                  <p className="text-white/60" style={{ fontSize: 9, fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[112px] z-30 bg-white border-b border-border px-4">
        <div className="flex gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #1E3A5F, #16A34A)" : "#F3F4F6",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "Poppins",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* ═══ TAB: DÉCOUVRIR ═══ */}
        {activeTab === "decouvrir" && (
          <div className="px-4 py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un groupement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] rounded-xl border-none"
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Why join section */}
            <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] rounded-2xl p-4 border border-[#E8A817]/20">
              <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Handshake className="w-5 h-5 text-[#E8A817]" /> Pourquoi rejoindre un groupement ?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: CircleDollarSign, label: "Prix négociés\nen volume", color: "#16A34A" },
                  { icon: Shield, label: "Quantités\nsécurisées", color: "#3B82F6" },
                  { icon: Truck, label: "Livraison\norganisée", color: "#F97316" },
                  { icon: BarChart3, label: "Commandes\nplanifiées", color: "#EC4899" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, lineHeight: "13px", whiteSpace: "pre-line" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Communities list */}
            <div>
              <h3 className="mb-3 flex items-center justify-between" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1E3A5F]" /> Groupements actifs
                </span>
                <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>{filteredCommunities.length} résultats</span>
              </h3>

              <div className="space-y-3">
                {visibleCommunities.map((community, i) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedCommunity(community)}
                    className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    {/* Top accent */}
                    <div className="h-1" style={{ background: community.color }} />

                    <div className="p-3.5">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                          <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="line-clamp-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                                {community.name}
                              </h4>
                              <p className="text-muted-foreground" style={{ fontSize: 10 }}>{community.category}</p>
                            </div>
                            <span
                              className="shrink-0 px-2 py-0.5 rounded-full text-white"
                              style={{ fontSize: 8, fontWeight: 800, background: community.badge === "VIP" ? "linear-gradient(135deg, #E8A817, #FBBF24)" : community.badge === "NOUVEAU" ? "#3B82F6" : community.color }}
                            >
                              {community.badge}
                            </span>
                          </div>

                          <p className="text-muted-foreground line-clamp-2 mt-1" style={{ fontSize: 10, lineHeight: "14px" }}>
                            {community.description}
                          </p>

                          {/* Stats row */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#1E3A5F]" />
                              <span style={{ fontSize: 10, fontWeight: 700 }}>{community.members}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#F97316]" />
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280" }}>{community.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                              <span style={{ fontSize: 10, fontWeight: 700 }}>{community.rating}</span>
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                              <TrendingUp className="w-3 h-3 text-[#16A34A]" />
                              <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A" }}>-{community.savings}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active buys */}
                      {community.activeGroupBuys > 0 && (
                        <div className="mt-2.5 flex items-center justify-between bg-[#FFF7ED] rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-[#F97316]" />
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{community.activeGroupBuys} achat{community.activeGroupBuys > 1 ? "s" : ""} groupé{community.activeGroupBuys > 1 ? "s" : ""} en cours</span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#F97316" }}>
                            Vol. {formatPrice(community.monthlyVolume)}/mois
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + 12)}
                  className="w-full mt-4 py-3 rounded-xl border border-border bg-card hover:bg-muted"
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  Voir plus ({filteredCommunities.length - visibleCount} restants)
                </button>
              )}
              {filteredCommunities.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p style={{ fontFamily: "Poppins", fontWeight: 600 }}>Aucune communauté trouvée</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>Essayez un autre terme de recherche.</p>
                </div>
              )}
            </div>

            <CouponStrip
              code="GROUPE15"
              label="Groupement"
              discount="-15% sur 1ère commande groupée"
              condition="Valable pour tout nouveau membre de groupement"
              color="#16A34A"
              expiry="Offre permanente"
            />
          </div>
        )}

        {/* ═══ TAB: ACHATS GROUPÉS ═══ */}
        {activeTab === "achats" && (
          <div className="px-4 py-4 space-y-4">
            <FlashPromoBanner
              text="🤝 ACHATS GROUPÉS : des prix impossibles en solo"
              subtext="Rejoignez une commande ouverte et bénéficiez des prix de gros"
              link="/communautes"
              color="#1E3A5F"
            />

            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Commandes groupées ouvertes
            </h3>

            <div className="space-y-3">
              {activeGroupBuys.map((buy, i) => {
                const progress = Math.round((buy.currentQty / buy.targetQty) * 100);
                return (
                  <motion.div
                    key={buy.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-2xl border border-border overflow-hidden"
                  >
                    <div className="h-1" style={{ background: buy.color }} />
                    <div className="p-4">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <img src={buy.image} alt={buy.product} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="line-clamp-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                            {buy.product}
                          </h4>
                          <p className="text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontSize: 10 }}>
                            <Users className="w-3 h-3" /> {buy.community}
                          </p>
                        </div>
                      </div>

                      {/* Price & savings */}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: buy.color }}>
                            {formatPrice(buy.unitPrice)}
                          </span>
                          <span className="text-muted-foreground ml-1" style={{ fontSize: 10 }}>/unité</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-[#16A34A]/10 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[#16A34A]" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A" }}>-{buy.savings}% vs solo</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280" }}>
                            {buy.currentQty}/{buy.targetQty} unités
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: buy.color }}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${buy.color}, ${buy.color}99)` }}
                          />
                        </div>
                      </div>

                      {/* Info row */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                          <Users className="w-3 h-3" /> {buy.participants} participants
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                          <Clock className="w-3 h-3" /> Avant le {buy.deadline}
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => toast.success(`Vous avez rejoint la commande groupée !`)}
                        className="mt-3 w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${buy.color}, ${buy.color}CC)`, fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
                      >
                        <ShoppingCart className="w-4 h-4" /> Rejoindre cette commande
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB: CRÉER ═══ */}
        {activeTab === "creer" && (
          <div className="px-4 py-4 space-y-4">
            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden h-40">
              <img src={IMG.cooperative} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5F]/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>
                  Créez votre groupement
                </h3>
                <p className="text-white/70" style={{ fontSize: 12 }}>
                  Lancez un achat groupé en 5 minutes
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Target className="w-5 h-5 text-[#E11D2E]" /> Comment ça marche
              </h4>
              <div className="space-y-4">
                {[
                  { step: 1, title: "Créez votre groupement", desc: "Nom, catégorie, zone géographique, règles d'adhésion", color: "#E11D2E" },
                  { step: 2, title: "Invitez des membres", desc: "Partagez le lien, invitez par téléphone ou QR code", color: "#F97316" },
                  { step: 3, title: "Lancez un achat groupé", desc: "Fixez le produit, la quantité cible, le délai et les conditions", color: "#16A34A" },
                  { step: 4, title: "Collectez les participations", desc: "Chaque membre confirme sa quantité et pré-paie via IPPOO CASH", color: "#3B82F6" },
                  { step: 5, title: "Commande & livraison", desc: "IPPOO organise la commande groupée et la livraison coordonnée", color: "#E8A817" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: item.color }}>
                      <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 13 }}>{item.step}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form CTA */}
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#16A34A] rounded-2xl p-5 text-center">
              <Users className="w-10 h-10 text-white/80 mx-auto mb-3" />
              <h3 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>
                Prêt à lancer votre groupement ?
              </h3>
              <p className="text-white/70 mb-4" style={{ fontSize: 12 }}>
                Seul on achète, ensemble on négocie, on économise et on sécurise.
              </p>
              <button
                onClick={() => toast.success("Formulaire de création ouvert !")}
                className="bg-white text-[#1E3A5F] px-6 py-3 rounded-xl active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
              >
                Créer mon groupement
              </button>
            </div>

            {/* Avantages du leader */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Crown className="w-5 h-5 text-[#E8A817]" /> Avantages du leader de groupement
              </h4>
              <div className="space-y-2">
                {[
                  "Commission de coordination sur chaque commande groupée",
                  "Statut VIP avec remises exclusives sur IPPOO",
                  "Accès prioritaire aux offres flash et jours de marché",
                  "Badge Leader vérifié sur votre profil",
                  "Support dédié par un conseiller IPPOO",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#FFF7ED] rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODAL: Community Detail ═══ */}
      <AnimatePresence>
        {selectedCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedCommunity(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Header image */}
              <div className="relative h-36 overflow-hidden">
                <img src={selectedCommunity.avatar} alt={selectedCommunity.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${selectedCommunity.color}E6, ${selectedCommunity.color}44)` }} />
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="px-2 py-0.5 rounded-full text-white mb-2 inline-block" style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.25)" }}>
                    {selectedCommunity.badge}
                  </span>
                  <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>
                    {selectedCommunity.name}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: selectedCommunity.members, label: "Membres", color: "#1E3A5F" },
                    { value: `${selectedCommunity.savings}%`, label: "Économies", color: "#16A34A" },
                    { value: selectedCommunity.activeGroupBuys, label: "Achats", color: "#F97316" },
                    { value: selectedCommunity.rating, label: "Note", color: "#E8A817" },
                  ].map((s, i) => (
                    <div key={i} className="text-center bg-[#F9F5F0] rounded-xl p-2">
                      <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: s.color }}>{s.value}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 9 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#374151" }}>{selectedCommunity.description}</p>

                {/* Leader */}
                <div className="flex items-center gap-3 bg-[#FFF7ED] rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={selectedCommunity.leaderAvatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700 }}>Leader : {selectedCommunity.leader}</p>
                    <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 10 }}>
                      <BadgeCheck className="w-3 h-3 text-[#16A34A]" /> Vérifié · {selectedCommunity.location}
                    </p>
                  </div>
                  <Crown className="w-5 h-5 text-[#E8A817] ml-auto" />
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {[
                    { label: "Catégorie", value: selectedCommunity.category },
                    { label: "Zone", value: selectedCommunity.location },
                    { label: "Volume mensuel", value: formatPrice(selectedCommunity.monthlyVolume) },
                    { label: "Achats groupés actifs", value: `${selectedCommunity.activeGroupBuys}` },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                      <span className="text-muted-foreground" style={{ fontSize: 12 }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { toast.success(`Vous avez rejoint ${selectedCommunity.name} !`); setSelectedCommunity(null); }}
                    className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${selectedCommunity.color}, ${selectedCommunity.color}CC)`, fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
                  >
                    <UserPlus className="w-4 h-4" /> Rejoindre
                  </button>
                  <button
                    onClick={() => navigate("/messagerie")}
                    className="px-4 py-3 rounded-xl border border-border"
                  >
                    <MessageSquare className="w-5 h-5 text-[#F97316]" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}