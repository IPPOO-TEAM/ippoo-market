import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Download,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  Fingerprint,
  FileDown,
  Wifi,
  RotateCw,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import ippooLogo from "figma:asset/c982f0d5cbe3604558371bad9d18d2f42806762d.png";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { buildQrToken } from "../services/identity";
import { registerBiometric, isBiometricSupported } from "../services/biometric";

const BRAND = {
  red: "#E8202A",
  orange: "#FF7A18",
  gold: "#D6A400",
  ink: "#0E0E12",
  ink2: "#1B1B1F",
  cream: "#FAF7F0",
};

function tierFor(role?: string | null): { label: string; gradient: string; accent: string } {
  if (role === "supplier")
    return {
      label: "FOURNISSEUR",
      gradient: "linear-gradient(135deg, #0E0E12 0%, #1B1B1F 40%, #2A1810 100%)",
      accent: BRAND.gold,
    };
  if (role === "admin")
    return {
      label: "ADMIN",
      gradient: "linear-gradient(135deg, #1a0b0b 0%, #2A0E10 50%, #4a1418 100%)",
      accent: "#FF6B6B",
    };
  return {
    label: "MEMBRE",
    gradient: "linear-gradient(135deg, #E8202A 0%, #C71823 40%, #8B1218 100%)",
    accent: "#FFD27A",
  };
}

export function QrIdentity() {
  const { user, updateUser } = useAuth();
  const { currentPlan, subscription } = useSubscription();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectoRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const supported = isBiometricSupported();
  const tier = useMemo(() => tierFor(user?.role), [user?.role]);
  const [flipped, setFlipped] = useState(false);

  const refresh = async () => {
    if (!user?.userNumber || !user.qrSecret) return;
    const t = await buildQrToken(user);
    setToken(t);
    if (canvasRef.current) {
      await QRCode.toCanvas(canvasRef.current, t, {
        width: 512,
        margin: 0,
        color: { dark: "#0E0E12", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.userNumber, user?.qrSecret]);

  if (!user) return null;

  const formatted = user.userNumber
    ? user.userNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1  $2  $3")
    : "—";

  const initials = (user.fullname || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
    : "05/26";

  const expiresOn = subscription.paidUntil
    ? new Date(subscription.paidUntil).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
    : "—/—";

  const download = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-identity-${user.userNumber}.png`;
    a.click();
  };

  const downloadPdf = async () => {
    if (!user.userNumber || !cardRef.current) return;

    const W = 85.6;
    const H = 54;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H] });

    const captureFace = async (target: "recto" | "verso") => {
      return html2canvas(cardRef.current!, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
        onclone: (cloned: Document) => {
          cloned.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
            el.style.transform = "none";
          });
          cloned.querySelectorAll<HTMLElement>("[data-face]").forEach((el) => {
            if (el.getAttribute("data-face") === target) {
              el.style.transform = "none";
            } else {
              el.style.display = "none";
            }
          });
        },
      });
    };

    try {
      const rectoCanvas = await captureFace("recto");
      doc.addImage(rectoCanvas.toDataURL("image/png"), "PNG", 0, 0, W, H);

      doc.addPage([W, H], "landscape");
      const versoCanvas = await captureFace("verso");
      doc.addImage(versoCanvas.toDataURL("image/png"), "PNG", 0, 0, W, H);

      doc.save(`ippoo-carte-membre-${user.userNumber}.pdf`);
      toast.success("Carte PDF téléchargée");
    } catch (err) {
      console.error("[QrIdentity] PDF export failed", err);
      toast.error("Échec du téléchargement du PDF");
    }
  };

  const copyNumber = async () => {
    if (!user.userNumber) return;
    await navigator.clipboard.writeText(user.userNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const enrolBiometric = async () => {
    if (!user.userNumber) return;
    setBioBusy(true);
    try {
      const credentialId = await registerBiometric(user.userNumber, user.fullname);
      updateUser({ biometricCredentialId: credentialId });
      toast.success("Empreinte biométrique enregistrée.");
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enrôlement biométrique.");
    } finally {
      setBioBusy(false);
    }
  };

  return (
    <section
      className="rounded-3xl border border-border bg-white p-5 md:p-6"
      style={{ boxShadow: "0 10px 30px rgba(27,27,31,.06)" }}
    >
      <header className="flex items-center gap-2 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg, #E8202A 0%, #FF7A18 100%)" }}
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            Ma carte de membre IPPOO
          </h3>
          <p style={{ fontSize: 12, color: "#5A5F6A" }}>
            Format CR80 · Imprimable en PDF.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Premium visual card — recto/verso flip */}
        <div className="flex flex-col items-center w-full lg:w-auto">
          <div
            ref={cardRef}
            className="relative w-full mx-auto"
            style={{
              maxWidth: 380,
              aspectRatio: "1.586 / 1",
              perspective: 1400,
              containerType: "inline-size",
            }}
          >
            <div
              data-flip
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* ─── RECTO ─── */}
              <div
                ref={rectoRef}
                data-face="recto"
                className="absolute inset-0 overflow-hidden text-white"
                style={{
                  borderRadius: "5.5cqw",
                  background: tier.gradient,
                  boxShadow:
                    "0 24px 48px rgba(14,14,18,.35), 0 6px 14px rgba(14,14,18,.18), inset 0 1px 0 rgba(255,255,255,.12)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  display: "grid",
                  gridTemplateRows: "auto auto auto 1fr auto",
                  padding: "5cqw",
                  gap: "1.8cqw",
                }}
              >
            {/* Decorative layers — pointer-events-none */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(circle at 88% -10%, rgba(255,255,255,.22), transparent 38%),
                  radial-gradient(circle at -10% 115%, ${tier.accent}44, transparent 45%),
                  linear-gradient(125deg, transparent 38%, rgba(255,255,255,.07) 50%, transparent 62%)
                `,
              }}
            />
            {/* Initials watermark */}
            <span
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                right: "5cqw",
                top: "50%",
                fontFamily: "Poppins",
                fontWeight: 800,
                fontSize: "30cqw",
                opacity: 0.07,
                letterSpacing: "0.3cqw",
                lineHeight: 0.85,
                transform: "translateY(-50%)",
              }}
            >
              {initials}
            </span>

            {/* Guilloché security pattern — very subtle */}
            <svg
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
              style={{ opacity: 0.06, mixBlendMode: "screen" }}
            >
              <defs>
                <pattern id="guilloche" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20 Q 10 0 20 20 T 40 20" stroke="white" strokeWidth="0.4" fill="none" />
                  <path d="M0 30 Q 10 10 20 30 T 40 30" stroke="white" strokeWidth="0.4" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#guilloche)" />
            </svg>

            {/* Initials monogram watermark — Revolut style, large + soft */}

            {/* Row 1 — Brand block (inline logomark + wordmark + sub) · Tier pill */}
            <div className="relative flex items-start justify-between" style={{ gap: "3cqw" }}>
              <div className="flex items-center" style={{ gap: "2.2cqw" }}>
                <img
                  src={ippooLogo}
                  alt="IPPOO"
                  style={{
                    height: "9cqw",
                    width: "auto",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,.3))",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "2cqw",
                    letterSpacing: "0.32cqw",
                    lineHeight: 1,
                    opacity: 0.75,
                    fontWeight: 600,
                  }}
                >
                  CARTE DE MEMBRE · BÉNIN
                </span>
              </div>
              <span
                className="inline-flex items-center"
                style={{
                  padding: "1.2cqw 2.6cqw",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.14)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  fontSize: "2.2cqw",
                  fontFamily: "Poppins",
                  fontWeight: 700,
                  letterSpacing: "0.35cqw",
                  border: "1px solid rgba(255,255,255,.3)",
                  color: tier.accent,
                  flexShrink: 0,
                }}
              >
                {(currentPlan?.name ?? tier.label).toUpperCase()}
              </span>
            </div>

            {/* Row 2 — Chip + contactless (AmEx-style alignment) */}
            <div className="relative flex items-center" style={{ gap: "2.8cqw" }}>
              <div
                style={{
                  width: "12cqw",
                  height: "9cqw",
                  borderRadius: "1.4cqw",
                  background:
                    "linear-gradient(135deg, #F2D88A 0%, #D9B25E 35%, #A5832E 100%)",
                  position: "relative",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(0,0,0,.2), 0 1px 2px rgba(0,0,0,.25)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "0.9cqw",
                    borderRadius: "0.5cqw",
                    border: "0.22cqw solid rgba(0,0,0,.3)",
                    backgroundImage:
                      "linear-gradient(to right, transparent 49%, rgba(0,0,0,.3) 50%, transparent 51%), linear-gradient(to bottom, transparent 49%, rgba(0,0,0,.3) 50%, transparent 51%)",
                  }}
                />
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: "7cqw",
                  height: "7cqw",
                  opacity: 0.9,
                  transform: "rotate(90deg)",
                  color: "white",
                }}
              >
                <path
                  d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Row 3 — MEMBER ID label + big number */}
            <div className="relative flex flex-col justify-center" style={{ gap: "1.4cqw" }}>
              <p
                style={{
                  fontSize: "1.9cqw",
                  opacity: 0.6,
                  letterSpacing: "0.38cqw",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                MEMBER ID
              </p>
              <p
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  fontSize: "6.6cqw",
                  letterSpacing: "0.38cqw",
                  textShadow: "0 1px 0 rgba(0,0,0,.25)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {formatted}
              </p>
            </div>

            {/* Row 4 — Holder + since (refined AmEx hierarchy) */}
            <div className="relative flex items-center justify-between" style={{ gap: "2.5cqw" }}>
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    fontSize: "1.9cqw",
                    opacity: 0.6,
                    letterSpacing: "0.38cqw",
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  TITULAIRE
                </p>
                <p
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 700,
                    fontSize: "3.6cqw",
                    marginTop: "1.1cqw",
                    textTransform: "uppercase",
                    letterSpacing: "0.18cqw",
                    lineHeight: 1.05,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.fullname || "—"}
                </p>
                {user.company && (
                  <p
                    style={{
                      fontSize: "2.2cqw",
                      opacity: 0.8,
                      marginTop: "0.5cqw",
                      letterSpacing: "0.06cqw",
                      lineHeight: 1.1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.company}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  style={{
                    fontSize: "1.9cqw",
                    opacity: 0.6,
                    letterSpacing: "0.38cqw",
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  EXPIRE LE
                </p>
                <p
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 700,
                    fontSize: "3.6cqw",
                    marginTop: "1.1cqw",
                    letterSpacing: "0.12cqw",
                    lineHeight: 1,
                  }}
                >
                  {expiresOn}
                </p>
              </div>
            </div>
              </div>

              {/* ─── VERSO ─── */}
              <div
                ref={versoRef}
                data-face="verso"
                className="absolute inset-0 overflow-hidden"
                style={{
                  borderRadius: "5.5cqw",
                  background:
                    "linear-gradient(160deg, #14161D 0%, #1B1E27 55%, #0E0E12 100%)",
                  boxShadow:
                    "0 24px 48px rgba(14,14,18,.45), 0 6px 14px rgba(14,14,18,.22), inset 0 1px 0 rgba(255,255,255,.08)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  color: "#EDEEF2",
                  display: "grid",
                  gridTemplateRows: "auto auto 1fr auto auto",
                }}
              >
                {/* Decorative ambient glows */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(circle at 12% 18%, ${tier.accent}33, transparent 38%),
                      radial-gradient(circle at 92% 78%, rgba(232,32,42,.18), transparent 45%),
                      linear-gradient(125deg, transparent 38%, rgba(255,255,255,.04) 50%, transparent 62%)
                    `,
                  }}
                />

                {/* Guilloché security pattern */}
                <svg
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  width="100%"
                  height="100%"
                  style={{ opacity: 0.08, mixBlendMode: "screen" }}
                >
                  <defs>
                    <pattern id="guilloche-back" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20 Q 10 0 20 20 T 40 20" stroke="white" strokeWidth="0.4" fill="none" />
                      <path d="M0 30 Q 10 10 20 30 T 40 30" stroke="white" strokeWidth="0.4" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#guilloche-back)" />
                </svg>

                {/* Initials watermark — discreet */}
                <span
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: "5cqw",
                    top: "50%",
                    fontFamily: "Poppins",
                    fontWeight: 800,
                    fontSize: "28cqw",
                    opacity: 0.04,
                    letterSpacing: "0.3cqw",
                    lineHeight: 0.85,
                    transform: "translateY(-50%)",
                  }}
                >
                  {initials}
                </span>

                {/* Top brand strip with IPPOO wordmark + tier echo */}
                <div
                  className="relative flex items-center justify-between"
                  style={{ padding: "4cqw 5cqw 0 5cqw" }}
                >
                  <div className="flex items-center" style={{ gap: "2cqw" }}>
                    <img
                      src={ippooLogo}
                      alt="IPPOO"
                      style={{
                        height: "7cqw",
                        width: "auto",
                        objectFit: "contain",
                        filter: "brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,.4))",
                      }}
                    />
                  </div>
                  <span
                    className="inline-flex items-center"
                    style={{
                      padding: "1cqw 2.4cqw",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.08)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      fontSize: "1.9cqw",
                      fontFamily: "Poppins",
                      fontWeight: 700,
                      letterSpacing: "0.32cqw",
                      border: "1px solid rgba(255,255,255,.18)",
                      color: tier.accent,
                    }}
                  >
                    {(user.company || tier.label).toUpperCase()}
                  </span>
                </div>

                {/* Holographic magnetic stripe */}
                <div
                  className="relative"
                  style={{ marginTop: "3cqw" }}
                >
                  <div
                    style={{
                      height: "7.5cqw",
                      background:
                        "linear-gradient(180deg, #000 0%, #15161B 50%, #000 100%)",
                      borderTop: "1px solid rgba(255,255,255,.06)",
                      borderBottom: "1px solid rgba(0,0,0,.6)",
                    }}
                  />
                  {/* Holo foil ribbon */}
                  <div
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      left: "5cqw",
                      right: "5cqw",
                      bottom: "-1.6cqw",
                      height: "2.4cqw",
                      borderRadius: "1.2cqw",
                      background:
                        "linear-gradient(90deg, #FF7A18 0%, #E8202A 25%, #FF3D8D 50%, #7C3AED 75%, #1DC7FF 100%)",
                      opacity: 0.85,
                      boxShadow: "0 4px 14px rgba(255,122,24,.35)",
                    }}
                  />
                </div>

                {/* QR + Signature/CVV — main row */}
                <div
                  className="relative flex items-center"
                  style={{
                    padding: "4cqw 5cqw 1.5cqw 5cqw",
                    gap: "3cqw",
                  }}
                >
                  <div
                    className="bg-white flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                    style={{
                      borderRadius: "1.4cqw",
                      padding: "0.8cqw",
                      width: "26cqw",
                      height: "26cqw",
                      boxShadow: "0 4px 10px rgba(0,0,0,.35)",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={512}
                      height={512}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "contain",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>
                  <div
                    className="min-w-0 flex flex-col"
                    style={{ gap: "1.2cqw", width: "32cqw" }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "2cqw",
                          color: "rgba(237,238,242,.55)",
                          letterSpacing: "0.32cqw",
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                      >
                        SIGNATURE DU TITULAIRE
                      </p>
                      <div
                        className="flex items-end relative overflow-hidden"
                        style={{
                          marginTop: "0.7cqw",
                          borderRadius: "0.9cqw",
                          background:
                            "repeating-linear-gradient(135deg, #FAF7F0 0 1.2cqw, #F0EAD8 1.2cqw 2.4cqw)",
                          padding: "1.4cqw 1.8cqw",
                          height: "13cqw",
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,.1)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Brush Script MT', cursive",
                            fontStyle: "italic",
                            fontSize: "3.6cqw",
                            color: "#1B1B1F",
                            lineHeight: 1,
                            opacity: 0.85,
                          }}
                        >
                          {user.fullname?.split(" ")[0] || "Signature"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mentions légales */}
                <div className="relative" style={{ padding: "0 5cqw" }}>
                </div>

              </div>
            </div>
          </div>

          {/* Flip toggle + helper text under the card */}
          <div className="mt-3 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white hover:bg-muted"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {flipped ? "Voir le recto" : "Voir le verso"}
            </button>
            <p style={{ fontSize: 11, color: "#5A5F6A" }}>
              Touchez la carte pour la retourner · QR au dos
            </p>
          </div>
        </div>

        {/* Right column: number + actions */}
        <div className="min-w-0">
          <div>
            <p style={{ fontSize: 10, color: "#5A5F6A", letterSpacing: 0.8 }}>
              NUMÉRO DE COMPTE
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p
                className="font-mono"
                style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 18 }}
              >
                {formatted}
              </p>
              <button
                onClick={copyNumber}
                className="p-1.5 rounded-lg hover:bg-muted"
                aria-label="Copier"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" style={{ color: "#1FB36B" }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="mt-3" style={{ fontSize: 12, color: "#5A5F6A" }}>
              Présentez le QR au comptoir, en caisse ou pour vous reconnecter
              sans saisir vos identifiants.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-muted"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Régénérer
            </button>
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-muted"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <Download className="w-3.5 h-3.5" />
              QR en PNG
            </button>
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #E8202A 0%, #FF7A18 100%)",
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: 12,
                boxShadow: "0 6px 14px rgba(232,32,42,.3)",
              }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Télécharger la carte PDF
            </button>
            {supported && (
              <button
                onClick={enrolBiometric}
                disabled={bioBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-50"
                style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                {user.biometricCredentialId
                  ? "Empreinte enregistrée"
                  : "Enrôler mon empreinte"}
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
