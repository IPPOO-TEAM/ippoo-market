import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Star,
  BadgeCheck,
  MapPin,
  Package,
  ChevronRight,
  Search,
  Crown,
  Filter,
  TrendingUp,
  Award,
  Truck,
  ShieldCheck,
  Heart,
  MessageSquare,
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
  Users,
  X,
  FileText,
  LayoutGrid,
  List,
  SortAsc,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useUserProfile } from "../auth/useUserProfile";
import { usePublicVendors } from "../data/usePublicVendors";
import { CategoryIcon } from "./category-icon";
import { StaggerList, StaggerItem } from "./anim";
import { AnimatedNumber } from "./animated-number";
import {
  nicheCategories,
  categoryLabel,
  seededVendors,
  vendorFromProfile,
  vendorFromPublic,
  filters,
  sortOptions,
  NICHE_COVERS,
  type Vendor,
  type SortKey,
  type NicheCategory,
} from "./vendors/data";

/* Deterministic pseudo-random helpers for derived metrics */
function seedHash(s: string | number): number {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededFloat(seed: number, salt: number): number {
  const v = Math.imul(seed ^ salt, 2654435761) >>> 0;
  return (v % 10000) / 10000;
}
function vendorMetrics(v: Vendor) {
  const s = seedHash(v.id);
  const years = 3 + Math.floor(seededFloat(s, 1) * 12);          // 3-14 yrs
  const responseRate = 88 + Math.floor(seededFloat(s, 2) * 12);  // 88-99 %
  const responseHours = 1 + Math.floor(seededFloat(s, 3) * 12);  // ≤Xh
  const exports = 1 + Math.floor(seededFloat(s, 4) * 8);         // 1-8 pays
  const reorderRate = 18 + Math.floor(seededFloat(s, 5) * 32);   // 18-49 %
  return { years, responseRate, responseHours, exports, reorderRate };
}
function vendorThumbs(v: Vendor): string[] {
  const pool = NICHE_COVERS[v.niche] || [];
  if (pool.length === 0) return [v.cover, v.avatar, v.cover].slice(0, 3);
  const s = seedHash(v.id);
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(pool[(s + i * 7) % pool.length]);
  }
  return out;
}


/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function getBadgeStyle(badge: string) {
  if (badge === "VIP")
    return { bg: "linear-gradient(135deg, #E8A817, #FBBF24)", text: "#fff", icon: Crown };
  if (badge === "TOP")
    return { bg: "#E11D2E", text: "#fff", icon: Award };
  return { bg: "#16A34A", text: "#fff", icon: ShieldCheck };
}

function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E", lineHeight: "15px" }}>{value}</p>
        <p style={{ fontSize: 9, color: "#9CA3AF", lineHeight: "11px" }}>{label}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VENDOR CARD, Alibaba Manufacturers / Global style
   ═══════════════════════════════════════════════════ */
function VendorCard({ vendor }: { vendor: Vendor }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const nicheInfo = nicheCategories.find((nc) => nc.key === vendor.niche) || nicheCategories[0];
  const metrics = vendorMetrics(vendor);
  const thumbs = vendorThumbs(vendor);
  const isManufacturer = vendor.badge === "VIP" || vendor.badge === "TOP";
  const open = () => navigate(vendor.slug ? `/boutique/${vendor.slug}` : `/vendeur/${vendor.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden cursor-pointer group flex flex-col"
      style={{ border: "1px solid #E5E7EB" }}
      onClick={open}
    >
      {/* ── Cover banner (image unique) ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 88, background: "#F1F5F9" }}>
        <img
          src={vendor.cover}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      {/* ── Logo (chevauche la bannière) + bouton favori ── */}
      <div className="relative px-3 -mt-7 flex items-start justify-between">
        <div
          className="w-14 h-14 rounded-md shrink-0 overflow-hidden bg-white"
          style={{ border: "2px solid #fff", boxShadow: "0 2px 6px rgba(15,23,42,0.15)" }}
        >
          <img
            src={vendor.avatar}
            alt={vendor.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = "none";
              const parent = img.parentElement;
              if (parent && !parent.querySelector("[data-logo-fallback]")) {
                const fb = document.createElement("div");
                fb.setAttribute("data-logo-fallback", "1");
                fb.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${nicheInfo.color}22;color:${nicheInfo.color};font-weight:800;font-size:18px;`;
                fb.textContent = vendor.name.charAt(0).toUpperCase();
                parent.appendChild(fb);
              }
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          className="shrink-0 w-8 h-8 mt-7 rounded-md flex items-center justify-center bg-white hover:bg-[#F1F5F9]"
          style={{ border: "1px solid #E5E7EB" }}
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); toast.success(liked ? "Retiré des favoris" : "Ajouté aux favoris"); }}
          aria-label="favori"
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-[#E11D2E] text-[#E11D2E]" : "text-[#94A3B8]"}`} />
        </button>
      </div>

      {/* ── Identité : nom pleine largeur + meta ── */}
      <div className="px-3 mt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="truncate min-w-0" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#0F172A", lineHeight: "17px" }}>
            {vendor.name}
          </h3>
          {isManufacturer && (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF6A00" }} aria-label="Verified Supplier" />
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 truncate" style={{ fontSize: 10.5, color: "#64748B" }}>
          <span aria-hidden>🇧🇯</span>
          <span className="truncate">{vendor.location}, Bénin</span>
          <span className="mx-1 text-[#CBD5E1]">·</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>{metrics.years} yrs</span>
        </div>
      </div>

      {/* ── Trust ribbon ── */}
      <div className="flex items-center gap-1.5 flex-wrap px-3 mt-2">
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
          style={{ fontSize: 9.5, fontWeight: 700, color: "#FF6A00", background: "#FFF1E5", border: "1px solid #FFD6B0" }}
        >
          <ShieldCheck className="w-2.5 h-2.5" /> Verified Supplier
        </span>
        {isManufacturer && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
            style={{ fontSize: 9.5, fontWeight: 700, color: "#0F766E", background: "#ECFDF5", border: "1px solid #A7F3D0" }}
          >
            <BadgeCheck className="w-2.5 h-2.5" /> Trade Assurance
          </span>
        )}
        {vendor.badge === "VIP" && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
            style={{ fontSize: 9.5, fontWeight: 700, color: "#92400E", background: "#FEF3C7", border: "1px solid #FCD34D" }}
          >
            <Crown className="w-2.5 h-2.5" /> Gold Supplier
          </span>
        )}
      </div>

      {/* ── Catégorie principale ── */}
      <p className="px-3 mt-2 truncate" style={{ fontSize: 11.5, color: "#334155" }}>
        <span style={{ color: "#94A3B8" }}>Main products:</span>{" "}
        <span style={{ fontWeight: 600 }}>{vendor.category}</span>
        {vendor.subcategories[0] ? ` · ${vendor.subcategories.slice(0, 2).join(", ")}` : ""}
      </p>

      {/* ── Metrics table style Alibaba ── */}
      <div className="grid grid-cols-3 mt-3 mx-3 rounded-md overflow-hidden" style={{ background: "#F8FAFC", border: "1px solid #E5E7EB" }}>
        <div className="px-2 py-1.5 text-center" style={{ borderRight: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", lineHeight: "14px" }}>{metrics.responseRate}%</p>
          <p style={{ fontSize: 8.5, color: "#64748B", marginTop: 1 }}>Réponse</p>
        </div>
        <div className="px-2 py-1.5 text-center" style={{ borderRight: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", lineHeight: "14px" }}>≤{metrics.responseHours}h</p>
          <p style={{ fontSize: 8.5, color: "#64748B", marginTop: 1 }}>Délai rép.</p>
        </div>
        <div className="px-2 py-1.5 text-center">
          <p style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", lineHeight: "14px" }}>{vendor.deliveryRate}%</p>
          <p style={{ fontSize: 8.5, color: "#64748B", marginTop: 1 }}>À temps</p>
        </div>
      </div>

      {/* ── Footer : note + global + CTAs ── */}
      <div className="px-3 pt-2.5 mt-1 flex items-center gap-2" style={{ fontSize: 10.5, color: "#475569" }}>
        <span className="inline-flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
          <span style={{ fontWeight: 700, color: "#0F172A" }}>{vendor.rating.toFixed(1)}</span>
          <span style={{ color: "#94A3B8" }}>({vendor.orders})</span>
        </span>
        <span className="text-[#CBD5E1]">·</span>
        <span className="inline-flex items-center gap-0.5">
          <Truck className="w-3 h-3 text-[#64748B]" /> {metrics.exports} pays
        </span>
        <span className="text-[#CBD5E1]">·</span>
        <span>Reorder {metrics.reorderRate}%</span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pt-2.5 pb-3">
        <button
          onClick={(e) => { e.stopPropagation(); navigate("/messagerie"); toast.success("Conversation ouverte"); }}
          className="py-2 rounded-md flex items-center justify-center gap-1 transition-colors"
          style={{ background: "#FF6A00", color: "#fff", fontSize: 11.5, fontWeight: 700 }}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Contacter
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toast.success("Demande de devis envoyée"); }}
          className="py-2 rounded-md flex items-center justify-center gap-1 transition-colors hover:bg-[#FFF7ED]"
          style={{ border: "1px solid #FF6A00", color: "#FF6A00", fontSize: 11.5, fontWeight: 700 }}
        >
          <FileText className="w-3.5 h-3.5" /> Devis
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FEATURED VENDOR, Large spotlight card
   ═══════════════════════════════════════════════════ */
function FeaturedVendor({ vendor }: { vendor: Vendor }) {
  const navigate = useNavigate();
  const nicheInfo = nicheCategories.find((nc) => nc.key === vendor.niche) || nicheCategories[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer"
      style={{ minHeight: 200 }}
      onClick={() => navigate(vendor.slug ? `/boutique/${vendor.slug}` : `/vendeur/${vendor.id}`)}
    >
      <img src={vendor.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/90 via-[#1A1A2E]/70 to-transparent" />
      <div className="relative z-10 p-5 flex flex-col justify-between h-full" style={{ minHeight: 200 }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E8A817] to-[#FBBF24]">
            <Crown className="w-3 h-3 text-white" />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>VENDEUR DU MOIS</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-white/30 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${nicheInfo.color}, ${nicheInfo.color}cc)`,
              }}
            >
              <CategoryIcon name={nicheInfo.icon} className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, lineHeight: "22px" }}>
                {vendor.name}
              </h2>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{vendor.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { icon: Star, val: vendor.rating, color: "#FBBF24" },
              { icon: Package, val: `${vendor.orders}+`, color: "#FF6B00" },
              { icon: Truck, val: `${vendor.deliveryRate}%`, color: "#34D399" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{s.val}</span>
              </div>
            ))}
            <div className="ml-auto flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/messagerie"); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Contacter</span>
              </button>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E11D2E]">
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Voir</span>
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   NICHE CATEGORY SECTION, grouped vendors
   ═══════════════════════════════════════════════════ */
function NicheCategorySection({ vendors, nicheInfo }: {
  vendors: Vendor[];
  nicheInfo: NicheCategory;
}) {
  // Show unique subcategories across all vendors in this niche
  const allSubs = [...new Set(vendors.flatMap((v) => v.subcategories))];

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${nicheInfo.color}15` }}
        >
          <CategoryIcon name={nicheInfo.icon} className="w-5 h-5" style={{ color: nicheInfo.color }} strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>
            {nicheInfo.label}
          </h3>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{vendors.length} boutique{vendors.length > 1 ? "s" : ""}</p>
        </div>
      </div>
      {/* Subcategory chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-0.5">
        {allSubs.slice(0, 6).map((sub) => (
          <span key={sub} className="shrink-0 inline-block px-2.5 py-1 rounded-full border" style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", borderColor: "#E8E0D8" }}>
            {sub}
          </span>
        ))}
      </div>

      {/* Cards grid */}
      <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <StaggerItem key={vendor.id}>
            <VendorCard vendor={vendor} />
          </StaggerItem>
        ))}
      </StaggerList>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function VendorsPage() {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const publicVendors = usePublicVendors();
  const allVendors = useMemo(() => {
    const extras: Vendor[] = publicVendors.map(vendorFromPublic);
    // Si l'utilisateur courant a un profil vendeur mais n'a pas encore
    // publié (réseau hors ligne par ex.), on l'injecte localement.
    if (userProfile) {
      const me = vendorFromProfile(userProfile);
      if (me && !extras.some((v) => v.name === me.name)) extras.unshift(me);
    }
    // Dédoublonnage par id (publiés > seed).
    const ids = new Set(extras.map((v) => v.id));
    return [...extras, ...seededVendors.filter((v) => !ids.has(v.id))];
  }, [publicVendors, userProfile]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [activeNiche, setActiveNiche] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"niche" | "grid">("niche");
  const [sortBy, setSortBy] = useState<SortKey>("pertinence");
  const [showSort, setShowSort] = useState(false);
  const [supplierTab, setSupplierTab] = useState<"all" | "manufacturer" | "global">("all");

  const filtered = useMemo(() => {
    let results = allVendors.filter((v) => {
      if (supplierTab === "manufacturer" && !(v.badge === "VIP" || v.badge === "TOP")) return false;
      if (supplierTab === "global" && vendorMetrics(v).exports < 4) return false;
      const q = search.toLowerCase();
      const matchSearch =
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.subcategories.some((s) => s.toLowerCase().includes(q));

      let matchFilter = true;
      if (activeFilter === "VIP") matchFilter = v.badge === "VIP";
      else if (activeFilter === "Top vendeurs") matchFilter = v.badge === "TOP";
      else if (activeFilter === "Vérifiés") matchFilter = v.badge === "VERIFIE";
      else if (activeFilter !== "Tous") matchFilter = v.location === activeFilter;

      let matchNiche = true;
      if (activeNiche !== "Tous") {
        matchNiche = v.niche === activeNiche;
      }

      return matchSearch && matchFilter && matchNiche;
    });

    // Sort
    if (sortBy === "rating") results.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "orders") results.sort((a, b) => b.orders - a.orders);
    else if (sortBy === "fiabilite") results.sort((a, b) => b.deliveryRate - a.deliveryRate);

    return results;
  }, [allVendors, search, activeFilter, activeNiche, sortBy, supplierTab]);

  // Group by niche
  const groupedByNiche = useMemo(() => {
    const groups: Record<string, Vendor[]> = {};
    filtered.forEach((v) => {
      if (!groups[v.niche]) groups[v.niche] = [];
      groups[v.niche].push(v);
    });
    return groups;
  }, [filtered]);

  // Compute counts per niche
  const nicheCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allVendors.forEach((v) => {
      counts[v.niche] = (counts[v.niche] || 0) + 1;
    });
    return counts;
  }, [allVendors]);

  const vipVendor = allVendors.find((v) => v.badge === "VIP" && v.orders > 1000) || allVendors[0];
  const isFiltered = activeFilter !== "Tous" || activeNiche !== "Tous" || !!search;

  return (
    <div className="pb-24">
      {/* ─── Hero Section — Alibaba "Suppliers" premium ─── */}
      <div className="relative" style={{ background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
        {/* Bandeau sombre avec halos lumineux + pattern grille subtil */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "radial-gradient(1200px 320px at 80% -10%, rgba(255,106,0,0.22), transparent 60%), radial-gradient(900px 280px at -10% 110%, rgba(14,165,233,0.18), transparent 55%), linear-gradient(135deg, #0B1220 0%, #111827 55%, #1F2937 100%)",
          }}
        >
          {/* grille fine */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.2))",
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-3 pb-6">
            {/* Top bar : retour + breadcrumb + CTA vendre */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-white/65 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
              </button>
              <button
                onClick={() => navigate("/devenir-vendeur")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <Sparkles className="w-3 h-3 text-[#FBBF24]" />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Devenir vendeur</span>
              </button>
            </div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ fontSize: 10, fontWeight: 700, color: "#FF6A00", background: "rgba(255,106,0,0.14)", border: "1px solid rgba(255,106,0,0.4)", letterSpacing: 0.3 }}
                >
                  <ShieldCheck className="w-3 h-3" /> FOURNISSEURS VÉRIFIÉS
                </span>
                <span aria-hidden style={{ fontSize: 14 }}>🇧🇯</span>
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>Bénin · Afrique de l'Ouest</span>
              </div>

              {/* Title + side stat */}
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 26, lineHeight: "30px", letterSpacing: -0.3 }}>
                    Annuaire des <span style={{ color: "#FBBF24" }}>fournisseurs</span>
                  </h1>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginTop: 4, maxWidth: 420 }}>
                    Grossistes, fabricants & importateurs · paiement protégé · devis en 24h
                  </p>
                </div>
                {/* Mini stack d'avatars top vendeurs */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <div className="flex -space-x-2">
                    {[...allVendors].slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="w-8 h-8 rounded-full overflow-hidden bg-white"
                        style={{ border: "2px solid #111827" }}
                        title={v.name}
                      >
                        <img src={v.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <div className="leading-tight">
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      +{Math.max(0, allVendors.length - 4)} actifs
                    </p>
                    <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)" }}>cette semaine</p>
                  </div>
                </div>
              </div>

              {/* Search bar premium : select catégorie + input + bouton orange */}
              <div className="mt-4 flex items-stretch rounded-xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35)" }}>
                <div className="relative hidden md:flex items-center">
                  <select
                    value={activeNiche}
                    onChange={(e) => setActiveNiche(e.target.value)}
                    className="appearance-none bg-transparent pl-3 pr-7 py-3 text-[#0F172A] focus:outline-none cursor-pointer"
                    style={{ fontSize: 12.5, fontWeight: 600, borderRight: "1px solid #E5E7EB" }}
                  >
                    {nicheCategories.slice(0, 12).map((nc) => (
                      <option key={nc.key} value={nc.key}>
                        {nc.key === "Tous" ? "Toutes catégories" : nc.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
                </div>
                <div className="relative flex-1 flex items-center min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Rechercher fournisseur, produit, marque…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-2 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 flex items-center gap-1 transition-colors hover:bg-[#F8FAFC]"
                  style={{ borderLeft: "1px solid #E5E7EB", fontSize: 11.5, fontWeight: 600, color: "#475569" }}
                  title="Filtres"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filtres</span>
                </button>
                <button
                  className="px-5 flex items-center justify-center gap-1.5 transition-colors hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #FF6A00, #F97316)", color: "#fff", fontSize: 13, fontWeight: 700 }}
                  aria-label="Rechercher"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Rechercher</span>
                </button>
              </div>

              {/* Liens rapides "Tendance" */}
              <div className="flex items-center gap-2 mt-3 flex-wrap" style={{ fontSize: 10.5 }}>
                <span style={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
                  Tendance
                </span>
                {["Tissu wax", "Riz importé", "Sneakers", "Bijoux or", "Cosmétiques", "Pièces auto"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSearch(q)}
                    className="px-2 py-0.5 rounded-full hover:bg-white/15 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.82)", fontWeight: 500 }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bandeau stats premium — chevauche la bordure sombre/claire */}
        <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-20">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-xl overflow-hidden bg-white"
            style={{ border: "1px solid #E5E7EB", boxShadow: "0 8px 24px -12px rgba(15,23,42,0.18)" }}
          >
            {[
              { icon: Users, val: <AnimatedNumber value={allVendors.length} />, label: "Fournisseurs", color: "#FF6A00" },
              { icon: LayoutGrid, val: <AnimatedNumber value={nicheCategories.length - 1} />, label: "Catégories", color: "#0EA5E9" },
              { icon: ShieldCheck, val: <AnimatedNumber value={98} suffix="%" />, label: "Satisfaction", color: "#16A34A" },
              { icon: MessageSquare, val: "≤24h", label: "Réponse moy.", color: "#92400E" },
            ].map((s, i) => {
              const Icon = s.icon;
              const isLastCol = (i + 1) % 4 === 0;
              const isLastRowSm = i >= 2;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-3"
                  style={{
                    borderRight: !isLastCol ? "1px solid #F1F5F9" : "none",
                    borderBottom: !isLastRowSm ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}14` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: "17px" }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: "#64748B", lineHeight: "12px", marginTop: 1 }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 8 }} />
        </div>
      </div>

      {/* ─── Niche category pills (always visible, scrollable) ─── */}
      <div className="bg-white border-b" style={{ borderColor: "#F0EBE5" }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {nicheCategories.map((nc) => {
              const isActive = activeNiche === nc.key;
              const cnt = nc.key === "Tous" ? allVendors.length : (nicheCounts[nc.key] || 0);
              return (
                <button
                  key={nc.key}
                  onClick={() => setActiveNiche(nc.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
                    isActive ? "text-white" : "bg-white text-[#6B7280] border-[#E8E0D8] hover:bg-[#FFF7ED]"
                  }`}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    ...(isActive ? { background: nc.color, borderColor: nc.color } : {}),
                  }}
                >
                  <CategoryIcon name={nc.icon} className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {nc.label}
                  <span
                    className="px-1.5 py-0.5 rounded-full"
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      background: isActive ? "rgba(255,255,255,0.25)" : "#F5F0EB",
                      color: isActive ? "#fff" : "#9CA3AF",
                    }}
                  >
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Filter pills (expandable) ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b overflow-hidden"
            style={{ borderColor: "#F0EBE5" }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>
                FILTRER PAR STATUT / VILLE
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl border transition-all ${
                      activeFilter === f
                        ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                        : "bg-white text-[#6B7280] border-[#E8E0D8] hover:bg-[#FFF7ED]"
                    }`}
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Active filter chips ─── */}
      {isFiltered && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {search && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1A1A2E]/5 text-[#1A1A2E]" style={{ fontSize: 11, fontWeight: 600 }}>
                "{search}" <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
              </span>
            )}
            {activeFilter !== "Tous" && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1A1A2E] text-white" style={{ fontSize: 11, fontWeight: 600 }}>
                {activeFilter} <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveFilter("Tous")} />
              </span>
            )}
            {activeNiche !== "Tous" && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8A817] text-white" style={{ fontSize: 11, fontWeight: 600 }}>
                {nicheCategories.find((n) => n.key === activeNiche)?.label || activeNiche}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveNiche("Tous")} />
              </span>
            )}
            <button
              onClick={() => { setSearch(""); setActiveFilter("Tous"); setActiveNiche("Tous"); }}
              style={{ fontSize: 11, fontWeight: 600, color: "#E11D2E" }}
            >
              Tout effacer
            </button>
            <span className="ml-auto" style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF" }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-5">
        {/* ─── Featured Vendor ─── */}
        {!isFiltered && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#E8A817]" />
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>À LA UNE</span>
            </div>
            <FeaturedVendor vendor={vipVendor} />
          </motion.section>
        )}

        {/* ─── Trending section ─── */}
        {!isFiltered && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#E11D2E]" />
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>TENDANCE</span>
              <span className="ml-auto" style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>Top 6 ce mois</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {[...allVendors]
                .sort((a, b) => b.orders - a.orders)
                .slice(0, 6)
                .map((v, i) => {
                  const ni = nicheCategories.find((nc) => nc.key === v.niche) || nicheCategories[0];
                  return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="shrink-0 bg-white rounded-2xl p-3 cursor-pointer"
                    style={{ width: 140, border: "1px solid #F0EBE5" }}
                    onClick={() => navigate((v as { slug?: string }).slug ? `/boutique/${(v as { slug?: string }).slug}` : `/vendeur/${v.id}`)}
                  >
                    <div className="relative mb-2">
                      <div
                        className="w-14 h-14 rounded-xl mx-auto overflow-hidden bg-white"
                        style={{ border: `2px solid ${ni.color}33` }}
                      >
                        <img
                          src={v.avatar}
                          alt={v.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.style.display = "none";
                            const parent = img.parentElement;
                            if (parent && !parent.querySelector("[data-trend-fb]")) {
                              const fb = document.createElement("div");
                              fb.setAttribute("data-trend-fb", "1");
                              fb.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${ni.color}22;color:${ni.color};font-weight:800;font-size:16px;`;
                              fb.textContent = v.name.charAt(0).toUpperCase();
                              parent.appendChild(fb);
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: i === 0 ? "#E8A817" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "#E8E0D8" }}
                      >
                        <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>#{i + 1}</span>
                      </div>
                    </div>
                    <p className="text-center truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, color: "#1A1A2E" }}>
                      {v.name}
                    </p>
                    <p className="text-center truncate" style={{ fontSize: 9, color: "#9CA3AF" }}>{v.category}</p>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-[#E8A817] text-[#E8A817]" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#1A1A2E" }}>{v.rating}</span>
                      <span style={{ fontSize: 9, color: "#9CA3AF" }}>({v.orders})</span>
                    </div>
                  </motion.div>
                  );
                })}
            </div>
          </section>
        )}

        {/* ─── Supplier-type tabs (Alibaba "Manufacturers / Global") ─── */}
        <div className="flex items-center gap-1 mb-3 border-b" style={{ borderColor: "#E5E7EB" }}>
          {[
            { key: "all" as const, label: "Tous", icon: Users },
            { key: "manufacturer" as const, label: "Fabricants", icon: ShieldCheck },
            { key: "global" as const, label: "Multi-pays", icon: Truck },
          ].map((t) => {
            const active = supplierTab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setSupplierTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2.5 transition-colors"
                style={{
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FF6A00" : "#475569",
                  borderBottom: active ? "2px solid #FF6A00" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── Toolbar: View mode toggle + Sort ─── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>
              {isFiltered ? "RÉSULTATS" : "TOUTES LES BOUTIQUES"}
            </span>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: "#E8A817", background: "#E8A81712" }}>
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border hover:bg-[#FFF7ED] transition-colors"
                style={{ borderColor: "#E8E0D8", fontSize: 11, fontWeight: 600, color: "#6B7280" }}
              >
                <SortAsc className="w-3.5 h-3.5" />
                {sortOptions.find((s) => s.key === sortBy)?.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 bg-white rounded-xl border z-20 overflow-hidden"
                    style={{ borderColor: "#E8E0D8", minWidth: 160 }}
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                        className={`w-full text-left px-3.5 py-2.5 transition-colors hover:bg-[#FFF7ED] ${sortBy === opt.key ? "bg-[#FFF7ED]" : ""}`}
                        style={{ fontSize: 12, fontWeight: sortBy === opt.key ? 700 : 500, color: sortBy === opt.key ? "#E8A817" : "#6B7280" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* View mode */}
            <div className="flex items-center gap-1 p-1 bg-[#F5F0EB] rounded-xl">
              <button
                onClick={() => setViewMode("niche")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "niche" ? "bg-white text-[#1A1A2E]" : "text-[#9CA3AF]"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-[#1A1A2E]" : "text-[#9CA3AF]"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Empty state ─── */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-[#E8E0D8] mx-auto mb-3" />
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Aucun vendeur trouvé</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Essayez d'ajuster vos filtres ou votre recherche</p>
            <button
              onClick={() => { setSearch(""); setActiveFilter("Tous"); setActiveNiche("Tous"); }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#1A1A2E] text-white"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* ─── NICHE VIEW: Grouped by category ─── */}
        {filtered.length > 0 && viewMode === "niche" && (
          <div>
            {/* Order: show niches by the nicheCategories order (skipping Tous) */}
            {nicheCategories
              .filter((nc) => nc.key !== "Tous")
              .filter((nc) => groupedByNiche[nc.key] && groupedByNiche[nc.key].length > 0)
              .map((nc) => (
                <NicheCategorySection
                  key={nc.key}
                  vendors={groupedByNiche[nc.key]}
                  nicheInfo={nc}
                />
              ))}
          </div>
        )}

        {/* ─── GRID VIEW: Flat list ─── */}
        {filtered.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
