import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { QrCode, ArrowLeft, ShieldCheck, Loader2, Fingerprint, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { payQR, payWalletInstant } from "../payments/store";
import { hasBiometricCredential, confirmBiometric, isBiometricSupported } from "../auth/biometric";

export function PayPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const id = (sp.get("id") || "").trim();
  const amt = Number(sp.get("amt") || 0);
  const to = (sp.get("to") || "").trim();

  const valid = useMemo(() => /^IPPOO-[A-Z]{3}-\d{3,8}-[A-Z]+$/.test(id), [id]);
  const [pin, setPin] = useState("");
  const [amount, setAmount] = useState<number>(amt > 0 ? amt : 0);
  const [loading, setLoading] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [receipt, setReceipt] = useState<{ txnId: string; amount: number; to: string } | null>(null);

  const persistTopupIntent = (deficit: number) => {
    try {
      sessionStorage.setItem("ippoo:pay-intent", JSON.stringify({ id, amt: amount, to, at: Date.now() }));
    } catch { /* quota */ }
    navigate(`/wallet?topup=${deficit}`);
  };

  useEffect(() => {
    setBioEnabled(isBiometricSupported() && hasBiometricCredential());
  }, []);

  if (!valid) {
    return (
      <div className="max-w-md mx-auto p-4 pb-24">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Accueil
        </button>
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E11D2E]/10 flex items-center justify-center mb-3">
            <QrCode className="w-7 h-7 text-[#E11D2E]" />
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>QR de paiement invalide</h2>
          <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
            Le lien scanné ne correspond à aucun identifiant IPPOO CASH valide.
          </p>
          <Link to="/wallet" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6A00] text-white" style={{ fontWeight: 700, fontSize: 13 }}>
            Aller à mon wallet
          </Link>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (amount < 100) { toast.error("Montant minimum : 100 FCFA"); return; }

    if (bioEnabled) {
      setLoading(true);
      try {
        await confirmBiometric();
      } catch (err) {
        setLoading(false);
        toast.error(err instanceof Error ? err.message : "Vérification biométrique annulée");
        return;
      }
      // Biométrie validée → débit direct sans PIN
      const r = payWalletInstant({
        amount,
        label: `Paiement QR · ${to || id}`,
        vendor: to || id,
      });
      setLoading(false);
      if (r.ok) { setReceipt({ txnId: r.txnId, amount, to: to || id }); }
      else {
        toast.error(r.error);
        if (r.deficit) persistTopupIntent(r.deficit);
      }
      return;
    }

    if (!/^\d{4}$/.test(pin)) { toast.error("PIN à 4 chiffres requis"); return; }
    setLoading(true);
    const r = await payQR(to || id, amount, pin);
    setLoading(false);
    if (r.ok) {
      setReceipt({ txnId: r.txnId, amount, to: to || id });
    } else {
      toast.error(r.error);
      if (r.deficit) persistTopupIntent(r.deficit);
    }
  };

  if (receipt) {
    return (
      <div className="max-w-md mx-auto p-4 pb-24">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#16A34A]/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-9 h-9 text-[#16A34A]" />
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>Paiement confirmé</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Référence&nbsp;: <strong>{receipt.txnId}</strong>
          </p>
          <div className="mt-4 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/20 p-4">
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>Montant débité</p>
            <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 26, color: "#16A34A" }}>{receipt.amount.toLocaleString("fr-FR")} FCFA</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>Destinataire : <strong>{receipt.to}</strong></p>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => navigate("/transactions")} className="flex-1 py-2.5 rounded-xl border border-border" style={{ fontWeight: 700, fontSize: 13 }}>
              Mes transactions
            </button>
            <button onClick={() => navigate("/wallet")} className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
              Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <button onClick={() => navigate("/wallet")} className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E11D2E]/10 flex items-center justify-center mb-3">
            <QrCode className="w-7 h-7 text-[#E11D2E]" />
          </div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Paiement IPPOO CASH</h2>
          <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
            Destinataire : <span style={{ fontWeight: 700 }}>{to || id}</span>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-muted-foreground" style={{ fontSize: 11 }}>
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Paiement protégé IPPOO
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 600 }}>Montant (FCFA)</span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="ex. 75000"
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-border outline-none focus:border-[#E11D2E]"
              style={{ fontSize: 14, fontWeight: 600 }}
            />
          </label>

          {bioEnabled ? (
            <div className="rounded-xl bg-[#FFF7ED] border border-[#E11D2E]/15 p-3 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#E11D2E]" />
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                La validation se fera par empreinte biométrique. Aucun code PIN à saisir.
              </p>
            </div>
          ) : (
            <label className="block">
              <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 600 }}>Code PIN IPPOO CASH</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-border outline-none focus:border-[#E11D2E] tracking-[0.5em] text-center"
                style={{ fontSize: 16, fontWeight: 700 }}
              />
            </label>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FF6A00] text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : bioEnabled ? <Fingerprint className="w-4 h-4" /> : null}
            {bioEnabled ? "Valider par empreinte" : "Payer"}
          </button>
        </div>
      </div>
    </div>
  );
}
