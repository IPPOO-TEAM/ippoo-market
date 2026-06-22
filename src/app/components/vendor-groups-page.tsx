/* Page vendeur : créer et gérer ses groupements (jusqu'à 7 vendeurs par groupement).
   Onglets : "Mes groupements" / "Découvrir" / "Demandes en attente".
   Inclut la création, la modération des candidatures, le départ et le transfert
   de leadership. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { Plus, Users, Crown, MapPin, Tag, ShieldCheck, LogOut, Check, X, ArrowRightLeft, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeVendorGroups, getVendorGroupsSnapshot,
  listGroupsForVendor, listPublicVendorGroups,
  createVendorGroup, joinVendorGroup, leaveVendorGroup,
  approveMember, rejectMember, transferLeadership, updateVendorGroup,
  activeMembers, isFull, MAX_MEMBERS,
  type VendorGroup, type GroupVisibility,
} from "../data/vendor-groups";
import { useUserProfile } from "../auth/useUserProfile";
import { isSeller } from "../auth/user-profile";
import { slugifyShopName } from "../data/shop-assets";

type Tab = "mine" | "discover" | "pending";

export function VendorGroupsPage() {
  useSyncExternalStore(subscribeVendorGroups, getVendorGroupsSnapshot, getVendorGroupsSnapshot);
  const profile = useUserProfile();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mine");
  const [showCreate, setShowCreate] = useState(false);

  if (!profile || !isSeller(profile)) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Réservé aux vendeurs</h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
          Connectez-vous avec un compte vendeur pour créer ou rejoindre un groupement.
        </p>
        <button onClick={() => navigate("/devenir-vendeur")} className="mt-4 px-4 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>
          Devenir vendeur
        </button>
      </div>
    );
  }

  const vendorId = slugifyShopName(profile.businessName || profile.email || "vendor");
  const vendorName = profile.businessName || profile.email || "Vendeur";
  const vendorNiche = profile.niche;

  const myGroups = listGroupsForVendor(vendorId);
  const publicGroups = listPublicVendorGroups().filter((g) => !myGroups.some((m) => m.id === g.id));
  const pendingForMe = myGroups.filter((g) => g.leaderId === vendorId && g.members.some((m) => m.status === "pending"));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "mine", label: "Mes groupements", count: myGroups.length },
    { id: "discover", label: "Découvrir", count: publicGroups.length },
    { id: "pending", label: "Demandes", count: pendingForMe.reduce((s, g) => s + g.members.filter((m) => m.status === "pending").length, 0) },
  ];

  const onJoin = (g: VendorGroup) => {
    const res = joinVendorGroup(g.id, { vendorId, vendorName, vendorNiche, vendorCity: profile.city }, true);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Vous avez rejoint « ${g.name} »`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>Groupements de vendeurs</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Réunissez-vous à <strong>{MAX_MEMBERS} vendeurs</strong> de même niche ou de niches complémentaires pour gagner en visibilité, négocier ensemble et mutualiser la logistique.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D2E] text-white"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          <Plus className="w-4 h-4" /> Créer un groupement
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 -mb-px border-b-2 transition-colors ${tab === t.id ? "border-[#E11D2E] text-[#E11D2E]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 px-1.5 rounded-full" style={{ background: tab === t.id ? "#E11D2E" : "#9CA3AF", color: "white", fontSize: 10 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "mine" && (
        myGroups.length === 0 ? (
          <EmptyMine onCreate={() => setShowCreate(true)} onDiscover={() => setTab("discover")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myGroups.map((g) => <GroupCard key={g.id} g={g} vendorId={vendorId} variant="mine" onLeave={() => { const r = leaveVendorGroup(g.id, vendorId); r.ok ? toast.success("Vous avez quitté le groupement") : toast.error(r.error ?? ""); }} />)}
          </div>
        )
      )}

      {tab === "discover" && (
        publicGroups.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground" style={{ fontSize: 13 }}>Aucun groupement public à rejoindre pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publicGroups.map((g) => <GroupCard key={g.id} g={g} vendorId={vendorId} variant="discover" onJoin={() => onJoin(g)} />)}
          </div>
        )
      )}

      {tab === "pending" && (
        pendingForMe.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground" style={{ fontSize: 13 }}>Aucune candidature en attente dans vos groupements.</p>
        ) : (
          <div className="space-y-3">
            {pendingForMe.map((g) => (
              <div key={g.id} className="bg-white rounded-2xl border border-border p-4">
                <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{g.name}</p>
                <ul className="mt-3 space-y-2">
                  {g.members.filter((m) => m.status === "pending").map((m) => (
                    <li key={m.vendorId} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#FFF7ED]">
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{m.vendorName}</p>
                        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{m.vendorNiche ?? "Niche non précisée"} {m.vendorCity ? `· ${m.vendorCity}` : ""}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { approveMember(g.id, m.vendorId); toast.success("Candidature approuvée"); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#16A34A] text-white" style={{ fontSize: 12, fontWeight: 700 }}><Check className="w-3.5 h-3.5" /> Approuver</button>
                        <button onClick={() => { rejectMember(g.id, m.vendorId); toast.success("Candidature rejetée"); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E11D2E] text-white" style={{ fontSize: 12, fontWeight: 700 }}><X className="w-3.5 h-3.5" /> Rejeter</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      )}

      {showCreate && (
        <CreateGroupDialog
          onClose={() => setShowCreate(false)}
          defaultNiche={vendorNiche}
          leader={{ vendorId, vendorName, vendorNiche, vendorCity: profile.city, avatar: profile.logo }}
        />
      )}
    </div>
  );
}

function EmptyMine({ onCreate, onDiscover }: { onCreate: () => void; onDiscover: () => void }) {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-border">
      <Users className="w-12 h-12 mx-auto mb-3 text-[#E11D2E]" />
      <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Vous n'êtes membre d'aucun groupement</h2>
      <p className="text-muted-foreground mt-1 max-w-md mx-auto" style={{ fontSize: 13 }}>
        Créez votre propre groupement (vous en devenez leader) ou rejoignez-en un existant pour mutualiser visibilité et logistique.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={onCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Créer un groupement
        </button>
        <button onClick={onDiscover} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border" style={{ fontSize: 13, fontWeight: 700 }}>
          <Eye className="w-4 h-4" /> Découvrir
        </button>
      </div>
    </div>
  );
}

function GroupCard({ g, vendorId, variant, onJoin, onLeave }: {
  g: VendorGroup; vendorId: string; variant: "mine" | "discover";
  onJoin?: () => void; onLeave?: () => void;
}) {
  const navigate = useNavigate();
  const actives = activeMembers(g);
  const full = isFull(g);
  const iAmLeader = g.leaderId === vendorId;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {g.coverImage && (
        <div className="h-20 bg-gradient-to-r from-[#E11D2E] to-[#F97316] overflow-hidden">
          <img src={g.coverImage} alt="" className="w-full h-full object-cover opacity-70" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>{g.name}</h3>
            <p className="text-muted-foreground line-clamp-2 mt-0.5" style={{ fontSize: 12 }}>{g.description}</p>
          </div>
          <span
            className="shrink-0 px-2 py-0.5 rounded-full text-white"
            style={{ background: full ? "#16A34A" : "#F0B429", fontSize: 11, fontWeight: 700 }}
          >
            {actives.length}/{MAX_MEMBERS}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 text-muted-foreground" style={{ fontSize: 11 }}>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF7ED]"><Tag className="w-3 h-3" /> {g.primaryNiche}</span>
          {g.complementaryNiches.slice(0, 2).map((n) => (
            <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">+ {n}</span>
          ))}
          {g.city && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted"><MapPin className="w-3 h-3" /> {g.city}</span>}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {actives.slice(0, MAX_MEMBERS).map((m) => (
            <div
              key={m.vendorId}
              title={`${m.vendorName} (${m.role === "leader" ? "Leader" : "Membre"})`}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shrink-0"
              style={{ fontSize: 10, fontWeight: 800 }}
            >
              {m.role === "leader" ? <Crown className="w-3.5 h-3.5" /> : (m.vendorName?.[0] ?? "?").toUpperCase()}
            </div>
          ))}
          {Array.from({ length: Math.max(0, MAX_MEMBERS - actives.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-7 h-7 rounded-full border-2 border-dashed border-border" />
          ))}
        </div>

        {g.moderation === "pending" && (
          <p className="text-[#F0B429]" style={{ fontSize: 11, fontWeight: 600 }}>⏳ En attente de validation admin</p>
        )}
        {g.moderation === "rejected" && (
          <p className="text-[#E11D2E]" style={{ fontSize: 11, fontWeight: 600 }} title={g.moderationReason}>⚠ Refusé : {g.moderationReason}</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button onClick={() => navigate(`/groupements/${g.id}`)} className="flex-1 px-3 py-2 rounded-xl border border-border" style={{ fontSize: 12, fontWeight: 700 }}>
            Détails
          </button>
          {variant === "discover" && (
            <button
              onClick={onJoin}
              disabled={full}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              <Users className="w-3.5 h-3.5" /> {full ? "Complet" : "Rejoindre"}
            </button>
          )}
          {variant === "mine" && !iAmLeader && (
            <button onClick={onLeave} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              <LogOut className="w-3.5 h-3.5" /> Quitter
            </button>
          )}
          {variant === "mine" && iAmLeader && (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#FEF3C7] text-[#92400E]" style={{ fontSize: 12, fontWeight: 700 }}>
              <Crown className="w-3.5 h-3.5" /> Leader
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateGroupDialog({ onClose, defaultNiche, leader }: {
  onClose: () => void;
  defaultNiche?: string;
  leader: { vendorId: string; vendorName: string; vendorNiche?: string; vendorCity?: string; avatar?: string };
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryNiche, setPrimaryNiche] = useState(defaultNiche ?? "");
  const [complementary, setComplementary] = useState("");
  const [city, setCity] = useState(leader.vendorCity ?? "");
  const [charter, setCharter] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");

  const submit = () => {
    if (!name.trim() || !description.trim() || !primaryNiche.trim()) {
      toast.error("Nom, description et niche principale requis");
      return;
    }
    const g = createVendorGroup({
      name, description, primaryNiche,
      complementaryNiches: complementary.split(",").map((s) => s.trim()).filter(Boolean),
      city: city.trim() || undefined,
      charter: charter.trim() || undefined,
      visibility,
      leader,
    });
    toast.success(`Groupement « ${g.name} » créé - en attente de validation admin`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18 }}>Nouveau groupement</h2>
        <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>Vous en serez le leader. Jusqu'à {MAX_MEMBERS - 1} autres vendeurs pourront rejoindre.</p>
        <div className="space-y-3">
          <Field label="Nom du groupement" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Cooperative Vivrier Nord-Bénin" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
          </Field>
          <Field label="Description courte" required>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Pitch visible dans la liste publique" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Niche principale" required>
              <input value={primaryNiche} onChange={(e) => setPrimaryNiche(e.target.value)} placeholder="Alimentaire, Textile..." className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </Field>
            <Field label="Ville (optionnel)">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cotonou, Parakou..." className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
            </Field>
          </div>
          <Field label="Niches complémentaires (séparées par des virgules)">
            <input value={complementary} onChange={(e) => setComplementary(e.target.value)} placeholder="Emballage, Logistique, Boissons" className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
          </Field>
          <Field label="Charte du groupement (visible aux candidats)">
            <textarea value={charter} onChange={(e) => setCharter(e.target.value)} rows={3} placeholder="Règles, engagements, modalités de partage des marges..." className="w-full px-3 py-2 rounded-xl border border-border outline-none" style={{ fontSize: 13 }} />
          </Field>
          <Field label="Visibilité">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as GroupVisibility)} className="w-full px-3 py-2 rounded-xl border border-border bg-white outline-none" style={{ fontSize: 13 }}>
              <option value="public">Public - visible dans l'annuaire</option>
              <option value="private">Privé - sur invitation uniquement</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-2 rounded-xl border border-border" style={{ fontSize: 13 }}>Annuler</button>
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Créer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}{required && <span className="text-[#E11D2E]"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default VendorGroupsPage;
