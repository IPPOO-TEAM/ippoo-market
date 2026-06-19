import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Trash2, Plus, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminPromos,
  upsertAdminPromo,
  deleteAdminPromo,
  toggleAdminPromo,
  AdminPromo,
} from "../data/admin-server";
import { downloadCSV } from "./csv";
import {
  fmtDate, PageHeader, Card, Badge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState,
} from "./page-primitives";

type Filter = "all" | "active" | "inactive" | "expired";

export function AdminPromosPage() {
  const [items, setItems] = useState<AdminPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await listAdminPromos()); }
    catch (e: any) { setError(e?.message || "Échec du chargement"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return items.filter((p) => {
      const expired = !!(p.expiresAt && p.expiresAt < now);
      if (filter === "active" && (!p.active || expired)) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "expired" && !expired) return false;
      if (q && !(p.code.toLowerCase().includes(q) || (p.label || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, query, filter]);

  const exportCsv = () => {
    downloadCSV("promos.csv", filtered.map((p) => ({
      code: p.code, label: p.label, type: p.type, value: p.value,
      minAmount: p.minAmount, uses: p.uses, maxUses: p.maxUses ?? "",
      active: p.active, expiresAt: p.expiresAt ? fmtDate(p.expiresAt) : "",
    })));
  };

  const onToggle = async (code: string) => {
    try { const saved = await toggleAdminPromo(code); setItems((arr) => arr.map((p) => p.code === code ? saved : p)); }
    catch (e: any) { toast.error(e?.message || "Échec"); }
  };
  const onDelete = async (code: string) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    try { await deleteAdminPromo(code); setItems((arr) => arr.filter((p) => p.code !== code)); toast.success("Code supprimé"); }
    catch (e: any) { toast.error(e?.message || "Échec"); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Codes promo" subtitle={`${items.length} code(s)`} actions={
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="px-3 py-2 rounded-xl border border-border flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl border border-border flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setCreating(!creating)} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      } />

      {creating && (
        <PromoForm
          onCancel={() => setCreating(false)}
          onSaved={(p) => { setItems((arr) => [p, ...arr.filter((x) => x.code !== p.code)]); setCreating(false); toast.success(`Code ${p.code} créé`); }}
        />
      )}

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Code, libellé…" />
        <Select value={filter} onChange={(v) => setFilter(v as Filter)} options={[
          { value: "all", label: "Tous" },
          { value: "active", label: "Actifs" },
          { value: "inactive", label: "Désactivés" },
          { value: "expired", label: "Expirés" },
        ]} />
      </Toolbar>

      {error && <Card className="p-4 mb-4" style={{ borderColor: "#E11D2E" }}><span style={{ color: "#E11D2E", fontSize: 13 }}>{error}</span></Card>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Code</Th><Th>Libellé</Th><Th>Réduction</Th><Th>Min</Th><Th>Utilisations</Th><Th>Expire</Th><Th>État</Th><Th /></tr></thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState>Aucun code promo.</EmptyState></td></tr>
              ) : filtered.map((p) => {
                const expired = !!(p.expiresAt && p.expiresAt < Date.now());
                return (
                  <tr key={p.code} className="hover:bg-muted/40">
                    <Td><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{p.code}</span></Td>
                    <Td className="text-muted-foreground">{p.label || "—"}</Td>
                    <Td><strong>{p.type === "percent" ? `${p.value} %` : `${p.value.toLocaleString()} F`}</strong></Td>
                    <Td className="text-muted-foreground">{p.minAmount ? `${p.minAmount.toLocaleString()} F` : "—"}</Td>
                    <Td className="text-muted-foreground">{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ""}</Td>
                    <Td className="text-muted-foreground">{p.expiresAt ? fmtDate(p.expiresAt) : "—"}</Td>
                    <Td>
                      {expired ? <Badge color="#9CA3AF">Expiré</Badge>
                        : p.active ? <Badge color="#16A34A">Actif</Badge>
                        : <Badge color="#F97316">Désactivé</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <IconBtn
                          icon={p.active ? Pause : Play}
                          label={p.active ? "Désactiver" : "Activer"}
                          onClick={() => void onToggle(p.code)}
                          color={p.active ? "#F97316" : "#16A34A"}
                        />
                        <IconBtn icon={Trash2} label="Supprimer" onClick={() => void onDelete(p.code)} color="#E11D2E" />
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

function PromoForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: (p: AdminPromo) => void }) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState(10);
  const [minAmount, setMinAmount] = useState(0);
  const [maxUses, setMaxUses] = useState(0);
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const c = code.toUpperCase().trim();
    if (!c) { toast.error("Code requis"); return; }
    if (value <= 0) { toast.error("Valeur invalide"); return; }
    setSaving(true);
    try {
      const saved = await upsertAdminPromo({
        code: c,
        label: label.trim() || c,
        type, value,
        minAmount: Math.max(0, minAmount),
        maxUses: maxUses > 0 ? maxUses : null,
        active: true,
        expiresAt: days > 0 ? Date.now() + days * 86400000 : null,
      });
      onSaved(saved);
    } catch (e: any) { toast.error(e?.message || "Échec"); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-4 mb-4">
      <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Créer un code promo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Field label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EXEMPLE10" className="w-full px-3 py-2 rounded-xl border border-border outline-none uppercase" style={{ fontSize: 13 }} />
        </Field>
        <Field label="Libellé">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Promo de lancement" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-border outline-none bg-background" style={{ fontSize: 13 }}>
            <option value="percent">Pourcentage</option>
            <option value="amount">Montant (F)</option>
          </select>
        </Field>
        <Field label={type === "percent" ? "Réduction (%)" : "Montant (F)"}>
          <input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </Field>
        <Field label="Montant min (F)">
          <input type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </Field>
        <Field label="Utilisations max (0 = ∞)">
          <input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </Field>
        <Field label="Validité (jours, 0 = ∞)">
          <input type="number" min={0} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
        <button onClick={() => void submit()} disabled={saving} className="px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-60" style={{ fontSize: 13, fontWeight: 700 }}>
          {saving ? "Création…" : "Créer"}
        </button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12 }}>
      <span className="text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
