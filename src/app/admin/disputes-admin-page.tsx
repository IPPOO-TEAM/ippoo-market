/* Admin · Disputes & Refunds.
   Lists orders with an open dispute (from local payments store) and lets
   the admin resolve in favor of buyer (refund) or vendor (release escrow). */

import { useMemo, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Scale, Wallet, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  subscribe as subscribePayments,
  getState as getPaymentsState,
  resolveDispute,
  SERVER_SNAPSHOT as PAYMENTS_SNAPSHOT,
} from "../payments/store";
import { logAudit } from "./audit";
import { PageHeader, Card, Badge, EmptyState, SearchInput, Select, fmtRelative } from "./page-primitives";
import { formatPrice } from "../components/mock-data";

type Filter = "open" | "resolved" | "all";

export function AdminDisputesPage() {
  useSyncExternalStore(subscribePayments, () => getPaymentsState(), () => PAYMENTS_SNAPSHOT);
  const orders = getPaymentsState().orders;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const disputes = useMemo(() => {
    const items = orders.filter((o) => o.dispute);
    const lower = q.trim().toLowerCase();
    return items
      .filter((o) => filter === "all" ? true : o.dispute!.status === (filter === "open" ? "open" : "resolved"))
      .filter((o) => !lower || o.id.toLowerCase().includes(lower) || o.dispute!.reason.toLowerCase().includes(lower) || o.address.name.toLowerCase().includes(lower))
      .sort((a, b) => (b.dispute!.openedAt) - (a.dispute!.openedAt));
  }, [orders, q, filter]);

  const counts = useMemo(() => {
    let open = 0, resolved = 0, refunded = 0, escrowAtRisk = 0;
    for (const o of orders) {
      if (!o.dispute) continue;
      if (o.dispute.status === "open") { open++; if (o.escrowStatus === "held") escrowAtRisk += o.total; }
      else { resolved++; if (o.escrowStatus === "refunded") refunded += o.total; }
    }
    return { open, resolved, refunded, escrowAtRisk };
  }, [orders]);

  const handleResolve = async (orderId: string, outcome: "refund_buyer" | "release_vendor") => {
    setBusy(orderId);
    try {
      const res = resolveDispute(orderId, outcome, noteFor === orderId ? noteText : undefined);
      if (!res.ok) { toast.error(res.error ?? "Échec"); return; }
      logAudit(
        outcome === "refund_buyer" ? "dispute.refund_buyer" : "dispute.release_vendor",
        orderId,
        { note: noteFor === orderId ? noteText : "" },
      );
      toast.success(outcome === "refund_buyer" ? "Acheteur remboursé" : "Vendeur payé");
      setNoteFor(null); setNoteText("");
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Litiges & remboursements"
        subtitle="Arbitrez les conflits acheteur ↔ vendeur, libérez ou remboursez l'escrow."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#E11D2E]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Litiges ouverts</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#E11D2E" }}>{counts.open}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-[#3B82F6]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Résolus</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#3B82F6" }}>{counts.resolved}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-[#F0B429]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Escrow à risque</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, color: "#F0B429" }}>{formatPrice(counts.escrowAtRisk)}<span style={{ fontSize: 13 }}> F</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Total remboursé</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, color: "#16A34A" }}>{formatPrice(counts.refunded)}<span style={{ fontSize: 13 }}> F</span></p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher #commande, motif, client…" />
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Ouverts" },
            { value: "resolved", label: "Résolus" },
            { value: "all", label: "Tous" },
          ]}
        />
      </div>

      {disputes.length === 0 ? (
        <EmptyState>Aucun litige à arbitrer 🎉</EmptyState>
      ) : (
        <ul className="space-y-3">
          {disputes.map((o) => {
            const d = o.dispute!;
            const isOpen = d.status === "open";
            return (
              <Card key={o.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{o.id}</span>
                      <Badge color={isOpen ? "#E11D2E" : "#16A34A"}>{isOpen ? "Litige ouvert" : "Résolu"}</Badge>
                      <Badge color="#6B7280">Escrow : {o.escrowStatus}</Badge>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                      <strong className="text-foreground">{d.reason}</strong>
                      {d.details && <> - {d.details}</>}
                    </p>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                      Client : {o.address.name} · {o.address.city} · Ouvert {fmtRelative(d.openedAt)} · Total {formatPrice(o.total)} FCFA
                    </p>
                  </div>

                  {isOpen && (
                    <div className="flex flex-col items-stretch gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(o.id, "refund_buyer")}
                        disabled={busy === o.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white disabled:opacity-60"
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {busy === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                        Rembourser l'acheteur
                      </button>
                      <button
                        onClick={() => handleResolve(o.id, "release_vendor")}
                        disabled={busy === o.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-60"
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {busy === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Libérer au vendeur
                      </button>
                      <button
                        onClick={() => { setNoteFor(noteFor === o.id ? null : o.id); setNoteText(""); }}
                        className="text-muted-foreground"
                        style={{ fontSize: 11 }}
                      >
                        {noteFor === o.id ? "Annuler note" : "Ajouter une note"}
                      </button>
                    </div>
                  )}
                </div>

                {isOpen && noteFor === o.id && (
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Note interne pour la décision (visible dans l'audit)…"
                    rows={2}
                    className="mt-3 w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
                    style={{ fontSize: 13 }}
                  />
                )}

                {o.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <p className="text-muted-foreground mb-1" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Articles
                    </p>
                    <ul className="space-y-1">
                      {o.items.map((it, i) => (
                        <li key={`${it.id ?? "x"}-${i}`} className="flex justify-between text-muted-foreground" style={{ fontSize: 12 }}>
                          <span className="truncate mr-3">{it.name} × {it.quantity}</span>
                          <span>{formatPrice((it.price ?? 0) * (it.quantity ?? 1))} F</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AdminDisputesPage;
