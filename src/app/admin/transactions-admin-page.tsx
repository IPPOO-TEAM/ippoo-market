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
/* ───────────── Transactions ───────────── */

export function AdminTransactionsPage() {
  const pay = usePayments();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "credit" | "debit">("all");

  const filtered = pay.transactions.filter((t) => {
    if (type !== "all" && t.type !== type) return false;
    if (q && !t.label.toLowerCase().includes(q.toLowerCase()) && !t.id.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totalIn = pay.transactions.filter((t) => t.type === "credit" && t.status === "success").reduce((s, t) => s + t.amount, 0);
  const totalOut = pay.transactions.filter((t) => t.type === "debit" && t.status === "success").reduce((s, t) => s + Math.abs(t.amount), 0);

  const exportCsv = () => {
    const rows = [
      ["ID", "Date", "Type", "Libellé", "Montant", "Méthode", "Statut"],
      ...filtered.map((t) => [t.id, t.date, t.type, t.label, String(t.amount), t.method, t.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV généré");
  };

  return (
    <div className="p-6">
      <PageHeader title="Transactions" subtitle={`${pay.transactions.length} mouvement(s)`} actions={
        <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Entrées</p>
          <p className="text-[#16A34A]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>+<AnimatedNumber value={totalIn} format={(n) => formatPrice(n)} /> FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Sorties</p>
          <p className="text-[#E11D2E]" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>−<AnimatedNumber value={totalOut} format={(n) => formatPrice(n)} /> FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Solde net</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}><AnimatedNumber value={totalIn - totalOut} format={(n) => formatPrice(n)} /> FCFA</p>
        </Card>
      </div>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher transaction" />
        <Select
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "Tous types" },
            { value: "credit", label: "Crédits" },
            { value: "debit", label: "Débits" },
          ]}
        />
      </Toolbar>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>ID</Th><Th>Date</Th><Th>Libellé</Th><Th>Méthode</Th><Th>Montant</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><Td className="text-center text-muted-foreground" >Aucune transaction</Td></tr>}
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40">
                  <Td><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{t.id}</span></Td>
                  <Td className="text-muted-foreground">{t.date} · {t.time}</Td>
                  <Td>{t.label}</Td>
                  <Td className="text-muted-foreground">{t.method}</Td>
                  <Td>
                    <span className={t.type === "credit" ? "text-[#16A34A]" : "text-[#E11D2E]"} style={{ fontWeight: 700 }}>
                      {t.type === "credit" ? "+" : ""}{formatPrice(t.amount)} FCFA
                    </span>
                  </Td>
                  <Td>
                    {t.status === "success" ? <Badge color="#16A34A">Succès</Badge> : t.status === "pending" ? <Badge color="#F0B429">En attente</Badge> : <Badge color="#E11D2E">Échec</Badge>}
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

