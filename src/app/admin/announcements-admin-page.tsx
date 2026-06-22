/* Admin · Announcements / Broadcast.
   Create platform-wide banners (audience + schedule) shown across the app. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Megaphone, Plus, Trash2, Power, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeOps, getOpsSnapshot,
  listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  type Announcement, type AnnouncementLevel, type AnnouncementAudience,
} from "./admin-ops-store";
import { logAudit } from "./audit";
import { PageHeader, Card, Badge, EmptyState, Toolbar, Select, fmtRelative, fmtDate } from "./page-primitives";

const LEVELS: { value: AnnouncementLevel; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "#3B82F6" },
  { value: "success", label: "Succès", color: "#16A34A" },
  { value: "warning", label: "Avertissement", color: "#F0B429" },
  { value: "critical", label: "Critique", color: "#E11D2E" },
];

const AUDIENCES: { value: AnnouncementAudience; label: string }[] = [
  { value: "all", label: "Tout le monde" },
  { value: "buyers", label: "Acheteurs" },
  { value: "vendors", label: "Vendeurs" },
  { value: "admin", label: "Admins" },
];

export function AdminAnnouncementsPage() {
  useSyncExternalStore(subscribeOps, getOpsSnapshot, getOpsSnapshot);
  const items = listAnnouncements();
  const [showCreate, setShowCreate] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0, scheduled = 0, expired = 0;
    for (const a of items) {
      const expiredFlag = a.endsAt !== null && a.endsAt <= now;
      if (expiredFlag) expired++;
      else if (a.active && a.startsAt <= now) active++;
      else scheduled++;
    }
    return { active, scheduled, expired };
  }, [items]);

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Annonces & diffusions"
        subtitle="Diffusez des bannières plateforme à toute votre audience (alertes, maintenance, nouveautés)."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <Plus className="w-4 h-4" /> Nouvelle annonce
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Actives</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#16A34A" }}>{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Planifiées</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#3B82F6" }}>{stats.scheduled}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Expirées</p>
          <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24, color: "#6B7280" }}>{stats.expired}</p>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState>Aucune annonce. Créez-en une pour avertir vos utilisateurs.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => <AnnouncementRow key={a.id} a={a} />)}
        </ul>
      )}

      {showCreate && <CreateDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function AnnouncementRow({ a }: { a: Announcement }) {
  const level = LEVELS.find((l) => l.value === a.level) ?? { value: a.level, label: a.level, color: "#6B7280" };
  const audience = AUDIENCES.find((x) => x.value === a.audience) ?? { value: a.audience, label: a.audience };
  const now = Date.now();
  const expired = a.endsAt !== null && a.endsAt <= now;
  const upcoming = a.startsAt > now;

  const toggle = () => {
    updateAnnouncement(a.id, { active: !a.active });
    logAudit(a.active ? "announcement.disable" : "announcement.enable", a.id);
  };
  const remove = () => {
    if (!confirm("Supprimer cette annonce ?")) return;
    deleteAnnouncement(a.id);
    logAudit("announcement.delete", a.id);
    toast.success("Annonce supprimée");
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${level.color}1A`, color: level.color }}
          >
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{a.title}</span>
              <Badge color={level.color}>{level.label}</Badge>
              <Badge color="#6B7280">{audience.label}</Badge>
              {!a.active && <Badge color="#9CA3AF">Désactivée</Badge>}
              {expired && <Badge color="#6B7280">Expirée</Badge>}
              {upcoming && <Badge color="#3B82F6">Planifiée</Badge>}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>{a.body}</p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1" style={{ fontSize: 11 }}>
              <Calendar className="w-3 h-3" />
              {fmtDate(a.startsAt)} → {a.endsAt ? fmtDate(a.endsAt) : "permanent"} · créée {fmtRelative(a.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title={a.active ? "Désactiver" : "Activer"}>
            <Power className="w-4 h-4" style={{ color: a.active ? "#16A34A" : "#9CA3AF" }} />
          </button>
          <button onClick={remove} className="p-2 rounded-lg hover:bg-red-50 text-[#E11D2E]" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<AnnouncementLevel>("info");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState("");

  const submit = () => {
    if (!title.trim() || !body.trim()) { toast.error("Titre et message requis"); return; }
    const start = new Date(startsAt).getTime();
    const end = endsAt ? new Date(endsAt).getTime() : null;
    const a = createAnnouncement({ title: title.trim(), body: body.trim(), level, audience, startsAt: start, endsAt: end });
    logAudit("announcement.create", a.id, { level, audience });
    toast.success("Annonce publiée");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Nouvelle annonce</h2>
        <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>Sera affichée sous forme de bannière selon l'audience et la fenêtre temporelle.</p>
        <div className="space-y-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} placeholder="Ex. Maintenance 23 juin 02h-04h" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} placeholder="Détails affichés à l'utilisateur…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Niveau</label>
              <div className="mt-1"><Select<AnnouncementLevel> value={level} onChange={setLevel} options={LEVELS} /></div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Audience</label>
              <div className="mt-1"><Select<AnnouncementAudience> value={audience} onChange={setAudience} options={AUDIENCES} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Début</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Fin (optionnel)</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Publier</button>
        </div>
      </div>
    </div>
  );
}

export default AdminAnnouncementsPage;
