/* ═══════════════════════════════════════════
   IPPOO — Mes prix surveillés
   Liste les produits surveillés via readPriceWatchList()
   et affiche les deltas 7 j / 30 j en temps réel.
   ═══════════════════════════════════════════ */

import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, BellOff, TrendingDown, TrendingUp, Minus, Scale, BellRing, ChevronRight } from "lucide-react";
import {
  getWatchedPriceItems,
  subscribeWatchList,
  toggleProductWatch,
  type WatchedPriceItem,
} from "./comparateur/data";

function getSnapshot(): WatchedPriceItem[] {
  return getWatchedPriceItems();
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const positive = value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  // baisse = bon pour l'acheteur → vert ; hausse → rouge.
  const color = neutral ? "#64748B" : positive ? "#DC2626" : "#059669";
  const bg = neutral ? "#F1F5F9" : positive ? "#FEF2F2" : "#ECFDF5";
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
      style={{ background: bg, color, fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}
    >
      <Icon className="w-3 h-3" />
      <span>{positive ? "+" : ""}{value.toFixed(1)}%</span>
      <span className="opacity-70" style={{ fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function MyWatchedPricesPage() {
  const navigate = useNavigate();
  const items = useSyncExternalStore(subscribeWatchList, getSnapshot, getSnapshot);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-32 lg:pb-8 overflow-x-hidden">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted" aria-label="Retour">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            <BellRing className="w-5 h-5 text-[#059669]" />
            Mes prix surveillés
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            Suivez l'évolution des prix de vos produits préférés en temps réel.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center mt-4">
          <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            Aucun prix surveillé
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Depuis la fiche d'un produit, activez « Surveiller le prix » pour recevoir des alertes en cas de baisse.
          </p>
          <button
            onClick={() => navigate("/comparateur")}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10B981 100%)", fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <Scale className="w-4 h-4" />
            Ouvrir le comparateur
          </button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {items.map((it) => {
            const economieFCFA = Math.max(0, it.prixMoyen - it.prixIppoo);
            return (
              <div
                key={it.productId}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:border-[#059669]/40 transition-colors"
              >
                <button
                  onClick={() => navigate(`/comparateur/produit/${it.productId}`)}
                  className="w-full flex items-stretch gap-3 p-3 text-left"
                >
                  <img
                    src={it.image}
                    alt={it.productName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
                        {it.productName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{it.category}</span>
                        {it.bestSellerName && (
                          <span className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
                            · {it.bestSellerName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TrendBadge value={it.evolution7j} label="7 j" />
                      <TrendBadge value={it.evolution30j} label="30 j" />
                      {it.economieVsExterne > 0 && (
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-lg"
                          style={{ background: "#FFF7ED", color: "#C2410C", fontSize: 11, fontWeight: 700, fontFamily: "Poppins" }}
                        >
                          -{it.economieVsExterne}% vs externe
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-right">
                      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#059669" }}>
                        {it.prixIppoo.toLocaleString("fr-FR")}
                      </div>
                      <div className="text-muted-foreground" style={{ fontSize: 10 }}>
                        FCFA / {it.unit}
                      </div>
                      {economieFCFA > 0 && (
                        <div style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>
                          −{economieFCFA.toLocaleString("fr-FR")}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-[#FAFAFA]">
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Prix moyen marché : <strong style={{ color: "#0F172A" }}>{it.prixMoyen.toLocaleString("fr-FR")} FCFA</strong>
                  </span>
                  <button
                    onClick={() => {
                      toggleProductWatch(it.productId);
                      toast.success(`« ${it.productName} » retiré de la surveillance`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors"
                    style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
