import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, EyeOff, Eye, Trash2, RefreshCw, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "./csv";
import {
  PageHeader, Card, Badge, Toolbar, SearchInput, Select,
  Th, Td, EmptyState, fmtRelative,
} from "./page-primitives";
import { listAdminReviews, moderateReview, Review } from "../data/admin-server";

type Filter = "all" | "active" | "hidden" | "low";

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await listAdminReviews());
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return reviews.filter((r) => {
      if (ql) {
        const hay = `${r.comment} ${r.targetId} ${r.userEmail || ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (filter === "active" && r.status !== "active") return false;
      if (filter === "hidden" && r.status !== "hidden") return false;
      if (filter === "low" && r.rating > 2) return false;
      return true;
    });
  }, [reviews, q, filter]);

  const counters = useMemo(() => {
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return {
      total: reviews.length,
      hidden: reviews.filter((r) => r.status === "hidden").length,
      low: reviews.filter((r) => r.rating <= 2).length,
      avg,
    };
  }, [reviews]);

  async function act(r: Review, action: "hide" | "show" | "delete") {
    setPending(r.id);
    try {
      await moderateReview({ targetType: r.targetType, targetId: r.targetId, id: r.id, action });
      toast.success(action === "delete" ? "Avis supprimé" : action === "hide" ? "Avis masqué" : "Avis publié");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setPending(null);
    }
  }

  function exportCsv() {
    downloadCSV(`avis-${Date.now()}`, [
      ["ID", "Cible", "Note", "Auteur", "Commentaire", "Statut", "Date"],
      ...filtered.map((r) => [
        r.id,
        `${r.targetType}:${r.targetId}`,
        r.rating,
        r.userEmail || r.userId,
        r.comment.replace(/\n/g, " "),
        r.status,
        new Date(r.createdAt).toISOString(),
      ]),
    ]);
    toast.success("Export CSV généré");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Avis"
        subtitle={loading ? "Chargement…" : `${counters.total} avis · ★ ${counters.avg.toFixed(2)} moyen · ${counters.hidden} masqué(s) · ${counters.low} ≤ 2★`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { void load(); }} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Recharger
            </button>
            <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher commentaire, cible ou auteur" />
        <Select
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "Tous" },
            { value: "active", label: "Visibles" },
            { value: "hidden", label: "Masqués" },
            { value: "low", label: "Note ≤ 2" },
          ]}
        />
      </Toolbar>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>{error}</div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Note</Th>
                <Th>Cible</Th>
                <Th>Commentaire</Th>
                <Th>Auteur</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><Td className="text-center text-muted-foreground" colSpan={7 as any}><Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> Chargement…</Td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><Td className="text-center" colSpan={7 as any}><EmptyState title="Aucun avis" description="Aucun résultat pour ces filtres" /></Td></tr>
              )}
              {!loading && filtered.map((r) => {
                const isPending = pending === r.id;
                return (
                  <tr key={r.id} className="hover:bg-muted/40 align-top">
                    <Td>
                      <div className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5" fill={i < r.rating ? "#F59E0B" : "none"} />
                        ))}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground" style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                      {r.targetType}<br />{r.targetId}
                    </Td>
                    <Td style={{ maxWidth: 360 }}>
                      <p style={{ fontSize: 13 }}>{r.comment || <span className="text-muted-foreground">-</span>}</p>
                    </Td>
                    <Td className="text-muted-foreground" style={{ fontSize: 11 }}>{r.userEmail || r.userId}</Td>
                    <Td className="text-muted-foreground">{fmtRelative(r.createdAt)}</Td>
                    <Td>
                      {r.status === "hidden"
                        ? <Badge color="#64748B">Masqué</Badge>
                        : <Badge color="#16A34A">Visible</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {r.status === "hidden" ? (
                          <button disabled={isPending} onClick={() => act(r, "show")} title="Publier" className="p-1.5 rounded-lg text-[#16A34A] hover:bg-[#16A34A]/10 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button disabled={isPending} onClick={() => act(r, "hide")} title="Masquer" className="p-1.5 rounded-lg text-[#F97316] hover:bg-[#F97316]/10 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        )}
                        <button disabled={isPending} onClick={() => { if (confirm("Supprimer cet avis ?")) act(r, "delete"); }} title="Supprimer" className="p-1.5 rounded-lg text-[#E11D2E] hover:bg-[#E11D2E]/10 disabled:opacity-40">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
