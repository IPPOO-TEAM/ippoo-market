import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EyeOff,
  Eye,
  Download,
  Loader2,
  RefreshCw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { downloadCSV } from "./csv";
import {
  PageHeader, Card, Badge, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState, fmtRelative,
} from "./page-primitives";
import { listAdminProducts, hideProduct, AdminProduct } from "../data/admin-server";

type Filter = "all" | "visible" | "hidden" | "out_of_stock";

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminProducts();
      setProducts(items);
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return products.filter((p) => {
      if (ql) {
        const hay = `${p.name || ""} ${p.category || ""} ${p.ownerId || ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (filter === "visible" && p.hidden) return false;
      if (filter === "hidden" && !p.hidden) return false;
      if (filter === "out_of_stock" && (p.stock ?? 0) > 0) return false;
      return true;
    });
  }, [products, q, filter]);

  const counters = useMemo(() => ({
    total: products.length,
    hidden: products.filter((p) => p.hidden).length,
    out: products.filter((p) => (p.stock ?? 0) === 0).length,
  }), [products]);

  async function onToggleHidden(p: AdminProduct) {
    const id = String(p.id || "");
    if (!id) return;
    setPending(id);
    try {
      const next = !p.hidden;
      await hideProduct(id, next);
      toast.success(next ? "Produit masqué" : "Produit publié");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setPending(null);
    }
  }

  const toggleOne = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allOnPage = filtered.length > 0 && filtered.every((p) => selected.has(String(p.id || "")));
  const toggleAll = () => {
    setSelected((s) => {
      const next = new Set(s);
      if (allOnPage) for (const p of filtered) next.delete(String(p.id || ""));
      else for (const p of filtered) { const id = String(p.id || ""); if (id) next.add(id); }
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  async function bulkSetHidden(hidden: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => hideProduct(id, hidden)));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const ko = results.length - ok;
    if (ok > 0) toast.success(`${ok} produit(s) ${hidden ? "masqué(s)" : "publié(s)"}`);
    if (ko > 0) toast.error(`${ko} échec(s)`);
    clearSelection();
    await load();
    setBulkBusy(false);
  }

  function exportCsv() {
    downloadCSV(`produits-${Date.now()}`, [
      ["ID", "Nom", "Vendeur", "Catégorie", "Prix", "Stock", "Masqué", "Créé"],
      ...filtered.map((p) => [
        String(p.id ?? ""),
        p.name || "",
        p.ownerId || "",
        p.category || "",
        p.price ?? 0,
        p.stock ?? 0,
        p.hidden ? "oui" : "non",
        p.createdAt ? new Date(p.createdAt).toISOString() : "",
      ]),
    ]);
    toast.success("Export CSV généré");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Produits"
        subtitle={loading ? "Chargement…" : `${counters.total} produit(s) · ${counters.hidden} masqué(s) · ${counters.out} en rupture`}
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
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher nom, catégorie ou owner" />
        <Select
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "Tous" },
            { value: "visible", label: "Publiés" },
            { value: "hidden", label: "Masqués" },
            { value: "out_of_stock", label: "En rupture" },
          ]}
        />
      </Toolbar>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky top-3 z-10 mb-3 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0F172A] text-white shadow-lg">
          <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.size} produit(s) sélectionné(s)</span>
          <button
            onClick={() => bulkSetHidden(false)}
            disabled={bulkBusy}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] disabled:opacity-60"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Publier tout
          </button>
          <button
            onClick={() => bulkSetHidden(true)}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E11D2E] disabled:opacity-60"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
            Masquer tout
          </button>
          <button onClick={clearSelection} className="text-white/70 hover:text-white px-2" style={{ fontSize: 11 }}>
            Désélectionner
          </button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleAll}
                    aria-label="Tout sélectionner"
                  />
                </Th>
                <Th>Produit</Th>
                <Th>Catégorie</Th>
                <Th>Prix</Th>
                <Th>Stock</Th>
                <Th>Statut</Th>
                <Th>Créé</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><Td className="text-center text-muted-foreground" colSpan={8 as any}>
                  <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> Chargement…
                </Td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><Td className="text-center" colSpan={8 as any}>
                  <EmptyState title="Aucun produit" description="Aucun résultat pour ces filtres" />
                </Td></tr>
              )}
              {!loading && filtered.map((p) => {
                const id = String(p.id || "");
                const isPending = pending === id;
                const stock = p.stock ?? 0;
                return (
                  <tr key={id || `${p.name}-${p.createdAt ?? Math.random()}`} className="hover:bg-muted/40">
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        aria-label={`Sélectionner ${p.name || id}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate"><strong>{p.name || "-"}</strong></span>
                      </div>
                      <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                        {p.ownerId || id}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{p.category || "-"}</Td>
                    <Td>{formatPrice(p.price ?? 0)} FCFA</Td>
                    <Td className={stock === 0 ? "text-[#E11D2E]" : ""}>{stock}</Td>
                    <Td>
                      {p.hidden
                        ? <Badge color="#64748B">Masqué</Badge>
                        : stock === 0
                          ? <Badge color="#F59E0B">Rupture</Badge>
                          : <StatusBadge status="active" />}
                    </Td>
                    <Td className="text-muted-foreground">
                      {p.createdAt ? fmtRelative(p.createdAt) : "-"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {p.hidden ? (
                          <IconBtn icon={isPending ? Loader2 : Eye} label="Publier" onClick={() => onToggleHidden(p)} color="#16A34A" />
                        ) : (
                          <IconBtn icon={isPending ? Loader2 : EyeOff} label="Masquer" onClick={() => onToggleHidden(p)} color="#E11D2E" />
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
