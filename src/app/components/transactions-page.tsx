import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CheckCircle2, ChevronRight, Clock, Copy, CreditCard, Download, QrCode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { usePayments } from "../payments/usePayments";
import { StaggerList, StaggerItem } from "./anim";
import { AnimatedNumber } from "./animated-number";

type TxRow = {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount: number;
  date: string;
  time: string;
  method: string;
  status: "success" | "pending";
  ref: string;
};

const FEDAPAY_RE = /(FDP-[A-Z0-9]{5}-[A-Z0-9]{5})/;


export function TransactionsPage() {
  const navigate = useNavigate();
  const state = usePayments();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<TxRow | null>(null);

  const allTransactions = useMemo<TxRow[]>(() => {
    const live: TxRow[] = state.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      label: t.label,
      amount: t.amount,
      date: t.date,
      time: t.time,
      method: t.method,
      status: (t.status === "failed" ? "pending" : t.status) as "success" | "pending",
      ref: t.ref,
    }));
    return live;
  }, [state.transactions]);

  const filtered = allTransactions
    .filter((t) => filter === "all" || t.type === filter || t.status === filter || (filter === "qr" && t.method === "QR Code"))
    .filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));

  // Totaux du mois calendaire courant, dérivés de l'historique réel.
  const { creditTotal, debitTotal } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let credit = 0;
    let debit = 0;
    for (const t of state.transactions) {
      const ts = typeof t.ts === "number" ? new Date(t.ts) : null;
      if (!ts || ts.getFullYear() !== y || ts.getMonth() !== m) continue;
      if (t.status !== "success") continue;
      if (t.type === "credit") credit += t.amount;
      else debit += t.amount;
    }
    return { creditTotal: credit, debitTotal: debit };
  }, [state.transactions]);

  return (
    <div>
      <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4400] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
            <CreditCard className="w-6 h-6" /> TRANSACTIONS
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>Historique complet de vos paiements et mouvements</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => navigate("/scanner")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors" style={{ fontSize: 12, fontWeight: 600 }}><QrCode className="w-3.5 h-3.5" /> Payer par QR</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher une transaction..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border" style={{ fontSize: 13 }} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {[
            { key: "all", label: "Toutes" },
            { key: "credit", label: "Entrées" },
            { key: "debit", label: "Sorties" },
            { key: "qr", label: "QR Code" },
            { key: "pending", label: "En attente" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl border transition-all ${filter === tab.key ? "bg-[#4F46E5] text-white border-[#4F46E5]" : "bg-white text-foreground border-border"}`}
              style={{ fontSize: 12, fontWeight: 600 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-[#E8FFF0] rounded-xl border border-border p-3">
            <p className="text-muted-foreground" style={{ fontSize: 10 }}>Total entrées (mois)</p>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#00B341" }}><AnimatedNumber value={creditTotal} format={(n) => formatPrice(n)} /></p>
          </div>
          <div className="bg-[#FFE8EA] rounded-xl border border-border p-3">
            <p className="text-muted-foreground" style={{ fontSize: 10 }}>Total sorties (mois)</p>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color: "#E11D2E" }}><AnimatedNumber value={debitTotal} format={(n) => formatPrice(n)} /></p>
          </div>
        </div>

        {/* Transactions list */}
        <StaggerList className="space-y-2">
          {filtered.map((tx) => (
            <StaggerItem
              key={tx.id}
              onClick={() => setDetail(tx)}
              whileTap={{ scale: 0.985 }}
              className="w-full text-left bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-[#00B341]/10" : "bg-[#E11D2E]/10"}`}>
                {tx.type === "credit" ? <ArrowDownLeft className="w-5 h-5 text-[#00B341]" /> : <ArrowUpRight className="w-5 h-5 text-[#E11D2E]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{tx.label}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{tx.date} · {tx.time} · {tx.method}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 10 }}>Réf: {tx.ref}</span>
                  {tx.status === "pending" && <span className="text-[#FF6B00] flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 600 }}><Clock className="w-3 h-3" /> En attente</span>}
                  {tx.status === "success" && <span className="text-[#00B341] flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 600 }}><CheckCircle2 className="w-3 h-3" /> Confirmé</span>}
                </div>
              </div>
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: tx.amount > 0 ? "#16A34A" : "#E11D2E" }}>
                {tx.amount > 0 ? "+" : ""}{formatPrice(Math.abs(tx.amount))}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </StaggerItem>
          ))}
        </StaggerList>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Aucune transaction</h3>
          </div>
        )}

        <button onClick={() => {
          const header = "ID,Type,Libellé,Montant,Date,Heure,Méthode,Statut,Référence\n";
          const rows = filtered.map((t) => [t.id, t.type, `"${t.label.replace(/"/g, '""')}"`, t.amount, t.date, t.time, t.method, t.status, t.ref].join(",")).join("\n");
          const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `transactions-${Date.now()}.csv`;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
          toast.success("Export CSV téléchargé !");
        }} className="w-full mt-4 py-3 border border-border rounded-xl flex items-center justify-center gap-2 bg-white" style={{ fontSize: 13, fontWeight: 600 }}>
          <Download className="w-4 h-4" /> Exporter l'historique (CSV)
        </button>
      </div>

      {detail && <TransactionDetail tx={detail} onClose={() => setDetail(null)} onOpenOrder={(orderId) => { setDetail(null); navigate(`/commande/${orderId}`); }} />}
    </div>
  );
}

function TransactionDetail({
  tx,
  onClose,
  onOpenOrder,
}: {
  tx: TxRow;
  onClose: () => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const fedapayRef = tx.label.match(FEDAPAY_RE)?.[1];
  const cleanLabel = fedapayRef ? tx.label.replace(` · ${fedapayRef}`, "").replace(fedapayRef, "").trim() : tx.label;
  const orderRef = /^CMD-/.test(tx.ref) ? tx.ref : undefined;

  const copy = (val: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(val).then(
        () => toast.success(`${label} copié`),
        () => toast.error("Copie impossible"),
      );
    } else {
      toast.error("Copie indisponible");
    }
  };

  const positive = tx.amount > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-border max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 py-6 text-center text-white ${positive ? "bg-gradient-to-br from-[#16A34A] to-[#15803D]" : "bg-gradient-to-br from-[#FF6A00] to-[#FF4400]"}`}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            {positive ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
            {positive ? "Crédit" : "Débit"} · {tx.method}
          </p>
          <p className="mt-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28 }}>
            {positive ? "+" : "−"}{formatPrice(Math.abs(tx.amount))}
          </p>
          <p className="mt-1" style={{ fontSize: 11, opacity: 0.85 }}>{tx.date} · {tx.time}</p>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30">
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 space-y-3">
          <DetailRow label="Libellé" value={cleanLabel} />
          <DetailRow
            label="Identifiant"
            value={tx.id}
            action={<button onClick={() => copy(tx.id, "Identifiant")} className="p-1.5 rounded-lg hover:bg-muted"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          />
          <DetailRow
            label="Référence"
            value={tx.ref}
            action={<button onClick={() => copy(tx.ref, "Référence")} className="p-1.5 rounded-lg hover:bg-muted"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          />
          {fedapayRef && (
            <DetailRow
              label="Réf. FedaPay"
              value={fedapayRef}
              action={<button onClick={() => copy(fedapayRef, "Réf. FedaPay")} className="p-1.5 rounded-lg hover:bg-muted"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>}
            />
          )}
          <DetailRow
            label="Statut"
            value={tx.status === "success" ? "Confirmé" : "En attente"}
            valueColor={tx.status === "success" ? "#16A34A" : "#FF6B00"}
          />

          {orderRef && (
            <button
              onClick={() => onOpenOrder(orderRef)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[#FF6A00] text-white inline-flex items-center justify-center gap-2"
              style={{ fontWeight: 700, fontSize: 13 }}
            >
              Voir la commande {orderRef}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor, action }: { label: string; value: string; valueColor?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
        <p className="truncate" style={{ fontWeight: 700, fontSize: 13, color: valueColor }}>{value}</p>
      </div>
      {action}
    </div>
  );
}