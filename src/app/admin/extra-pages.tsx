import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pause,
  Play,
  Check,
  X,
  Download,
  RotateCcw,
  Wallet,
  TrendingUp,
  Users,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { usePayments } from "../payments/usePayments";
import { platformAccounting, VendorPeriod } from "../payments/store";
import { useAdminSettings } from "./settings-store";
import { useAdmin } from "./useAdmin";
import { useCategories, upsertCategory, deleteCategory, toggleCategory, moveCategory, AdminCategory } from "./categories";
import { usePayouts, setPayoutStatus, createPayout, Payout } from "./payouts";
import { useAudit, clearAudit, logAudit } from "./audit";
import { downloadCSV } from "./csv";
import { Switch, Segmented } from "../components/ui-kit/Switch";
import { CategoryIcon } from "../components/category-icon";

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-border ${className}`}>{children}</div>;
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-muted-foreground border-b border-border ${className}`}
      style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

function Td({ children, className = "", style, colSpan }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 border-b border-[#F3F4F6] ${className}`} style={{ fontSize: 13, ...style }}>{children}</td>;
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md inline-flex items-center gap-1"
      style={{ fontSize: 11, fontWeight: 700, color, background: color + "1A" }}>
      {children}
    </span>
  );
}

const PAYOUT_COLORS: Record<Payout["status"], string> = {
  pending: "#F0B429",
  processing: "#3B82F6",
  paid: "#16A34A",
  failed: "#E11D2E",
};

const PAYOUT_LABELS: Record<Payout["status"], string> = {
  pending: "En attente",
  processing: "En cours",
  paid: "Payé",
  failed: "Échoué",
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ───────────── Analytics ───────────── */

export function AdminAnalyticsPage() {
  const pay = usePayments();
  const admin = useAdmin();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const daily = useMemo(() => {
    const days = period;
    const buckets: { date: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = pay.orders.filter((o) => o.createdAt >= dayStart.getTime() && o.createdAt <= dayEnd.getTime());
      const revenue = dayOrders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0);
      buckets.push({ date: label, revenue, orders: dayOrders.length });
    }
    return buckets;
  }, [pay.orders, period]);

  const topVendors = useMemo(() => {
    const top = [...admin.vendors].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const seen = new Map<string, number>();
    return top.map((v) => {
      const base = v.name.slice(0, 14);
      const n = seen.get(base) || 0;
      seen.set(base, n + 1);
      const name = n === 0 ? base : `${base} (${n + 1})`;
      return { id: v.id, name, revenue: v.revenue };
    });
  }, [admin.vendors]);

  const categoryMix = useMemo(() => {
    const map = new Map<string, number>();
    admin.products.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + p.price * Math.max(1, p.stock / 10)));
    return Array.from(map.entries())
      .filter(([name, value]) => name && value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [admin.products]);

  const COLORS = ["#E11D2E", "#F97316", "#F0B429", "#16A34A", "#3B82F6", "#9333EA", "#6B7280"];

  const totalRevenue = pay.orders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0);
  const avgBasket = pay.orders.length > 0 ? Math.round(totalRevenue / pay.orders.length) : 0;
  const conversion = admin.users.length > 0 ? ((pay.orders.length / admin.users.length) * 100).toFixed(1) : "0";

  const kpis = [
    { label: `Revenus ${period}j`, value: `${formatPrice(daily.reduce((s, d) => s + d.revenue, 0))} FCFA`, Icon: Wallet, color: "#16A34A" },
    { label: "Panier moyen", value: `${formatPrice(avgBasket)} FCFA`, Icon: ShoppingBag, color: "#3B82F6" },
    { label: "Taux conversion", value: `${conversion} %`, Icon: TrendingUp, color: "#E11D2E" },
    { label: "Vendeurs actifs", value: String(admin.vendors.filter((v) => v.status === "approved").length), Icon: Users, color: "#F0B429" },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Analytics"
        subtitle="Performances et tendances de la marketplace"
        actions={
          <Segmented<"7" | "30" | "90">
            value={String(period) as "7" | "30" | "90"}
            onChange={(v) => setPeriod(Number(v) as 7 | 30 | 90)}
            options={[
              { value: "7", label: "7j" },
              { value: "30", label: "30j" },
              { value: "90", label: "90j" },
            ]}
            ariaLabel="Période"
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: k.color + "1A" }}>
              <k.Icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{k.label}</p>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5 mb-4">
        <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Revenus & commandes ({period} derniers jours)</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart key={`line-${period}`} data={daily} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, n) => n === "revenue" ? [`${formatPrice(v)} FCFA`, "Revenus"] : [String(v), "Commandes"]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#E11D2E" strokeWidth={2} dot={false} name="Revenus" isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={false} name="Commandes" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Top 5 vendeurs</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={topVendors} layout="vertical" margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => [`${formatPrice(v)} FCFA`, "Revenus"]} />
                <Bar dataKey="revenue" fill="#16A34A" radius={[0, 6, 6, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Mix catalogue par catégorie</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} isAnimationActive={false} label={(e) => e.name}>
                  {categoryMix.map((entry, i) => <Cell key={`cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, n) => [`${formatPrice(v)} FCFA`, String(n)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <PlatformAccountingCard />
    </div>
  );
}

function PlatformAccountingCard() {
  const pay = usePayments();
  const settings = useAdminSettings();
  const [period, setPeriod] = useState<VendorPeriod>("30d");
  void pay.invoices?.length; // re-render when invoices change
  const acc = useMemo(() => platformAccounting(period), [period, pay.invoices]);
  const commission = Math.round((acc.revenue * settings.commission) / 100);
  const vat = settings.vatRate > 0 ? Math.round((acc.revenue * settings.vatRate) / (100 + settings.vatRate)) : 0;
  const netVendors = acc.revenue - commission;

  const exportCsv = () => {
    downloadCSV(`comptabilite-plateforme-${period}-${Date.now()}`, [
      ["Vendeur", "ID vendeur", "Unités", "CA brut (FCFA)", `Commission ${settings.commission}%`, "Net vendeur"],
      ...acc.vendors.map((v) => {
        const com = Math.round((v.revenue * settings.commission) / 100);
        return [v.vendorName, v.vendorId, v.units, v.revenue, com, v.revenue - com];
      }),
      ["TOTAL", "", acc.unitsSold, acc.revenue, commission, netVendors],
    ]);
    toast.success("Export CSV généré");
  };

  return (
    <Card className="p-5 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Comptabilité plateforme</h3>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {acc.invoicesCount} facture(s) · période {period} · commission {settings.commission}% · TVA {settings.vatRate}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented<VendorPeriod>
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7d", label: "7j" },
              { value: "30d", label: "30j" },
              { value: "90d", label: "90j" },
              { value: "365d", label: "1 an" },
              { value: "all", label: "Tout" },
            ]}
            ariaLabel="Période comptable"
          />
          <button onClick={exportCsv} className="px-3 py-1.5 rounded-xl bg-white border border-border" style={{ fontSize: 12, fontWeight: 600 }}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <AccTile label="CA brut" value={`${formatPrice(acc.revenue)} FCFA`} color="#16A34A" />
        <AccTile label={`Commission (${settings.commission}%)`} value={`${formatPrice(commission)} FCFA`} color="#E11D2E" />
        <AccTile label={`TVA incluse (${settings.vatRate}%)`} value={`${formatPrice(vat)} FCFA`} color="#3B82F6" />
        <AccTile label="Net à reverser" value={`${formatPrice(netVendors)} FCFA`} color="#F0B429" />
      </div>

      {acc.vendors.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground" style={{ fontSize: 13 }}>
          Aucune facture sur cette période.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-muted-foreground border-b border-border" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>Vendeur</th>
                <th className="text-right px-3 py-2 text-muted-foreground border-b border-border" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>Unités</th>
                <th className="text-right px-3 py-2 text-muted-foreground border-b border-border" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>CA brut</th>
                <th className="text-right px-3 py-2 text-muted-foreground border-b border-border" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>Commission</th>
                <th className="text-right px-3 py-2 text-muted-foreground border-b border-border" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>Net vendeur</th>
              </tr>
            </thead>
            <tbody>
              {acc.vendors.map((v) => {
                const com = Math.round((v.revenue * settings.commission) / 100);
                return (
                  <tr key={v.vendorId} className="hover:bg-muted/40">
                    <td className="px-3 py-2 border-b border-[#F3F4F6]" style={{ fontSize: 13 }}><strong>{v.vendorName}</strong></td>
                    <td className="px-3 py-2 border-b border-[#F3F4F6] text-right text-muted-foreground" style={{ fontSize: 13 }}>{v.units}</td>
                    <td className="px-3 py-2 border-b border-[#F3F4F6] text-right" style={{ fontSize: 13, fontWeight: 700 }}>{formatPrice(v.revenue)}</td>
                    <td className="px-3 py-2 border-b border-[#F3F4F6] text-right text-[#E11D2E]" style={{ fontSize: 13, fontWeight: 600 }}>−{formatPrice(com)}</td>
                    <td className="px-3 py-2 border-b border-[#F3F4F6] text-right text-[#16A34A]" style={{ fontSize: 13, fontWeight: 700 }}>{formatPrice(v.revenue - com)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40">
                <td className="px-3 py-2" style={{ fontSize: 13, fontWeight: 800 }}>Total</td>
                <td className="px-3 py-2 text-right" style={{ fontSize: 13, fontWeight: 800 }}>{acc.unitsSold}</td>
                <td className="px-3 py-2 text-right" style={{ fontSize: 13, fontWeight: 800 }}>{formatPrice(acc.revenue)}</td>
                <td className="px-3 py-2 text-right text-[#E11D2E]" style={{ fontSize: 13, fontWeight: 800 }}>−{formatPrice(commission)}</td>
                <td className="px-3 py-2 text-right text-[#16A34A]" style={{ fontSize: 13, fontWeight: 800 }}>{formatPrice(netVendors)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

function AccTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl border border-border" style={{ background: color + "0D" }}>
      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{label}</p>
      <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16, color }}>{value}</p>
    </div>
  );
}

/* ───────────── Categories ───────────── */

export function AdminCategoriesPage() {
  const cats = useCategories();
  const admin = useAdmin();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    admin.products.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [admin.products]);

  const blank = (): AdminCategory => ({
    id: "", name: "", slug: "", icon: "Package", color: "#6B7280", active: true, sortOrder: (cats[cats.length - 1]?.sortOrder ?? 0) + 1,
  });

  const submit = async (c: AdminCategory) => {
    if (!c.name.trim()) { toast.error("Nom requis"); return; }
    if (!c.slug.trim()) c.slug = c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      await upsertCategory(c);
      logAudit(c.id ? "category.update" : "category.create", c.name);
      toast.success(c.id ? "Catégorie mise à jour" : "Catégorie créée");
      setEditing(null); setCreating(false);
    } catch (e: any) {
      toast.error(e?.message || "Échec de l'enregistrement");
    }
  };

  const remove = async (c: AdminCategory) => {
    if (!confirm(`Supprimer ${c.name} ?`)) return;
    try {
      await deleteCategory(c.id);
      logAudit("category.delete", c.name);
      toast.success("Catégorie supprimée");
    } catch (e: any) {
      toast.error(e?.message || "Suppression impossible");
    }
  };

  const form = editing ?? (creating ? blank() : null);

  return (
    <div className="p-6">
      <PageHeader title="Catégories" subtitle={`${cats.length} catégorie(s)`} actions={
        <button onClick={() => { setCreating(true); setEditing(null); }} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      } />

      {form && (
        <Card className="p-4 mb-4">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </h3>
          <CategoryForm initial={form} onCancel={() => { setEditing(null); setCreating(false); }} onSubmit={submit} />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Ordre</Th><Th>Icône</Th><Th>Nom</Th><Th>Slug</Th><Th>Produits</Th><Th>État</Th><Th /></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={async () => { try { await moveCategory(c.id, -1); } catch (e: any) { toast.error(e?.message || "Échec"); } }} className="p-1 rounded hover:bg-muted"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { try { await moveCategory(c.id, 1); } catch (e: any) { toast.error(e?.message || "Échec"); } }} className="p-1 rounded hover:bg-muted"><ArrowDown className="w-3.5 h-3.5" /></button>
                    </div>
                  </Td>
                  <Td>
                    <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center" style={{ background: c.color + "1A" }}>
                      <CategoryIcon name={c.icon} className="w-4 h-4" style={{ color: c.color }} strokeWidth={2.2} />
                    </span>
                  </Td>
                  <Td><strong style={{ color: c.color }}>{c.name}</strong></Td>
                  <Td className="text-muted-foreground"><code style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{c.slug}</code></Td>
                  <Td>{counts.get(c.name) ?? 0}</Td>
                  <Td>{c.active ? <Badge color="#16A34A">Active</Badge> : <Badge color="#9CA3AF">Désactivée</Badge>}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={async () => { try { await toggleCategory(c.id); logAudit("category.toggle", c.name); } catch (e: any) { toast.error(e?.message || "Échec"); } }} className="p-1.5 rounded-lg hover:bg-muted" title={c.active ? "Désactiver" : "Activer"}>
                        {c.active ? <Pause className="w-4 h-4 text-[#F97316]" /> : <Play className="w-4 h-4 text-[#16A34A]" />}
                      </button>
                      <button onClick={() => { setEditing(c); setCreating(false); }} className="px-2 py-1 rounded-lg text-[#3B82F6] hover:bg-[#3B82F6]/10" style={{ fontSize: 12, fontWeight: 600 }}>
                        Modifier
                      </button>
                      <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-[#E11D2E] hover:bg-[#E11D2E]/10" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CategoryForm({ initial, onSubmit, onCancel }: { initial: AdminCategory; onSubmit: (c: AdminCategory) => void; onCancel: () => void }) {
  const [c, setC] = useState<AdminCategory>(initial);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Nom</span>
          <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Slug</span>
          <input value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value })} placeholder="auto" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Icône</span>
          <select value={c.icon} onChange={(e) => setC({ ...c, icon: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }}>
            {["Package","UtensilsCrossed","Sparkles","SprayCan","Shirt","Wrench","Plug","Smartphone","Laptop","Tv","Refrigerator","Baby","HeartPulse","Sofa","Dumbbell","Gamepad2","Car","BookOpen","Music","Luggage","Briefcase","Palette","Store","Camera","Tag","CreditCard","FileText"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <span className="text-muted-foreground block mb-1">Couleur</span>
          <input type="color" value={c.color} onChange={(e) => setC({ ...c, color: e.target.value })} className="w-full h-[38px] rounded-xl border border-border" />
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
        <button onClick={() => onSubmit(c)} className="px-3 py-2 rounded-xl bg-[#16A34A] text-white" style={{ fontSize: 13, fontWeight: 700 }}>
          {initial.id ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </>
  );
}

/* ───────────── Payouts ───────────── */

export function AdminPayoutsPage() {
  const payouts = usePayouts();
  const admin = useAdmin();
  const [creating, setCreating] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<Payout["method"]>("momo");

  const totals = useMemo(() => ({
    pending: payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.net, 0),
    processing: payouts.filter((p) => p.status === "processing").reduce((s, p) => s + p.net, 0),
    paid: payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.net, 0),
  }), [payouts]);

  const submit = () => {
    if (!vendorId) { toast.error("Vendeur requis"); return; }
    if (amount <= 0) { toast.error("Montant invalide"); return; }
    const p = createPayout(vendorId, amount, method);
    if (!p) { toast.error("Vendeur introuvable"); return; }
    logAudit("payout.create", p.vendorName, { amount, method });
    toast.success(`Reversement ${p.id} créé`);
    setCreating(false); setVendorId(""); setAmount(0);
  };

  const advance = async (p: Payout) => {
    const next: Record<Payout["status"], Payout["status"] | null> = {
      pending: "processing",
      processing: "paid",
      paid: null,
      failed: null,
    };
    const n = next[p.status];
    if (!n) return;
    try {
      await setPayoutStatus(p.id, n);
      logAudit("payout.advance", p.vendorName, { from: p.status, to: n });
      toast.success(`Reversement ${p.id} → ${PAYOUT_LABELS[n]}`);
    } catch (e: any) {
      toast.error(e?.message || "Mise à jour impossible");
    }
  };

  const fail = async (p: Payout) => {
    try {
      await setPayoutStatus(p.id, "failed");
      logAudit("payout.fail", p.vendorName);
      toast.success(`Reversement ${p.id} marqué en échec`);
    } catch (e: any) {
      toast.error(e?.message || "Mise à jour impossible");
    }
  };

  const exportCsv = () => {
    downloadCSV(`reversements-${Date.now()}`, [
      ["ID", "Vendeur", "Montant brut", "Commission", "Net", "Méthode", "Statut", "Créé", "Payé", "Référence"],
      ...payouts.map((p) => [p.id, p.vendorName, p.amount, p.commission, p.net, p.method, p.status, fmtDate(p.createdAt), p.paidAt ? fmtDate(p.paidAt) : "", p.reference || ""]),
    ]);
    toast.success("Export CSV généré");
  };

  return (
    <div className="p-6">
      <PageHeader title="Reversements vendeurs" subtitle={`${payouts.length} reversement(s)`} actions={
        <>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setCreating(!creating)} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Nouveau reversement
          </button>
        </>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>En attente</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#F0B429" }}>{formatPrice(totals.pending)} FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>En cours</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#3B82F6" }}>{formatPrice(totals.processing)} FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Payés</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: "#16A34A" }}>{formatPrice(totals.paid)} FCFA</p>
        </Card>
      </div>

      {creating && (
        <Card className="p-4 mb-4">
          <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>Créer un reversement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label style={{ fontSize: 12 }}>
              <span className="text-muted-foreground block mb-1">Vendeur</span>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }}>
                <option value="">-</option>
                {admin.vendors.filter((v) => v.status === "approved").map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              <span className="text-muted-foreground block mb-1">Montant brut (FCFA)</span>
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12 }}>
              <span className="text-muted-foreground block mb-1">Méthode</span>
              <select value={method} onChange={(e) => setMethod(e.target.value as Payout["method"])} className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }}>
                <option value="momo">Mobile Money</option>
                <option value="bank">Virement bancaire</option>
                <option value="wallet">IPPOO CASH</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setCreating(false)} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
            <button onClick={submit} className="px-3 py-2 rounded-xl bg-[#16A34A] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Créer</button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>ID</Th><Th>Vendeur</Th><Th>Net</Th><Th>Commission</Th><Th>Méthode</Th><Th>Statut</Th><Th>Créé</Th><Th>Réf.</Th><Th /></tr></thead>
            <tbody>
              {payouts.length === 0 && <tr><Td className="text-center text-muted-foreground">Aucun reversement</Td></tr>}
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <Td><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{p.id}</span></Td>
                  <Td><strong>{p.vendorName}</strong></Td>
                  <Td><strong>{formatPrice(p.net)}</strong> FCFA</Td>
                  <Td className="text-muted-foreground">−{formatPrice(p.commission)}</Td>
                  <Td className="capitalize">{p.method === "momo" ? "Mobile Money" : p.method === "bank" ? "Virement" : "Wallet"}</Td>
                  <Td><Badge color={PAYOUT_COLORS[p.status]}>{PAYOUT_LABELS[p.status]}</Badge></Td>
                  <Td className="text-muted-foreground">{fmtDate(p.createdAt)}</Td>
                  <Td className="text-muted-foreground">{p.reference || "-"}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {(p.status === "pending" || p.status === "processing") && (
                        <button onClick={() => advance(p)} title="Avancer" className="p-1.5 rounded-lg text-[#16A34A] hover:bg-[#16A34A]/10">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {p.status !== "paid" && p.status !== "failed" && (
                        <button onClick={() => fail(p)} title="Marquer en échec" className="p-1.5 rounded-lg text-[#E11D2E] hover:bg-[#E11D2E]/10">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Audit log ───────────── */

export function AdminAuditPage() {
  const [entries, setEntries] = useState<import("../data/admin-server").AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { listAuditLog } = await import("../data/admin-server");
      setEntries(await listAuditLog());
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = entries.filter((e) =>
    !q || e.action.toLowerCase().includes(q.toLowerCase())
      || (e.adminEmail || "").toLowerCase().includes(q.toLowerCase())
      || e.adminId.toLowerCase().includes(q.toLowerCase())
      || (e.meta ? JSON.stringify(e.meta).toLowerCase().includes(q.toLowerCase()) : false)
  );

  const exportCsv = () => {
    downloadCSV(`audit-${Date.now()}`, [
      ["ID", "Date", "Admin", "Email", "Action", "Meta"],
      ...filtered.map((e) => [e.id, fmtTime(e.ts), e.adminId, e.adminEmail || "", e.action, e.meta ? JSON.stringify(e.meta) : ""]),
    ]);
    toast.success("Export CSV généré");
  };

  return (
    <div className="p-6">
      <PageHeader title="Journal d'audit" subtitle={loading ? "Chargement…" : `${entries.length} événement(s) · serveur`} actions={
        <>
          <button onClick={() => { void load(); }} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
            <RotateCcw className="w-4 h-4" /> Recharger
          </button>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </>
      } />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}

      <div className="mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher action, admin ou meta"
          className="w-full max-w-md px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30" style={{ fontSize: 13 }} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Quand</Th><Th>Admin</Th><Th>Action</Th><Th>Détails</Th></tr></thead>
            <tbody>
              {loading && <tr><Td className="text-center text-muted-foreground" colSpan={4 as any}>Chargement…</Td></tr>}
              {!loading && filtered.length === 0 && <tr><Td className="text-center text-muted-foreground" colSpan={4 as any}>Aucun événement</Td></tr>}
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/40">
                  <Td className="text-muted-foreground">{fmtTime(e.ts)}</Td>
                  <Td>
                    <strong>{e.adminEmail || "-"}</strong>
                    <div className="text-muted-foreground" style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{e.adminId}</div>
                  </Td>
                  <Td><code style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#E11D2E" }}>{e.action}</code></Td>
                  <Td className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {e.meta && Object.keys(e.meta).length > 0
                      ? <code style={{ fontFamily: "ui-monospace, monospace" }}>{JSON.stringify(e.meta)}</code>
                      : "-"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
