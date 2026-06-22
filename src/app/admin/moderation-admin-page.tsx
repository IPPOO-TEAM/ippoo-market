/* Admin · Pre-publication moderation queue for vendor products.
   Vendors publish to "pending" by default; products only reach the public
   catalogue/comparateur once approved here. Bulk actions supported. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, X, Package, ShieldAlert, ShieldCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  subscribePublicProducts, getPublicProducts,
  setProductModeration, bulkSetProductModeration,
  type ModerationStatus,
} from "../data/public-products";
import { logAudit } from "./audit";
import { PageHeader, Card, Badge, EmptyState, Toolbar, SearchInput, Select } from "./page-primitives";
import { formatPrice } from "../components/mock-data";

type Filter = ModerationStatus | "all";

export function AdminModerationPage() {
  useSyncExternalStore(subscribePublicProducts, () => getPublicProducts().length, () => 0);
  const all = getPublicProducts();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectFor, setRejectFor] = useState<string[] | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const counts = useMemo(() => {
    let p = 0, a = 0, r = 0;
    for (const x of all) {
      const m = x.moderation ?? "pending";
      if (m === "pending") p++; else if (m === "approved") a++; else r++;
    }
    return { pending: p, approved: a, rejected: r, total: all.length };
  }, [all]);

  const filtered = useMemo(() => {
    const l = q.trim().toLowerCase();
    return all
      .filter((p) => filter === "all" ? true : (p.moderation ?? "pending") === filter)
      .filter((p) => !l || p.name.toLowerCase().includes(l) || (p.category ?? "").toLowerCase().includes(l) || (p.brand ?? "").toLowerCase().includes(l) || (p.shopSlug ?? "").toLowerCase().includes(l))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [all, q, filter]);

  const allSelectedOnPage = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleOne = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((s) => {
      const next = new Set(s);
      if (allSelectedOnPage) for (const p of filtered) next.delete(p.id);
      else for (const p of filtered) next.add(p.id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const approveOne = (id: string, name: string) => {
    setProductModeration(id, "approved");
    logAudit("product.approve", id, { name });
    toast.success(`« ${name} » approuvé`);
  };
  const bulkApprove = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    bulkSetProductModeration(ids, "approved");
    logAudit("product.bulk_approve", `${ids.length} produits`);
    toast.success(`${ids.length} produit(s) approuvé(s)`);
    clearSelection();
  };

  const submitReject = () => {
    if (!rejectFor) return;
    const reason = rejectReason.trim() || "Non conforme aux conditions de vente IPPOO";
    bulkSetProductModeration(rejectFor, "rejected", reason);
    logAudit(rejectFor.length > 1 ? "product.bulk_reject" : "product.reject", `${rejectFor.length} produit(s)`, { reason });
    toast.success(`${rejectFor.length} produit(s) rejeté(s)`);
    setRejectFor(null); setRejectReason("");
    clearSelection();
  };

  const askReject = (ids: string[]) => { setRejectFor(ids); setRejectReason(""); };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Modération produits"
        subtitle="Validez les produits avant qu'ils n'apparaissent dans le catalogue public et le comparateur."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-[#F0B429]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>À modérer</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#F0B429" }}>{counts.pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Approuvés</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#16A34A" }}>{counts.approved}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Ban className="w-4 h-4 text-[#E11D2E]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Rejetés</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#E11D2E" }}>{counts.rejected}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-[#3B82F6]" /><span className="text-muted-foreground" style={{ fontSize: 12 }}>Total vendeurs</span></div>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#3B82F6" }}>{counts.total}</p>
        </Card>
      </div>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Nom, marque, catégorie, boutique…" />
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "À modérer" },
            { value: "approved", label: "Approuvés" },
            { value: "rejected", label: "Rejetés" },
            { value: "all", label: "Tous" },
          ]}
        />
      </Toolbar>

      {selected.size > 0 && (
        <div className="sticky top-3 z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0F172A] text-white shadow-lg">
          <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.size} sélectionné(s)</span>
          <button onClick={bulkApprove} className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A]" style={{ fontSize: 12, fontWeight: 700 }}>
            <Check className="w-3.5 h-3.5" /> Approuver tout
          </button>
          <button onClick={() => askReject(Array.from(selected))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E11D2E]" style={{ fontSize: 12, fontWeight: 700 }}>
            <X className="w-3.5 h-3.5" /> Rejeter tout
          </button>
          <button onClick={clearSelection} className="text-white/70 hover:text-white px-2" style={{ fontSize: 11 }}>Désélectionner</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState>Rien à modérer dans cette vue.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input type="checkbox" checked={allSelectedOnPage} onChange={toggleAll} aria-label="Tout sélectionner" />
                  </th>
                  <th className="px-3 py-2 text-left text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Produit</th>
                  <th className="px-3 py-2 text-left text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Catégorie</th>
                  <th className="px-3 py-2 text-left text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Prix · MOQ</th>
                  <th className="px-3 py-2 text-left text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Statut</th>
                  <th className="px-3 py-2 text-right text-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const m = p.moderation ?? "pending";
                  const isChecked = selected.has(p.id);
                  return (
                    <tr key={p.id} className="border-t border-[#F3F4F6] hover:bg-muted/30">
                      <td className="px-3 py-2 align-middle">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(p.id)} aria-label={`Sélectionner ${p.name}`} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />}
                          <div className="min-w-0">
                            <p className="truncate" style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                            <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{p.brand ?? "-"} · {p.shopSlug ?? "-"}</p>
                            {m === "rejected" && p.rejectionReason && (
                              <p className="text-[#E11D2E] truncate" style={{ fontSize: 11 }} title={p.rejectionReason}>Motif : {p.rejectionReason}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground" style={{ fontSize: 12 }}>{p.category ?? "-"}</td>
                      <td className="px-3 py-2" style={{ fontSize: 12 }}>{formatPrice(p.price)} F<span className="text-muted-foreground"> · {p.moq ?? 1} {p.unit ?? "unité"}</span></td>
                      <td className="px-3 py-2">
                        {m === "approved" && <Badge color="#16A34A">Approuvé</Badge>}
                        {m === "pending" && <Badge color="#F0B429">En attente</Badge>}
                        {m === "rejected" && <Badge color="#E11D2E">Rejeté</Badge>}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {m !== "approved" && (
                          <button onClick={() => approveOne(p.id, p.name)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#16A34A] text-white mr-1" style={{ fontSize: 12, fontWeight: 700 }}>
                            <Check className="w-3.5 h-3.5" /> Approuver
                          </button>
                        )}
                        {m !== "rejected" && (
                          <button onClick={() => askReject([p.id])} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E11D2E] text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                            <X className="w-3.5 h-3.5" /> Rejeter
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectFor(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Rejeter {rejectFor.length} produit(s)</h2>
            <p className="text-muted-foreground mb-3" style={{ fontSize: 13 }}>Le motif sera visible par le vendeur sur sa fiche produit.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ex. images de mauvaise qualité, prix non conforme, description incomplète…"
              className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
              style={{ fontSize: 13 }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectFor(null)} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
              <button onClick={submitReject} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminModerationPage;
