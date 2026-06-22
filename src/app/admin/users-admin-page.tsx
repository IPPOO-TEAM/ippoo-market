import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Check,
  X,
  Pause,
  Play,
  Download,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "./csv";
import {
  PageHeader, Card, Badge, StatusBadge,
  Toolbar, SearchInput, Select,
  Th, Td, IconBtn, EmptyState, fmtDate, fmtRelative,
} from "./page-primitives";
import { listAdminUsers, banUser, unbanUser, AdminUser } from "../data/admin-server";

type Filter = "all" | "admin" | "buyer" | "banned" | "unconfirmed";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminUsers(1, 200);
      setUsers(items);
    } catch (e: any) {
      setError(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return users.filter((u) => {
      if (ql && !(u.email || "").toLowerCase().includes(ql) && !u.id.toLowerCase().includes(ql)) return false;
      if (filter === "admin" && !u.isAdmin) return false;
      if (filter === "buyer" && u.isAdmin) return false;
      if (filter === "banned" && !u.banned) return false;
      if (filter === "unconfirmed" && u.emailConfirmed) return false;
      return true;
    });
  }, [users, q, filter]);

  const counters = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.isAdmin).length,
    unconfirmed: users.filter((u) => !u.emailConfirmed).length,
  }), [users]);

  async function onBan(u: AdminUser) {
    if (!u.id || u.isAdmin) return;
    setPending(u.id);
    try {
      await banUser(u.id, 168);
      toast.success(`${u.email || u.id} suspendu 7 jours`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setPending(null);
    }
  }

  async function onUnban(u: AdminUser) {
    setPending(u.id);
    try {
      await unbanUser(u.id);
      toast.success("Compte réactivé");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Échec");
    } finally {
      setPending(null);
    }
  }

  function exportCsv() {
    downloadCSV(`utilisateurs-${Date.now()}`, [
      ["ID", "Email", "Créé le", "Dernière connexion", "Email confirmé", "Admin"],
      ...filtered.map((u) => [
        u.id,
        u.email || "",
        u.createdAt ? fmtDate(new Date(u.createdAt).getTime()) : "",
        u.lastSignInAt ? fmtDate(new Date(u.lastSignInAt).getTime()) : "-",
        u.emailConfirmed ? "oui" : "non",
        u.isAdmin ? "oui" : "non",
      ]),
    ]);
    toast.success("Export CSV généré");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Utilisateurs"
        subtitle={loading ? "Chargement…" : `${counters.total} comptes · ${counters.admins} admin(s) · ${counters.unconfirmed} non confirmés`}
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
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher email ou ID utilisateur" />
        <Select
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "Tous" },
            { value: "admin", label: "Admins" },
            { value: "buyer", label: "Non-admins" },
            { value: "banned", label: "Suspendus" },
            { value: "unconfirmed", label: "Email non confirmé" },
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
                <Th>Email</Th>
                <Th>Créé</Th>
                <Th>Dernière connexion</Th>
                <Th>Statut</Th>
                <Th>Rôle</Th>
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
                  <EmptyState title="Aucun utilisateur" description="Aucun résultat pour ces filtres" />
                </Td></tr>
              )}
              {!loading && filtered.map((u) => {
                const isPending = pending === u.id;
                return (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <Td>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate"><strong>{u.email || "-"}</strong></span>
                      </div>
                      <div className="text-muted-foreground truncate" style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                        {u.id}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">
                      {u.createdAt ? fmtRelative(new Date(u.createdAt).getTime()) : "-"}
                    </Td>
                    <Td className="text-muted-foreground">
                      {u.lastSignInAt ? fmtRelative(new Date(u.lastSignInAt).getTime()) : "Jamais"}
                    </Td>
                    <Td>
                      {u.banned
                        ? <Badge color="#E11D2E">Suspendu</Badge>
                        : u.emailConfirmed
                          ? <StatusBadge status="active" />
                          : <Badge color="#F59E0B">Email non confirmé</Badge>}
                    </Td>
                    <Td>
                      {u.isAdmin
                        ? <Badge color="#FF6A00"><ShieldCheck className="w-3 h-3 inline-block mr-1" />Admin</Badge>
                        : <Badge color="#64748B">Utilisateur</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {u.isAdmin ? (
                          <span className="text-muted-foreground" style={{ fontSize: 11 }}>-</span>
                        ) : u.banned ? (
                          <IconBtn icon={isPending ? Loader2 : Play} label="Réactiver" onClick={() => onUnban(u)} color="#16A34A" />
                        ) : (
                          <IconBtn icon={isPending ? Loader2 : Pause} label="Suspendre 7j" onClick={() => onBan(u)} color="#E11D2E" />
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
