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
  Search,
  Heart,
  Zap,
  Target,
  Layers,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  FileText,
  Calendar,
  BadgeCheck,
  Eye,
  Gift,
  Repeat,
  Percent,
  ArrowUpRight,
  Download,
  Filter,
  Flame,
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

/* ═══════════════════════════════════════════ */
const P = "#4338CA";
const PL = "#EEF2FF";
const A1 = "#0EA5E9";
const A2 = "#16A34A";
const GOLD = "#E8A817";
const RED = "#E11D2E";

/* ═══════════════════════════════════════════ */
const ceProfile = {
  name: "Mon CE",
  type: "Comité d'entreprise",
  members: 0,
  city: "—",
  since: "—",
  totalOrders: 0,
  totalSavings: 0,
  creditAvailable: 0,
  nextDelivery: "—",
  tier: "Bronze",
};

const ceCategories = [
  { slug: "alimentaire", name: "Alimentaire", icon: Package, color: RED, count: 18, discount: "-25%" },
  { slug: "hygiene", name: "Hygiène", icon: Shield, color: A2, count: 12, discount: "-20%" },
  { slug: "beaute", name: "Beauté", icon: Heart, color: "#EC4899", count: 14, discount: "-22%" },
  { slug: "boissons", name: "Boissons", icon: Zap, color: "#F97316", count: 10, discount: "-18%" },
  { slug: "textile", name: "Textile", icon: Layers, color: GOLD, count: 10, discount: "-30%" },
  { slug: "electronique", name: "Électronique", icon: Zap, color: "#3B82F6", count: 8, discount: "-15%" },
  { slug: "equipements", name: "Équipements", icon: Target, color: "#7C3AED", count: 6, discount: "-20%" },
  { slug: "materiaux", name: "Matériaux", icon: Package, color: "#78716C", count: 6, discount: "-12%" },
  { slug: "mobilier", name: "Mobilier", icon: Sofa, color: "#0D9488", count: 8, discount: "-22%" },
  { slug: "biens-equip", name: "Biens d'équip.", icon: Wrench, color: "#6366F1", count: 10, discount: "-18%" },
  { slug: "bureau", name: "Bureau", icon: Monitor, color: "#2563EB", count: 9, discount: "-20%" },
  { slug: "maison", name: "Maison", icon: Home, color: "#D97706", count: 12, discount: "-25%" },
  { slug: "hommes", name: "Hommes", icon: UserCircle, color: "#1E40AF", count: 10, discount: "-20%" },
  { slug: "femmes", name: "Femmes", icon: UserCircle, color: "#DB2777", count: 14, discount: "-22%" },
];

const ceProducts = [
  { id: 1, name: "Riz Parfumé 25kg", cat: "alimentaire", price: 18500, cePrice: 13875, discount: 25, moq: 50, unit: "sacs", image: IMAGES.riceBags, rating: 4.8, hot: true },
  { id: 2, name: "Huile de palme 20L", cat: "alimentaire", price: 22000, cePrice: 16500, discount: 25, moq: 20, unit: "bidons", image: IMAGES.palmOil, rating: 4.7, hot: true },
  { id: 3, name: "Savon ménage - Crt 48pcs", cat: "hygiene", price: 12000, cePrice: 9000, discount: 25, moq: 30, unit: "cartons", image: IMAGES.soapBulk, rating: 4.6, hot: false },
  { id: 4, name: "Sucre en poudre 50kg", cat: "alimentaire", price: 32000, cePrice: 25600, discount: 20, moq: 20, unit: "sacs", image: IMAGES.sugar, rating: 4.5, hot: false },
  { id: 5, name: "Eau minérale Pack 12x1.5L", cat: "boissons", price: 3800, cePrice: 2850, discount: 25, moq: 50, unit: "packs", image: IMAGES.mineralWater, rating: 4.7, hot: true },
  { id: 6, name: "Papier toilette 96 rlx", cat: "hygiene", price: 18000, cePrice: 13500, discount: 25, moq: 15, unit: "lots", image: IMAGES.toiletPaper, rating: 4.5, hot: false },
  { id: 7, name: "Concentré tomate - Crt", cat: "alimentaire", price: 15000, cePrice: 11250, discount: 25, moq: 20, unit: "cartons", image: IMAGES.tomatoPaste, rating: 4.6, hot: false },
  { id: 8, name: "Lait en poudre 24 sachets", cat: "alimentaire", price: 24000, cePrice: 18000, discount: 25, moq: 15, unit: "cartons", image: IMAGES.milkPowder, rating: 4.8, hot: false },
  { id: 9, name: "Pâtes spaghetti - Crt 20", cat: "alimentaire", price: 8500, cePrice: 6375, discount: 25, moq: 25, unit: "cartons", image: IMAGES.pasta, rating: 4.4, hot: false },
  { id: 10, name: "Farine de blé 50kg", cat: "alimentaire", price: 28000, cePrice: 21000, discount: 25, moq: 15, unit: "sacs", image: IMAGES.flour, rating: 4.5, hot: false },
  { id: 11, name: "Javel concentrée - Crt", cat: "hygiene", price: 9500, cePrice: 7125, discount: 25, moq: 20, unit: "cartons", image: IMAGES.bleach, rating: 4.3, hot: false },
  { id: 12, name: "Dentifrice - Crt 48 tubes", cat: "hygiene", price: 14000, cePrice: 10500, discount: 25, moq: 10, unit: "cartons", image: IMAGES.toothpaste, rating: 4.6, hot: false },
  { id: 13, name: "Beurre de karité 5kg", cat: "beaute", price: 15000, cePrice: 11250, discount: 25, moq: 10, unit: "pots", image: IMAGES.sheaButter, rating: 4.9, hot: true },
  { id: 14, name: "Jus fruits - Pack 12x1L", cat: "boissons", price: 7200, cePrice: 5400, discount: 25, moq: 30, unit: "packs", image: IMAGES.juices, rating: 4.5, hot: false },
  { id: 15, name: "Thé vert - Crt 100 sachets", cat: "boissons", price: 6500, cePrice: 4875, discount: 25, moq: 20, unit: "cartons", image: IMAGES.greenTea, rating: 4.4, hot: false },
  { id: 16, name: "T-shirts blancs - Lot 50", cat: "textile", price: 85000, cePrice: 59500, discount: 30, moq: 5, unit: "lots", image: IMAGES.whiteTshirts, rating: 4.6, hot: false },
];

const packs = [
  { name: "Essentiel Mensuel", desc: "Riz, huile, sucre, savon, eau", items: 5, price: 285000, cePrice: 213750, icon: Package, color: RED },
  { name: "Hygiène Bureau", desc: "Savons, papier, nettoyants, javel", items: 4, price: 120000, cePrice: 90000, icon: Shield, color: A2 },
  { name: "Fêtes & Événements", desc: "Boissons, snacks, lots festifs", items: 8, price: 450000, cePrice: 337500, icon: Star, color: GOLD },
  { name: "Rentrée Scolaire", desc: "Kits scolaires, uniformes", items: 6, price: 320000, cePrice: 240000, icon: FileText, color: "#3B82F6" },
  { name: "Beauté & Bien-être", desc: "Karité, cosmétiques, soins", items: 5, price: 180000, cePrice: 135000, icon: Heart, color: "#EC4899" },
  { name: "Pack Ramadan", desc: "Riz, huile, sucre, dattes, thé", items: 6, price: 350000, cePrice: 262500, icon: Star, color: "#7C3AED" },
  { name: "Boissons 1 mois", desc: "Eau, jus, thé, bissap", items: 4, price: 95000, cePrice: 71250, icon: Zap, color: "#F97316" },
  { name: "Textile Solidaire", desc: "Pagnes, draps, t-shirts", items: 5, price: 520000, cePrice: 364000, icon: Layers, color: GOLD },
];

const ceOrders = [
  { id: "CE-2026-024", date: "05 Mar 2026", items: 10, total: 1890000, status: "En cours", color: "#F97316" },
  { id: "CE-2026-023", date: "28 Fév 2026", items: 8, total: 1450000, status: "Livré", color: A2 },
  { id: "CE-2026-022", date: "15 Fév 2026", items: 12, total: 2180000, status: "Livré", color: A2 },
  { id: "CE-2026-021", date: "01 Fév 2026", items: 5, total: 780000, status: "Livré", color: A2 },
  { id: "CE-2026-020", date: "18 Jan 2026", items: 15, total: 3200000, status: "Livré", color: A2 },
  { id: "CE-2026-019", date: "05 Jan 2026", items: 6, total: 920000, status: "Livré", color: A2 },
  { id: "CE-2025-018", date: "20 Déc 2025", items: 22, total: 4500000, status: "Livré", color: A2 },
  { id: "CE-2025-017", date: "10 Déc 2025", items: 9, total: 1350000, status: "Livré", color: A2 },
];

const upcomingDeliveries = [
  { date: "12 Mars", ref: "CE-2026-024", items: 10, status: "Préparation" },
  { date: "26 Mars", ref: "CE-2026-025", items: 8, status: "Planifié" },
  { date: "09 Avril", ref: "CE-2026-026", items: 12, status: "Planifié" },
];

type Tab = "catalogue" | "packs" | "commandes" | "dashboard";

const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "catalogue", label: "Catalogue", icon: ShoppingBag },
  { key: "packs", label: "Packs", icon: Package },
  { key: "commandes", label: "Commandes", icon: ClipboardList },
  { key: "dashboard", label: "Bord", icon: BarChart3 },
];

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
export function CEApprovisionnementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("catalogue");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const prod = ceProducts.find(p => p.id === Number(id));
    return total + (prod ? prod.cePrice * qty : 0);
  }, 0);

  const addToCart = (pid: number) => {
    setCart(prev => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
    toast.success("Ajouté au panier CE");
  };

  const removeFromCart = (pid: number) => {
    setCart(prev => {
      const c = { ...prev };
      if (c[pid] > 1) c[pid]--;
      else delete c[pid];
      return c;
    });
  };

  const filteredProducts = ceProducts
    .filter(p => !selectedCategory || p.cat === selectedCategory)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/comite-entreprise")} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Espace Approvisionnement</h1>
          <p className="truncate" style={{ fontSize: 11, color: P, fontWeight: 600 }}>{ceProfile.name} · {ceProfile.tier}</p>
        </div>
        <button onClick={() => toast.info(`Panier CE : ${cartCount} articles, ${formatPrice(cartTotal)}`)} className="relative p-2 rounded-lg hover:bg-gray-100">
          <ShoppingCart className="w-5 h-5" style={{ color: P }} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ fontSize: 10, fontWeight: 700, background: RED }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Profile Banner */}
      <div className="mx-4 mt-3 rounded-xl p-3.5" style={{ background: `linear-gradient(135deg, ${P}, ${A1})` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#FFF" }}>{ceProfile.name}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{ceProfile.members} membres · {ceProfile.city}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/20" style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>{ceProfile.tier}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: ceProfile.totalOrders.toString(), l: "Commandes" },
            { v: "2.4M", l: "Économisés" },
            { v: "850K", l: "Crédit" },
            { v: "12 Mars", l: "Livraison" },
          ].map((s, i) => (
            <div key={i} className="rounded-lg py-2 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#FFF" }}>{s.v}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#6B7280" }}>
              <TI className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-3.5">

        {/* ═══════════ CATALOGUE ═══════════ */}
        {activeTab === "catalogue" && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un produit CE..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 13, background: "#FFF" }} />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setSelectedCategory(null)} className="px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 12, fontWeight: !selectedCategory ? 700 : 500, background: !selectedCategory ? `${P}12` : "#FFF", color: !selectedCategory ? P : "#6B7280", border: !selectedCategory ? `2px solid ${P}` : "1px solid #E5E7EB" }}>
                Tous
              </button>
              {ceCategories.map(c => {
                const on = selectedCategory === c.slug;
                return (
                  <button key={c.slug} onClick={() => setSelectedCategory(on ? null : c.slug)} className="px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: on ? 700 : 500, background: on ? `${c.color}12` : "#FFF", color: on ? c.color : "#6B7280", border: on ? `2px solid ${c.color}` : "1px solid #E5E7EB" }}>
                    {c.name}
                    <span style={{ fontSize: 10, fontWeight: 700, color: A2 }}>{c.discount}</span>
                  </button>
                );
              })}
            </div>

            <CouponStrip code="CE-VOLUME50" discount="50+ articles = -5% supplémentaire" color={P} />

            {/* Products */}
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>
                {selectedCategory ? ceCategories.find(c => c.slug === selectedCategory)?.name : "Catalogue CE"} ({filteredProducts.length})
              </p>
            </div>
            <div className="space-y-2.5">
              {filteredProducts.map(p => (
                <div key={p.id} className="rounded-xl p-3 flex gap-3" style={{ background: "#FFF" }}>
                  <div className="relative shrink-0">
                    <ImageWithFallback src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                    {p.hot && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" style={{ fontSize: 9, fontWeight: 700, color: "#FFF", background: RED }}>
                        <Flame className="w-3 h-3" /> HOT
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{formatPrice(p.price)}</span>
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: P }}>{formatPrice(p.cePrice)}</span>
                      <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: RED }}>-{p.discount}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: "#6B7280" }}>Min. {p.moq} {p.unit}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#E8A817]" style={{ color: "#E8A817" }} />
                          <span style={{ fontSize: 11, color: "#6B7280" }}>{p.rating}</span>
                        </div>
                      </div>
                      {cart[p.id] ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${P}12` }}>
                            <Minus className="w-3.5 h-3.5" style={{ color: P }} />
                          </button>
                          <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: P, minWidth: 20, textAlign: "center" }}>{cart[p.id]}</span>
                          <button onClick={() => addToCart(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: P }}>
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(p.id)} className="px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: P, fontSize: 12, fontWeight: 700, color: "#FFF" }}>
                          <Plus className="w-3.5 h-3.5" /> Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════ PACKS ═══════════ */}
        {activeTab === "packs" && (
          <>
            <div className="rounded-xl p-3.5" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>Packs pré-configurés</span>, Commandez en un clic. Prix CE négociés. Personnalisation possible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {packs.map((pk, i) => {
                const PKIcon = pk.icon;
                return (
                  <div key={i} className="rounded-xl p-3.5 flex flex-col" style={{ background: "#FFF", borderTop: `4px solid ${pk.color}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${pk.color}10` }}>
                        <PKIcon className="w-4.5 h-4.5" style={{ color: pk.color }} />
                      </div>
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: A2 }}>-25%</span>
                    </div>
                    <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E", lineHeight: 1.2 }}>{pk.name}</p>
                    <p className="mt-1 flex-1" style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.35 }}>{pk.desc}</p>
                    <div className="mt-2">
                      <span style={{ fontSize: 10, color: "#9CA3AF", textDecoration: "line-through" }}>{formatPrice(pk.price)}</span>
                      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: pk.color }}>{formatPrice(pk.cePrice)}</p>
                      <p style={{ fontSize: 11, color: "#6B7280" }}>{pk.items} articles</p>
                    </div>
                    <button onClick={() => toast.success(`Pack "${pk.name}" ajouté`)} className="w-full mt-2.5 py-2 rounded-xl text-white flex items-center justify-center gap-1" style={{ background: pk.color, fontSize: 12, fontWeight: 700 }}>
                      <ShoppingCart className="w-3.5 h-3.5" /> Commander
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={() => toast.info("Pack personnalisé, bientôt")} className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2" style={{ borderColor: P, color: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
              <Plus className="w-4 h-4" /> Créer un pack personnalisé
            </button>

            {/* Recurring order */}
            <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "#FFF", borderLeft: `4px solid ${A1}` }}>
              <Repeat className="w-6 h-6 shrink-0" style={{ color: A1 }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>Commande récurrente</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>Programmez un pack automatique chaque mois</p>
              </div>
              <button onClick={() => toast.info("Planification, à venir")} className="px-3 py-1.5 rounded-lg" style={{ background: A1, fontSize: 12, fontWeight: 700, color: "#FFF" }}>Planifier</button>
            </div>
          </>
        )}

        {/* ═══════════ COMMANDES ═══════════ */}
        {activeTab === "commandes" && (
          <>
            {/* Upcoming deliveries */}
            <div>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Prochaines livraisons</p>
              <div className="space-y-2">
                {upcomingDeliveries.map((d, i) => (
                  <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#FFF" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${A1}10` }}>
                      <Truck className="w-5 h-5" style={{ color: A1 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{d.date}</span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>{d.ref}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{d.items} articles</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg" style={{ fontSize: 11, fontWeight: 700, color: d.status === "Préparation" ? "#F97316" : A1, background: d.status === "Préparation" ? "#FFF7ED" : `${A1}10` }}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Historique</p>
                <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: 11, fontWeight: 700, color: P, background: PL }}>{ceOrders.length} cmd</span>
              </div>
              <div className="space-y-2">
                {ceOrders.map(o => (
                  <button key={o.id} onClick={() => toast.info(`Détails ${o.id}`)} className="w-full rounded-xl p-3.5 text-left flex items-center gap-3" style={{ background: "#FFF" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{o.id}</span>
                        <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: o.color }}>{o.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{o.date}</span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{o.items} articles</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: P }}>{formatPrice(o.total)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setActiveTab("catalogue")} className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${P}, ${A1})`, fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
              <Plus className="w-4 h-4" /> Nouvelle commande
            </button>
          </>
        )}

        {/* ═══════════ DASHBOARD ═══════════ */}
        {activeTab === "dashboard" && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <KPI icon={ShoppingCart} label="Commandes" value="23" sub="+3 ce mois" color={P} />
              <KPI icon={TrendingDown} label="Économies" value="2.4M" sub="FCFA cumulés" color={A2} />
              <KPI icon={Users} label="Membres actifs" value="387" sub="/450 inscrits" color={A1} />
              <KPI icon={BadgeCheck} label="Crédit CE" value="850K" sub="FCFA disponible" color={GOLD} />
            </div>

            {/* Monthly spend */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Dépenses mensuelles (FCFA)</p>
              <div className="space-y-2.5">
                {[
                  { m: "Sep", a: 980000, pct: 39 },
                  { m: "Oct", a: 1200000, pct: 48 },
                  { m: "Nov", a: 1800000, pct: 72 },
                  { m: "Déc", a: 2500000, pct: 100 },
                  { m: "Jan", a: 1600000, pct: 64 },
                  { m: "Fév", a: 2180000, pct: 87 },
                  { m: "Mar", a: 890000, pct: 36 },
                ].map(r => (
                  <div key={r.m} className="flex items-center gap-2">
                    <span style={{ fontSize: 12, color: "#6B7280", width: 28, textAlign: "right" }}>{r.m}</span>
                    <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <div className="h-full rounded-lg" style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${P}, ${A1})` }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", minWidth: 65, textAlign: "right" }}>{formatPrice(r.a)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Répartition par catégorie</p>
              <div className="space-y-2.5">
                {[
                  { n: "Alimentaire", pct: 42, color: RED },
                  { n: "Hygiène", pct: 20, color: A2 },
                  { n: "Boissons", pct: 14, color: "#F97316" },
                  { n: "Beauté", pct: 10, color: "#EC4899" },
                  { n: "Textile", pct: 8, color: GOLD },
                  { n: "Autre", pct: 6, color: "#78716C" },
                ].map(c => (
                  <div key={c.n} className="flex items-center gap-2">
                    <span className="truncate" style={{ fontSize: 12, color: "#374151", width: 70 }}>{c.n}</span>
                    <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <div className="h-full rounded-lg" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color, minWidth: 30, textAlign: "right" }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Top 5 produits commandés</p>
              <div className="space-y-2">
                {[
                  { n: "Riz Parfumé 25kg", qty: 340, cat: "Alimentaire" },
                  { n: "Eau minérale Pack", qty: 280, cat: "Boissons" },
                  { n: "Savon ménage Crt", qty: 220, cat: "Hygiène" },
                  { n: "Huile de palme 20L", qty: 185, cat: "Alimentaire" },
                  { n: "Sucre en poudre 50kg", qty: 150, cat: "Alimentaire" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="w-5 text-center" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: i < 3 ? GOLD : "#9CA3AF" }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{p.n}</p>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{p.cat}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P }}>{p.qty} u.</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Members engagement */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Engagement membres</p>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl p-3 text-center" style={{ background: `${A2}08` }}>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: A2 }}>86%</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Participation</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: `${P}08` }}>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: P }}>3.2</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Cmd/membre/trim.</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: `${GOLD}08` }}>
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: GOLD }}>4.8</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Satisfaction /5</p>
                </div>
              </div>
            </div>

            {/* Savings highlight */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${A2}15, ${A2}05)`, border: `1px solid ${A2}25` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${A2}18` }}>
                <TrendingDown className="w-6 h-6" style={{ color: A2 }} />
              </div>
              <div>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: A2 }}>{formatPrice(ceProfile.totalSavings)}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>Économies depuis {ceProfile.since}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button onClick={() => toast.success("Rapport téléchargé")} className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5" style={{ borderColor: "#E5E7EB", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                <Download className="w-4 h-4" /> Rapport PDF
              </button>
              <button onClick={() => toast.success("Export Excel")} className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5" style={{ borderColor: "#E5E7EB", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                <FileText className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </>
        )}

        {/* Floating cart */}
        {cartCount > 0 && (
          <div className="fixed left-4 right-4 rounded-xl p-3.5 flex items-center justify-between z-30 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] lg:left-auto lg:right-6 lg:bottom-6 lg:w-96" style={{ background: P }}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#FFF" }}>{cartCount} articles</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#FFF" }}>{formatPrice(cartTotal)}</span>
              <button onClick={() => toast.success("Commande CE validée !")} className="px-4 py-2 rounded-lg" style={{ background: "#FFF", color: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                Valider
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color }: { icon: LucideIcon; label: string; value: string; sub: string; color: string }) {
  const I = Icon;
  return (
    <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
      <I className="w-5 h-5 mb-1.5" style={{ color }} />
      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </div>
  );
}