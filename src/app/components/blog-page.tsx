import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Search, BookOpen, Clock, Eye, Star, ChevronRight,
  TrendingUp, Bell, Bookmark, Filter, Newspaper, Tag, Users,
  BarChart3, Truck, Heart, ShoppingCart, Sparkles, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { blogArticles } from "../data/blog-articles";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  useBlogEngagement, toggleBookmark, isBookmarked,
  setNewsletterEmail, getNewsletterEmail, isNotifyEnabled, toggleNotify, getViews,
} from "../data/blog-engagement";

/* ═══════════════════════════════════════════
   PALETTE
   ═══════════════════════════════════════════ */
const P = "#7C3AED";
const PL = "#F5F3FF";
const RED = "#E11D2E";
const GREEN = "#16A34A";
const GOLD = "#E8A817";
const TEAL = "#0D9488";
const ORANGE = "#F97316";
const BLUE = "#3B82F6";

const IMG_HERO = "https://images.unsplash.com/photo-1717065165653-bb853b7e6e7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd2hvbGVzYWxlJTIwbWFya2V0JTIwYWVyaWFsJTIwY29sb3JmdWwlMjBzdGFsbHN8ZW58MXx8fHwxNzczMzM2MDUyfDA&ixlib=rb-4.1.0&q=80&w=1080";

type Tab = "tous" | "favoris" | "cotation" | "guides" | "temoignages" | "analyses";

/* ═══════════════════════════════════════════
   BLOG CATEGORIES
   ═══════════════════════════════════════════ */
const blogCategories: { key: Tab; label: string; icon: LucideIcon; color: string; matchCats: string[] }[] = [
  { key: "tous", label: "Tous", icon: Newspaper, color: P, matchCats: [] },
  { key: "favoris", label: "Favoris", icon: Bookmark, color: RED, matchCats: [] },
  { key: "cotation", label: "Cotation & Prix", icon: BarChart3, color: TEAL, matchCats: ["Cotation", "Analyse marche"] },
  { key: "guides", label: "Guides pratiques", icon: BookOpen, color: ORANGE, matchCats: ["Guide pratique", "Education", "Conseils", "Comparatif"] },
  { key: "temoignages", label: "Temoignages", icon: Heart, color: "#EC4899", matchCats: ["Temoignage"] },
  { key: "analyses", label: "Secteurs", icon: Tag, color: BLUE, matchCats: ["Alimentaire", "Textile & Mode", "Electronique", "Nettoyage", "BTP & Materiaux", "Innovation", "Logistique", "Equipements"] },
];

export function BlogPage() {
  const navigate = useNavigate();
  useBlogEngagement(); // re-render on engagement changes
  const [activeTab, setActiveTab] = useState<Tab>("tous");
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState(getNewsletterEmail() ?? "");
  const newsletterDone = !!getNewsletterEmail();
  const notifyOn = isNotifyEnabled();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchQ), 250);
    return () => clearTimeout(id);
  }, [searchQ]);

  const filtered = useMemo(() => {
    const cat = blogCategories.find(c => c.key === activeTab);
    let articles = [...blogArticles];
    if (activeTab === "favoris") {
      articles = articles.filter(a => isBookmarked(a.id));
    } else if (cat && cat.matchCats.length > 0) {
      articles = articles.filter(a => cat.matchCats.includes(a.category));
    }
    if (debouncedQ) {
      const q = debouncedQ.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return articles;
  }, [activeTab, debouncedQ]);

  const featuredArticles = blogArticles.filter(a => a.featured).slice(0, 3);
  const latestArticles = [...blogArticles].sort((a, b) => b.id - a.id).slice(0, 5);
  const popularArticles = [...blogArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const cotationArticles = blogArticles.filter(a => a.category === "Cotation");

  const totalViews = blogArticles.reduce((s, a) => s + (a.views || 0), 0);

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden" style={{ background: "#FFF7ED" }}>
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <BookOpen className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Blog IPPOO</h1>
          <p style={{ fontSize: 10, color: "#6B7280" }}>{blogArticles.length} articles · Guides, analyses & cotations</p>
        </div>
        <button
          onClick={() => { const on = toggleNotify(); toast.success(on ? "Notifications blog activées" : "Notifications blog désactivées"); }}
          className="p-2 rounded-lg hover:bg-gray-100 relative"
          aria-label="Notifications du blog"
        >
          <Bell className="w-4.5 h-4.5" style={{ color: notifyOn ? P : "#6B7280", fill: notifyOn ? P : "transparent" }} />
          {notifyOn && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: P }} />}
        </button>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ height: 150 }}>
        <ImageWithFallback src={IMG_HERO} alt="Blog IPPOO" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.88), rgba(91,33,182,0.78))" }} />
        <div className="absolute inset-0 flex items-center px-4">
          <div className="flex-1">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#FFF", lineHeight: 1.15 }}>
              Informations<br />& Analyses
            </p>
            <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
              Cotations, guides, temoignages & tendances du marche
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#FFF" }}>{blogArticles.length}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>Articles</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-center">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#FFF" }}>{(totalViews / 1000).toFixed(0)}k</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>Lectures</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="px-4 mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher un article, un sujet..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:outline-none"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {blogCategories.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0"
              style={{ fontSize: 11, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? tab.color : "#FFF", color: on ? "#FFF" : "#6B7280" }}
            >
              <TI className="w-3.5 h-3.5" /> {tab.label}
              {tab.key === "favoris" && (() => {
                const n = blogArticles.filter(a => isBookmarked(a.id)).length;
                return n > 0 ? (
                  <span className="ml-0.5 px-1.5 py-px rounded-full" style={{ fontSize: 9, fontWeight: 800, background: on ? "rgba(255,255,255,0.25)" : `${RED}15`, color: on ? "#FFF" : RED }}>{n}</span>
                ) : null;
              })()}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-4">

        {/* ═══════════════════════════════════
            ONGLET "TOUS", CONTENU ENRICHI
            ═══════════════════════════════════ */}
        {activeTab === "tous" && !searchQ && (
          <>
            {/* FEATURED / A LA UNE */}
            <div>
              <h2 className="mb-2.5 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                <Sparkles className="w-4 h-4" style={{ color: GOLD }} /> A la une
              </h2>
              <div className="space-y-3">
                {featuredArticles.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/blog/article/${a.id}`)}
                    className="w-full bg-white rounded-2xl overflow-hidden text-left"
                  >
                    {i === 0 ? (
                      <>
                        <div className="relative h-40 overflow-hidden">
                          <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-white" style={{ fontSize: 9, fontWeight: 700, background: a.color }}>{a.category}</span>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white line-clamp-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, lineHeight: "19px" }}>{a.title}</h3>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-gray-500 line-clamp-2 mb-2" style={{ fontSize: 12, lineHeight: 1.5 }}>{a.excerpt}</p>
                          <div className="flex items-center gap-3 text-gray-400" style={{ fontSize: 10 }}>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.readTime}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views?.toLocaleString()}</span>
                            <span>{a.date}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3 p-3">
                        <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0">
                          <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, background: a.color }}>{a.category}</span>
                          <h4 className="line-clamp-2 mt-1" style={{ fontSize: 12, fontWeight: 700, lineHeight: "15px" }}>{a.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5 text-gray-400" style={{ fontSize: 10 }}>
                            <span>{a.readTime}</span>
                            <span>{a.views?.toLocaleString()} vues</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* COTATION SECTION */}
            {cotationArticles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                    <BarChart3 className="w-4 h-4" style={{ color: TEAL }} /> Cotation & Prix
                  </h2>
                  <button onClick={() => setActiveTab("cotation")} className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: TEAL }}>
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {cotationArticles.slice(0, 4).map(a => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/blog/article/${a.id}`)}
                      className="w-56 shrink-0 bg-white rounded-2xl overflow-hidden text-left"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, background: TEAL }}>Cotation</span>
                      </div>
                      <div className="p-2.5">
                        <h5 className="line-clamp-2" style={{ fontSize: 11, fontWeight: 700, lineHeight: "14px" }}>{a.title}</h5>
                        <div className="flex items-center gap-2 mt-1 text-gray-400" style={{ fontSize: 9 }}>
                          <span>{a.readTime}</span>
                          <span>{a.views?.toLocaleString()} vues</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA COTATION */}
            <button
              onClick={() => navigate("/cotation")}
              className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #065F46)` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15 shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#FFF" }}>Cotation en temps reel</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Suivez 32 produits sur 16 categories</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 shrink-0" />
            </button>

            {/* POPULAR */}
            <div>
              <h2 className="mb-2.5 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                <TrendingUp className="w-4 h-4" style={{ color: RED }} /> Les plus lus
              </h2>
              <div className="space-y-2">
                {popularArticles.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/blog/article/${a.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl text-left"
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: i < 3 ? `${RED}15` : "#F3F4F6", fontSize: 11, fontWeight: 800, color: i < 3 ? RED : "#9CA3AF" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-gray-400" style={{ fontSize: 10 }}>
                        <span className="px-1.5 py-0 rounded" style={{ fontSize: 9, fontWeight: 600, color: a.color, background: `${a.color}12` }}>{a.category}</span>
                        <span>{a.views?.toLocaleString()} vues</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* NEWSLETTER */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#2D2B55] rounded-2xl p-5 text-center">
              <Newspaper className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#FFF" }}>Newsletter IPPOO</h3>
              <p className="text-white/50 mt-1 mb-4" style={{ fontSize: 12 }}>
                Recevez nos analyses et cotations chaque semaine
              </p>
              {newsletterDone ? (
                <div className="rounded-xl bg-white/10 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-left">
                    <p className="text-white truncate" style={{ fontSize: 12, fontWeight: 700 }}>Inscrit : {getNewsletterEmail()}</p>
                    <p className="text-white/50" style={{ fontSize: 10 }}>Vous recevrez nos analyses chaque semaine.</p>
                  </div>
                  <button
                    onClick={() => { setNewsletterEmail(null); setSubscribedEmail(""); toast.success("Désinscrit de la newsletter"); }}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white/80 shrink-0"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    Se désabonner
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email" value={subscribedEmail} onChange={e => setSubscribedEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ fontSize: 12 }}
                  />
                  <button
                    onClick={() => {
                      const e = subscribedEmail.trim();
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Email invalide"); return; }
                      setNewsletterEmail(e);
                      toast.success("Inscription confirmée !");
                    }}
                    className="px-4 py-2.5 rounded-xl text-white shrink-0"
                    style={{ background: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
                  >
                    S'inscrire
                  </button>
                </div>
              )}
            </div>

            {/* LATEST */}
            <div>
              <h2 className="mb-2.5 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                <Clock className="w-4 h-4" style={{ color: BLUE }} /> Derniers articles
              </h2>
              <div className="space-y-2.5">
                {latestArticles.map(a => (
                  <ArticleCard key={a.id} article={a} navigate={navigate} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            FILTERED RESULTS
            ═══════════════════════════════════ */}
        {(activeTab !== "tous" || searchQ) && (
          <>
            <div className="flex items-center justify-between">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                {filtered.length} article{filtered.length > 1 ? "s" : ""}
                {searchQ && <span className="text-gray-400" style={{ fontWeight: 500 }}> pour « {searchQ} »</span>}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                {activeTab === "favoris" ? <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" /> : <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                  {activeTab === "favoris" ? "Aucun favori pour le moment" : "Aucun article trouvé"}
                </p>
                <p className="text-gray-400 mt-1" style={{ fontSize: 12 }}>
                  {activeTab === "favoris"
                    ? "Touchez l'icône signet sur un article pour le retrouver ici."
                    : "Essayez d'autres mots-clés ou une autre catégorie."}
                </p>
                {activeTab === "favoris" && (
                  <button onClick={() => setActiveTab("tous")} className="mt-4 px-4 py-2 rounded-xl text-white" style={{ background: P, fontSize: 12, fontWeight: 700 }}>
                    Parcourir les articles
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(a => (
                  <ArticleCard key={a.id} article={a} navigate={navigate} />
                ))}
              </div>
            )}

            {/* CTA cotation for cotation tab */}
            {activeTab === "cotation" && (
              <button
                onClick={() => navigate("/cotation")}
                className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
                style={{ background: `linear-gradient(135deg, ${TEAL}, #065F46)` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 shrink-0">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: "#FFF" }}>Voir les cotations en direct</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>32 produits · 16 categories · Temps reel</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/60 shrink-0" />
              </button>
            )}
          </>
        )}

        {/* ALL CATEGORIES (tous tab, no search) */}
        {activeTab === "tous" && !searchQ && (
          <div>
            <h2 className="mb-2.5 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
              <Tag className="w-4 h-4" style={{ color: P }} /> Par categorie
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {blogCategories.filter(c => c.key !== "tous").map(cat => {
                const CatIcon = cat.icon;
                const count = cat.key === "favoris"
                  ? blogArticles.filter(a => isBookmarked(a.id)).length
                  : cat.matchCats.length > 0
                    ? blogArticles.filter(a => cat.matchCats.includes(a.category)).length
                    : blogArticles.length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className="bg-white rounded-xl p-3.5 text-left flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cat.color}12` }}>
                      <CatIcon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700 }}>{cat.label}</p>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{count} articles</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ARTICLE CARD COMPONENT
   ═══════════════════════════════════════════ */
function ArticleCard({ article: a, navigate }: { article: typeof blogArticles[0]; navigate: ReturnType<typeof useNavigate> }) {
  const bookmarked = isBookmarked(a.id);
  const totalViews = (a.views || 0) + getViews(a.id);
  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden flex gap-3 p-3 relative">
      <button onClick={() => navigate(`/blog/article/${a.id}`)} className="absolute inset-0" aria-label={a.title} />
      <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0 relative pointer-events-none">
        <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, background: a.color }}>{a.category}</span>
          {a.featured && <Star className="w-3 h-3" style={{ color: GOLD, fill: GOLD }} />}
        </div>
        <h4 className="line-clamp-2" style={{ fontSize: 12, fontWeight: 700, lineHeight: "15px", color: "#1A1A2E" }}>{a.title}</h4>
        <div className="flex items-center gap-2 mt-1.5 text-gray-400 flex-wrap" style={{ fontSize: 10 }}>
          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.readTime}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {totalViews.toLocaleString()}</span>
          <span>{a.date}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); const on = toggleBookmark(a.id); toast.success(on ? "Article ajouté aux favoris" : "Retiré des favoris"); }}
        className="relative shrink-0 self-start p-1.5 rounded-lg hover:bg-gray-100"
        aria-label={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Bookmark className="w-4 h-4" style={{ color: bookmarked ? RED : "#9CA3AF", fill: bookmarked ? RED : "transparent" }} />
      </button>
    </div>
  );
}