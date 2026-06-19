import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  TrendingUp,
  Shield,
  CreditCard,
  Smartphone,
  ChevronRight,
  QrCode,
  Loader2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { walletTransactions, formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { CouponStrip, GiftBanner, LoyaltyPointsBadge } from "./promo-widgets";
import { BottomSheet } from "../native/BottomSheet";
import { usePayments } from "../payments/usePayments";
import { rechargeWallet, withdrawWallet, setupWalletPin, isWalletActivated, syncWalletFromServer } from "../payments/store";
import { useServerWallet } from "../data/useServerWallet";
import { ensureAccountId } from "../auth/account-id";
import { getUserProfile } from "../auth/user-profile";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { PaymentLogo, type BrandKey } from "../payments/brands";
import {
  cvvValid,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  luhnCheck,
  momoPhoneValid,
  pinValid,
} from "../payments/validators";

type Action = "Recharger" | "Retirer";
type RechargeMethod = "mobile" | "card" | "qr";
type MobileProvider = "mtn" | "moov" | "celtis" | "wave" | "orange";

const MOBILE_PROVIDERS: { id: MobileProvider; brand: BrandKey; label: string }[] = [
  { id: "mtn",    brand: "mtn",    label: "MTN Money" },
  { id: "moov",   brand: "moov",   label: "Moov Money" },
  { id: "celtis", brand: "celtis", label: "Celtis Cash" },
  { id: "wave",   brand: "wave",   label: "Wave" },
  { id: "orange", brand: "orange", label: "Orange Money" },
];

export function WalletPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const state = usePayments();
  const server = useServerWallet();
  useEffect(() => {
    // Le store local est la source de vérité pour les recharges/paiements
    // effectués hors-ligne. On ne synchronise depuis le serveur que si celui-ci
    // détient un solde strictement supérieur (crédit reçu côté serveur) — sinon
    // un solde serveur à 0 viendrait écraser un solde local après un paiement
    // QR refusé pour solde insuffisant.
    if (server.data && server.data.balance > state.walletBalance) {
      syncWalletFromServer(server.data.balance);
    }
  }, [server.data, state.walletBalance]);
  const balance = state.walletBalance;
  const blocked = state.walletBlocked;
  const dispo = balance - blocked;

  const [activeTab, setActiveTab] = useState<"all" | "credit" | "debit">("all");
  const [actionModal, setActionModal] = useState<null | Action>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rechargeMethod, setRechargeMethod] = useState<RechargeMethod>("mobile");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>("mtn");
  const [topupFromScan, setTopupFromScan] = useState(false);
  const [receipt, setReceipt] = useState<null | { kind: "Recharger" | "Retirer"; amount: number; ref?: string; dest?: string; newBalance: number; resumePay?: { id: string; amt: number; to: string } }>(null);
  const [justActivated, setJustActivated] = useState(false);
  useEffect(() => {
    if (state.walletActivated) {
      try {
        if (sessionStorage.getItem("ippoo:cash-just-activated") === "1") {
          setJustActivated(true);
          sessionStorage.removeItem("ippoo:cash-just-activated");
        }
      } catch { /* noop */ }
    }
  }, [state.walletActivated]);

  // Recharge guidée depuis un scan QR à solde insuffisant : /wallet?topup=12500
  useEffect(() => {
    const raw = sp.get("topup");
    if (!raw) return;
    const n = Math.max(500, Math.round(Number(raw)));
    if (Number.isFinite(n) && n > 0) {
      setActionModal("Recharger");
      setAmount(String(n));
      setTopupFromScan(true);
      toast.info(`Solde IPPOO CASH insuffisant — recharge ${formatPrice(n)} pour finaliser le paiement.`);
    }
    const next = new URLSearchParams(sp);
    next.delete("topup");
    setSp(next, { replace: true });
  }, [sp, setSp]);

  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cvv, setCvv] = useState("");

  const [pin, setPin] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("MTN +229 ");

  const merged = useMemo(() => {
    const live = state.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      label: t.label,
      amount: t.amount,
      date: `${t.date} · ${t.time}`,
      status: t.status === "failed" ? "pending" : t.status,
    }));
    const remote = (server.data?.transactions ?? []).map((t, i) => {
      const d = new Date(t.at);
      return {
        id: `srv-${t.at}-${i}`,
        type: (t.amount >= 0 ? "credit" : "debit") as "credit" | "debit",
        label: t.reason,
        amount: Math.abs(t.amount),
        date: d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
        status: "completed" as const,
      };
    });
    if (remote.length > 0) return [...live, ...remote];
    return [...live, ...walletTransactions];
  }, [state.transactions, server.data]);

  const filtered = activeTab === "all" ? merged : merged.filter((t) => t.type === activeTab);

  const openModal = (a: Action) => {
    setActionModal(a);
    setAmount(""); setError(null); setBusy(false);
    setPhone("");
    setCardNumber(""); setCardExp(""); setCvv("");
    setPin(""); setRechargeMethod("mobile");
  };

  const validateRecharge = (val: number): string | null => {
    if (val < 500) return "Montant minimum : 500 FCFA";
    if (rechargeMethod === "mobile") {
      if (!momoPhoneValid(phone)) return "Numéro Mobile Money invalide";
    }
    if (rechargeMethod === "card") {
      if (!luhnCheck(cardNumber)) return "Numéro de carte invalide";
      if (!expiryValid(cardExp)) return "Date d'expiration invalide";
      const brand = detectCardBrand(cardNumber);
      if (!cvvValid(cvv, brand)) return "CVV invalide";
    }
    return null;
  };

  const submitAction = async () => {
    const val = parseInt(amount.replace(/\D/g, ""), 10);
    if (!val) { setError("Montant requis"); return; }

    if (actionModal === "Recharger") {
      const err = validateRecharge(val);
      if (err) { setError(err); return; }
      setBusy(true);
      const last4 = cardNumber.replace(/\D/g, "").slice(-4);
      const r = await rechargeWallet(val, rechargeMethod, {
        phone: rechargeMethod === "mobile" ? phone : undefined,
        cardLast4: rechargeMethod === "card" ? last4 : undefined,
        operator: rechargeMethod === "mobile" ? mobileProvider : undefined,
        brand: rechargeMethod === "card" ? brand : undefined,
      });
      setBusy(false);
      if (!r.ok) { setError(r.error); return; }
      const ref = (r as { fedapayRef?: string }).fedapayRef;
      let resumePay: { id: string; amt: number; to: string } | undefined;
      if (topupFromScan) {
        try {
          const raw = sessionStorage.getItem("ippoo:pay-intent");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.id) resumePay = { id: parsed.id, amt: Number(parsed.amt) || 0, to: parsed.to || "" };
          }
        } catch { /* noop */ }
        sessionStorage.removeItem("ippoo:pay-intent");
        setTopupFromScan(false);
      }
      setActionModal(null);
      setReceipt({ kind: "Recharger", amount: val, ref, newBalance: balance + val, resumePay });
      return;
    }

    if (actionModal === "Retirer") {
      if (!pinValid(pin)) { setError("Code PIN à 4 chiffres requis"); return; }
      if (!withdrawDest.trim()) { setError("Destination requise"); return; }
      setBusy(true);
      const r = await withdrawWallet(val, pin, withdrawDest.trim());
      setBusy(false);
      if (!r.ok) { setError(r.error); return; }
      setActionModal(null);
      setReceipt({ kind: "Retirer", amount: val, dest: withdrawDest.trim(), newBalance: Math.max(0, balance - val) });
    }
  };

  const brand = detectCardBrand(cardNumber);

  if (!state.walletActivated) {
    return (
      <div className="max-w-md mx-auto p-4 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <ActivateCashPanel />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-[#00B341] to-[#00875A] px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-white/80" />
            <span className="text-white/80" style={{ fontSize: 13, fontWeight: 500 }}>Mon IPPOO CASH</span>
          </div>
          <h1 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: "clamp(26px, 7vw, 36px)" }}>
            <AnimatedNumber value={balance} format={(n) => formatPrice(n)} />
          </h1>
          <div className="flex items-center gap-4 mb-5 sm:mb-6 flex-wrap">
            <span className="text-white/90 flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700 }}>
              <Shield className="w-3.5 h-3.5" /> Disponible : <AnimatedNumber value={dispo} format={(n) => formatPrice(n)} />
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: Plus, label: "Recharger" as const, color: "#00B341" },
              { icon: Send, label: "Retirer" as const, color: "#FF6B00" },
              { icon: QrCode, label: "QR Code" as const, color: "#E11D2E" },
              { icon: CreditCard, label: "Payer" as const, color: "#9333EA" },
            ].map((action, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  if (action.label === "QR Code") navigate("/scanner");
                  else if (action.label === "Payer") navigate("/panier");
                  else openModal(action.label);
                }}
                className="bg-white/20 backdrop-blur-sm rounded-xl py-3 flex flex-col items-center gap-1.5 border border-white/20 hover:bg-white/30 transition-colors"
              >
                <action.icon className="w-5 h-5 text-white" />
                <span className="text-white" style={{ fontSize: 12, fontWeight: 600 }}>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {justActivated && (
          <div className="mb-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: "#F0FDF4", border: "1px solid #16A34A40" }}>
            <div className="w-10 h-10 rounded-xl bg-[#16A34A]/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#15803D" }}>Compte IPPOO CASH activé</p>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Bienvenue ! Effectue ta première recharge pour commencer à payer en un scan.
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => { setJustActivated(false); openModal("Recharger"); }} className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                Recharger
              </button>
              <button onClick={() => setJustActivated(false)} aria-label="Fermer" className="px-3 py-1.5 rounded-lg text-muted-foreground" style={{ fontSize: 11 }}>
                Plus tard
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>Reçu (mois)</p>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#16A34A" }}><AnimatedNumber value={522500} format={(n) => formatPrice(n)} /></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E11D2E]/10 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#E11D2E]" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>Dépensé (mois)</p>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#E11D2E" }}><AnimatedNumber value={490000} format={(n) => formatPrice(n)} /></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Moyens de recharge</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { brand: "mtn"    as BrandKey, label: "MTN Money",      method: "mobile" as RechargeMethod, provider: "mtn"    as MobileProvider },
              { brand: "moov"   as BrandKey, label: "Moov Money",     method: "mobile" as RechargeMethod, provider: "moov"   as MobileProvider },
              { brand: "celtis" as BrandKey, label: "Celtis Cash",    method: "mobile" as RechargeMethod, provider: "celtis" as MobileProvider },
              { brand: "wave"   as BrandKey, label: "Wave",           method: "mobile" as RechargeMethod, provider: "wave"   as MobileProvider },
              { brand: "orange" as BrandKey, label: "Orange Money",   method: "mobile" as RechargeMethod, provider: "orange" as MobileProvider },
              { brand: "card"   as BrandKey, label: "Carte bancaire", method: "card"   as RechargeMethod, provider: null },
              { brand: "qr"     as BrandKey, label: "QR Code IPPOO",  method: "qr"     as RechargeMethod, provider: null },
            ]).map((m) => (
              <button
                key={m.brand}
                onClick={() => {
                  if (m.method === "qr") { navigate("/scanner"); return; }
                  openModal("Recharger");
                  setRechargeMethod(m.method);
                  if (m.provider) setMobileProvider(m.provider);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:bg-[#F0FDF4] transition-colors text-left"
              >
                <PaymentLogo brand={m.brand} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <CouponStrip code="CASH20" label="Bonus" discount="+20% bonus recharge" condition="Sur toute recharge de +100 000 FCFA via Mobile Money" color="#00B341" expiry="Jusqu'au 15 mars" />
          <LoyaltyPointsBadge />
          <GiftBanner text="Parrainez, gagnez 5 000 FCFA" subtext="Invitez un ami et recevez un bonus sur votre IPPOO CASH" link="/vip" />
        </div>

        <div>
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Historique des mouvements</h3>

          <div className="flex gap-2 mb-4">
            {[
              { key: "all" as const, label: "Tous" },
              { key: "credit" as const, label: "Entrées" },
              { key: "debit" as const, label: "Sorties" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl border transition-all ${activeTab === tab.key ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-white text-foreground border-border"}`}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((tx) => (
              <div key={tx.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "credit" ? "bg-[#16A34A]/10" : "bg-[#E11D2E]/10"}`}>
                  {tx.type === "credit" ? <ArrowDownLeft className="w-5 h-5 text-[#16A34A]" /> : <ArrowUpRight className="w-5 h-5 text-[#E11D2E]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{tx.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{tx.date}</span>
                    {tx.status === "pending" && (
                      <span className="flex items-center gap-0.5 text-[#F97316]" style={{ fontSize: 10, fontWeight: 600 }}>
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    )}
                    {tx.status === "success" && (
                      <span className="flex items-center gap-0.5 text-[#16A34A]" style={{ fontSize: 10, fontWeight: 600 }}>
                        <CheckCircle2 className="w-3 h-3" /> Confirmé
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: tx.amount > 0 ? "#16A34A" : "#E11D2E" }}>
                  {tx.amount > 0 ? "+" : ""}{formatPrice(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


      <BottomSheet
        open={!!actionModal}
        onClose={() => !busy && setActionModal(null)}
        title={actionModal === "Recharger" ? "Recharger IPPOO CASH" : "Retirer vers"}
        snapPoints={[0.85, 0.95]}
      >
        {actionModal && (
          <div className="space-y-3">
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Solde actuel : <strong>{formatPrice(balance)} FCFA</strong> · Disponible : <strong>{formatPrice(dispo)} FCFA</strong>
              </p>
              <input
                autoFocus
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Montant en FCFA"
                aria-label="Montant"
                className="w-full px-3 py-3 rounded-xl border border-border bg-input-background"
              />
              <div className="flex gap-2">
                {[5000, 10000, 25000, 50000, 100000].map((v) => (
                  <button key={v} onClick={() => setAmount(String(v))} className="flex-1 py-1.5 rounded-lg border border-border hover:bg-muted" style={{ fontSize: 11 }}>
                    {v.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>

              {actionModal === "Recharger" && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {([
                      { id: "mobile" as const, brand: "mtn" as BrandKey,  label: "Mobile Money", sub: "MTN · Moov · Wave · Orange · Celtis" },
                      { id: "card"   as const, brand: "card" as BrandKey, label: "Carte bancaire", sub: "Visa · Mastercard" },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setRechargeMethod(m.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${rechargeMethod === m.id ? "border-[#00B341] bg-[#F0FDF4]" : "border-border"}`}
                      >
                        <PaymentLogo brand={m.brand} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</p>
                          <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{m.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {rechargeMethod === "mobile" && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Opérateur Mobile Money</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MOBILE_PROVIDERS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setMobileProvider(p.id)}
                            className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-colors ${mobileProvider === p.id ? "border-[#00B341] bg-[#F0FDF4]" : "border-border hover:bg-muted"}`}
                          >
                            <PaymentLogo brand={p.brand} size="sm" />
                            <span className="truncate" style={{ fontSize: 11, fontWeight: 700 }}>{p.label}</span>
                          </button>
                        ))}
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+229 9X XX XX XX"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                      />
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                        La confirmation se fera directement depuis votre application {MOBILE_PROVIDERS.find((p) => p.id === mobileProvider)?.label ?? "Mobile Money"} après avoir cliqué sur « Procéder au paiement ».
                      </p>
                    </div>
                  )}

                  {rechargeMethod === "card" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formatCardNumber(cardNumber)}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background tracking-wider"
                      />
                      {cardNumber && <p className="text-muted-foreground" style={{ fontSize: 11 }}>Réseau : <strong className="uppercase">{brand}</strong></p>}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExp(v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                          }}
                          placeholder="MM/AA"
                          className="px-3 py-2.5 rounded-xl border border-border bg-input-background"
                        />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={brand === "amex" ? 4 : 3}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                          placeholder="CVV"
                          className="px-3 py-2.5 rounded-xl border border-border bg-input-background"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {actionModal === "Retirer" && (
                <>
                  <input
                    type="text"
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    placeholder="Numéro Mobile Money de destination"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Code PIN (4 chiffres)"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background tracking-[0.5em] text-center"
                  />
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>PIN par défaut : 1234</p>
                </>
              )}

            {error && (
              <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>{error}</div>
            )}
            <div className="pt-2 flex gap-2 sticky bottom-0 bg-white">
              <button onClick={() => !busy && setActionModal(null)} className="flex-1 py-3 rounded-xl border border-border" style={{ fontWeight: 700 }}>Annuler</button>
              <button
                onClick={submitAction}
                disabled={busy}
                data-haptic="success"
                className="flex-1 py-3 rounded-xl bg-[#00B341] text-white disabled:opacity-60 flex items-center justify-center gap-2 press-feedback"
                style={{ fontWeight: 700 }}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</> : actionModal === "Recharger" ? "Procéder au paiement" : "Confirmer"}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {receipt && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setReceipt(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReceipt(null)} aria-label="Fermer" className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: receipt.kind === "Recharger" ? "#DCFCE7" : "#FFEDD5" }}>
              <CheckCircle2 className="w-9 h-9" style={{ color: receipt.kind === "Recharger" ? "#16A34A" : "#F97316" }} />
            </div>
            <h2 className="text-center mt-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>
              {receipt.kind === "Recharger" ? "Recharge confirmée" : "Retrait en cours"}
            </h2>
            {receipt.ref && (
              <p className="text-center text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                Référence&nbsp;: <strong>{receipt.ref}</strong>
              </p>
            )}
            <div className="mt-4 rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
                <span className="text-muted-foreground">{receipt.kind === "Recharger" ? "Crédité" : "Débité"}</span>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: receipt.kind === "Recharger" ? "#16A34A" : "#F97316" }}>
                  {receipt.kind === "Recharger" ? "+" : "−"} {formatPrice(receipt.amount)} FCFA
                </span>
              </div>
              {receipt.dest && (
                <div className="flex items-center justify-between mt-2" style={{ fontSize: 12 }}>
                  <span className="text-muted-foreground">Vers</span>
                  <span style={{ fontWeight: 700 }}>{receipt.dest}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border" style={{ fontSize: 12 }}>
                <span className="text-muted-foreground">Nouveau solde</span>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{formatPrice(receipt.newBalance)} FCFA</span>
              </div>
            </div>
            {receipt.kind === "Retirer" && (
              <p className="text-muted-foreground text-center mt-3" style={{ fontSize: 11 }}>
                Les fonds arrivent généralement sous 5 minutes sur le compte Mobile Money de destination.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              {receipt.resumePay ? (
                <button
                  onClick={() => {
                    const r = receipt.resumePay!;
                    setReceipt(null);
                    navigate(`/pay?id=${encodeURIComponent(r.id)}${r.amt ? `&amt=${r.amt}` : ""}${r.to ? `&to=${encodeURIComponent(r.to)}` : ""}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF6A00] text-white"
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  Finaliser le paiement
                </button>
              ) : (
                <button
                  onClick={() => { setReceipt(null); navigate("/transactions"); }}
                  className="flex-1 py-2.5 rounded-xl border border-border"
                  style={{ fontWeight: 700, fontSize: 13 }}
                >
                  Voir transactions
                </button>
              )}
              <button onClick={() => setReceipt(null)} className="flex-1 py-2.5 rounded-xl bg-[#00B341] text-white" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Activation IPPOO CASH : configuration du PIN au premier accès ─── */
function ActivateCashPanel() {
  const account = ensureAccountId();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"intro" | "pin" | "confirm">("intro");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const r = await setupWalletPin(pin, confirm, account.id);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    try { sessionStorage.setItem("ippoo:cash-just-activated", "1"); } catch { /* noop */ }
    toast.success("Compte IPPOO CASH activé ✅ Tu peux maintenant recharger et payer.");
  };

  const profile = getUserProfile();
  const firstName = (profile?.firstName || "").trim();
  const greeting = firstName ? `Bonjour ${firstName}` : "Bienvenue";

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[#00B341] to-[#00875A] px-5 py-7 text-white">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
          {greeting}
        </h1>
        <p className="opacity-90 mt-1" style={{ fontSize: 13 }}>
          Active ton compte IPPOO CASH pour payer, recevoir et envoyer en toute sécurité.
        </p>
      </div>

      <div className="p-5 space-y-3">
        {step === "intro" && (
          <>
            <button
              onClick={() => setStep("pin")}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00B341] to-[#00875A] text-white inline-flex items-center justify-center gap-2"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
            >
              <ShieldCheck className="w-5 h-5" /> Créer mon compte IPPOO CASH
            </button>
            <button
              onClick={() => setStep("pin")}
              className="w-full py-3 rounded-xl border border-border inline-flex items-center justify-center gap-2 hover:bg-muted"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              <KeyRound className="w-4 h-4" /> Configurer mon code PIN
            </button>
            <p className="text-muted-foreground text-center pt-1" style={{ fontSize: 11 }}>
              <Lock className="w-3 h-3 inline mr-1" />
              Tes informations restent privées et chiffrées sur ton appareil.
            </p>
          </>
        )}

        {step === "pin" && (
          <>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              Choisis un code PIN secret à 4 chiffres.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              autoFocus
              className="w-full px-3 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#00B341]/30 focus:outline-none tracking-[0.8em] text-center"
              style={{ fontSize: 24, fontWeight: 800 }}
            />
            <button
              onClick={() => { if (pin.length === 4) { setStep("confirm"); setError(null); } else setError("PIN à 4 chiffres requis"); }}
              className="w-full py-3 rounded-xl bg-[#0F172A] text-white"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
            >
              Continuer
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              Confirme ton PIN pour finaliser l'activation.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              autoFocus
              className="w-full px-3 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#00B341]/30 focus:outline-none tracking-[0.8em] text-center"
              style={{ fontSize: 24, fontWeight: 800 }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            <button
              onClick={submit}
              disabled={busy || confirm.length !== 4}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00B341] to-[#00875A] text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {busy ? "Activation…" : "Activer mon compte"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("pin"); setConfirm(""); setError(null); }}
              className="w-full py-2 rounded-xl text-muted-foreground hover:bg-muted"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Modifier le PIN
            </button>
          </>
        )}

        {error && (
          <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

void isWalletActivated;
