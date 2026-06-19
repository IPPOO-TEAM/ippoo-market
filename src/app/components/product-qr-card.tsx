import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

type Props = {
  uid: string;
  scanUrl: string;
  productName: string;
  origin?: string;
  liveStock?: number;
};

export function ProductQrCard({ scanUrl }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-[#FFF8F0] p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-[#E11D2E]" strokeWidth={2.5} />
        <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#0F172A" }}>
          Identifiant unique &amp; QR
        </h3>
      </div>

      <div className="flex justify-center">
        <div className="p-4 bg-white rounded-2xl border border-border">
          <QRCodeSVG
            value={scanUrl}
            size={240}
            level="H"
            fgColor="#1A1A2E"
            bgColor="#FFFFFF"
            includeMargin={false}
            imageSettings={{
              src:
                "data:image/svg+xml;utf8," +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#E11D2E"/><text x="50%" y="50%" dy=".1em" text-anchor="middle" dominant-baseline="middle" font-family="Poppins, Inter, system-ui, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF">IP</text></svg>`,
                ),
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </div>
      </div>

      <p className="mt-5 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.55 }}>
        Scannez le QR pour ouvrir la fiche produit, vérifier l'origine ou régler en un geste via IPPOO CASH.
      </p>
    </div>
  );
}
