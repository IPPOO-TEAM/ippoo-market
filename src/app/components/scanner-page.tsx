import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, Fingerprint, Keyboard, Loader2, Minus, Plus, QrCode, ScanLine, ShieldCheck, Store, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { allProducts, formatPrice } from "./mock-data";

type ScannerProduct = (typeof allProducts)[number];
import { productUid } from "../lib/product-uid";
import {
  hydrateMyProducts,
  findMyProductByUid,
  type MyProduct,
} from "../data/my-products";

function lookupMyProduct(candidate: string): MyProduct | undefined {
  hydrateMyProducts();
  return findMyProductByUid(candidate, (p) => productUid({ id: p.id, reference: p.reference }));
}
import { getState, payWalletInstant, verifyPinWithLock, isWalletActivated } from "../payments/store";
import { pinValid } from "../payments/validators";
import { hasBiometricCredential, confirmBiometric } from "../auth/biometric";
import { verifyLoginPayload, isOwnAccount } from "../auth/account-id";

/* ─────────────────────────────────────────────────────────────────────────
   Décodage QR : utilise l'API BarcodeDetector si disponible (Chrome/Edge
   mobile et desktop récents). En absence, on retombe sur une saisie
   manuelle. Aucune dépendance externe - pas de jsQR, pas de html5-qrcode.
   ───────────────────────────────────────────────────────────────────── */

type BarcodeFormat = "qr_code" | "code_128" | "ean_13" | "ean_8" | "upc_a" | "upc_e";

type DetectedBarcode = { rawValue: string; format: BarcodeFormat };

interface BarcodeDetectorCtor {
  new (opts?: { formats?: BarcodeFormat[] }): { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
  getSupportedFormats?: () => Promise<BarcodeFormat[]>;
}

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null;
}

type PendingPayment =
  | { kind: "merchant"; amount: number; vendor: string; label: string }
  | { kind: "product"; product: ScannerProduct }
  | { kind: "myProduct"; product: MyProduct };

/** Interprète un code lu (UID, URL IPPOO) en intention de paiement. */
function parseDecodedCode(raw: string): PendingPayment | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  let payParams: { id: string; amt?: string; to?: string } | null = null;
  try {
    const u = new URL(trimmed);
    const payId = u.searchParams.get("ippoo-pay");
    if (payId) {
      payParams = {
        id: payId,
        amt: u.searchParams.get("amt") || undefined,
        to: u.searchParams.get("to") || undefined,
      };
    } else {
      candidate = u.searchParams.get("ippoo") || u.pathname.replace(/^\/scan\//, "") || trimmed;
    }
  } catch {
    /* not a URL */
  }

  if (payParams) {
    const amt = Number(payParams.amt || 0);
    if (!amt || amt < 100) return null;
    const vendor = payParams.to || payParams.id;
    return { kind: "merchant", amount: amt, vendor, label: `Paiement QR · ${vendor}` };
  }

  const product = allProducts.find(
    (p) => productUid(p) === candidate || String((p as { reference?: string }).reference) === candidate,
  );
  if (product) return { kind: "product", product };
  const mine = lookupMyProduct(candidate);
  if (mine) return { kind: "myProduct", product: mine };
  return null;
}

/** Prix unitaire au MOQ : meilleur palier ≤ MOQ. */
function unitPriceAtMoq(product: ScannerProduct): number {
  const paliers = (product.paliers || []).slice().sort((a, b) => a.qty - b.qty);
  let price = product.price;
  for (const p of paliers) {
    if (product.moq >= p.qty) price = p.price;
  }
  return price;
}

/* ─────────────────────────────────────────────────────────────────────────
   Scanner - composant autonome
   ───────────────────────────────────────────────────────────────────── */

type ScannerStatus = "idle" | "requesting" | "streaming" | "denied" | "unsupported" | "error";

function Scanner({ onDecoded }: { onDecoded: (raw: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const decodedRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errMsg, setErrMsg] = useState<string>("");
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const stop = useCallback(() => {
    aliveRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* ignore */ }
      });
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      try { v.srcObject = null; } catch { /* ignore */ }
    }
  }, []);

  const handleDecoded = useCallback((raw: string) => {
    if (decodedRef.current) return;
    decodedRef.current = true;
    stop();
    onDecoded(raw);
  }, [onDecoded, stop]);

  const start = useCallback(async () => {
    aliveRef.current = true;
    decodedRef.current = false;
    setErrMsg("");

    const Detector = getBarcodeDetector();
    if (!Detector) {
      setStatus("unsupported");
      setManualMode(true);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setManualMode(true);
      return;
    }

    setStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
      } else {
        setStatus("error");
        setErrMsg((e as { message?: string })?.message || "Caméra indisponible");
      }
      return;
    }

    if (!aliveRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    const v = videoRef.current;
    if (!v) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    v.srcObject = stream;
    v.setAttribute("playsinline", "true");
    v.muted = true;
    try { await v.play(); } catch { /* autoplay block ignoré, on continue */ }

    setStatus("streaming");

    const detector = new Detector({ formats: ["qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e"] });

    const tick = async () => {
      if (!aliveRef.current || decodedRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          const codes = await detector.detect(video);
          if (codes && codes.length > 0) {
            const raw = codes[0].rawValue;
            if (raw) {
              handleDecoded(raw);
              return;
            }
          }
        } catch { /* frame skip */ }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecoded]);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  const submitManual = () => {
    const v = manualValue.trim();
    if (!v) { toast.error("Saisis un code"); return; }
    handleDecoded(v);
  };

  return (
    <div className="w-full">
      <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 aspect-square rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/55 text-white inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600 }}>
            <QrCode className="w-3.5 h-3.5" /> Scanner IPPOO
          </span>
          {status === "streaming" && (
            <span className="px-2.5 py-1 rounded-full bg-[#16A34A]/85 text-white inline-flex items-center gap-1.5" style={{ fontSize: 10, fontWeight: 700 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ACTIF
            </span>
          )}
        </div>

        {status === "requesting" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span style={{ fontSize: 13 }}>Activation de la caméra…</span>
          </div>
        )}
        {status === "denied" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 px-6 text-center">
            <CameraOff className="w-7 h-7 text-[#FF6B00]" />
            <p style={{ fontSize: 13, fontWeight: 700 }}>Caméra refusée</p>
            <p className="text-white/70" style={{ fontSize: 11 }}>
              Autorise l'accès caméra dans les réglages du navigateur, puis recharge.
            </p>
            <button onClick={() => start()} className="mt-2 px-3 py-1.5 rounded-lg bg-white text-black" style={{ fontSize: 12, fontWeight: 700 }}>
              Réessayer
            </button>
          </div>
        )}
        {status === "unsupported" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 px-6 text-center">
            <Camera className="w-7 h-7 text-[#FF6B00]" />
            <p style={{ fontSize: 13, fontWeight: 700 }}>Scan caméra non supporté</p>
            <p className="text-white/70" style={{ fontSize: 11 }}>
              Ton navigateur ne dispose pas de BarcodeDetector. Saisis le code manuellement ci-dessous.
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 px-6 text-center">
            <Camera className="w-7 h-7 text-[#E11D2E]" />
            <p style={{ fontSize: 13, fontWeight: 700 }}>Erreur caméra</p>
            <p className="text-white/70" style={{ fontSize: 11 }}>{errMsg}</p>
            <button onClick={() => start()} className="mt-2 px-3 py-1.5 rounded-lg bg-white text-black" style={{ fontSize: 12, fontWeight: 700 }}>
              Réessayer
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setManualMode((m) => !m)}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border text-foreground hover:bg-muted"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          <Keyboard className="w-4 h-4" /> {manualMode ? "Masquer la saisie manuelle" : "Saisir le code à la main"}
        </button>
        {manualMode && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="ex. IPP-ABC123-XY45"
              className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-border outline-none focus:border-[#E11D2E]"
              style={{ fontSize: 13 }}
              onKeyDown={(e) => { if (e.key === "Enter") submitManual(); }}
            />
            <button onClick={submitManual} className="px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white" style={{ fontSize: 13, fontWeight: 700 }}>
              Valider
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 11 }}>
        <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Aucun code n'est transmis : la lecture reste sur ton appareil.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   /scanner - page complète
   ───────────────────────────────────────────────────────────────────── */

type Receipt = {
  txnId: string;
  date: string;
  time: string;
  amount: number;
  label: string;
  vendor?: string;
  productName?: string;
  qty?: number;
  balanceAfter: number;
};

export function ScannerPage() {
  const navigate = useNavigate();
  const processedRef = useRef(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);

  const handleDecoded = async (raw: string) => {
    if (processedRef.current) return;
    processedRef.current = true;

    // QR de connexion IPPOO (identifiant utilisateur signé)
    const loginId = verifyLoginPayload(raw);
    if (loginId) {
      if (!isOwnAccount(loginId)) {
        toast.error("Ce QR ne correspond pas au compte de cet appareil");
        processedRef.current = false;
        return;
      }
      if (!hasBiometricCredential()) {
        toast.error("Active l'empreinte biométrique dans Paramètres pour utiliser le scan de connexion");
        processedRef.current = false;
        return;
      }
      try {
        await confirmBiometric();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Vérification biométrique annulée");
        processedRef.current = false;
        return;
      }
      toast.success("Connexion validée");
      navigate("/profil");
      return;
    }

    const intent = parseDecodedCode(raw);
    if (!intent) {
      toast.error("Code non reconnu");
      navigate(`/scan/${encodeURIComponent(raw.trim())}`);
      return;
    }

    // Produit ajouté par un vendeur : route vers sa fiche pour encaisser/voir
    if (intent.kind === "myProduct") {
      toast.success(`${intent.product.name} reconnu`);
      navigate(`/boutique/produits/${intent.product.id}`);
      return;
    }

    if (!isWalletActivated()) {
      toast.error("Active d'abord ton compte IPPOO CASH (PIN)");
      navigate("/wallet");
      return;
    }

    // Affiche la confirmation : quantité + auth (biométrie ou PIN), pas de débit immédiat.
    setPending(intent);
  };

  const handleConfirmed = (params: { amount: number; label: string; vendor?: string; qty?: number; productName?: string }) => {
    const r = payWalletInstant({ amount: params.amount, label: params.label, vendor: params.vendor });
    if (r.ok) {
      const { walletBalance, walletBlocked } = getState();
      setReceipt({
        txnId: r.txnId,
        date: r.date,
        time: r.time,
        amount: params.amount,
        label: params.label,
        vendor: params.vendor,
        productName: params.productName,
        qty: params.qty,
        balanceAfter: walletBalance - walletBlocked,
      });
      setPending(null);
    } else {
      toast.error(r.error);
      if (r.deficit) navigate(`/wallet?topup=${r.deficit}`);
      else {
        setPending(null);
        processedRef.current = false;
      }
    }
  };

  const cancelPending = () => {
    setPending(null);
    processedRef.current = false;
  };

  const reset = () => {
    setReceipt(null);
    setPending(null);
    processedRef.current = false;
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground"
        style={{ fontSize: 13, fontWeight: 600 }}
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <h1 className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>
        Scanner un QR code
      </h1>
      <p className="text-muted-foreground mb-3" style={{ fontSize: 12 }}>
        Vérification biométrique ou PIN requise avant tout débit IPPOO CASH.
      </p>
      {receipt ? (
        <ReceiptCard
          receipt={receipt}
          onScanAgain={reset}
          onGoTransactions={() => navigate("/transactions")}
        />
      ) : pending && pending.kind !== "myProduct" ? (
        <ConfirmPanel pending={pending} onCancel={cancelPending} onConfirmed={handleConfirmed} />
      ) : (
        <Scanner onDecoded={handleDecoded} />
      )}
    </div>
  );
}

/* ─── Confirmation avant débit : quantité + biométrie/PIN ─── */
type ConfirmablePayment = Extract<PendingPayment, { kind: "merchant" | "product" }>;
function ConfirmPanel({
  pending,
  onCancel,
  onConfirmed,
}: {
  pending: ConfirmablePayment;
  onCancel: () => void;
  onConfirmed: (params: { amount: number; label: string; vendor?: string; qty?: number; productName?: string }) => void;
}) {
  const isProduct = pending.kind === "product";
  const moq = isProduct ? pending.product.moq : 1;
  const unit = isProduct ? unitPriceAtMoq(pending.product) : pending.amount;
  const [qty, setQty] = useState(moq);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bioAvailable = hasBiometricCredential();

  const amount = isProduct ? unit * qty : pending.amount;
  const label = isProduct
    ? `${pending.product.name} ×${qty} · ${pending.product.seller}`
    : pending.label;
  const vendor = isProduct ? pending.product.seller : pending.vendor;
  const productName = isProduct ? pending.product.name : undefined;

  const decQty = () => setQty((q) => Math.max(moq, q - moq));
  const incQty = () => setQty((q) => q + moq);

  const confirmWithBio = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await confirmBiometric();
      onConfirmed({ amount, label, vendor, qty: isProduct ? qty : undefined, productName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vérification biométrique annulée");
      setSubmitting(false);
    }
  };

  const confirmWithPin = async () => {
    if (submitting) return;
    setError(null);
    if (!pinValid(pin)) { setError("Code PIN à 4 chiffres requis"); return; }
    setSubmitting(true);
    const r = await verifyPinWithLock(pin);
    if (!r.ok) {
      if (r.reason === "locked") setError(`PIN verrouillé. Réessayez dans ${Math.ceil(r.remainingMs / 60000)} min`);
      else if (r.lockedNow) setError("Trop d'échecs. PIN verrouillé pendant 15 minutes");
      else setError(`PIN incorrect. ${r.attemptsLeft} essai(s) restant(s)`);
      setSubmitting(false);
      return;
    }
    onConfirmed({ amount, label, vendor, qty: isProduct ? qty : undefined, productName });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirmer le paiement</p>
            <p className="mt-1 truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
              {isProduct ? pending.product.name : pending.label}
            </p>
            {vendor && (
              <p className="mt-0.5 opacity-80" style={{ fontSize: 12 }}>
                <Store className="w-3 h-3 inline mr-1" />{vendor}
              </p>
            )}
          </div>
          <button onClick={onCancel} className="rounded-full p-1.5 bg-white/10 hover:bg-white/20" aria-label="Annuler">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isProduct && (
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12, fontWeight: 600 }}>
              Quantité (multiple de {moq})
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decQty}
                disabled={qty <= moq}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={moq}
                step={moq}
                value={qty}
                onChange={(e) => {
                  const v = Math.max(moq, Math.floor(Number(e.target.value) / moq) * moq || moq);
                  setQty(v);
                }}
                className="flex-1 text-center px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}
              />
              <button
                type="button"
                onClick={incQty}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-muted-foreground mt-2" style={{ fontSize: 11 }}>
              Prix unitaire : {formatPrice(unit)} · MOQ {moq}
            </p>
          </div>
        )}

        <div className="rounded-xl bg-gradient-to-br from-[#E11D2E]/8 to-[#F97316]/8 border border-[#E11D2E]/15 p-4 flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 600 }}>Total à débiter</span>
          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, color: "#E11D2E" }}>
            {formatPrice(amount)}
          </span>
        </div>

        {bioAvailable ? (
          <button
            type="button"
            onClick={confirmWithBio}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
            {submitting ? "Validation…" : "Confirmer avec empreinte"}
          </button>
        ) : (
          <div className="space-y-2">
            <label className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                Code PIN du wallet
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-full px-3 py-3 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none tracking-[0.5em] text-center"
                style={{ fontSize: 18 }}
                onKeyDown={(e) => { if (e.key === "Enter") confirmWithPin(); }}
              />
            </label>
            <button
              type="button"
              onClick={confirmWithPin}
              disabled={submitting || !pinValid(pin)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {submitting ? "Validation…" : "Confirmer avec PIN"}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function ReceiptCard({
  receipt,
  onScanAgain,
  onGoTransactions,
}: {
  receipt: Receipt;
  onScanAgain: () => void;
  onGoTransactions: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[#16A34A] to-[#15803D] px-5 py-6 text-center text-white">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Paiement IPPOO CASH confirmé</p>
        <p className="mt-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 30 }}>
          −{formatPrice(receipt.amount)}
        </p>
      </div>

      <div className="p-5 space-y-3">
        {receipt.productName ? (
          <Row icon={<ScanLine className="w-4 h-4 text-[#E11D2E]" />} label="Produit" value={`${receipt.productName} ×${receipt.qty}`} />
        ) : (
          <Row icon={<QrCode className="w-4 h-4 text-[#E11D2E]" />} label="Libellé" value={receipt.label} />
        )}
        {receipt.vendor && (
          <Row icon={<Store className="w-4 h-4 text-[#FF6B00]" />} label="Marchand" value={receipt.vendor} />
        )}
        <Row icon={<Wallet className="w-4 h-4 text-[#16A34A]" />} label="Solde restant" value={formatPrice(receipt.balanceAfter)} />

        <div className="border-t border-border pt-3 grid grid-cols-2 gap-3 text-muted-foreground" style={{ fontSize: 11 }}>
          <div>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Référence</p>
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: 12 }}>{receipt.txnId}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Horodatage</p>
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: 12 }}>{receipt.date} · {receipt.time}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onScanAgain}
            className="px-4 py-2.5 rounded-xl border border-border inline-flex items-center justify-center gap-1.5 hover:bg-muted"
            style={{ fontWeight: 700, fontSize: 13 }}
          >
            <ScanLine className="w-4 h-4" /> Scanner à nouveau
          </button>
          <button
            onClick={onGoTransactions}
            className="px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white inline-flex items-center justify-center gap-1.5"
            style={{ fontWeight: 700, fontSize: 13 }}
          >
            Voir mes transactions
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
        <p className="truncate" style={{ fontWeight: 700, fontSize: 13 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   /scan/:uid - page de fallback : on essaie de résoudre l'UID en produit,
   sinon on affiche un message clair avec accès au scanner.
   ───────────────────────────────────────────────────────────────────── */

export function ScanLookupPage() {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(uid).trim();
  const product = allProducts.find(
    (p) => productUid(p) === decoded || String((p as { reference?: string }).reference) === decoded,
  );
  const myProduct = product ? undefined : lookupMyProduct(decoded);

  useEffect(() => {
    if (product) navigate(`/produit/${product.id}`, { replace: true });
    else if (myProduct) navigate(`/boutique/produits/${myProduct.id}`, { replace: true });
  }, [product, myProduct, navigate]);

  if (product || myProduct) return null;

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
        <ArrowLeft className="w-4 h-4" /> Accueil
      </button>
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E11D2E]/10 flex items-center justify-center mb-3">
          <QrCode className="w-7 h-7 text-[#E11D2E]" />
        </div>
        <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Code non reconnu</h2>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
          Aucun produit ne correspond au code <span style={{ fontWeight: 700 }}>{decoded || "-"}</span>.
        </p>
        <button
          onClick={() => navigate("/scanner")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6A00] text-white"
          style={{ fontWeight: 700, fontSize: 13 }}
        >
          <QrCode className="w-4 h-4" /> Rouvrir le scanner
        </button>
      </div>
    </div>
  );
}
