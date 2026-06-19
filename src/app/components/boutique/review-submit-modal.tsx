import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { addReview } from "../../data/shop-reviews";

export function ReviewSubmitModal({ shopSlug, defaultName, onClose }: { shopSlug: string; defaultName: string; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(defaultName || "");

  const submit = () => {
    const c = comment.trim();
    const n = name.trim();
    if (!n) { toast.error("Indiquez votre nom"); return; }
    if (c.length < 5) { toast.error("Votre commentaire est trop court"); return; }
    addReview({ shopSlug, authorName: n, rating, comment: c });
    toast.success("Avis soumis pour modération. Merci !");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Laisser un avis</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Votre nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marie A."
              className="w-full px-3 py-2 rounded-xl border border-border"
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Note</label>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1"
                  aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                >
                  <Star className={`w-7 h-7 ${s <= rating ? "fill-[#F0B429] text-[#F0B429]" : "text-[#E5E7EB]"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Votre commentaire</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Partagez votre expérience avec cette boutique…"
              className="w-full px-3 py-2 rounded-xl border border-border resize-none"
              style={{ fontSize: 13 }}
            />
          </div>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            Votre avis sera publié après modération du vendeur.
          </p>
          <button
            onClick={submit}
            className="w-full py-2.5 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins", fontWeight: 700, fontSize: 14,
            }}
          >
            Envoyer mon avis
          </button>
        </div>
      </div>
    </div>
  );
}
