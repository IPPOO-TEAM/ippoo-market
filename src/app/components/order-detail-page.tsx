import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  MessageSquare,
  FileText,
  Copy,
  AlertTriangle,
  X,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { orders, formatPrice, IMAGES } from "./mock-data";
import { usePayments } from "../payments/usePayments";
import { openDispute, type EscrowStatus } from "../payments/store";
import { useMyOrders } from "../data/orders-server";

const ESCROW_META: Record<EscrowStatus, { label: string; color: string; bg: string; help: string }> = {
  held:     { label: "Fonds protégés", color: "#FF6B00", bg: "#FFF3E8", help: "Fonds retenus par IPPOO jusqu'à la livraison." },
  released: { label: "Libéré",       color: "#00B341", bg: "#E8FFF0", help: "Fonds versés au vendeur après confirmation." },
  refunded: { label: "Remboursé",    color: "#0066FF", bg: "#E8F0FF", help: "Montant recrédité sur ton IPPOO CASH." },
  "n/a":    { label: "À la livraison", color: "#64748B", bg: "#F1F5F9", help: "Paiement encaissé à la livraison." },
};

const statusSteps = ["Confirmée", "Préparation", "Expédition", "Livrée"];

const DISPUTE_REASONS = [
  "Colis non reçu",
  "Produit endommagé",
  "Produit non conforme",
  "Quantité incorrecte",
  "Autre",
];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pay = usePayments();
  const serverOrders = useMyOrders();
  const serverOrder = serverOrders.find((o) => o.id === id);
  const realOrder = pay.orders.find((o) => o.id === id) || (serverOrder ? {
    id: serverOrder.id,
    createdAt: serverOrder.createdAt,
    items: serverOrder.items.map((it: any) => ({
      name: it.title,
      quantity: it.qty,
      unit: "pièce",
      price: it.unitPrice,
      image: undefined as string | undefined,
    })),
    total: serverOrder.total,
    status: serverOrder.status as any,
    escrowStatus: serverOrder.escrowStatus,
    dispute: undefined as any,
  } as any : undefined);
  const mockOrder = orders.find((o) => o.id === id);

  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!realOrder && !mockOrder) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4" style={{ fontSize: 14 }}>Commande introuvable.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Retour</button>
      </div>
    );
  }

  const STATUS_LABEL: Record<string, string> = {
    pending: "En attente",
    preparation: "En préparation",
    expedition: "En expédition",
    livree: "Livrée",
    cloturee: "Clôturée",
    litige: "En litige",
    annulee: "Annulée",
  };

  const order = realOrder
    ? {
        id: realOrder.id,
        status: realOrder.status,
        statusLabel: STATUS_LABEL[realOrder.status] || realOrder.status,
        date: new Date(realOrder.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        total: realOrder.total,
      }
    : (mockOrder as { id: string; status: string; statusLabel: string; date: string; total: number });

  const rawEscrow = realOrder?.escrowStatus;
  const escrowStatus: EscrowStatus =
    rawEscrow === "released" || rawEscrow === "refunded" || rawEscrow === "n/a" || rawEscrow === "held"
      ? rawEscrow
      : "held";
  const escrow = ESCROW_META[escrowStatus] ?? ESCROW_META.held;
  const dispute = realOrder?.dispute;

  const activeStep = order.status === "preparation" ? 1 : order.status === "expedition" ? 2 : order.status === "livree" ? 3 : order.status === "cloturee" ? 4 : 0;

  const orderItems = realOrder
    ? realOrder.items.map((it) => ({
        name: it.name,
        qty: it.quantity,
        unit: it.unit || "pièce",
        price: it.price,
        image: it.image || IMAGES.grocery,
      }))
    : [
        { name: "Riz Parfumé 25kg - Premium", qty: 15, unit: "sacs", price: 14800, image: IMAGES.grocery },
        { name: "Savon de ménage - Carton 48pcs", qty: 10, unit: "cartons", price: 9000, image: IMAGES.hygiene },
      ];

  const escrowSteps = (() => {
    const paid = true;
    const inEscrow = escrowStatus !== "n/a";
    const delivered = order.status === "livree" || order.status === "cloturee";
    const released = escrowStatus === "released";
    const refunded = escrowStatus === "refunded";
    const disputed = !!dispute && dispute.status === "open";

    const finalStep = refunded
      ? { label: "Fonds remboursés", desc: `Crédités sur ton IPPOO CASH`, color: "#0066FF", icon: Wallet, done: true }
      : disputed
        ? { label: "Fonds bloqués (litige)", desc: `IPPOO arbitre le dossier sous 48h`, color: "#E11D2E", icon: ShieldAlert, done: true }
        : { label: "Fonds libérés au vendeur", desc: released ? "Vendeur payé" : "Après confirmation de réception", color: "#00B341", icon: CheckCircle2, done: released };

    return [
      { label: "Paiement reçu", desc: "Montant prélevé et validé", color: "#00B341", icon: CheckCircle2, done: paid },
      { label: "Fonds protégés par IPPOO", desc: inEscrow ? "Protégés jusqu'à livraison" : "Paiement à la livraison", color: "#FF6B00", icon: ShieldCheck, done: inEscrow },
      { label: "Livraison confirmée", desc: delivered ? "Acheteur a reçu la commande" : "En attente", color: "#0066FF", icon: Truck, done: delivered },
      finalStep,
    ];
  })();

  async function submitDispute() {
    if (!reason) { toast.error("Sélectionne un motif"); return; }
    if (!realOrder) { toast.error("Commande non synchronisée — impossible d'ouvrir un litige"); return; }
    setSubmitting(true);
    const res = openDispute(order.id, reason, details.trim() || undefined);
    setSubmitting(false);
    if (!res.ok) { toast.error(res.error || "Erreur"); return; }
    toast.success("Litige ouvert — IPPOO te répond sous 48h");
    setShowDispute(false);
    setDetails("");
  }

  const canDispute = !!realOrder && (!dispute || dispute.status !== "open") && order.status !== "annulee";

  return (
    <div className="pb-20">
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="flex-1 text-center truncate px-4" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
          {order.id}
        </h3>
        <button onClick={() => { copyToClipboard(order.id); toast.success("Numéro copié !"); }} className="p-2 rounded-xl hover:bg-muted">
          <Copy className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Status header */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>{order.id}</p>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{order.date}</p>
            </div>
            <span className="px-3 py-1 rounded-xl" style={{
              fontSize: 12, fontWeight: 700,
              color: order.status === "livree" || order.status === "cloturee" ? "#00B341" : order.status === "expedition" ? "#0066FF" : "#FF6B00",
              background: order.status === "livree" || order.status === "cloturee" ? "#E8FFF0" : order.status === "expedition" ? "#E8F0FF" : "#FFF3E8",
            }}>
              {order.statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            {statusSteps.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={`w-3 h-3 rounded-full shrink-0 ${i <= activeStep ? "bg-[#00B341]" : "bg-[#E5E7EB]"}`} />
                {i < 3 && <div className={`flex-1 h-0.5 ${i < activeStep ? "bg-[#00B341]" : "bg-[#E5E7EB]"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {statusSteps.map((step, i) => (
              <span key={i} className={i <= activeStep ? "text-[#00B341]" : "text-muted-foreground"} style={{ fontSize: 10, fontWeight: 600 }}>{step}</span>
            ))}
          </div>
        </div>

        {/* Escrow timeline */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
              <ShieldCheck className="w-4 h-4 text-[#FF6B00]" /> Paiement protégé IPPOO
            </h3>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: escrow.bg, color: escrow.color, fontSize: 11, fontWeight: 700 }}
            >
              {escrow.label}
            </span>
          </div>
          <p className="text-muted-foreground mb-4" style={{ fontSize: 11 }}>{escrow.help}</p>

          <div className="space-y-0">
            {escrowSteps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === escrowSteps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.done ? step.color : "#F3F4F6",
                        color: step.done ? "#fff" : "#9CA3AF",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: step.done ? step.color : "#E5E7EB", minHeight: 24 }} />}
                  </div>
                  <div className="pb-5 flex-1">
                    <p style={{ fontSize: 13, fontWeight: 700, color: step.done ? "#111827" : "#9CA3AF" }}>{step.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {dispute && (
            <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#E11D2E" }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                  Litige {dispute.status === "open" ? "en cours" : "résolu"} · {dispute.reason}
                </p>
                {dispute.details && (
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{dispute.details}</p>
                )}
                <p className="text-muted-foreground mt-1" style={{ fontSize: 10 }}>
                  Ouvert le {new Date(dispute.openedAt).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Timeline events (delivery) */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            <Clock className="w-4 h-4 text-[#FF6B00]" /> Historique livraison
          </h3>
          <div className="space-y-4">
            {[
              { time: "05 Mars 14:30", label: "Commande confirmée", desc: "Paiement reçu et validé", done: true },
              { time: "05 Mars 16:00", label: "En préparation", desc: "Le vendeur prépare votre commande", done: activeStep >= 1 },
              { time: "06 Mars 09:00", label: "Expédiée", desc: "Colis remis au transporteur", done: activeStep >= 2 },
              { time: "07 Mars", label: "Livraison prévue", desc: "Entre 8h et 12h", done: activeStep >= 3 },
            ].map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${event.done ? "bg-[#00B341]" : "bg-[#E5E7EB]"}`} />
                  {i < 3 && <div className={`w-0.5 flex-1 ${event.done ? "bg-[#00B341]" : "bg-[#E5E7EB]"}`} />}
                </div>
                <div className="pb-4">
                  <p style={{ fontSize: 13, fontWeight: 600, color: event.done ? "#111827" : "#9CA3AF" }}>{event.label}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{event.desc}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            <Package className="w-4 h-4 text-[#E11D2E]" /> Articles ({orderItems.length})
          </h3>
          {orderItems.map((item, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.qty} {item.unit} × {formatPrice(item.price)}</p>
              </div>
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#E11D2E" }}>
                {formatPrice(item.qty * item.price)}
              </p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between" style={{ fontSize: 13 }}>
              <span className="text-muted-foreground">Sous-total</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(order.total - 15000)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 13 }}>
              <span className="text-muted-foreground">Transport</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(15000)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Total</span>
              <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18, color: "#E11D2E" }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
            <Truck className="w-4 h-4 text-[#FF6B00]" /> Livraison
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <p style={{ fontSize: 13 }}>Quartier Agla, Lot 456, Cotonou, Bénin</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p style={{ fontSize: 13 }}>Livraison estimée : 24-48h</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/messagerie")} className="py-3 bg-white border border-border rounded-xl flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
            <MessageSquare className="w-4 h-4 text-[#FF6B00]" /> Contacter vendeur
          </button>
          <button onClick={() => toast.success("Facture téléchargée !")} className="py-3 bg-white border border-border rounded-xl flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
            <FileText className="w-4 h-4 text-[#00B341]" /> Télécharger facture
          </button>
        </div>

        {order.status === "livree" && (
          <button onClick={() => toast.success("Commande confirmée !")} className="w-full py-3 bg-[#00B341] text-white rounded-xl" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <CheckCircle2 className="inline w-4 h-4 mr-1" /> Confirmer la réception
          </button>
        )}

        {(order.status === "livree" || order.status === "cloturee") && (() => {
          const slugs = Array.from(new Set(
            (realOrder?.items ?? [])
              .map((it) => it.vendorId)
              .filter((v): v is string => typeof v === "string" && v.length > 0)
          ));
          if (slugs.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl border border-border p-4">
              <h3 className="flex items-center gap-2 mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                <Star className="w-4 h-4 text-[#F0B429]" /> Votre avis compte
              </h3>
              <p className="text-muted-foreground mb-3" style={{ fontSize: 12 }}>
                Aidez les autres acheteurs en évaluant {slugs.length > 1 ? "ces boutiques" : "cette boutique"}.
              </p>
              <div className="flex flex-wrap gap-2">
                {slugs.map((s) => (
                  <button
                    key={s}
                    onClick={() => navigate(`/boutique/${encodeURIComponent(s)}?review=1`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white"
                    style={{
                      background: "linear-gradient(135deg, #F0B429 0%, #F97316 100%)",
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Noter {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {canDispute && (
          <button
            onClick={() => setShowDispute(true)}
            className="w-full py-3 border border-[#E11D2E] text-[#E11D2E] rounded-xl flex items-center justify-center gap-2"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <AlertTriangle className="w-4 h-4" /> Signaler un litige
          </button>
        )}
      </div>

      {/* Dispute modal */}
      {showDispute && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => !submitting && setShowDispute(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white">
              <h3 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
                <ShieldAlert className="w-5 h-5 text-[#E11D2E]" /> Ouvrir un litige
              </h3>
              <button onClick={() => !submitting && setShowDispute(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl p-3" style={{ background: "#FFF3E8", border: "1px solid #FED7AA" }}>
                <p style={{ fontSize: 12, color: "#9A3412", fontWeight: 600 }}>
                  Les fonds seront gelés jusqu'à arbitrage par IPPOO (réponse sous 48h).
                </p>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Motif</label>
                <div className="grid grid-cols-1 gap-2">
                  {DISPUTE_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className="text-left px-3 py-2.5 rounded-xl border transition-colors"
                      style={{
                        background: reason === r ? "#FEF2F2" : "#fff",
                        borderColor: reason === r ? "#E11D2E" : "#E5E7EB",
                        color: reason === r ? "#991B1B" : "#111827",
                        fontSize: 13,
                        fontWeight: reason === r ? 700 : 500,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Détails (facultatif)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Décris brièvement le problème rencontré…"
                  className="w-full px-3 py-2 rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
                  style={{ fontSize: 13 }}
                />
                <p className="text-right text-muted-foreground mt-1" style={{ fontSize: 10 }}>{details.length}/500</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDispute(false)}
                  disabled={submitting}
                  className="flex-1 py-3 border border-border rounded-xl"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  onClick={submitDispute}
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#FF6A00] text-white rounded-xl disabled:opacity-60"
                  style={{ fontFamily: "Poppins", fontSize: 13, fontWeight: 700 }}
                >
                  {submitting ? "Envoi…" : "Ouvrir le litige"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
