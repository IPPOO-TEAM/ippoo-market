import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X, Sparkles, Trophy, AlertTriangle, Scale, BadgeCheck, MapPin, Star,
  TrendingDown, TrendingUp, Minus, Globe, ChevronDown, MessageCircle,
  ShoppingCart, Bell,
} from "lucide-react";
import { formatPrice } from "../mock-data";
import {
  categoryColors, quantityModes, getProductReviews,
  pushAlertForProduct, persistDevisIntent,
  type ComparisonEntry, type SellerEntry,
} from "./data";

export function ComparisonDetailModal({ entry, onClose }: { entry: ComparisonEntry; onClose: () => void }) {
  const navigate = useNavigate();
  const [qtyMode, setQtyMode] = useState("gros");
  const [showExternals, setShowExternals] = useState(true);
  const catColor = categoryColors[entry.category] || "#6B7280";

  const getPriceByMode = (seller: SellerEntry) => {
    switch (qtyMode) {
      case "detail": return seller.priceDetail;
      case "semi": return seller.priceSemiGros;
      case "gros": return seller.priceGros;
      case "volume": return seller.priceVolume;
      default: return seller.priceGros;
    }
  };

  const sortedSellers = [...entry.sellers].sort((a, b) => getPriceByMode(a) - getPriceByMode(b));
  const bestPrice = getPriceByMode(sortedSellers[0]);
  const worstPrice = getPriceByMode(sortedSellers[sortedSellers.length - 1]);
  const spread = worstPrice > 0 ? Math.round(((worstPrice - bestPrice) / bestPrice) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 300, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 300, scale: 0.95 }} transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()} className="bg-[#FAFAFA] rounded-t-[28px] sm:rounded-[28px] w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="relative h-28 overflow-hidden rounded-t-[28px]">
          <img src={entry.image} alt={entry.productName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/30 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-white" style={{ background: catColor, fontSize: 9, fontWeight: 700 }}>{entry.category}</span>
              {entry.isSelection && (
                <span className="px-2 py-0.5 bg-[#D97706] text-white rounded-full flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 800 }}>
                  <Sparkles className="w-2.5 h-2.5" /> SELECTION
                </span>
              )}
            </div>
            <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>{entry.productName}</h3>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div className="rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}CC)` }}>
            <Trophy className="w-5 h-5 text-white/80 shrink-0" />
            <div className="flex-1">
              <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>-{entry.economieVsExterne}% vs enseignes</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>{formatPrice(bestPrice)}</p>
              <p className="text-white/60" style={{ fontSize: 7 }}>IPPOO</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Min", value: formatPrice(bestPrice), color: "#059669", bg: "#ECFDF5" },
              { label: "Moy.", value: formatPrice(Math.round(sortedSellers.reduce((a, s) => a + getPriceByMode(s), 0) / sortedSellers.length)), color: "#F97316", bg: "#FFF7ED" },
              { label: "Max", value: formatPrice(worstPrice), color: "#EF4444", bg: "#FEF2F2" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-2 text-center" style={{ background: s.bg }}>
                <p className="text-muted-foreground" style={{ fontSize: 8, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 11, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {spread > 15 && (
            <div className="bg-[#FFFBEB] rounded-xl p-2 flex items-center gap-1.5 border border-[#E8A817]/15">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <p style={{ fontSize: 9, color: "#92400E" }}>
                <strong>Ecart {spread}%</strong>, comparez conditions avant de choisir.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl p-2 border border-[#E5E7EB]">
            <div className="grid grid-cols-4 gap-1">
              {quantityModes.map((m) => {
                const MIcon = m.icon;
                return (
                  <button key={m.key} onClick={() => setQtyMode(m.key)} className="py-1.5 rounded-lg text-center transition-all" style={{ background: qtyMode === m.key ? catColor : "#F3F4F6", color: qtyMode === m.key ? "#fff" : "#6B7280", fontSize: 8, fontWeight: 700 }}>
                    <MIcon className="w-3 h-3 mx-auto mb-px" />{m.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1 mb-2" style={{ fontSize: 11, fontWeight: 700, color: catColor }}>
              <Scale className="w-3.5 h-3.5" /> Vendeurs IPPOO ({sortedSellers.length})
            </p>
            <div className="space-y-1.5">
              {sortedSellers.map((seller, i) => {
                const price = getPriceByMode(seller);
                return (
                  <div key={seller.name} onClick={() => { navigate("/messagerie"); onClose(); toast.success(`Ouverture du chat avec ${seller.name}`); }} className="rounded-2xl overflow-hidden border cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: i === 0 ? catColor : "#E5E7EB", borderWidth: i === 0 ? 1.5 : 1, background: i === 0 ? `${catColor}08` : "#fff" }}>
                    {seller.badge && (
                      <div className="py-0.5 text-center text-white" style={{ background: catColor, fontSize: 8, fontWeight: 800, letterSpacing: "0.05em" }}>{seller.badge}</div>
                    )}
                    <div className="p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: i === 0 ? catColor : "#E5E7EB", color: i === 0 ? "#fff" : "#6B7280", fontSize: 9, fontWeight: 800 }}>{i + 1}</span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate" style={{ fontSize: 11, fontWeight: 700 }}>
                              {seller.name}
                              {seller.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: catColor }} />}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5 text-muted-foreground" style={{ fontSize: 8 }}><MapPin className="w-2.5 h-2.5" /> {seller.zone}</span>
                              <span className="flex items-center gap-0.5" style={{ fontSize: 8 }}><Star className="w-2.5 h-2.5 fill-[#F0B429] text-[#F0B429]" /> {seller.rating}</span>
                              <span className="flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 600, color: seller.trend === "down" ? "#059669" : seller.trend === "up" ? "#EF4444" : "#9CA3AF" }}>
                                {seller.trend === "down" ? <TrendingDown className="w-2.5 h-2.5" /> : seller.trend === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                                {seller.trendPercent}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 14, color: i === 0 ? catColor : "#0F172A" }}>{formatPrice(price)}</p>
                          <p className="text-muted-foreground" style={{ fontSize: 8 }}>/{entry.unit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {entry.externalPrices.length > 0 && (
            <div>
              <button onClick={() => setShowExternals(!showExternals)} className="flex items-center justify-between w-full mb-2">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}><Globe className="w-3.5 h-3.5 inline mr-1" />Enseignes externes ({entry.externalPrices.length})</p>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showExternals ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showExternals && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1.5 overflow-hidden">
                    {entry.externalPrices.sort((a, b) => a.price - b.price).map((ep) => {
                      const diff = Math.round(((ep.price - bestPrice) / bestPrice) * 100);
                      const StoreIcon = ep.store.icon;
                      return (
                        <div key={ep.store.name} className="bg-white rounded-2xl p-2.5 border border-[#E5E7EB] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ep.store.color}15` }}>
                            <StoreIcon className="w-4 h-4" style={{ color: ep.store.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontSize: 11, fontWeight: 600 }}>{ep.store.name}</p>
                            <span className="text-muted-foreground" style={{ fontSize: 8 }}>{ep.store.location}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>{formatPrice(ep.price)}</p>
                            <p style={{ fontSize: 8, fontWeight: 700, color: "#EF4444" }}>+{diff}% vs IPPOO</p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 mb-2" style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>
              <MessageCircle className="w-3.5 h-3.5" style={{ color: catColor }} /> Avis consommateurs
            </p>
            <div className="space-y-1.5">
              {getProductReviews(entry.productId).map((rev, ri) => (
                <div key={ri} className="bg-white rounded-xl p-2.5 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${catColor}15`, fontSize: 8, fontWeight: 800, color: catColor }}>{rev.name.charAt(0)}</div>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{rev.name}</span>
                      <span className="text-muted-foreground" style={{ fontSize: 8 }}>{rev.location}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-2.5 h-2.5" style={{ fill: s <= rev.rating ? "#FBBF24" : "#E5E7EB", color: s <= rev.rating ? "#FBBF24" : "#E5E7EB" }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 10, lineHeight: "14px", color: "#4B5563" }}>{rev.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <button onClick={() => { navigate(`/produit/${entry.productId}`); onClose(); }} className="w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: catColor, fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}>
              <ShoppingCart className="w-4 h-4" /> Acheter sur IPPOO
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => { pushAlertForProduct(entry.productName); toast.success("Alerte créée. Voir vos alertes.", { action: { label: "Ouvrir", onClick: () => { navigate("/cotation"); onClose(); } } }); }} className="py-2 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center gap-1 active:scale-[0.97] transition-transform" style={{ fontSize: 9, fontWeight: 700, color: catColor }}>
                <Bell className="w-3 h-3" /> Alertes
              </button>
              <button onClick={() => { persistDevisIntent(entry.productName, entry.productId, sortedSellers[0]?.name); navigate("/devis"); onClose(); }} className="py-2 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center gap-1 active:scale-[0.97] transition-transform" style={{ fontSize: 9, fontWeight: 700, color: "#6B7280" }}>
                <Scale className="w-3 h-3" /> Devis
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
