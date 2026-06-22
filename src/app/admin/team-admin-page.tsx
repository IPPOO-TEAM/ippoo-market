/* Admin · Team & roles.
   Invite sub-admins with scoped permissions (RBAC). Local-first. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { UserPlus, Trash2, Shield, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeOps,
  getOpsSnapshot,
  listSubAdmins,
  inviteSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  ROLE_PRESETS,
  type SubAdmin,
  type AdminPermission,
} from "./admin-ops-store";
import { logAudit } from "./audit";
import { PageHeader, Card, Badge, EmptyState, Toolbar, SearchInput, Select, fmtRelative } from "./page-primitives";

const ALL_PERMS: { key: AdminPermission; label: string }[] = [
  { key: "orders", label: "Commandes" },
  { key: "products", label: "Produits" },
  { key: "vendors", label: "Vendeurs" },
  { key: "users", label: "Utilisateurs" },
  { key: "kyc", label: "KYC" },
  { key: "escrow", label: "Escrow" },
  { key: "disputes", label: "Litiges" },
  { key: "support", label: "Support" },
  { key: "reviews", label: "Avis" },
  { key: "promos", label: "Promos" },
  { key: "finance", label: "Finance" },
  { key: "content", label: "Contenus" },
  { key: "announcements", label: "Annonces" },
  { key: "team", label: "Équipe" },
  { key: "settings", label: "Paramètres" },
];

const ROLES: { value: SubAdmin["role"]; label: string }[] = [
  { value: "owner", label: "Owner (accès total)" },
  { value: "ops", label: "Opérations" },
  { value: "finance", label: "Finance" },
  { value: "moderator", label: "Modération" },
  { value: "support", label: "Support" },
  { value: "custom", label: "Personnalisé" },
];

export function AdminTeamPage() {
  useSyncExternalStore(subscribeOps, getOpsSnapshot, getOpsSnapshot);
  const admins = listSubAdmins();
  const [q, setQ] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const filtered = useMemo(() => {
    const l = q.trim().toLowerCase();
    if (!l) return admins;
    return admins.filter((a) => a.email.toLowerCase().includes(l) || a.name.toLowerCase().includes(l) || a.role.includes(l));
  }, [admins, q]);

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Équipe & permissions"
        subtitle="Gérez les administrateurs et leurs droits d'accès aux modules du back-office."
        actions={
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <UserPlus className="w-4 h-4" /> Inviter un admin
          </button>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher email, nom, rôle…" />
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState>Aucun administrateur. Invitez votre équipe pour distribuer les responsabilités.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => <AdminRow key={a.id} admin={a} />)}
        </ul>
      )}

      {showInvite && <InviteDialog onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function AdminRow({ admin }: { admin: SubAdmin }) {
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState<AdminPermission[]>(admin.permissions);
  const [role, setRole] = useState<SubAdmin["role"]>(admin.role);

  const togglePerm = (p: AdminPermission) => {
    setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  };

  const save = () => {
    updateSubAdmin(admin.id, { role, permissions: perms });
    logAudit("team.update", admin.email, { role, perms: perms.join(",") });
    toast.success("Permissions mises à jour");
    setEditing(false);
  };

  const toggleStatus = () => {
    const next = admin.status === "suspended" ? "active" : "suspended";
    updateSubAdmin(admin.id, { status: next });
    logAudit(next === "suspended" ? "team.suspend" : "team.activate", admin.email);
    toast.success(next === "suspended" ? "Admin suspendu" : "Admin réactivé");
  };

  const remove = () => {
    if (!confirm(`Retirer ${admin.email} de l'équipe ?`)) return;
    deleteSubAdmin(admin.id);
    logAudit("team.delete", admin.email);
    toast.success("Admin retiré");
  };

  const statusColor = admin.status === "active" ? "#16A34A" : admin.status === "invited" ? "#F0B429" : "#E11D2E";

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{admin.name}</p>
            <p className="text-muted-foreground truncate" style={{ fontSize: 12 }}>{admin.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Badge color="#3B82F6">{ROLES.find((r) => r.value === admin.role)?.label ?? admin.role}</Badge>
              <Badge color={statusColor}>{admin.status === "active" ? "Actif" : admin.status === "invited" ? "Invité" : "Suspendu"}</Badge>
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>Invité {fmtRelative(admin.invitedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing((e) => !e)}
            className="px-3 py-2 rounded-xl border border-border hover:bg-muted"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            {editing ? "Fermer" : "Permissions"}
          </button>
          <button onClick={toggleStatus} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title={admin.status === "suspended" ? "Réactiver" : "Suspendre"}>
            {admin.status === "suspended" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button onClick={remove} className="p-2 rounded-lg hover:bg-red-50 text-[#E11D2E]" title="Retirer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, fontWeight: 600 }}>Rôle prédéfini :</span>
            <Select<SubAdmin["role"]>
              value={role}
              onChange={(v) => { setRole(v); setPerms(ROLE_PRESETS[v]); }}
              options={ROLES}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {ALL_PERMS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer" style={{ fontSize: 12 }}>
                <input type="checkbox" checked={perms.includes(p.key)} onChange={() => togglePerm(p.key)} />
                {p.label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setPerms(admin.permissions); setRole(admin.role); }} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
            <button onClick={save} className="px-3 py-2 rounded-xl bg-[#16A34A] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Enregistrer</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SubAdmin["role"]>("ops");

  const submit = () => {
    if (!email.trim() || !/.+@.+\..+/.test(email)) { toast.error("Email invalide"); return; }
    inviteSubAdmin({ email, name, role });
    logAudit("team.invite", email, { role });
    toast.success(`Invitation envoyée à ${email}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Inviter un administrateur</h2>
        <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>L'invitation est ajoutée localement ; à la première connexion l'admin verra ses droits appliqués.</p>
        <div className="space-y-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} placeholder="prenom.nom@ippoo.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Nom (optionnel)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} placeholder="Nom & prénom" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Rôle</label>
            <div className="mt-1"><Select<SubAdmin["role"]> value={role} onChange={setRole} options={ROLES} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Envoyer l'invitation</button>
        </div>
      </div>
    </div>
  );
}

export default AdminTeamPage;
