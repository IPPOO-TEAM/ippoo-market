import { useEffect, useMemo, useState } from "react";
import { Check, X, ArrowUpRight, Download, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminTickets,
  updateAdminTicket,
  AdminTicket,
} from "../data/admin-server";
import { downloadCSV } from "./csv";
import {
  fmtDate, fmtRelative,
  PageHeader, Card, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState,
} from "./page-primitives";

type Filter = "all" | AdminTicket["status"];

export function AdminSupportPage() {
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [opened, setOpened] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await listAdminTickets()); }
    catch (e: any) { setError(e?.message || "Échec du chargement"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const sorted = useMemo(() => {
    const order: Record<AdminTicket["priority"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return items
      .filter((t) => {
        if (status !== "all" && t.status !== status) return false;
        const qq = q.toLowerCase();
        if (qq && !t.subject.toLowerCase().includes(qq) && !(t.userEmail || "").toLowerCase().includes(qq)) return false;
        return true;
      })
      .sort((a, b) => order[a.priority] - order[b.priority] || b.updatedAt - a.updatedAt);
  }, [items, q, status]);

  const exportCsv = () => {
    downloadCSV("tickets.csv", sorted.map((t) => ({
      id: t.id, subject: t.subject, user: t.userEmail || "", category: t.category,
      priority: t.priority, status: t.status,
      created: fmtDate(t.createdAt), updated: fmtDate(t.updatedAt),
    })));
  };

  const applyUpdate = async (input: Parameters<typeof updateAdminTicket>[0]) => {
    try {
      const saved = await updateAdminTicket(input);
      setItems((arr) => arr.map((t) => t.id === saved.id ? saved : t));
      return saved;
    } catch (e: any) { toast.error(e?.message || "Échec"); return null; }
  };

  const sendReply = async () => {
    if (!opened || !reply.trim()) return;
    setSending(true);
    const saved = await applyUpdate({ id: opened, reply: reply.trim() });
    setSending(false);
    if (saved) { setReply(""); toast.success("Réponse envoyée"); }
  };

  const current = opened ? items.find((t) => t.id === opened) : null;

  return (
    <div className="p-6">
      <PageHeader title="Support / SAV" subtitle={`${items.length} ticket(s)`} actions={
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="px-3 py-2 rounded-xl border border-border flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl border border-border flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      } />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Sujet ou email…" />
        <Select value={status} onChange={(v) => setStatus(v as Filter)} options={[
          { value: "all", label: "Tous statuts" },
          { value: "open", label: "Ouverts" },
          { value: "in_progress", label: "En cours" },
          { value: "resolved", label: "Résolus" },
          { value: "closed", label: "Fermés" },
        ]} />
      </Toolbar>

      {error && <Card className="p-4 mb-4" style={{ borderColor: "#E11D2E" }}><span style={{ color: "#E11D2E", fontSize: 13 }}>{error}</span></Card>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Sujet</Th><Th>Utilisateur</Th><Th>Catégorie</Th><Th>Priorité</Th><Th>Statut</Th><Th>MAJ</Th><Th /></tr></thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>Chargement…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7}><EmptyState>Aucun ticket.</EmptyState></td></tr>
              ) : sorted.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => { setOpened(t.id); setReply(""); }}>
                  <Td><strong>{t.subject}</strong></Td>
                  <Td className="text-muted-foreground">{t.userEmail || "—"}</Td>
                  <Td className="capitalize text-muted-foreground">{t.category}</Td>
                  <Td><StatusBadge status={t.priority} /></Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td className="text-muted-foreground">{fmtRelative(t.updatedAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <IconBtn icon={MessageSquare} label="Ouvrir" onClick={() => { setOpened(t.id); setReply(""); }} color="#3B82F6" />
                      {t.status === "open" && (
                        <IconBtn icon={ArrowUpRight} label="Prendre" onClick={() => void applyUpdate({ id: t.id, status: "in_progress" })} color="#3B82F6" />
                      )}
                      {(t.status === "open" || t.status === "in_progress") && (
                        <IconBtn icon={Check} label="Résoudre" onClick={() => void applyUpdate({ id: t.id, status: "resolved" })} color="#16A34A" />
                      )}
                      {t.status === "resolved" && (
                        <IconBtn icon={X} label="Fermer" onClick={() => void applyUpdate({ id: t.id, status: "closed" })} color="#6B7280" />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {current && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpened(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div>
                <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>{current.subject}</h3>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                  {current.userEmail || "—"} · {current.category} · <StatusBadge status={current.priority} /> <StatusBadge status={current.status} />
                </p>
              </div>
              <button onClick={() => setOpened(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-xl bg-muted/40 p-3" style={{ fontSize: 13 }}>
                <div className="text-muted-foreground mb-1" style={{ fontSize: 11 }}>Message initial · {fmtDate(current.createdAt)}</div>
                {current.message}
              </div>
              {current.replies.map((r, i) => (
                <div key={i} className={`rounded-xl p-3 ${r.from === "admin" ? "bg-[#E11D2E]/10 ml-6" : "bg-muted/40 mr-6"}`} style={{ fontSize: 13 }}>
                  <div className="text-muted-foreground mb-1" style={{ fontSize: 11 }}>
                    {r.from === "admin" ? "Admin" : "Utilisateur"} · {fmtRelative(r.at)}
                  </div>
                  {r.text}
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>Priorité :</span>
                <Select value={current.priority} onChange={(v) => void applyUpdate({ id: current.id, priority: v as AdminTicket["priority"] })} options={[
                  { value: "low", label: "Basse" },
                  { value: "normal", label: "Normale" },
                  { value: "high", label: "Haute" },
                  { value: "urgent", label: "Urgente" },
                ]} />
                <span className="text-muted-foreground ml-2" style={{ fontSize: 12 }}>Statut :</span>
                <Select value={current.status} onChange={(v) => void applyUpdate({ id: current.id, status: v as AdminTicket["status"] })} options={[
                  { value: "open", label: "Ouvert" },
                  { value: "in_progress", label: "En cours" },
                  { value: "resolved", label: "Résolu" },
                  { value: "closed", label: "Fermé" },
                ]} />
              </div>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Répondre à l'utilisateur…" className="w-full px-3 py-2 rounded-xl border border-border outline-none resize-y" style={{ fontSize: 13 }} />
              <div className="flex justify-end">
                <button onClick={() => void sendReply()} disabled={sending || !reply.trim()} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white disabled:opacity-60" style={{ fontSize: 13, fontWeight: 700 }}>
                  {sending ? "Envoi…" : "Envoyer la réponse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
