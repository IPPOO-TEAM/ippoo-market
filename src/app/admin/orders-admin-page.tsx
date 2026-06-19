import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Package,
  Wallet,
  Crown,
  Check,
  X,
  Pause,
  Play,
  Trash2,
  Download,
  ArrowUpRight,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { AnimatedNumber } from "../components/animated-number";
import { usePayments } from "../payments/usePayments";
import { useAdminOrders, setOrderStatus as setServerOrderStatus, refreshAdminOrders, type OrderRecord, type OrderStatus as ServerOrderStatus } from "../data/orders-server";
import {
  cancelOrder,
  updateOrderStatus,
  Order,
  OrderStatus,
} from "../payments/store";
import { useAdminSettings, updateAdminSettings, resetAdminSettings } from "./settings-store";
import { downloadCSV } from "./csv";
import { Switch } from "../components/ui-kit/Switch";
import { changeAdminPin } from "./auth";
import {
  fmtDate, fmtRelative,
  PageHeader, Card, Badge, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState,
} from "./page-primitives";
/* ───────────── Orders ───────────── */

export function AdminOrdersPage() {
  const serverOrders = useAdminOrders();
  const pay = usePayments();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ServerOrderStatus>("all");

  // Fusion serveur + local (les commandes uniquement-mock restent visibles).
  const merged: OrderRecord[] = (() => {
    const byId = new Map<string, OrderRecord>();
    for (const o of serverOrders) byId.set(o.id, o);
    for (const o of pay.orders) {
      if (byId.has(o.id)) continue;
      byId.set(o.id, {
        id: o.id,
        userId: "",
        items: o.items as any,
        shippingAddress: {
          name: o.address?.name || "",
          phone: o.address?.phone || "",
          city: o.address?.city || "",
          line1: o.address?.line || "",
        },
        paymentMethod: (o.payMethod as any) || "wallet",
        total: o.total,
        commission: 0,
        vendorShares: {},
        status: o.status as ServerOrderStatus,
        escrowStatus: (o.escrowStatus as any) || "n/a",
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
      });
    }
    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  })();

  const filtered = merged.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    const name = o.shippingAddress?.name || "";
    if (q && !o.id.toLowerCase().includes(q.toLowerCase()) && !name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const advance = async (o: OrderRecord) => {
    const next: Record<ServerOrderStatus, ServerOrderStatus | null> = {
      pending: "preparation",
      preparation: "expedition",
      expedition: "livree",
      livree: "cloturee",
      cloturee: null,
      litige: null,
      annulee: null,
    };
    const n = next[o.status];
    if (!n) return;
    if (o.userId) {
      const saved = await setServerOrderStatus(o.id, n, o.userId);
      if (saved) { toast.success(`Commande ${o.id} → ${n}`); return; }
    }
    updateOrderStatus(o.id, n as any);
    toast.success(`Commande ${o.id} → ${n}`);
  };

  return (
    <div className="p-6">
      <PageHeader title="Commandes" subtitle={`${merged.length} commande(s)`} actions={
        <button onClick={() => void refreshAdminOrders()} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Rafraîchir</button>
      } />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher par ID ou client" />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous statuts" },
            { value: "preparation", label: "Préparation" },
            { value: "expedition", label: "Expédition" },
            { value: "livree", label: "Livrée" },
            { value: "cloturee", label: "Clôturée" },
            { value: "litige", label: "Litige" },
            { value: "annulee", label: "Annulée" },
          ]}
        />
      </Toolbar>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>ID</Th><Th>Date</Th><Th>Client</Th><Th>Articles</Th><Th>Total</Th><Th>Méthode</Th><Th>Statut</Th><Th /></tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><Td className="text-center text-muted-foreground" >Aucune commande</Td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <Td><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{o.id}</span></Td>
                  <Td className="text-muted-foreground">{fmtDate(o.createdAt)}</Td>
                  <Td>{o.shippingAddress?.name || "—"}</Td>
                  <Td className="text-muted-foreground">{o.items.length} ligne(s)</Td>
                  <Td><strong>{formatPrice(o.total)}</strong> FCFA</Td>
                  <Td className="capitalize text-muted-foreground">{o.paymentMethod}</Td>
                  <Td><StatusBadge status={o.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {o.status !== "cloturee" && o.status !== "annulee" && o.status !== "litige" && (
                        <IconBtn icon={ArrowUpRight} label="Avancer" onClick={() => void advance(o)} color="#16A34A" />
                      )}
                      {(o.status === "preparation" || o.status === "pending") && (
                        <IconBtn icon={X} label="Annuler" onClick={async () => {
                          if (o.userId) {
                            const saved = await setServerOrderStatus(o.id, "annulee", o.userId);
                            if (saved) { toast.success("Commande annulée"); return; }
                          }
                          const r = cancelOrder(o.id);
                          if (r.ok) toast.success("Commande annulée"); else toast.error(r.error);
                        }} color="#E11D2E" />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

