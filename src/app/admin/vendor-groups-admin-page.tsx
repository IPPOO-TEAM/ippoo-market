/* Admin · Modération des groupements vendeurs.
   Liste tous les groupements, permet d'approuver/rejeter/archiver. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, X, Archive, Trash2, Users, Crown, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeVendorGroups, getVendorGroupsSnapshot,
  listAllVendorGroups, setGroupModeration, archiveGroup, deleteVendorGroup,
  activeMembers, MAX_MEMBERS,
  type VendorGroup,
} from "../data/vendor-groups";
import { logAudit } from "./audit";
import { PageHeader, Card, Badge, EmptyState, Toolbar, SearchInput, Select, fmtRelative } from "./page-primitives";

type Filter = "pending" | "approved" | "rejected" | "archived" | "all";

export function AdminVendorGroupsPage() {
  useSyncExternalStore(subscribeVendorGroups, getVendorGroupsSnapshot, getVendorGroupsSnapshot);
  const all = listAllVendorGroups();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [rejectFor, setRejectFor] = useState<VendorGroup | null>(null);
  const [reason, setReason] = useState("");

  const counts = useMemo(() => {
    let p = 0, a = 0, r = 0, ar = 0;
    for (const g of all) {
      if (g.status === "archived") ar++;
      else if (g.moderation === "pending") p++;
      else if (g.moderation === "approved") a++;
      else r++;
    }
    return { pending: p, approved: a, rejected: r, archived: ar, total: all.length };
  }, [all]);

  const filtered = useMemo(() => {
    const l = q.trim().toLowerCase();
    return all
      .filter((g) => {
        if (filter === "archived") return g.status === "archived";
        if (filter === "all") return true;
        if (g.status === "archived") return false;
        return g.moderation === filter;
      })
      .filter((g) => !l || g.name.toLowerCase().includes(l) || g.primaryNiche.toLowerCase().includes(l) || (g.city ?? "").toLowerCase().includes(l) || g.members.some((m) => m.vendorName.toLowerCase().includes(l)));
  }, [all, q, filter]);

  const approve = (g: VendorGroup) => {
    setGroupModeration(g.id, "approved");
    logAudit("vendor-group.approve", g.id, { name: g.name });
    toast.success(`« ${g.name} » approuvé`);
  };
  const askReject = (g: VendorGroup) => { setRejectFor(g); setReason(""); };
  const submitReject = () => {
    if (!rejectFor) return;
    const r = reason.trim() || "Non conforme aux règles IPPOO";
    setGroupModeration(rejectFor.id, "rejected", r);
    logAudit("vendor-group.reject", rejectFor.id, { reason: r });
    toast.success("Groupement rejeté");
    setRejectFor(null); setReason("");
  };
  const archive = (g: VendorGroup) => {
    if (!confirm(`Archiver « ${g.name} » ?`)) return;
    archiveGroup(g.id);
    logAudit("vendor-group.archive", g.id);
    toast.success("Groupement archivé");
  };
  const remove = (g: VendorGroup) => {
    if (!confirm(`Supprimer définitivement « ${g.name} » ? Cette action est irréversible.`)) return;
    deleteVendorGroup(g.id);
    logAudit("vendor-group.delete", g.id);
    toast.success("Groupement supprimé");
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Groupements vendeurs"
        subtitle={`Modération des collectifs de jusqu'à ${MAX_MEMBERS} vendeurs. Approuvez avant que les groupements ne deviennent visibles publiquement.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4"><p className="text-muted-foreground" style={{ fontSize: 12 }}>À modérer</p><p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#F0B429" }}>{counts.pending}</p></Card>
        <Card className="p-4"><p className="text-muted-foreground" style={{ fontSize: 12 }}>Approuvés</p><p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#16A34A" }}>{counts.approved}</p></Card>
        <Card className="p-4"><p className="text-muted-foreground" style={{ fontSize: 12 }}>Rejetés</p><p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#E11D2E" }}>{counts.rejected}</p></Card>
        <Card className="p-4"><p className="text-muted-foreground" style={{ fontSize: 12 }}>Archivés</p><p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#6B7280" }}>{counts.archived}</p></Card>
        <Card className="p-4"><p className="text-muted-foreground" style={{ fontSize: 12 }}>Total</p><p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#3B82F6" }}>{counts.total}</p></Card>
      </div>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Nom, niche, ville, vendeur..." />
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "À modérer" },
            { value: "approved", label: "Approuvés" },
            { value: "rejected", label: "Rejetés" },
            { value: "archived", label: "Archivés" },
            { value: "all", label: "Tous" },
          ]}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState>Rien à modérer dans cette vue.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((g) => {
            const actives = activeMembers(g);
            return (
              <Card key={g.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>{g.name}</span>
                      <Badge color={g.moderation === "approved" ? "#16A34A" : g.moderation === "rejected" ? "#E11D2E" : "#F0B429"}>
                        {g.moderation === "approved" ? "Approuvé" : g.moderation === "rejected" ? "Rejeté" : "À modérer"}
                      </Badge>
                      <Badge color={actives.length >= MAX_MEMBERS ? "#16A34A" : "#3B82F6"}>{actives.length}/{MAX_MEMBERS} vendeurs</Badge>
                      <Badge color="#6B7280">{g.visibility === "public" ? "Public" : "Privé"}</Badge>
                      {g.status === "archived" && <Badge color="#6B7280">Archivé</Badge>}
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 13 }}>{g.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-muted-foreground" style={{ fontSize: 11 }}>
                      <span>Niche : <strong>{g.primaryNiche}</strong></span>
                      {g.complementaryNiches.length > 0 && <span>+ {g.complementaryNiches.join(", ")}</span>}
                      {g.city && <span><MapPin className="w-3 h-3 inline" /> {g.city}</span>}
                      <span>Créé {fmtRelative(g.createdAt)}</span>
                    </div>
                    {g.moderation === "rejected" && g.moderationReason && (
                      <p className="mt-1 text-[#E11D2E]" style={{ fontSize: 11 }}>Motif : {g.moderationReason}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-stretch gap-1.5 shrink-0">
                    {g.moderation !== "approved" && g.status !== "archived" && (
                      <button onClick={() => approve(g)} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                        <Check className="w-3.5 h-3.5" /> Approuver
                      </button>
                    )}
                    {g.moderation !== "rejected" && g.status !== "archived" && (
                      <button onClick={() => askReject(g)} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#E11D2E] text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                        <X className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    )}
                    {g.status !== "archived" && (
                      <button onClick={() => archive(g)} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-border" style={{ fontSize: 12, fontWeight: 700 }}>
                        <Archive className="w-3.5 h-3.5" /> Archiver
                      </button>
                    )}
                    <button onClick={() => remove(g)} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 700 }}>
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                  <p className="text-muted-foreground mb-1" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    <Users className="w-3 h-3 inline" /> Membres ({actives.length})
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {actives.map((m) => (
                      <li key={m.vendorId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted" style={{ fontSize: 11 }}>
                        {m.role === "leader" && <Crown className="w-3 h-3 text-[#F0B429]" />}
                        {m.vendorName}
                        {m.vendorNiche && <span className="text-muted-foreground"> · {m.vendorNiche}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectFor(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Rejeter « {rejectFor.name} »</h2>
            <p className="text-muted-foreground mb-3" style={{ fontSize: 13 }}>Le motif sera visible au leader.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Ex. doublon, niche non conforme, charte incomplète..."
              className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
              style={{ fontSize: 13 }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectFor(null)} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
              <button onClick={submitReject} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendorGroupsPage;
