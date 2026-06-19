import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Truck, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { usePayments } from "../payments/usePayments";
import { cartSubtotal, clearCart } from "../payments/store";
import { PaymentDialog } from "../payments/PaymentDialog";
import { useAdminSettings } from "../admin/settings-store";

export function CheckoutPage() {
  const navigate = useNavigate();
  const state = usePayments();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState({ name: "", phone: "", city: "Cotonou", line: "", note: "" });
  const [shipping, setShipping] = useState<"std" | "express">("std");
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const settings = useAdminSettings();
  const items = state.cart;
  const subtotal = cartSubtotal();
  const freeShipping = settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const baseShipping = shipping === "express" ? settings.shippingExpress : settings.shippingStd;
  const shippingCost = freeShipping ? 0 : baseShipping;
  const discount = state.promoDiscount;
  const total = useMemo(() => Math.max(0, subtotal + shippingCost - discount), [subtotal, shippingCost, discount]);
  const vatIncluded = useMemo(
    () => settings.vatRate > 0 ? Math.round((total * settings.vatRate) / (100 + settings.vatRate)) : 0,
    [total, settings.vatRate],
  );
  const amountToFreeShipping = freeShipping || settings.freeShippingThreshold <= 0
    ? 0
    : Math.max(0, settings.freeShippingThreshold - subtotal);

  useEffect(() => {
    if (!done && items.length === 0) {
      // Pas de panier : rediriger
      navigate("/panier", { replace: true });
    }
  }, [items.length, done, navigate]);

  const validateAddress = () => {
    if (!address.name.trim() || !address.phone.trim() || !address.line.trim()) {
      toast.error("Renseignez nom, téléphone et adresse");
      return false;
    }
    if (!/^\+?\d[\d\s]{6,}$/.test(address.phone)) {
      toast.error("Numéro de téléphone invalide");
      return false;
    }
    return true;
  };

  if (settings.maintenance) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center pb-24">
        <div className="w-20 h-20 rounded-2xl bg-[#FEF3C7] flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-10 h-10 text-[#F0B429]" />
        </div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>Achats temporairement suspendus</h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
          La marketplace est en maintenance. Merci de réessayer dans quelques instants.
        </p>
        <button onClick={() => navigate("/")} className="mt-6 px-5 py-3 rounded-xl bg-[#FF6A00] text-white" style={{ fontWeight: 700 }}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center pb-24">
        <div className="w-20 h-20 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
        </div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>Commande confirmée</h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
          Votre numéro&nbsp;: <strong>{done.id}</strong>
        </p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
          Total payé&nbsp;: <strong>{formatPrice(done.total)} FCFA</strong>
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate("/commandes")} className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white" style={{ fontWeight: 700 }}>
            Mes commandes
          </button>
          <button onClick={() => navigate("/")} className="flex-1 py-3 rounded-xl border border-border" style={{ fontWeight: 700 }}>
            Accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => (step > 1 ? setStep((step - 1) as 1 | 2) : navigate(-1))} aria-label="Retour" className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Paiement</h3>
        <span className="ml-auto text-muted-foreground" style={{ fontSize: 12 }}>Étape {step} / 3</span>
      </div>

      <div className="px-4 pt-4 flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#E11D2E]" : "bg-muted"}`} />
        ))}
      </div>

      <div className="p-4 space-y-4">
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[#E11D2E]" />
              <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Adresse de livraison</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input aria-label="Nom complet" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Nom complet" className="px-3 py-2.5 rounded-xl border border-border bg-input-background" />
              <input aria-label="Téléphone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="Téléphone (+229…)" className="px-3 py-2.5 rounded-xl border border-border bg-input-background" />
              <select aria-label="Ville" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="px-3 py-2.5 rounded-xl border border-border bg-input-background">
                {["Cotonou", "Porto-Novo", "Parakou", "Abomey", "Bohicon", "Lokossa", "Natitingou"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input aria-label="Adresse" value={address.line} onChange={(e) => setAddress({ ...address, line: e.target.value })} placeholder="Quartier, rue, repère" className="sm:col-span-1 px-3 py-2.5 rounded-xl border border-border bg-input-background" />
              <textarea aria-label="Note livreur" value={address.note} onChange={(e) => setAddress({ ...address, note: e.target.value })} placeholder="Note pour le livreur (optionnel)" className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-border bg-input-background min-h-[70px]" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-[#F97316]" />
              <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Mode de livraison</h4>
            </div>
            {[
              { id: "std", label: "Standard (24-48 h)", price: settings.shippingStd },
              { id: "express", label: "Express (même jour)", price: settings.shippingExpress },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setShipping(opt.id as "std" | "express")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border ${shipping === opt.id ? "border-[#E11D2E] bg-[#FFF7ED]" : "border-border bg-card"}`}
              >
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
                {freeShipping ? (
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground line-through" style={{ fontSize: 12 }}>{formatPrice(opt.price)}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#16A34A] text-white" style={{ fontSize: 11, fontWeight: 800 }}>OFFERTE</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: "Poppins", fontWeight: 700 }}>{formatPrice(opt.price)} FCFA</span>
                )}
              </button>
            ))}
            {amountToFreeShipping > 0 && (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Plus que <strong>{formatPrice(amountToFreeShipping)} FCFA</strong> pour la livraison gratuite.
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Récapitulatif</h4>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between" style={{ fontSize: 12 }}>
                  <span className="truncate mr-2">{it.name} × {it.quantity}</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-2xl bg-muted">
              <Row label="Sous-total" value={`${formatPrice(subtotal)} FCFA`} />
              <Row
                label="Livraison"
                value={shippingCost === 0 ? "Offerte" : `${formatPrice(shippingCost)} FCFA`}
              />
              {discount > 0 && <Row label={`Promo ${state.promoCode || ""}`} value={`-${formatPrice(discount)} FCFA`} />}
              <div className="border-t border-border my-2" />
              <Row label="Total" value={`${formatPrice(total)} FCFA`} bold />
              {vatIncluded > 0 && (
                <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
                  Dont TVA {settings.vatRate}% : {formatPrice(vatIncluded)} FCFA
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="fixed left-0 right-0 bg-background border-t border-border px-4 py-3 z-[55] bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !validateAddress()) return;
                setStep((step + 1) as 2 | 3);
              }}
              data-haptic="light"
              className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white press-feedback"
              style={{ fontWeight: 700 }}
            >
              Continuer
            </button>
          ) : (
            <button
              onClick={() => setPayOpen(true)}
              data-haptic="success"
              className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white press-feedback"
              style={{ fontWeight: 700 }}
            >
              Procéder au paiement · {formatPrice(total)} FCFA
            </button>
          )}
        </div>
      </div>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onSuccess={(orderId) => {
          setPayOpen(false);
          setDone({ id: orderId, total });
          clearCart();
        }}
        payInputBase={{
          items,
          subtotal,
          shipping: shippingCost,
          discount,
          total,
          address,
          shippingMode: shipping,
        }}
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1" style={{ fontSize: 13, fontWeight: bold ? 800 : 500 }}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span style={{ fontFamily: "Poppins" }}>{value}</span>
    </div>
  );
}
