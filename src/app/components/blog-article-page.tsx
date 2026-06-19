import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import {
  useBlogEngagement, isBookmarked, toggleBookmark,
  isSubscribed as isArticleSubscribed, toggleSubscribe,
  isHelpfulLiked, toggleHelpful,
  getReplies, addReply,
  getUserReviews, addUserReview,
  getViews, incrementViews,
} from "../data/blog-engagement";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Bookmark,
  Share2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  Scale,
  Star,
  ThumbsUp,
  MessageCircle,
  Heart,
  Bell,
  UserPlus,
  ShoppingCart,
  Send,
  ChevronRight,
  Eye,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { blogArticles } from "../data/blog-articles";

/* ═══════════════════════════════════════════
   ARTICLE REVIEWS (consumer reviews per article)
   ═══════════════════════════════════════════ */
const articleReviews: Record<number, { name: string; location: string; rating: number; text: string; date: string; helpful: number }[]> = {
};

/* ═══════════════════════════════════════════
   BLOG ARTICLES, 12 articles with images
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   BLOG ARTICLE FULL PAGE
   ═══════════════════════════════════════════ */
export function BlogArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useBlogEngagement(); // re-render on engagement changes
  const article = blogArticles.find((a) => a.id === Number(id));
  const articleId = article?.id ?? 0;
  const isSubscribed = articleId ? isArticleSubscribed(articleId) : false;
  const bookmarked = articleId ? isBookmarked(articleId) : false;

  // Réponses ouvertes (par clé de review)
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("");

  // Composition d'avis
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  // Compteur de vues incrémenté une seule fois par montage
  useEffect(() => { if (articleId) incrementViews(articleId); }, [articleId]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FAFAFA]">
        <BookOpen className="w-16 h-16 text-[#D1D5DB] mb-4" />
        <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>Article introuvable</h2>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>Cet article n'existe pas ou a ete supprime.</p>
        <button onClick={() => navigate("/blog")} className="mt-6 px-6 py-3 bg-[#7C3AED] text-white rounded-2xl" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
          Retour au blog
        </button>
      </div>
    );
  }

  const seedReviews = (articleReviews[article.id] || []).map((r, i) => ({ ...r, key: `seed-${article.id}-${i}` }));
  const userReviews = getUserReviews(article.id).map((r) => ({
    key: `user-${r.id}`,
    name: r.name, location: "Vous", rating: r.rating, text: r.text, date: r.date, helpful: r.helpful,
  }));
  const reviews = [...userReviews, ...seedReviews];
  const otherArticles = blogArticles.filter((a) => a.id !== article.id).slice(0, 4);
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0";
  const totalViews = (article.views || 0) + getViews(article.id);

  return (
    <div className="pb-24 bg-[#FAFAFA] overflow-x-hidden">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: 260 }}>
        <div className="absolute inset-0">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-[#0F172A]/20" />
        </div>
        <div className="relative z-10 px-4 pt-4 pb-8 max-w-3xl mx-auto">
          <button onClick={() => navigate("/blog")} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Blog</span>
          </button>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white mb-3" style={{ background: article.color, fontSize: 10, fontWeight: 700 }}>{article.category}</span>
            <h1 className="text-white mb-3" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "28px", letterSpacing: "-0.02em" }}>{article.title}</h1>
            <div className="flex items-center gap-4 text-white/50 flex-wrap" style={{ fontSize: 11 }}>
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {article.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {totalViews.toLocaleString()} vues</span>
              {reviews.length > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" /> {avgRating} ({reviews.length} avis)</span>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Actions */}
      <div className="sticky top-[60px] z-30 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]/60">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1.5 h-5 rounded-full shrink-0" style={{ background: article.color }} />
            <span className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 11, maxWidth: 180 }}>{article.title}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { const on = toggleSubscribe(article.id); toast.success(on ? "Abonné aux alertes !" : "Désabonné"); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all" style={{ background: isSubscribed ? `${article.color}15` : "transparent", color: isSubscribed ? article.color : "#6B7280", fontSize: 10, fontWeight: 600 }}>
              <Bell className="w-3.5 h-3.5" /> {isSubscribed ? "Abonné" : "S'abonner"}
            </button>
            <button
              onClick={() => { const on = toggleBookmark(article.id); toast.success(on ? "Article sauvegardé !" : "Retiré des favoris"); }}
              className="p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
              aria-label="Sauvegarder"
            >
              <Bookmark className="w-4 h-4" style={{ color: bookmarked ? article.color : "#6B7280", fill: bookmarked ? article.color : "transparent" }} />
            </button>
            <button
              onClick={() => { copyToClipboard(window.location.href); toast.success("Lien copié !"); }}
              className="p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
              aria-label="Partager"
            >
              <Share2 className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">

          {/* Lead */}
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#374151", fontWeight: 500 }}>{article.excerpt}</p>
          <div className="h-px bg-[#E5E7EB]" />

          {/* Subscribe CTA inline */}
          <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: `${article.color}06`, borderColor: `${article.color}20` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${article.color}15` }}>
              <Bell className="w-5 h-5" style={{ color: article.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>Ne manquez aucun article</p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>Recevez nos analyses et guides directement dans vos notifications.</p>
            </div>
            <button
              onClick={() => { if (!isSubscribed) { toggleSubscribe(article.id); toast.success("Abonné !"); } else { toast.success("Déjà abonné"); } }}
              className="px-3 py-2 rounded-xl text-white shrink-0 active:scale-95 transition-transform"
              style={{ background: article.color, fontSize: 10, fontWeight: 700 }}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1" />{isSubscribed ? "Abonné" : "S'inscrire"}
            </button>
          </div>

          {/* Article body */}
          {article.content.map((block, i) => {
            if (block.type === "intro") {
              return <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }} style={{ fontSize: 14, lineHeight: 1.9, color: "#374151" }}>{block.text}</motion.p>;
            }
            if (block.type === "section") {
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
                  <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#0F172A" }}>
                    <div className="w-1.5 h-5 rounded-full" style={{ background: article.color }} />{block.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.9, color: "#4B5563", paddingLeft: 14 }}>{block.text}</p>
                </motion.div>
              );
            }
            if (block.type === "image") {
              const img = block as { type: "image"; src: string; caption?: string };
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }} className="rounded-2xl overflow-hidden">
                  <img src={img.src} alt="" className="w-full h-48 sm:h-64 object-cover" />
                  {img.caption && (
                    <p className="bg-[#F3F4F6] px-4 py-2.5 text-muted-foreground" style={{ fontSize: 11, lineHeight: 1.4, fontStyle: "italic" }}>{img.caption}</p>
                  )}
                </motion.div>
              );
            }
            if (block.type === "insight") {
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }} className="rounded-2xl p-4 border-l-4" style={{ background: `${article.color}08`, borderColor: article.color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4" style={{ color: article.color }} />
                    <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12, color: article.color }}>POINT CLE</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.8, color: "#374151" }}>{block.text}</p>
                </motion.div>
              );
            }
            if (block.type === "callout") {
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }} className="rounded-2xl p-5 bg-[#0F172A]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
                    <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12, color: "#4ADE80" }}>CONSEIL IPPOO</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,0.8)" }}>{block.text}</p>
                </motion.div>
              );
            }
            return null;
          })}

          {/* ═══ BUY / SUBSCRIBE / REGISTER CTAs ═══ */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${article.color}, ${article.color}BB)` }}>
              <div className="p-5 text-center">
                <ShoppingCart className="w-8 h-8 text-white/80 mx-auto mb-2" />
                <h4 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 17 }}>Achetez au meilleur prix, maintenant.</h4>
                <p className="text-white/60 mb-4" style={{ fontSize: 11, lineHeight: 1.5 }}>Les prix que vous venez de lire sont disponibles sur IPPOO. Comparez, choisissez, commandez.</p>
                <button onClick={() => navigate("/comparateur")} className="bg-white px-6 py-3 rounded-2xl active:scale-95 transition-transform" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: article.color }}>
                  <Scale className="w-4 h-4 inline mr-1.5" />Ouvrir le comparateur
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/inscription")} className="rounded-2xl p-4 border border-[#E5E7EB] bg-white text-center active:scale-95 transition-transform">
                <UserPlus className="w-6 h-6 mx-auto mb-1.5" style={{ color: article.color }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12, color: "#0F172A" }}>S'inscrire gratuit</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 9, lineHeight: "12px" }}>Rejoignez 12 000+ acheteurs malins</p>
              </button>
              <button
                onClick={() => { const on = toggleSubscribe(article.id); toast.success(on ? "Abonné aux alertes !" : "Désabonné"); }}
                className="rounded-2xl p-4 border bg-white text-center active:scale-95 transition-transform"
                style={{ borderColor: isSubscribed ? article.color : "#E5E7EB" }}
              >
                <Bell className="w-6 h-6 mx-auto mb-1.5" style={{ color: article.color, fill: isSubscribed ? article.color : "transparent" }} />
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12, color: "#0F172A" }}>{isSubscribed ? "Abonné" : "S'abonner"}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 9, lineHeight: "12px" }}>Alertes prix + nouveaux articles</p>
              </button>
            </div>
          </div>

          {/* ═══ CONSUMER REVIEWS ═══ */}
          {(
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#0F172A" }}>
                  <MessageCircle className="w-5 h-5" style={{ color: article.color }} /> Avis des lecteurs
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ fill: s <= Math.round(Number(avgRating)) ? "#FBBF24" : "#E5E7EB", color: s <= Math.round(Number(avgRating)) ? "#FBBF24" : "#E5E7EB" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{avgRating}</span>
                  <span className="text-muted-foreground" style={{ fontSize: 10 }}>({reviews.length})</span>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.map((review, i) => {
                  const key = review.key;
                  const isLiked = isHelpfulLiked(key);
                  const replies = getReplies(key);
                  const isReplyOpen = replyOpen === key;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${article.color}15` }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: article.color }}>{review.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate" style={{ fontSize: 12, fontWeight: 700 }}>
                              {review.name}
                              <CheckCircle2 className="w-3 h-3 text-[#059669] shrink-0" />
                            </p>
                            <p className="text-muted-foreground truncate" style={{ fontSize: 9 }}>{review.location} · {review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3 h-3" style={{ fill: s <= review.rating ? "#FBBF24" : "#E5E7EB", color: s <= review.rating ? "#FBBF24" : "#E5E7EB" }} />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.7, color: "#4B5563" }}>{review.text}</p>
                      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[#F3F4F6]">
                        <button onClick={() => toggleHelpful(key)} className="flex items-center gap-1 transition-colors" style={{ fontSize: 10, fontWeight: 600, color: isLiked ? article.color : "#9CA3AF" }}>
                          <ThumbsUp className="w-3.5 h-3.5" /> Utile ({review.helpful + (isLiked ? 1 : 0)})
                        </button>
                        <button
                          onClick={() => { setReplyOpen(isReplyOpen ? null : key); setReplyText(""); setReplyName(""); }}
                          className="flex items-center gap-1"
                          style={{ fontSize: 10, fontWeight: 600, color: isReplyOpen ? article.color : "#9CA3AF" }}
                        >
                          <Send className="w-3.5 h-3.5" /> {isReplyOpen ? "Annuler" : "Répondre"}{replies.length > 0 && ` (${replies.length})`}
                        </button>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-3 space-y-2 pl-3 border-l-2" style={{ borderColor: `${article.color}30` }}>
                          {replies.map((rep) => (
                            <div key={rep.id} className="rounded-xl bg-[#F8FAFC] p-2.5">
                              <p style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{rep.name} <span className="text-muted-foreground" style={{ fontWeight: 500 }}>· {rep.date}</span></p>
                              <p className="mt-1" style={{ fontSize: 11, lineHeight: 1.6, color: "#4B5563" }}>{rep.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isReplyOpen && (
                        <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-2.5 space-y-2">
                          <input
                            value={replyName} onChange={(e) => setReplyName(e.target.value)}
                            placeholder="Votre nom"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white outline-none"
                            style={{ fontSize: 11 }}
                          />
                          <textarea
                            value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Votre réponse..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white outline-none resize-none"
                            style={{ fontSize: 11 }}
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                const name = replyName.trim() || "Anonyme";
                                const text = replyText.trim();
                                if (text.length < 3) { toast.error("Réponse trop courte"); return; }
                                addReply(key, name, text);
                                setReplyOpen(null); setReplyName(""); setReplyText("");
                                toast.success("Réponse publiée");
                              }}
                              className="px-3 py-1.5 rounded-lg text-white"
                              style={{ background: article.color, fontSize: 11, fontWeight: 700 }}
                            >
                              Publier
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Composer d'avis */}
              {reviewOpen ? (
                <div className="mt-3 rounded-2xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: `${article.color}40` }}>
                  <div className="flex items-center justify-between">
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: article.color }}>Votre avis</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setReviewRating(s)} aria-label={`${s} étoile${s > 1 ? "s" : ""}`}>
                          <Star className="w-5 h-5" style={{ fill: s <= reviewRating ? "#FBBF24" : "#E5E7EB", color: s <= reviewRating ? "#FBBF24" : "#E5E7EB" }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={reviewName} onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Votre nom (ou pseudo)"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white outline-none"
                    style={{ fontSize: 12 }}
                  />
                  <textarea
                    value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white outline-none resize-none"
                    style={{ fontSize: 12 }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setReviewOpen(false)} className="px-3 py-2 rounded-xl text-muted-foreground" style={{ fontSize: 12, fontWeight: 600 }}>Annuler</button>
                    <button
                      onClick={() => {
                        const name = reviewName.trim() || "Anonyme";
                        const text = reviewText.trim();
                        if (text.length < 10) { toast.error("Avis trop court (10 caractères min)"); return; }
                        addUserReview(article.id, name, reviewRating, text);
                        setReviewOpen(false); setReviewName(""); setReviewText(""); setReviewRating(5);
                        toast.success("Merci ! Votre avis est publié.");
                      }}
                      className="px-4 py-2 rounded-xl text-white"
                      style={{ background: article.color, fontSize: 12, fontWeight: 700 }}
                    >
                      Publier l'avis
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReviewOpen(true)}
                  className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  style={{ borderColor: `${article.color}30`, color: article.color, fontSize: 12, fontWeight: 700 }}
                >
                  <MessageCircle className="w-4 h-4" /> Laisser un avis sur cet article
                </button>
              )}
            </div>
          )}

          {/* Author card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${article.color}15` }}>
              <Scale className="w-6 h-6" style={{ color: article.color }} />
            </div>
            <div className="flex-1">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Equipe IPPOO Market</p>
              <p className="text-muted-foreground" style={{ fontSize: 11, lineHeight: 1.4 }}>Nos analyses s'appuient sur les données réelles collectees sur la plateforme.</p>
            </div>
          </div>

          {/* Slogan banner */}
          <div className="rounded-2xl p-5 text-center bg-[#0F172A]">
            <p className="text-[#FBBF24] mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>
              "Achetez malin. Vendez juste. Grandissez ensemble."
            </p>
            <p className="text-white/40" style={{ fontSize: 11 }}>La promesse IPPOO Market</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => navigate("/explorer")} className="px-5 py-2.5 rounded-xl text-white active:scale-95 transition-transform" style={{ background: article.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
                <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />Explorer les produits
              </button>
              <button onClick={() => navigate("/devenir-vendeur")} className="px-5 py-2.5 rounded-xl bg-white/10 text-white active:scale-95 transition-transform" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
                Devenir vendeur <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>

          {/* Related articles */}
          {otherArticles.length > 0 && (
            <div>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#0F172A" }}>A lire aussi</h3>
              <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                {otherArticles.map((a) => (
                  <motion.div key={a.id} onClick={() => navigate(`/blog/article/${a.id}`)} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden cursor-pointer">
                    <div className="relative h-28 overflow-hidden">
                      <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, background: a.color }}>{a.category}</span>
                    </div>
                    <div className="p-3">
                      <h5 className="line-clamp-2 mb-1" style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: "15px" }}>{a.title}</h5>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 9 }}>
                          <span>{a.readTime}</span><span>.</span><span>{a.views?.toLocaleString()} vues</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
