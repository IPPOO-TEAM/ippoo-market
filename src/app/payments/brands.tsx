// Registre central des marques de paiement (logos, couleurs, libellés).
// Sert le PaymentDialog, le wallet, les pages de recharge, et tout autre
// endroit qui présente un moyen de paiement à l'utilisateur.

import { Banknote, CreditCard, QrCode, Truck, Wallet } from "lucide-react";
import mtnLogo from "../../imports/images__19_.png";
import moovLogo from "../../imports/promotion-1-1-350x250__1_.png";
import waveLogo from "../../imports/wave_logo_670.jpg";
import orangeLogo from "../../imports/Orange-Money-logo.jpg";
import mastercardLogo from "../../imports/MasterCard-Logo.svg.png";
import celtisLogo from "../../imports/FiRK9VOXwBEtkoy.jpg";
import ippooLogo from "../../imports/ippo_market.png";

export type BrandKey =
  | "ippoo"
  | "mtn"
  | "moov"
  | "celtis"
  | "wave"
  | "orange"
  | "card"
  | "fedapay"
  | "cod"
  | "qr";

export type BrandInfo = {
  key: BrandKey;
  label: string;
  short: string;
  color: string;     // couleur dominante (background tag, accents)
  bg: string;        // fond du carré logo (souvent #FFF, parfois coloré)
  logo?: string;     // image PNG/JPG si dispo
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  fallbackText?: string; // monogramme si pas de logo
};

export const BRANDS: Record<BrandKey, BrandInfo> = {
  ippoo:   { key: "ippoo",   label: "IPPOO CASH",       short: "IPPOO",  color: "#E11D2E", bg: "#FFFFFF", logo: ippooLogo,       fallbackIcon: Wallet },
  mtn:     { key: "mtn",     label: "MTN Money",        short: "MTN",    color: "#FFCC00", bg: "#FFFFFF", logo: mtnLogo },
  moov:    { key: "moov",    label: "Moov Money",       short: "Moov",   color: "#0066B3", bg: "#FFFFFF", logo: moovLogo },
  celtis:  { key: "celtis",  label: "Celtis Cash",      short: "Celtis", color: "#16A34A", bg: "#FFFFFF", logo: celtisLogo },
  wave:    { key: "wave",    label: "Wave",             short: "Wave",   color: "#1DC8FF", bg: "#FFFFFF", logo: waveLogo },
  orange:  { key: "orange",  label: "Orange Money",     short: "Orange", color: "#FF6600", bg: "#FFFFFF", logo: orangeLogo },
  card:    { key: "card",    label: "Carte bancaire",   short: "Carte",  color: "#1A1F71", bg: "#FFFFFF", logo: mastercardLogo,   fallbackIcon: CreditCard },
  fedapay: { key: "fedapay", label: "FedaPay",          short: "Feda",   color: "#0061FF", bg: "#0061FF", fallbackText: "FP",     fallbackIcon: Banknote },
  cod:     { key: "cod",     label: "Paiement livraison", short: "COD",  color: "#16A34A", bg: "#16A34A", fallbackIcon: Truck },
  qr:      { key: "qr",      label: "QR Code IPPOO",    short: "QR",     color: "#0F172A", bg: "#0F172A", fallbackIcon: QrCode },
};

type LogoSize = "sm" | "md" | "lg";

const SIZE_PX: Record<LogoSize, number> = { sm: 32, md: 44, lg: 56 };

/** Composant logo générique - carré arrondi avec image, icône ou monogramme. */
export function PaymentLogo({
  brand,
  size = "md",
  className = "",
}: {
  brand: BrandKey;
  size?: LogoSize;
  className?: string;
}) {
  const info = BRANDS[brand];
  const px = SIZE_PX[size];
  const radius = size === "sm" ? 8 : 12;
  const useImage = !!info.logo;
  const useText = !info.logo && !!info.fallbackText;
  const Icon = info.fallbackIcon;

  return (
    <div
      className={`shrink-0 border border-border overflow-hidden flex items-center justify-center ${className}`}
      style={{
        width: px,
        height: px,
        borderRadius: radius,
        background: useImage ? "#FFFFFF" : info.bg,
      }}
      aria-label={info.label}
    >
      {useImage ? (
        <img
          src={info.logo}
          alt={info.label}
          className="w-full h-full object-contain p-1"
          loading="lazy"
          draggable={false}
        />
      ) : useText ? (
        <span
          style={{
            color: "#FFFFFF",
            fontFamily: "Poppins",
            fontWeight: 900,
            fontSize: size === "sm" ? 11 : size === "md" ? 14 : 18,
            letterSpacing: 0.5,
          }}
        >
          {info.fallbackText}
        </span>
      ) : Icon ? (
        <Icon
          className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}
          // @ts-expect-error lucide accepts color via style on root svg
          style={{ color: info.bg === "#FFFFFF" ? info.color : "#FFFFFF" }}
        />
      ) : null}
    </div>
  );
}

/** Ligne compacte logo + nom (pour récap commande, transaction, etc.). */
export function PaymentBrandRow({ brand, sub }: { brand: BrandKey; sub?: string }) {
  const info = BRANDS[brand];
  return (
    <div className="inline-flex items-center gap-2">
      <PaymentLogo brand={brand} size="sm" />
      <div className="min-w-0">
        <p className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>{info.label}</p>
        {sub && <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{sub}</p>}
      </div>
    </div>
  );
}
