import { logger } from "../lib/logger";
import { useEffect, useMemo, useState } from "react";
import { X, Loader2, ShieldCheck, Check, Fingerprint } from "lucide-react";
import { hasBiometricCredential, isBiometricSupported, confirmBiometric } from "../auth/biometric";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { createOrder as mirrorOrderToServer } from "../data/orders-server";
import { pushNotification } from "../notifications/store";
import { getUserProfile } from "../auth/user-profile";
import { slugifyShopName } from "../data/shop-assets";
import {
  PayMethod,
  MobileProvider,
  MOBILE_PROVIDER_LABEL,
  processPayment,
  paySubscription,
  PayInput,
  Subscription,
  getState,
  consumePromoOnOrder,
} from "./store";
import {
  cvvValid,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  luhnCheck,
  providerPhoneValid,
  pinValid,
} from "./validators";
import { PaymentLogo, type BrandKey } from "./brands";

type SubscriptionPayload = { planId: Subscription["planId"]; label: string; price: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  payInputBase: Omit<PayInput, "payMethod" | "pin" | "mobileProvider" | "mobilePhone" | "card">;
  initialMethod?: PayMethod;
  subscription?: SubscriptionPayload;
};

type Choice =
  | { kind: "wallet" }
  | { kind: "mobile"; provider: MobileProvider }
  | { kind: "card" }
  | { kind: "cod" };

type Option = {
  key: string;
  choice: Choice;
  brand: BrandKey;
  label: string;
  sub?: string;
};

const OPTIONS: Option[] = [
  { key: "wallet", choice: { kind: "wallet" },                  brand: "ippoo",  label: "IPPOO CASH",            sub: "Solde de votre portefeuille" },
  { key: "mtn",    choice: { kind: "mobile", provider: "mtn" },    brand: "mtn",    label: "MTN Money",             sub: "Numéro MTN MoMo · via FedaPay" },
  { key: "moov",   choice: { kind: "mobile", provider: "moov" },   brand: "moov",   label: "Moov Money",            sub: "Numéro Moov · via FedaPay" },
  { key: "celtis", choice: { kind: "mobile", provider: "celtis" }, brand: "celtis", label: "Celtis Cash",           sub: "Numéro Celtis · via FedaPay" },
  { key: "wave",   choice: { kind: "mobile", provider: "wave" },   brand: "wave",   label: "Wave",                  sub: "Compte Wave · via FedaPay" },
  { key: "orange", choice: { kind: "mobile", provider: "orange" }, brand: "orange", label: "Orange Money",          sub: "Numéro Orange · via FedaPay" },
  { key: "card",   choice: { kind: "card" },                       brand: "card",   label: "Carte bancaire",        sub: "Visa · Mastercard · via FedaPay" },
  { key: "cod",    choice: { kind: "cod" },                        brand: "cod",    label: "Paiement à la livraison", sub: "Espèces au livreur" },
];

function initialKey(m: PayMethod): string {
  if (m === "wallet") return "wallet";
  if (m === "card") return "card";
  if (m === "cod") return "cod";
  if (m === "mobile") return "mtn";
  return "wallet";
}

export function PaymentDialog({ open, onClose, onSuccess, payInputBase, initialMethod = "wallet", subscription }: Props) {
  const visible = subscription ? OPTIONS.filter((o) => o.choice.kind !== "cod") : OPTIONS;
  const [selectedKey, setSelectedKey] = useState<string>(initialKey(initialMethod));
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clé d'idempotence valable pour la durée d'ouverture du dialogue : tant
  // que l'utilisateur ne ferme/rouvre pas, un double-clic ne crée qu'une seule
  // commande même si la requête est rejouée.
  const [idemKey, setIdemKey] = useState<string>(() => `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const [bioEnabled, setBioEnabled] = useState(false);
  useEffect(() => { setBioEnabled(isBiometricSupported() && hasBiometricCredential()); }, [open]);

  useEffect(() => {
    if (!open) {
      setPin(""); setPhone(""); setOtp(""); setOtpSent(false);
      setCardNumber(""); setCardName(""); setCardExp(""); setCvv("");
      setBusy(false); setError(null);
      setSelectedKey(initialKey(initialMethod));
      setIdemKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    }
  }, [open, initialMethod]);

  const selected = visible.find((o) => o.key === selectedKey) ?? visible[0];
  const choice = selected.choice;
  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const wallet = getState();
  const dispo = wallet.walletBalance - wallet.walletBlocked;

  if (!open) return null;

  const validate = (): string | null => {
    if (choice.kind === "wallet") {
      if (!bioEnabled && !pinValid(pin)) return "Code PIN à 4 chiffres requis";
      if (payInputBase.total > dispo) return "Solde IPPOO CASH insuffisant";
    }
    if (choice.kind === "mobile") {
      if (!providerPhoneValid(phone, choice.provider)) {
        return `Numéro ${MOBILE_PROVIDER_LABEL[choice.provider]} invalide`;
      }
      if (!otpSent) return "Demandez un code de confirmation";
      if (!/^\d{4,6}$/.test(otp)) return "Code de confirmation invalide";
    }
    if (choice.kind === "card") {
      if (!luhnCheck(cardNumber)) return "Numéro de carte invalide";
      if (!cardName.trim()) return "Nom du titulaire requis";
      if (!expiryValid(cardExp)) return "Date d'expiration invalide ou dépassée";
      if (!cvvValid(cvv, brand)) return brand === "amex" ? "CVV à 4 chiffres" : "CVV à 3 chiffres";
    }
    return null;
  };

  const requestOtp = () => {
    if (choice.kind !== "mobile") return;
    if (!providerPhoneValid(phone, choice.provider)) {
      setError(`Numéro ${MOBILE_PROVIDER_LABEL[choice.provider]} invalide`);
      return;
    }
    setOtpSent(true);
    setError(null);
    toast.success(`Code envoyé au ${phone}`);
  };

  const toPayMethod = (c: Choice): PayMethod => {
    if (c.kind === "wallet") return "wallet";
    if (c.kind === "mobile") return "mobile";
    if (c.kind === "card") return "card";
    return "cod";
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setBusy(true);
    setError(null);
    const method = toPayMethod(choice);
    let bioOk = false;
    if (choice.kind === "wallet" && bioEnabled) {
      try {
        await confirmBiometric();
        bioOk = true;
      } catch (e) {
        setBusy(false);
        setError(e instanceof Error ? e.message : "Vérification biométrique annulée");
        return;
      }
    }
    if (subscription) {
      const res = await paySubscription(
        subscription.planId,
        subscription.label,
        subscription.price,
        method,
        choice.kind === "wallet" && !bioOk ? pin : undefined,
        bioOk,
      );
      setBusy(false);
      if (!res.ok) { setError(res.error); return; }
      toast.success(`Abonnement VIP ${subscription.label} activé`);
      onSuccess(res.txnId);
      return;
    }
    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    const res = await processPayment({
      ...payInputBase,
      payMethod: method,
      pin: choice.kind === "wallet" && !bioOk ? pin : undefined,
      mobileProvider: choice.kind === "mobile" ? choice.provider : undefined,
      mobilePhone: choice.kind === "mobile" ? phone : undefined,
      card: choice.kind === "card" ? { last4, brand } : undefined,
      idempotencyKey: idemKey,
      bioVerified: bioOk,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    const ref = res.fedapayRef;
    toast.success(
      ref
        ? `Commande ${res.orderId} confirmée · Fedapay ${ref}`
        : `Commande ${res.orderId} confirmée`,
    );
    // Mirror la commande côté serveur (escrow + commission split) en best-effort.
    void mirrorOrderToServer({
      items: payInputBase.items.map((it) => ({
        productId: String(it.uid ?? it.id),
        vendorId: it.vendorId ?? it.seller ?? "unknown",
        title: it.name,
        unitPrice: Math.round(it.price),
        qty: Math.max(1, Math.round(it.quantity)),
      })),
      shippingAddress: {
        name: payInputBase.address?.name ?? "",
        phone: payInputBase.address?.phone ?? "",
        city: payInputBase.address?.city ?? "",
        line1: payInputBase.address?.line ?? "",
        line2: payInputBase.address?.note ?? undefined,
      },
      paymentMethod: method === "mobile" ? "mobile-money" : method === "qr" ? "wallet" : method,
    }).catch((e) => logger.warn(`mirror order failed: ${e?.message ?? e}`));

    // Notification vendeur : si l'un des items appartient à la boutique du
    // profil courant, on simule la réception de commande côté vendeur.
    try {
      const me = getUserProfile();
      if (me?.businessName) {
        const mySlug = slugifyShopName(me.businessName);
        const mine = payInputBase.items.filter(
          (it) => (it.vendorId ?? it.seller) === mySlug || (it.vendorId ?? it.seller) === me.businessName,
        );
        if (mine.length > 0) {
          const total = mine.reduce((s, it) => s + Math.round(it.price) * Math.max(1, Math.round(it.quantity)), 0);
          pushNotification({
            type: "order",
            priority: "high",
            title: "Nouvelle commande reçue",
            desc: `${mine.length} article${mine.length > 1 ? "s" : ""} · ${formatPrice(total)} FCFA`,
            link: `/commande/${res.orderId}`,
            color: "#16A34A",
          });
        }
      }
    } catch { /* notif best-effort */ }

    // Consomme le code promo vendeur appliqué (incrémente usedCount)
    try { consumePromoOnOrder(getState().promoCode); } catch { /* silent */ }

    onSuccess(res.orderId);
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmer le paiement"
      onKeyDown={(e) => e.key === "Escape" && !busy && onClose()}
    >
      <div className="absolute inset-0" onClick={() => !busy && onClose()} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl border border-border max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10">
          <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Paiement sécurisé</h3>
          <button onClick={onClose} disabled={busy} aria-label="Fermer" className="ml-auto p-1.5 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-[#FFF7ED] rounded-2xl p-3 flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total à payer</span>
            <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, color: "#E11D2E" }}>
              {formatPrice(payInputBase.total)} FCFA
            </span>
          </div>

          <p className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 600 }}>
            Choisissez votre moyen de paiement
          </p>

          <div className="grid grid-cols-1 gap-2">
            {visible.map((opt) => {
              const active = opt.key === selectedKey;
              return (
                <button
                  key={opt.key}
                  onClick={() => { setSelectedKey(opt.key); setError(null); setOtp(""); setOtpSent(false); }}
                  aria-pressed={active}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors ${active ? "border-[#E11D2E] bg-[#FFF7ED]" : "border-border bg-card hover:bg-muted"}`}
                >
                  <PaymentLogo brand={opt.brand} size="md" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate" style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</p>
                    {opt.sub && <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{opt.sub}</p>}
                  </div>
                  {active && <Check className="w-5 h-5 text-[#E11D2E] shrink-0" />}
                </button>
              );
            })}
          </div>

          {choice.kind === "wallet" && (
            <div className="space-y-2">
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Solde disponible : <strong>{formatPrice(dispo)} FCFA</strong>
              </p>
              {bioEnabled ? (
                <div className="rounded-xl bg-[#FFF7ED] border border-[#E11D2E]/20 p-3 flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-[#E11D2E]" />
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    Validation par empreinte biométrique. Aucun PIN à saisir.
                  </p>
                </div>
              ) : (
                <>
                  <label className="block" style={{ fontSize: 12, fontWeight: 600 }}>Code PIN (4 chiffres)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background tracking-[0.5em] text-center"
                    aria-label="Code PIN"
                  />
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>PIN par défaut : 1234. Modifiable dans Paramètres.</p>
                </>
              )}
            </div>
          )}

          {choice.kind === "mobile" && (
            <div className="space-y-2">
              <label className="block" style={{ fontSize: 12, fontWeight: 600 }}>
                Numéro {MOBILE_PROVIDER_LABEL[choice.provider]}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setOtpSent(false); setOtp(""); }}
                  placeholder="+229 9X XX XX XX"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-input-background"
                />
                <button onClick={requestOtp} disabled={otpSent} className="px-3 py-2 rounded-xl bg-[#F97316] text-white disabled:opacity-50" style={{ fontSize: 12, fontWeight: 700 }}>
                  {otpSent ? "Envoyé" : "Envoyer code"}
                </button>
              </div>
              {otpSent && (
                <>
                  <label className="block mt-1" style={{ fontSize: 12, fontWeight: 600 }}>Code reçu par SMS</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background tracking-widest text-center"
                  />
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Le débit sera confirmé sur votre {MOBILE_PROVIDER_LABEL[choice.provider]} après validation.
                  </p>
                </>
              )}
            </div>
          )}

          {choice.kind === "card" && (
            <div className="space-y-2">
              <label className="block" style={{ fontSize: 12, fontWeight: 600 }}>Numéro de carte</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCardNumber(cardNumber)}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background tracking-wider"
              />
              {cardNumber && (
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  Réseau : <strong className="uppercase">{brand}</strong>
                </p>
              )}
              <label className="block mt-1" style={{ fontSize: 12, fontWeight: 600 }}>Nom du titulaire</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="PRENOM NOM"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background uppercase"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block" style={{ fontSize: 12, fontWeight: 600 }}>Expiration</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExp}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExp(v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                    }}
                    placeholder="MM/AA"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                  />
                </div>
                <div>
                  <label className="block" style={{ fontSize: 12, fontWeight: 600 }}>CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={brand === "amex" ? 4 : 3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    placeholder={brand === "amex" ? "••••" : "•••"}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                  />
                </div>
              </div>
              <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 11 }}>
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Données chiffrées · Conformité PCI-DSS
              </p>
            </div>
          )}

          {choice.kind === "cod" && (
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              Vous payerez en espèces à la livraison. Le livreur encaissera <strong>{formatPrice(payInputBase.total)} FCFA</strong>.
            </p>
          )}

          {error && (
            <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border p-3 flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 py-3 rounded-xl border border-border" style={{ fontWeight: 700 }}>
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ fontWeight: 700 }}
          >
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</> : <>Payer {formatPrice(payInputBase.total)} FCFA</>}
          </button>
        </div>
      </div>
    </div>
  );
}
