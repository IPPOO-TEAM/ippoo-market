/* Annuaire public des groupements vendeurs - visible à tous (acheteurs et
   vendeurs). Affiche les groupements approuvés et publics. */

import { useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { Users, MapPin, Tag, Crown, ChevronLeft, ShieldCheck, Search } from "lucide-react";
import {
  subscribeVendorGroups, getVendorGroupsSnapshot,
  listPublicVendorGroups, getVendorGroup, activeMembers, isFull, MAX_MEMBERS,
} from "../data/vendor-groups";

export function GroupementsPage() {
  useSyncExternalStore(subscribeVendorGroups, getVendorGroupsSnapshot, getVendorGroupsSnapshot);
  const all = listPublicVendorGroups();
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("");
  const navigate = useNavigate();

  const niches = useMemo(() => Array.from(new Set(all.map((g) => g.primaryNiche))).sort(), [all]);

  const filtered = useMemo(() => {
    const l = q.trim().toLowerCase();
    return all.filter((g) => {
      if (niche && g.primaryNiche !== niche && !g.complementaryNiches.includes(niche)) return false;
      if (!l) return true;
      return g.name.toLowerCase().includes(l) || g.description.toLowerCase().includes(l) || g.primaryNiche.toLowerCase().includes(l) || (g.city ?? "").toLowerCase().includes(l);
    });
  }, [all, q, niche]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <header>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24 }}>Groupements de vendeurs</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl" style={{ fontSize: 13 }}>
          Collectifs de jusqu'à <strong>{MAX_MEMBERS} vendeurs</strong> regroupés par niche ou complémentarité. Plus de visibilité, négociations communes, mutualisation de la logistique.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un groupement, une niche, une ville..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-border outline-none"
            style={{ fontSize: 13 }}
          />
        </div>
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-white outline-none" style={{ fontSize: 13 }}>
          <option value="">Toutes les niches</option>
          {niches.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground" style={{ fontSize: 13 }}>Aucun groupement ne correspond à cette recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((g) => {
            const actives = activeMembers(g);
            const full = isFull(g);
            return (
              <Link key={g.id} to={`/groupements/${g.id}`} className="block bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-16 bg-gradient-to-r from-[#E11D2E] via-[#F97316] to-[#F0B429]" />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>{g.name}</h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-white" style={{ background: full ? "#16A34A" : "#F0B429", fontSize: 11, fontWeight: 700 }}>
                      {actives.length}/{MAX_MEMBERS}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2" style={{ fontSize: 12 }}>{g.description}</p>
                  <div className="flex flex-wrap gap-1 text-muted-foreground" style={{ fontSize: 11 }}>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF7ED]"><Tag className="w-3 h-3" /> {g.primaryNiche}</span>
                    {g.city && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted"><MapPin className="w-3 h-3" /> {g.city}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GroupementDetailPage() {
  useSyncExternalStore(subscribeVendorGroups, getVendorGroupsSnapshot, getVendorGroupsSnapshot);
  const { id } = useParams();
  const navigate = useNavigate();
  const g = id ? getVendorGroup(id) : undefined;

  if (!g) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4" style={{ fontSize: 14 }}>Groupement introuvable.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-[#E11D2E] text-white" style={{ fontSize: 13, fontWeight: 700 }}>Retour</button>
      </div>
    );
  }

  const actives = activeMembers(g);
  const full = isFull(g);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" style={{ fontSize: 13 }}>
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#E11D2E] via-[#F97316] to-[#F0B429] relative">
          {g.coverImage && <img src={g.coverImage} alt="" className="w-full h-full object-cover opacity-70" />}
          <span
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-white"
            style={{ background: full ? "#16A34A" : "rgba(0,0,0,0.5)", fontSize: 12, fontWeight: 700 }}
          >
            {actives.length}/{MAX_MEMBERS} vendeurs
          </span>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>{g.name}</h1>
            <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>{g.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF7ED]" style={{ fontSize: 12, fontWeight: 600 }}>
              <Tag className="w-3.5 h-3.5" /> {g.primaryNiche}
            </span>
            {g.complementaryNiches.map((n) => (
              <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted" style={{ fontSize: 12 }}>+ {n}</span>
            ))}
            {g.city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted" style={{ fontSize: 12 }}>
                <MapPin className="w-3.5 h-3.5" /> {g.city}
              </span>
            )}
            {g.moderation === "approved" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[#15803D]" style={{ fontSize: 12, fontWeight: 700 }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Validé IPPOO
              </span>
            )}
          </div>

          {g.charter && (
            <div className="p-3 rounded-xl bg-[#FFF7ED]">
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Charte du groupement</p>
              <p className="text-foreground/80 whitespace-pre-line" style={{ fontSize: 12 }}>{g.charter}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
          <Users className="w-4 h-4 text-[#E11D2E]" /> Membres du groupement
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actives.map((m) => (
            <li key={m.vendorId} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shrink-0">
                {m.role === "leader" ? <Crown className="w-5 h-5" /> : <span style={{ fontSize: 14, fontWeight: 800 }}>{(m.vendorName?.[0] ?? "?").toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: 13, fontWeight: 700 }}>{m.vendorName}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                  {m.role === "leader" ? "Leader" : "Membre"}
                  {m.vendorNiche ? ` · ${m.vendorNiche}` : ""}
                  {m.vendorCity ? ` · ${m.vendorCity}` : ""}
                </p>
              </div>
              <Link to={`/boutique/${m.vendorId}`} className="text-[#E11D2E]" style={{ fontSize: 11, fontWeight: 700 }}>Voir</Link>
            </li>
          ))}
          {Array.from({ length: Math.max(0, MAX_MEMBERS - actives.length) }).map((_, i) => (
            <li key={`slot-${i}`} className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-border text-muted-foreground" style={{ fontSize: 12 }}>
              Place vacante
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GroupementsPage;
