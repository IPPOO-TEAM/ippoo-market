/* ═══════════════════════════════════════════
   IPPOO - Modération des avis (vendeur)
   Liste des avis reçus sur la boutique active, avec
   actions : approuver, rejeter, répondre, supprimer.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  ArrowLeft, Star, CheckCircle2, X, MessageSquare, Trash2, Clock,
} from "lucide-react";
import { AnimatedNumber } from "./animated-number";
import { toast } from "sonner";
import {
  getUserProfile,
  subscribe as subscribeProfile,
  SERVER_SNAPSHOT as PROFILE_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import {
  hydrateMyShops,
  subscribe as subscribeShops,
  getMyShopsSnapshot,
  SERVER_SNAPSHOT as SHOPS_SNAPSHOT,
  listAllShops,
  getActiveShopSlug,
} from "../data/my-shops";
import {
  hydrateShopReviews,
  subscribe as subscribeReviews,
  getShopReviewsSnapshot,
  SERVER_SNAPSHOT as REVIEWS_SNAPSHOT,
  listShopReviews,
  updateReview,
  deleteReview,
  type ShopReview,
  type ReviewStatus,
} from "../data/shop-reviews";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Rejeté",
};
const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: "#F59E0B",
  approved: "#16A34A",
  rejected: "#9CA3AF",
};

export function MyReviewsPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateShopReviews(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeReviews, getShopReviewsSnapshot, () => REVIEWS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const [replyTo, setReplyTo] = useState<ShopReview | null>(null);

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug);
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  if (!isSeller(profile) || !slug) {
    return <Navigate to="/boutique" replace />;
  }

  const reviews = listShopReviews(slug);
  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };
  const avgRating = reviews.filter((r) => r.status === "approved").length
    ? reviews.filter((r) => r.status === "approved").reduce((s, r) => s + r.rating, 0) / reviews.filter((r) => r.status === "approved").length
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Avis clients
          </h1>
          {allShops.length > 1 && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              Boutique : {activeShopName}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground" style={{ fontSize: 11 }}>Note moyenne</div>
          <div className="flex items-center gap-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20 }}>
            <AnimatedNumber value={avgRating} decimals={1} />
            <Star className="w-4 h-4 fill-current" style={{ color: "#F59E0B" }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground" style={{ fontSize: 11 }}>Publiés</div>
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "#16A34A" }}>
            <AnimatedNumber value={counts.approved} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground" style={{ fontSize: 11 }}>En attente</div>
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "#F59E0B" }}>
            <AnimatedNumber value={counts.pending} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-3 -mx-1 px-1">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => {
          const active = filter === s;
          const label = s === "all" ? "Tous" : STATUS_LABELS[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition ${active ? "border-[#E11D2E] bg-[#FEF2F2]" : "border-border bg-white hover:bg-muted/40"}`}
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: active ? "#E11D2E" : "#374151" }}
            >
              {label} <span className="opacity-60">({counts[s]})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            {reviews.length === 0 ? "Aucun avis pour le moment" : "Aucun avis dans cette catégorie"}
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Les avis apparaissent ici après les premiers achats.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              onApprove={() => { updateReview(r.id, { status: "approved" }); toast.success("Avis publié"); }}
              onReject={() => { updateReview(r.id, { status: "rejected" }); toast.success("Avis rejeté"); }}
              onReply={() => setReplyTo(r)}
              onDelete={() => {
                if (confirm("Supprimer cet avis définitivement ?")) {
                  deleteReview(r.id);
                  toast.success("Avis supprimé");
                }
              }}
            />
          ))}
        </div>
      )}

      {replyTo && (
        <ReplyEditor
          review={replyTo}
          onClose={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}

function ReviewRow({
  review, onApprove, onReject, onReply, onDelete,
}: {
  review: ShopReview;
  onApprove: () => void;
  onReject: () => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  const date = new Date(review.createdAt).toLocaleDateString("fr-FR");
  return (
    <div className="bg-white rounded-2xl border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
          <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#E11D2E" }}>
            {review.authorName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>{review.authorName}</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-white"
              style={{ background: STATUS_COLORS[review.status], fontSize: 9, fontWeight: 700 }}
            >
              {STATUS_LABELS[review.status]}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 10 }}>{date}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                style={{ color: "#F59E0B", fill: i <= review.rating ? "currentColor" : "transparent" }}
              />
            ))}
          </div>
          <p className="mt-1.5" style={{ fontSize: 13, lineHeight: 1.4 }}>{review.comment}</p>
          {review.vendorReply && (
            <div className="mt-2 p-2 rounded-lg bg-[#F3F4F6] border-l-2 border-[#E11D2E]">
              <div className="text-muted-foreground mb-0.5" style={{ fontSize: 10, fontWeight: 600 }}>
                Votre réponse
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.4 }}>{review.vendorReply}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 mt-3 flex-wrap">
        {review.status !== "approved" && (
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approuver
          </button>
        )}
        {review.status !== "rejected" && (
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            <X className="w-3.5 h-3.5" />
            Rejeter
          </button>
        )}
        <button
          onClick={onReply}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {review.vendorReply ? "Modifier réponse" : "Répondre"}
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-border hover:bg-[#FEF2F2] hover:border-[#E11D2E] hover:text-[#E11D2E] ml-auto"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ReplyEditor({ review, onClose }: { review: ShopReview; onClose: () => void }) {
  const [reply, setReply] = useState(review.vendorReply ?? "");
  const save = () => {
    updateReview(review.id, { vendorReply: reply.trim() || undefined });
    toast.success("Réponse enregistrée");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Répondre à {review.authorName}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F3F4F6] mb-3" style={{ fontSize: 12, fontStyle: "italic" }}>
          « {review.comment} »
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Merci pour votre retour…"
          className="w-full px-3 py-2 rounded-xl border border-border resize-none"
          style={{ fontSize: 13 }}
        />
        <button
          onClick={save}
          className="w-full mt-3 py-2.5 rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
            fontFamily: "Poppins", fontWeight: 700, fontSize: 14,
          }}
        >
          Enregistrer la réponse
        </button>
      </div>
    </div>
  );
}
