import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, RefreshCw, Save, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import {
  PageHeader, Card, Badge, Th, Td, EmptyState,
} from "./page-primitives";
import { listAdminPlans, upsertAdminPlan, AdminPlan, listAdminSubscriptions, AdminSubscription } from "../data/admin-server";

export function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([listAdminPlans(), listAdminSubscriptions()]);
      setPlans(p);
      setSubscribers(s);
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const now = Date.now();
  const activeSubs = useMemo(() => subscribers.filter((s) => (s.expiresAt ?? 0) > now), [subscribers, now]);
  const totals = useMemo(() => ({
    total: plans.length,
    active: plans.filter((p) => p.active).length,
    subscribers: activeSubs.length,
    mrr: activeSubs.reduce((s, sub) => s + (sub.price || 0), 0),
  }), [plans, activeSubs]);

  async function savePlan(p: Partial<AdminPlan> & { id: string; priceMonthly: number }) {
    setSaving(p.id);
    try {
      const saved = await upsertAdminPlan(p);
      setPlans((cur) => {
        const exists = cur.some((x) => x.id === saved.id);
        return exists ? cur.map((x) => x.id === saved.id ? saved : x) : [...cur, saved];
      });
      toast.success(`Plan ${saved.label} enregistré`);
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Abonnements VIP"
        subtitle={loading ? "Chargement…" : `${totals.total} plan(s) · ${totals.active} actif(s) · ${totals.subscribers} abonné(s) · MRR ${formatPrice(totals.mrr)} FCFA`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { void load(); }} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Recharger
            </button>
            <button onClick={() => setCreating(true)} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700 }}>
              <Plus className="w-4 h-4" /> Nouveau plan
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>{error}</div>
      )}

      {creating && (
        <PlanForm
          initial={{ id: "", label: "", priceMonthly: 0, priceYearly: 0, features: [], active: true, updatedAt: Date.now() }}
          onCancel={() => setCreating(false)}
          onSubmit={async (p) => {
            const id = p.id.trim() || `plan_${Date.now().toString(36)}`;
            await savePlan({ ...p, id });
            setCreating(false);
          }}
          saving={saving === "__new__"}
        />
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Plan</Th>
                <Th>Mensuel</Th>
                <Th>Annuel</Th>
                <Th>Avantages</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><Td className="text-center text-muted-foreground" colSpan={6 as any}><Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> Chargement…</Td></tr>}
              {!loading && plans.length === 0 && (
                <tr><Td className="text-center" colSpan={6 as any}><EmptyState title="Aucun plan" description="Créez un premier plan d'abonnement." /></Td></tr>
              )}
              {!loading && plans.map((p) => (
                <PlanRow key={p.id} plan={p} saving={saving === p.id} onSave={(np) => savePlan(np)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h3 className="mt-6 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
        Abonnés actifs ({activeSubs.length})
      </h3>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Utilisateur</Th>
                <Th>Plan</Th>
                <Th>Prix</Th>
                <Th>Démarré</Th>
                <Th>Expire</Th>
                <Th>Auto-renouv.</Th>
              </tr>
            </thead>
            <tbody>
              {!loading && subscribers.length === 0 && (
                <tr><Td className="text-center" colSpan={6 as any}><EmptyState title="Aucun abonné" description="Personne n'a encore souscrit." /></Td></tr>
              )}
              {!loading && subscribers.map((s) => {
                const expired = (s.expiresAt ?? 0) <= now;
                return (
                  <tr key={s.userId} className="hover:bg-muted/40">
                    <Td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.userEmail ?? "-"}</div>
                      <div className="text-muted-foreground" style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{s.userId}</div>
                    </Td>
                    <Td>{s.label || s.planId}</Td>
                    <Td>{formatPrice(s.price)} FCFA</Td>
                    <Td style={{ fontSize: 12 }}>{new Date(s.startedAt).toLocaleDateString("fr-FR")}</Td>
                    <Td style={{ fontSize: 12 }}>
                      {expired
                        ? <Badge color="#9CA3AF">Expiré</Badge>
                        : <span>{new Date(s.expiresAt).toLocaleDateString("fr-FR")}</span>}
                    </Td>
                    <Td>{s.autoRenew ? <Badge color="#16A34A">Oui</Badge> : <Badge color="#9CA3AF">Non</Badge>}</Td>
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

function PlanRow({ plan, saving, onSave }: { plan: AdminPlan; saving: boolean; onSave: (p: AdminPlan) => void }) {
  const [draft, setDraft] = useState<AdminPlan>(plan);
  const dirty = JSON.stringify(draft) !== JSON.stringify(plan);
  return (
    <tr className="hover:bg-muted/40">
      <Td>
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
          <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="px-2 py-1 rounded-lg border border-border outline-none" style={{ fontSize: 13, fontWeight: 700, minWidth: 140 }} />
        </div>
        <div className="text-muted-foreground" style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{draft.id}</div>
      </Td>
      <Td>
        <input type="number" min={0} value={draft.priceMonthly} onChange={(e) => setDraft({ ...draft, priceMonthly: Number(e.target.value) })}
          className="px-2 py-1 rounded-lg border border-border outline-none" style={{ fontSize: 13, width: 110 }} />
      </Td>
      <Td>
        <input type="number" min={0} value={draft.priceYearly} onChange={(e) => setDraft({ ...draft, priceYearly: Number(e.target.value) })}
          className="px-2 py-1 rounded-lg border border-border outline-none" style={{ fontSize: 13, width: 110 }} />
      </Td>
      <Td>
        <input value={draft.features.join(", ")} onChange={(e) => setDraft({ ...draft, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder="Avantage 1, Avantage 2"
          className="w-full px-2 py-1 rounded-lg border border-border outline-none" style={{ fontSize: 12 }} />
      </Td>
      <Td>
        <button onClick={() => setDraft({ ...draft, active: !draft.active })} className="cursor-pointer">
          {draft.active ? <Badge color="#16A34A">Actif</Badge> : <Badge color="#9CA3AF">Inactif</Badge>}
        </button>
      </Td>
      <Td>
        <button
          disabled={!dirty || saving}
          onClick={() => onSave(draft)}
          className="px-3 py-1.5 rounded-lg bg-[#E11D2E] text-white disabled:opacity-40 flex items-center gap-1"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Sauver
        </button>
      </Td>
    </tr>
  );
}

function PlanForm({ initial, onSubmit, onCancel, saving }: { initial: AdminPlan; onSubmit: (p: AdminPlan) => void; onCancel: () => void; saving: boolean }) {
  const [p, setP] = useState<AdminPlan>(initial);
  return (
    <Card className="p-4 mb-4">
      <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Nouveau plan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">ID (slug)</span>
          <input value={p.id} onChange={(e) => setP({ ...p, id: e.target.value })} placeholder="auto" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Libellé</span>
          <input value={p.label} onChange={(e) => setP({ ...p, label: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Mensuel (FCFA)</span>
          <input type="number" min={0} value={p.priceMonthly} onChange={(e) => setP({ ...p, priceMonthly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Annuel (FCFA)</span>
          <input type="number" min={0} value={p.priceYearly} onChange={(e) => setP({ ...p, priceYearly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
      </div>
      <label className="block mt-3" style={{ fontSize: 12 }}>
        <span className="text-muted-foreground block mb-1">Avantages (séparés par virgule)</span>
        <input value={p.features.join(", ")} onChange={(e) => setP({ ...p, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
      </label>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
        <button disabled={saving} onClick={() => onSubmit(p)} className="px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-40" style={{ fontSize: 13, fontWeight: 700 }}>
          {saving ? "…" : "Créer"}
        </button>
      </div>
    </Card>
  );
}
