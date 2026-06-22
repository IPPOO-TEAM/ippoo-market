/* ═══════════════════════════════════════════
   IPPOO Market - Logos des moyens de paiement
   Marques béninoises : MTN MoMo, Moov Money, Celtiis Cash.
   Cartes : Visa, Mastercard. Plus Paiement à la livraison.
   Rendu en SVG inline (aucun asset externe, aucune emoji).
   ═══════════════════════════════════════════ */
import { Banknote } from "lucide-react";
import type { PaymentMethod } from "../auth/user-profile";

type Props = { method: PaymentMethod; size?: number };

export function PaymentLogo({ method, size = 36 }: Props) {
  switch (method) {
    case "mtn":
      return <MtnBadge size={size} />;
    case "moov":
      return <MoovBadge size={size} />;
    case "celtis":
      return <CeltiisBadge size={size} />;
    case "carte":
      return <CardBadge size={size} />;
    case "livraison":
      return <CashBadge size={size} />;
    default:
      return null;
  }
}

/* ── Badges ─────────────────────────────────────────────────── */

function Frame({
  size,
  bg,
  children,
  ring,
}: {
  size: number;
  bg: string;
  ring?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        boxShadow: ring ? `inset 0 0 0 1px ${ring}` : "inset 0 0 0 1px rgba(0,0,0,.06)",
      }}
    >
      {children}
    </div>
  );
}

function MtnBadge({ size }: { size: number }) {
  // Jaune MTN officiel, monogramme MTN.
  return (
    <Frame size={size} bg="#FFCC08">
      <span
        style={{
          fontFamily: "Poppins",
          fontWeight: 900,
          fontSize: size * 0.34,
          color: "#003E7E",
          letterSpacing: -0.5,
        }}
      >
        MTN
      </span>
    </Frame>
  );
}

function MoovBadge({ size }: { size: number }) {
  // Bleu Moov Africa.
  return (
    <Frame size={size} bg="linear-gradient(135deg,#005BAA 0%, #0E73C6 100%)">
      <span
        style={{
          fontFamily: "Poppins",
          fontWeight: 900,
          fontSize: size * 0.32,
          color: "white",
          letterSpacing: -0.3,
        }}
      >
        moov
      </span>
    </Frame>
  );
}

function CeltiisBadge({ size }: { size: number }) {
  // Rouge / vert Bénin (opérateur Celtiis).
  return (
    <Frame size={size} bg="#0F1F3D">
      <svg viewBox="0 0 36 36" width={size * 0.74} height={size * 0.74}>
        <circle cx="18" cy="18" r="14" fill="#E11D2E" />
        <path d="M18 6a12 12 0 1 0 0 24V6z" fill="#16A34A" />
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Poppins"
          fontWeight={900}
          fontSize="11"
          fill="#FFE45C"
        >
          C
        </text>
      </svg>
    </Frame>
  );
}

function CardBadge({ size }: { size: number }) {
  // Carte avec marques Visa + Mastercard inline (sans logos officiels).
  return (
    <Frame size={size} bg="linear-gradient(135deg,#1A1A2E 0%, #2D1B4E 100%)" ring="rgba(255,255,255,.1)">
      <svg viewBox="0 0 40 26" width={size * 0.78} height={size * 0.78 * (26 / 40)}>
        {/* Carte */}
        <rect x="0.5" y="0.5" width="39" height="25" rx="4" fill="none" stroke="rgba(255,255,255,.25)" />
        {/* Bande Visa */}
        <text x="4" y="17" fontFamily="Poppins" fontWeight={900} fontSize="9" fill="#FFFFFF" letterSpacing="-0.5">
          VISA
        </text>
        {/* Cercles Mastercard */}
        <circle cx="29" cy="13" r="5.5" fill="#EB001B" opacity="0.95" />
        <circle cx="35" cy="13" r="5.5" fill="#F79E1B" opacity="0.95" />
        <path d="M32 8.5a6 6 0 0 0 0 9 6 6 0 0 0 0-9z" fill="#FF5F00" />
      </svg>
    </Frame>
  );
}

function CashBadge({ size }: { size: number }) {
  return (
    <Frame size={size} bg="linear-gradient(135deg,#16A34A 0%, #1FB36B 100%)">
      <Banknote className="text-white" style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.2} />
    </Frame>
  );
}

/* ── Étiquette officielle (sans emoji) ──────────────────────── */

export const PAYMENT_PROVIDER_LABEL: Record<PaymentMethod, string> = {
  mtn:       "MTN MoMo",
  moov:      "Moov Money",
  celtis:    "Celtiis Cash",
  carte:     "Carte bancaire (Visa / Mastercard)",
  livraison: "Paiement à la livraison",
};

export const PAYMENT_PROVIDER_HINT: Record<PaymentMethod, string> = {
  mtn:       "Reçois et envoie en MTN Mobile Money",
  moov:      "Compte Moov Africa Money",
  celtis:    "Wallet Celtiis (opérateur Bénin)",
  carte:     "Paiement sécurisé 3-D Secure",
  livraison: "Le client règle en espèces à la livraison",
};
