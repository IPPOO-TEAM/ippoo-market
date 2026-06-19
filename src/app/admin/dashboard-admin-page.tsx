import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Wallet,
  Crown,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatPrice } from "../components/mock-data";
import { AnimatedNumber } from "../components/animated-number";
import {
  fmtDate,
  PageHeader, Card, EmptyState,
} from "./page-primitives";
import { getAdminStats, listAuditLog, AdminStats, AuditEntry } from "../data/admin-server";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([getAdminStats(), listAuditLog()]);
      setStats(s);
      setAudit(a.slice(0, 12));
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis: Array<{ label: string; value: React.ReactNode; change: string; up: boolean; Icon: typeof Wallet; color: string }> = stats ? [
    {
      label: "GMV (30j)",
      value: <><AnimatedNumber value={stats.orders.gmv30} format={(n) => formatPrice(n)} /> FCFA</>,
      change: `${formatPrice(stats.orders.gmv7)} FCFA sur 7j`,
      up: stats.orders.gmv7 > 0,
      Icon: Wallet, color: "#16A34A",
    },
    {
      label: "Commandes (30j)",
      value: <AnimatedNumber value={stats.orders.last30} />,
      change: `${stats.orders.total} au total · ${stats.orders.last7} sur 7j`,
      up: stats.orders.last7 > 0,
      Icon: ShoppingBag, color: "#3B82F6",
    },
    {
      label: "Utilisateurs",
      value: <AnimatedNumber value={stats.users} />,
      change: `${stats.vendors} vendeur(s) · ${stats.products} produit(s)`,
      up: true,
      Icon: Users, color: "#F0B429",
    },
    {
      label: "Escrow retenu",
      value: <><AnimatedNumber value={stats.escrow.heldAmount} format={(n) => formatPrice(n)} /> FCFA</>,
      change: `${stats.escrow.held} en attente · ${stats.escrow.released} libérés`,
      up: stats.escrow.held === 0,
      Icon: Crown, color: "#F97316",
    },
  ] : [];

  return (
    <div className="p-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={stats ? `Données actualisées ${fmtDate(stats.generatedAt)}` : "Vue d'ensemble de la marketplace IPPOO"}
        actions={
          <button
            onClick={() => { void load(); }}
            className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Recharger
          </button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading && !stats ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 inline-block animate-spin mr-2" /> Chargement des KPI…
        </Card>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((k) => (
              <Card key={k.label} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.color + "1A" }}>
                    <k.Icon className="w-5 h-5" style={{ color: k.color }} />
                  </div>
                  {k.up ? <TrendingUp className="w-4 h-4 text-[#16A34A]" /> : <TrendingDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{k.label}</p>
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{k.value}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{k.change}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5">
              <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Activité admin récente</h3>
              {audit.length === 0 ? (
                <EmptyState title="Aucune activité" description="Les actions admin apparaîtront ici." />
              ) : (
                <div className="space-y-2">
                  {audit.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
                      <span className="px-2 py-0.5 rounded-md shrink-0" style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", background: "#F1F5F9" }}>
                        {e.action}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground" style={{ fontSize: 12 }}>
                        {e.adminEmail || e.adminId}
                        {e.meta && Object.keys(e.meta).length > 0 ? " · " + JSON.stringify(e.meta) : ""}
                      </span>
                      <span className="text-muted-foreground shrink-0" style={{ fontSize: 11 }}>{fmtDate(e.ts)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>À surveiller</h3>
              <div className="space-y-3">
                <Tile label={`${stats.kyc.pending} KYC à examiner`} color="#3B82F6" Icon={ShieldCheck} />
                <Tile label={`${stats.escrow.held} fonds en escrow`} color="#F0B429" Icon={Lock} />
                <Tile label={`${stats.kyc.rejected} KYC rejetés`} color="#E11D2E" Icon={AlertTriangle} />
                <Tile label={`${stats.kyc.approved} KYC validés`} color="#16A34A" Icon={ShieldCheck} />
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Tile({ label, color, Icon }: { label: string; color: string; Icon: typeof AlertTriangle }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "1A" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
