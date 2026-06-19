import { useNavigate } from "react-router";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { CouponStrip, GiftBanner, FlashPromoBanner } from "./promo-widgets";
import { CouponInput } from "./coupon-input";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Store,
  Layers,
  Trash,
} from "lucide-react";
import { usePayments } from "../payments/usePayments";
import {
  cartSubtotal,
  clearCart,
  removeFromCart,
  updateCartQty,
} from "../payments/store";
import { useAdminSettings } from "../admin/settings-store";

export function CartPage() {
  const navigate = useNavigate();
  const state = usePayments();
  const settings = useAdminSettings();

  const items = state.cart;
  const subtotal = cartSubtotal();
  const discount = state.promoDiscount;
  const freeShipping = settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const shippingEstimate = freeShipping ? 0 : settings.shippingStd;
  const amountToFreeShipping = freeShipping || settings.freeShippingThreshold <= 0
    ? 0
    : Math.max(0, settings.freeShippingThreshold - subtotal);
  const freeShippingProgress = settings.freeShippingThreshold > 0
    ? Math.min(100, Math.round((subtotal / settings.freeShippingThreshold) * 100))
    : 100;
  const total = Math.max(0, subtotal + shippingEstimate - discount);
  const sellers = [...new Set(items.map((i) => i.seller))];

  const onQty = (id: number | string, delta: number) => {
    const r = updateCartQty(id, delta);
    if (!r.ok) {
      if (r.reason === "moq") toast.error(`Quantité minimum : ${r.min} (MOQ)`);
      else if (r.reason === "stock") toast.error(`Stock disponible : ${r.max}`);
    }
  };

  const onClearCart = () => {
    if (items.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm("Vider tout le panier ?")) return;
    clearCart();
    toast.success("Panier vidé");
  };

  return (
    <div className="pb-32">
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Panier ({items.length})</h3>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="ml-auto inline-flex items-center gap-1 text-[#FF6A00] px-2.5 py-1.5 rounded-lg hover:bg-[#FEE2E2]"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            <Trash className="w-3.5 h-3.5" /> Vider
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 px-4">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20 }}>Votre panier est vide</h2>
          <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
            Explorez le catalogue et ajoutez des produits en gros
          </p>
          <button
            onClick={() => navigate("/explorer")}
            className="mt-4 px-6 py-3 bg-[#FF6A00] text-white rounded-xl"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
          >
            Explorer le catalogue
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              {sellers.map((seller) => (
                <div key={seller} className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-[#FFF7ED] border-b border-border flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#F97316]" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{seller}</span>
                  </div>
                  {items.filter((i) => i.seller === seller).map((item) => (
                    <div key={item.id} className="p-3 sm:p-4 border-b border-[#F3F4F6] last:border-0">
                      <div className="flex gap-2.5 sm:gap-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate" style={{ fontSize: 12, fontWeight: 600, fontFamily: "Poppins" }}>{item.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <p className="text-[#FF6A00]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
                              {formatPrice(item.price)}
                              <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 400 }}>
                                {" "}/ {(item.unit || "u").slice(0, -1)}
                              </span>
                            </p>
                            {item.moq && item.moq > 1 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFF7ED] text-[#C2410C]" style={{ fontSize: 10, fontWeight: 700 }}>
                                <Layers className="w-2.5 h-2.5" /> MOQ {item.moq}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-[#F3F4F6] rounded-lg">
                              <button
                                onClick={() => onQty(item.id, -1)}
                                aria-label="Diminuer"
                                disabled={item.quantity <= (item.moq ?? 1)}
                                className="p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <span className="px-2 sm:px-3" style={{ fontSize: 12, fontWeight: 700 }}>{item.quantity}</span>
                              <button onClick={() => onQty(item.id, 1)} aria-label="Augmenter" className="p-1.5">
                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 12 }}>
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button onClick={() => removeFromCart(item.id)} aria-label="Retirer" className="text-[#FF6A00] p-1">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4 lg:mt-0">
              <div className="space-y-2 mb-4">
                <CouponStrip code="GROS10" label="Volume" discount="-10% dès 10 cartons" condition="Appliquez dans le champ ci-dessous pour bénéficier de la réduction" color="#FF6B00" expiry="Offre permanente" />
              </div>

              <CouponInput className="mb-4" />

              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Récapitulatif</h4>
                <div className="space-y-2">
                  <div className="flex justify-between" style={{ fontSize: 13 }}>
                    <span className="text-muted-foreground">Sous-total</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: 13 }}>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Transport estimé
                    </span>
                    {freeShipping ? (
                      <span className="text-[#16A34A]" style={{ fontWeight: 700 }}>Offerte</span>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{formatPrice(shippingEstimate)}</span>
                    )}
                  </div>
                  {settings.freeShippingThreshold > 0 && (
                    <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-2.5 mt-1">
                      {freeShipping ? (
                        <p className="text-[#16A34A] flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
                          <Truck className="w-3.5 h-3.5" /> Livraison gratuite débloquée 🎉
                        </p>
                      ) : (
                        <>
                          <p className="text-[#15803D]" style={{ fontSize: 11, fontWeight: 600 }}>
                            Plus que <strong>{formatPrice(amountToFreeShipping)} FCFA</strong> pour la livraison gratuite
                          </p>
                          <div className="h-1.5 rounded-full bg-[#DCFCE7] mt-1.5 overflow-hidden">
                            <div className="h-full bg-[#16A34A] transition-all" style={{ width: `${freeShippingProgress}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-[#16A34A]" style={{ fontSize: 13 }}>
                      <span>Réduction promo</span>
                      <span style={{ fontWeight: 600 }}>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Total</span>
                    <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, color: "#FF6A00" }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-[#16A34A]" style={{ fontSize: 11 }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Paiement protégé par IPPOO</span>
                </div>
              </div>

              <div className="mt-3">
                <GiftBanner
                  text="🎁 +5 000 FCFA = Cadeau offert !"
                  subtext="Ajoutez un article pour recevoir un bonus surprise"
                  link="/explorer"
                />
              </div>

              <div className="mt-3">
                <FlashPromoBanner
                  text="⚡ -30% sur Hygiène cette nuit"
                  subtext="Ajoutez des produits hygiène à prix réduit"
                  link="/explorer?cat=Hygiène"
                  color="#00B341"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed left-0 right-0 px-4 z-40 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
          <div className="max-w-5xl mx-auto">
            <button
              disabled={settings.maintenance}
              data-haptic="medium"
              className="w-full py-4 bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white rounded-xl flex items-center justify-center gap-2 press-feedback disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}
              onClick={() => settings.maintenance ? toast.error("Achats suspendus pour maintenance") : navigate("/checkout")}
            >
              <ShieldCheck className="w-5 h-5" />
              {settings.maintenance ? "Maintenance en cours" : `Valider la commande · ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
