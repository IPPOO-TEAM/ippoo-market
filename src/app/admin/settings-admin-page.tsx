import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Package,
  Wallet,
  Crown,
  Check,
  X,
  Pause,
  Play,
  Trash2,
  Download,
  ArrowUpRight,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { AnimatedNumber } from "../components/animated-number";
import { usePayments } from "../payments/usePayments";
import {
  cancelOrder,
  updateOrderStatus,
  Order,
  OrderStatus,
} from "../payments/store";
import { useAdminSettings, updateAdminSettings, resetAdminSettings } from "./settings-store";
import { downloadCSV } from "./csv";
import { Switch } from "../components/ui-kit/Switch";
import { changeAdminPin } from "./auth";
import {
  fmtDate, fmtRelative,
  PageHeader, Card, Badge, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState,
} from "./page-primitives";
/* ───────────── Settings ───────────── */

export function AdminSettingsPage() {
  const settings = useAdminSettings();
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft({ ...draft, [k]: v });

  const save = () => { updateAdminSettings(draft); toast.success("Paramètres enregistrés"); };
  const reset = () => {
    if (!confirm("Réinitialiser tous les paramètres ?")) return;
    resetAdminSettings();
    toast.success("Paramètres réinitialisés");
  };

  return (
    <div className="p-6">
      <PageHeader title="Paramètres" subtitle="Configuration globale de la marketplace" actions={
        <button onClick={reset} className="px-3 py-2 rounded-xl bg-white border border-border" style={{ fontSize: 13, fontWeight: 600 }}>
          Réinitialiser
        </button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Frais & taxes</h3>
          <div className="space-y-3">
            <FormRow label="Commission marketplace (%)">
              <input type="number" min={0} max={50} value={draft.commission} onChange={(e) => set("commission", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="TVA (%)">
              <input type="number" min={0} max={30} value={draft.vatRate} onChange={(e) => set("vatRate", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Livraison standard (FCFA)">
              <input type="number" min={0} value={draft.shippingStd} onChange={(e) => set("shippingStd", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Livraison express (FCFA)">
              <input type="number" min={0} value={draft.shippingExpress} onChange={(e) => set("shippingExpress", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Seuil livraison gratuite (FCFA)">
              <input type="number" min={0} value={draft.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Délai de remboursement (jours)">
              <input type="number" min={0} max={90} value={draft.refundWindowDays} onChange={(e) => set("refundWindowDays", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Fréquence des reversements">
              <select value={draft.payoutFrequency} onChange={(e) => set("payoutFrequency", e.target.value as typeof draft.payoutFrequency)} className="px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }}>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </FormRow>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Plateforme</h3>
          <div className="space-y-3">
            <FormRow label="Mode maintenance">
              <Toggle on={draft.maintenance} onChange={(v) => set("maintenance", v)} />
            </FormRow>
            <FormRow label="KYC obligatoire pour vendeurs">
              <Toggle on={draft.requireKycForVendors} onChange={(v) => set("requireKycForVendors", v)} />
            </FormRow>
            <FormRow label="Commande sans compte">
              <Toggle on={draft.allowGuestCheckout} onChange={(v) => set("allowGuestCheckout", v)} />
            </FormRow>
            <FormRow label="Devise par défaut">
              <input value={draft.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Langue par défaut">
              <input value={draft.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
            <FormRow label="Domaine public (QR codes)">
              <input
                value={draft.publicOrigin}
                onChange={(e) => set("publicOrigin", e.target.value.trim())}
                placeholder="https://ippoomarket.figma.site"
                className="w-72 px-3 py-2 rounded-xl border border-border outline-none"
                style={{ fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              />
            </FormRow>
            <FormRow label="Clé VAPID publique (Web Push)">
              <div className="flex-1">
                <input
                  value={draft.vapidPublicKey}
                  onChange={(e) => set("vapidPublicKey", e.target.value.trim())}
                  placeholder="BNc7… (87 caractères base64url)"
                  className="w-full px-3 py-2 rounded-xl border border-border outline-none"
                  style={{ fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                />
                <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
                  Générer avec <code>npx web-push generate-vapid-keys</code>. Coller ici la
                  publicKey ; la privateKey reste côté backend (Edge Function <code>/push/send</code>).
                </p>
              </div>
            </FormRow>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Sécurité</h3>
          <PinChanger />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Notifications</h3>
          <div className="space-y-3">
            <FormRow label="Nouveau vendeur">
              <Toggle on={draft.notifyNewVendor} onChange={(v) => set("notifyNewVendor", v)} />
            </FormRow>
            <FormRow label="Nouveau ticket SAV">
              <Toggle on={draft.notifyNewTicket} onChange={(v) => set("notifyNewTicket", v)} />
            </FormRow>
            <FormRow label="Stock faible">
              <Toggle on={draft.notifyLowStock} onChange={(v) => set("notifyLowStock", v)} />
            </FormRow>
            <FormRow label="Seuil stock faible">
              <input type="number" min={0} value={draft.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} className="w-32 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </FormRow>
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={() => setDraft(settings)} disabled={!dirty} className="px-3 py-2 rounded-xl border border-border disabled:opacity-50" style={{ fontSize: 13 }}>
          Annuler
        </button>
        <button onClick={save} disabled={!dirty} className="px-5 py-2.5 rounded-xl bg-[#16A34A] text-white disabled:opacity-50" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function PinChanger() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const submit = () => {
    if (next !== confirmPin) { toast.error("Les nouveaux PIN ne correspondent pas"); return; }
    const r = changeAdminPin(current, next);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("PIN administrateur mis à jour");
    setCurrent(""); setNext(""); setConfirmPin("");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label style={{ fontSize: 12 }}>
        <span className="text-muted-foreground block mb-1">PIN actuel</span>
        <input type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(e.target.value.replace(/\D/g, "").slice(0, 8))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
      </label>
      <label style={{ fontSize: 12 }}>
        <span className="text-muted-foreground block mb-1">Nouveau PIN (4-8 chiffres)</span>
        <input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value.replace(/\D/g, "").slice(0, 8))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
      </label>
      <label style={{ fontSize: 12 }}>
        <span className="text-muted-foreground block mb-1">Confirmer</span>
        <input type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
      </label>
      <div className="sm:col-span-3 flex justify-end">
        <button onClick={submit} disabled={!current || !next || !confirmPin} className="px-3 py-2 rounded-xl bg-[#0F172A] text-white disabled:opacity-50" style={{ fontSize: 13, fontWeight: 700 }}>
          Modifier le PIN
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <Switch checked={on} onChange={onChange} tone="brand" />;
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
      <span className="text-muted-foreground" style={{ fontSize: 13 }}>{label}</span>
      {children}
    </div>
  );
}
