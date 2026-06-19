import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pause,
  Play,
  Download,
  Loader2,
  RefreshCw,
  Store,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "./csv";
import {
  PageHeader, Card, Badge, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState, fmtRelative,
} from "./page-primitives";
import { listAdminVendors, suspendVendor, AdminVendor } from "../data/admin-server";

type Filter = "all" | "active" | "suspended" | "vacation" | "closed";

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminVendors();
      setVendors(items);
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return vendors.filter((v) => {
      if (ql) {
        const hay = `${v.name || ""} ${v.city || ""} ${v.niche || ""} ${v.email || ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (filter === "suspended" && !v.suspended) return false;
      if (filter === "active" && (v.suspended || (v.shopStatus && v.shopStatus !== "open"))) return false;
      if (filter === "vacation" && v.shopStatus !== "vacation") return false;
      if (filter === "closed" && v.shopStatus !== "closed") return false;
      return true;
    });
  }, [vendors, q, filter]);

  const counters = useMemo(() => ({
    total: vendors.length,
    suspended: vendors.filter((v) => v.suspended).length,
    vacation: vendors.filter((v) => v.shopStatus === "vacation").length,
  }), [vendors]);

  async function onToggle(v: AdminVendor) {
    if (!v.ownerId) return;
    setPending(v.ownerId);
    try {
      const next = !v.suspended;
      await suspendVendor(v.ownerId, next);
      toast.success(next ? `${v.name || v.ownerId} suspendu` : "Vendeur réactivé");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setPending(null);
    }
  }

  function exportCsv() {
    downloadCSV(`vendeurs-${Date.now()}`, [
      ["OwnerID", "Nom", "Niche", "Ville", "Email", "Statut boutique", "Suspendu", "Créé"],
      ...filtered.map((v) => [
        v.ownerId || "",
        v.name || "",
        v.niche || "",
        v.city || "",
        v.email || "",
        v.shopStatus || "open",
        v.suspended ? "oui" : "non",
        v.createdAt ? new Date(v.createdAt).toISOString() : "",
      ]),
    ]);
    toast.success("Export CSV généré");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Vendeurs"
        subtitle={loading ? "Chargement…" : `${counters.total} boutique(s) · ${counters.suspended} suspendue(s) · ${counters.vacation} en vacances`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { void load(); }}
              className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Recharger
            </button>
            <button
              onClick={exportCsv}
              className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher nom, niche, ville ou email" />
        <Select
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "Tous" },
            { value: "active", label: "Actifs" },
            { value: "suspended", label: "Suspendus" },
            { value: "vacation", label: "En vacances" },
            { value: "closed", label: "Fermés" },
          ]}
        />
      </Toolbar>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Boutique</Th>
                <Th>Niche</Th>
                <Th>Ville</Th>
                <Th>Créé</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><Td className="text-center text-muted-foreground" colSpan={6 as any}>
                  <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> Chargement…
                </Td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><Td className="text-center" colSpan={6 as any}>
                  <EmptyState title="Aucun vendeur" description="Aucun résultat pour ces filtres" />
                </Td></tr>
              )}
              {!loading && filtered.map((v) => {
                const isPending = pending === v.ownerId;
                const key = v.ownerId || `${v.name}-${v.createdAt ?? Math.random()}`;
                return (
                  <tr key={key} className="hover:bg-muted/40">
                    <Td>
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate"><strong>{v.name || "—"}</strong></span>
                      </div>
                      <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                        {v.email || v.ownerId}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{v.niche || "—"}</Td>
                    <Td className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{v.city || "—"}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">
                      {v.createdAt ? fmtRelative(v.createdAt) : "—"}
                    </Td>
                    <Td>
                      {v.suspended
                        ? <Badge color="#E11D2E">Suspendu</Badge>
                        : v.shopStatus === "vacation"
                          ? <Badge color="#F59E0B">Vacances</Badge>
                          : v.shopStatus === "closed"
                            ? <Badge color="#64748B">Fermé</Badge>
                            : <StatusBadge status="active" />}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {v.suspended ? (
                          <IconBtn icon={isPending ? Loader2 : Play} label="Réactiver" onClick={() => onToggle(v)} color="#16A34A" />
                        ) : (
                          <IconBtn icon={isPending ? Loader2 : Pause} label="Suspendre" onClick={() => onToggle(v)} color="#E11D2E" />
                        )}
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
