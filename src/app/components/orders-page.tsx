import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useOnPullRefresh } from "../native/RefreshContext";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Filter,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { formatPrice } from "./mock-data";
import { usePayments } from "../payments/usePayments";
import { useMyOrders, refreshMyOrders } from "../data/orders-server";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  preparation: "En préparation",
  expedition: "En cours de livraison",
  livree: "Livrée",
  cloturee: "Clôturée",
  litige: "En litige",
  annulee: "Annulée",
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
import { GiftBanner, CouponStrip } from "./promo-widgets";
import { StaggerList, StaggerItem } from "./anim";

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: "#9CA3AF", bg: "#F3F4F6", icon: Clock },
  preparation: { color: "#FF6B00", bg: "#FFF3E8", icon: Clock },
  expedition: { color: "#0066FF", bg: "#E8F0FF", icon: Truck },
  livree: { color: "#00B341", bg: "#E8FFF0", icon: CheckCircle2 },
  cloturee: { color: "#6B7280", bg: "#F3F4F6", icon: CheckCircle2 },
  litige: { color: "#E11D2E", bg: "#FFE8EA", icon: AlertTriangle },
  annulee: { color: "#E11D2E", bg: "#FFE8EA", icon: XCircle },
};

const tabs = [
  { key: "all", label: "Toutes" },
  { key: "preparation", label: "En préparation" },
  { key: "expedition", label: "En cours" },
  { key: "livree", label: "Livrées" },
  { key: "cloturee", label: "Clôturées" },
];

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const pay = usePayments();
  const serverOrders = useMyOrders();

  // Fusion serveur (source de vérité) + local (commandes mock / hors-ligne).
  const sourceOrders = (() => {
    const byId = new Map<string, { id: string; date: string; status: string; statusLabel: string; total: number; items: number; seller: string; createdAt: number }>();
    for (const o of serverOrders) {
      byId.set(o.id, {
        id: o.id,
        date: fmtDate(o.createdAt),
        status: o.status,
        statusLabel: statusLabels[o.status as keyof typeof statusLabels] ?? o.status,
        total: o.total,
        items: o.items.reduce((acc: number, it: any) => acc + (it.qty ?? it.quantity ?? 0), 0),
        seller: (o.items[0] as any)?.title || "—",
        createdAt: o.createdAt,
      });
    }
    for (const o of pay.orders) {
      if (byId.has(o.id)) continue;
      byId.set(o.id, {
        id: o.id,
        date: fmtDate(o.createdAt),
        status: o.status,
        statusLabel: statusLabels[o.status] ?? o.status,
        total: o.total,
        items: o.items.reduce((acc, it) => acc + it.quantity, 0),
        seller: o.items[0]?.vendorName || o.items[0]?.seller || "—",
        createdAt: o.createdAt,
      });
    }
    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  })();

  const filtered = activeTab === "all" ? sourceOrders : sourceOrders.filter((o) => o.status === activeTab);

  useOnPullRefresh(useCallback(async () => {
    await refreshMyOrders();
    toast.success("Commandes mises à jour");
  }, []));

  return (
    <div>
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24 }}>MES COMMANDES</h1>
          <p className="text-white/70 mt-1" style={{ fontSize: 13 }}>
            Suivez vos commandes, livraisons et retours
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl border transition-all ${
                activeTab === tab.key
                  ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                  : "bg-white text-foreground border-border"
              }`}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <StaggerList className="space-y-3">
          {filtered.map((order) => {
            const config = statusConfig[order.status] ?? statusConfig.preparation;
            const StatusIcon = config.icon;
            return (
              <StaggerItem
                key={order.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-border p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>{order.id}</span>
                    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{order.date}</p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-xl flex items-center gap-1.5"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: config.color,
                      background: config.bg,
                    }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {order.statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{order.seller}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{order.items} articles</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#E11D2E" }}>
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                {/* Timeline for active orders */}
                {(order.status === "preparation" || order.status === "expedition") && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <div className="flex items-center gap-1">
                      {["Confirmée", "Préparation", "Expédition", "Livrée"].map((step, i) => {
                        const activeStep = order.status === "preparation" ? 1 : order.status === "expedition" ? 2 : 3;
                        return (
                          <div key={i} className="flex-1 flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                i <= activeStep ? "bg-[#16A34A]" : "bg-[#E5E7EB]"
                              }`}
                            />
                            <div
                              className={`flex-1 h-0.5 ${
                                i < activeStep ? "bg-[#16A34A]" : "bg-[#E5E7EB]"
                              } ${i === 3 ? "hidden" : ""}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {["Confirmée", "Préparation", "Expédition", "Livrée"].map((step, i) => (
                        <span key={i} className="text-muted-foreground" style={{ fontSize: 9 }}>{step}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/commande/${order.id}`)}
                    className="flex-1 py-2 bg-[#F3F4F6] rounded-xl flex items-center justify-center gap-1"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    Détails <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {(order.status === "expedition") && (
                    <button
                      onClick={() => navigate(`/commande/${order.id}`)}
                      className="flex-1 py-2 bg-[#16A34A] text-white rounded-xl flex items-center justify-center gap-1"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      <Truck className="w-3.5 h-3.5" /> Suivre
                    </button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Aucune commande</h3>
            <p className="text-muted-foreground mt-2" style={{ fontSize: 14 }}>
              Commencez à explorer les produits pour passer votre première commande !
            </p>
          </div>
        )}

        {/* Promos after orders */}
        <div className="mt-6 space-y-3">
          <CouponStrip code="REVIENS" label="Fidélité" discount="-10% sur votre prochaine commande" condition="Valable dans les 7 jours suivant votre dernière commande" color="#1A1A2E" expiry="Expire dans 7 jours" />
          <GiftBanner
            text="Fidélité récompensée"
            subtext="Chaque commande vous rapproche d'un cadeau, Voir vos points"
            link="/vip"
          />
        </div>
      </div>
    </div>
  );
}