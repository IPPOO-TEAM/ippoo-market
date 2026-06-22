import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Printer, Download, FileText, Store, ShieldCheck, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { getInvoice, getOrder, getState, type Invoice } from "../payments/store";
import { usePayments } from "../payments/usePayments";
import { formatPrice } from "./mock-data";
import { productScanUrl } from "../lib/product-uid";

function loadInvoice(id: string): Invoice | undefined {
  // getInvoice est la voie nominale ; usePayments() est lu pour déclencher le rerender.
  return getInvoice(id);
}

export function FactureDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  usePayments(); // abonnement pour rafraîchir si la facture vient d'être créée
  const invoice = useMemo(() => loadInvoice(id), [id]);
  const order = invoice ? getOrder(invoice.orderId) : undefined;

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-3 text-muted-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
          <h2 className="mt-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Facture introuvable</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            La facture {id} n'existe pas ou n'a pas encore été générée.
          </p>
        </div>
      </div>
    );
  }

  const lines = invoice.lines ?? [];
  const subtotal = lines.reduce((s, l) => s + l.total, 0) || invoice.total;
  const shipping = order?.shipping ?? 0;
  const discount = order?.discount ?? 0;

  const handleDownload = () => {
    const payload = {
      invoice,
      order,
      generatedAt: new Date().toISOString(),
      issuer: "IPPOO Market",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const defaultTo = (invoice.buyer as { email?: string } | undefined)?.email ?? (order?.address as { email?: string } | undefined)?.email ?? "";
    const to = window.prompt("Envoyer la facture à l'adresse e-mail :", defaultTo)?.trim();
    if (!to) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      toast.error("Adresse e-mail invalide");
      return;
    }
    const subject = `Facture IPPOO Market ${invoice.id}`;
    const bodyLines = [
      `Bonjour ${invoice.buyer?.name ?? order?.address.name ?? ""},`,
      "",
      `Veuillez trouver ci-dessous le récapitulatif de votre facture ${invoice.id} émise le ${invoice.date}.`,
      `Commande : ${invoice.orderId}`,
      `Montant total TTC : ${formatPrice(invoice.total)}`,
      `Statut : ${invoice.status === "paid" ? "PAYÉE" : "EN ATTENTE"}`,
      "",
      "Lignes :",
      ...lines.map((l) => `· ${l.name} × ${l.quantity} - ${formatPrice(l.total)}`),
      "",
      "Vous pouvez consulter et télécharger votre facture certifiée sur IPPOO Market.",
      "- L'équipe IPPOO Market",
    ];
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    try {
      window.location.href = mailto;
    } catch {
      /* ignore */
    }
    toast.success(`Facture ${invoice.id} envoyée à ${to}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-3 no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex gap-2">
          <button onClick={handleEmail} className="px-3 py-2 rounded-xl border border-border bg-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
            <Mail className="w-4 h-4" /> E-mail
          </button>
          <button onClick={handleDownload} className="px-3 py-2 rounded-xl border border-border bg-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
            <Download className="w-4 h-4" /> Télécharger
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-xl bg-[#1A1A2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] text-white flex items-center justify-center" style={{ fontFamily: "Poppins", fontWeight: 900 }}>IP</div>
              <div>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>IPPOO Market</p>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>Plateforme B2B Bénin / UEMOA</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>FACTURE</p>
            <p style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 800, fontSize: 15 }}>{invoice.id}</p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{invoice.date}</p>
            <span
              className="inline-block mt-1.5 px-2 py-0.5 rounded"
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: invoice.status === "paid" ? "rgba(22,163,74,0.12)" : "rgba(234,179,8,0.18)",
                color: invoice.status === "paid" ? "#16A34A" : "#A16207",
              }}
            >
              {invoice.status === "paid" ? "PAYÉE" : "EN ATTENTE"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>ACHETEUR</p>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{invoice.buyer?.name ?? order?.address.name ?? "-"}</p>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{invoice.buyer?.phone ?? order?.address.phone ?? ""}</p>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {invoice.buyer?.line ?? order?.address.line ?? ""} {invoice.buyer?.city ?? order?.address.city ?? ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>RÉFÉRENCES</p>
            <p style={{ fontSize: 12 }}>Commande : <span style={{ fontFamily: "ui-monospace", fontWeight: 700 }}>{invoice.orderId}</span></p>
            {order?.txnId && (
              <p style={{ fontSize: 12 }}>Transaction : <span style={{ fontFamily: "ui-monospace", fontWeight: 700 }}>{order.txnId}</span></p>
            )}
            <p style={{ fontSize: 12 }}>Paiement : {invoice.payMethod ?? order?.payMethod ?? "-"}</p>
          </div>
        </div>

        {invoice.vendorRefs && invoice.vendorRefs.length > 0 && (
          <div className="mt-5">
            <p className="text-muted-foreground mb-2" style={{ fontSize: 11, fontWeight: 700 }}>VENDEURS</p>
            <div className="flex flex-wrap gap-2">
              {invoice.vendorRefs.map((v) => (
                <span key={v.vendorId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted" style={{ fontSize: 11, fontWeight: 600 }}>
                  <Store className="w-3.5 h-3.5 text-[#E11D2E]" /> {v.vendorName} · {formatPrice(v.subtotal)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full" style={{ fontSize: 12 }}>
            <thead>
              <tr className="bg-[#1A1A2E] text-white text-left">
                <th className="px-3 py-2" style={{ fontWeight: 700 }}>UID</th>
                <th className="px-3 py-2" style={{ fontWeight: 700 }}>Produit</th>
                <th className="px-3 py-2" style={{ fontWeight: 700 }}>Catégorie</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 700 }}>Qté</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 700 }}>PU</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">
                    Pas de détail de lignes pour cette facture.
                  </td>
                </tr>
              )}
              {lines.map((l) => (
                <tr key={`${l.uid}-${l.productId}`} className="border-b border-border">
                  <td className="px-3 py-2" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11 }}>{l.uid}</td>
                  <td className="px-3 py-2">
                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>Vendu par {l.vendorName ?? "-"}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{l.category ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{l.quantity} {l.unit ?? ""}</td>
                  <td className="px-3 py-2 text-right">{formatPrice(l.unitPrice)}</td>
                  <td className="px-3 py-2 text-right" style={{ fontWeight: 700 }}>{formatPrice(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="self-start">
            <p className="text-muted-foreground mb-1.5" style={{ fontSize: 11, fontWeight: 700 }}>VÉRIFICATION QR</p>
            <div className="p-2 bg-white border border-border rounded-xl inline-block">
              <QRCodeSVG value={productScanUrl(invoice.id)} size={92} level="M" />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-muted-foreground" style={{ fontSize: 10 }}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Facture certifiée IPPOO Market
            </div>
          </div>
          <div className="w-full sm:w-72 self-end">
            <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
              <span className="text-muted-foreground">Sous-total</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
            </div>
            {shipping ? (
              <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                <span className="text-muted-foreground">Livraison</span>
                <span>{formatPrice(shipping)}</span>
              </div>
            ) : null}
            {discount ? (
              <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                <span className="text-muted-foreground">Remise</span>
                <span style={{ color: "#16A34A" }}>-{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border mt-1 pt-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              <span>Total TTC</span>
              <span style={{ color: "#E11D2E" }}>{formatPrice(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media print {
        .no-print { display: none !important; }
        body { background: white; }
      }`}</style>
    </div>
  );
}

// Empêche le tree-shaking de virer getState : utilisé en debug par les tests.
export const __debugGetState = getState;
