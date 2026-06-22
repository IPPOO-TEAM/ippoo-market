/* ═══════════════════════════════════════════
   IPPOO - Vendeur · Devis reçus (RFQ inbox)
   Liste les demandes envoyées au vendeur courant et permet d'y répondre.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Inbox, Send, CheckCircle2, XCircle, Clock, Search, X, Package,
  MapPin, MessageSquare, BadgeCheck, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import {
  subscribeDevis, getInboxDevis, refreshInboxDevis, respondDevis,
  type Devis, type DevisResponse, type DevisResponseItem,
} from "../data/devis-server";
import { getUserProfile, subscribe as subscribeProfile, isSeller } from "../auth/user-profile";
import { ensureAccountId } from "../auth/account-id";

const STATUS_CONFIG: Record<Devis["status"], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "En attente", color: "#3B82F6", icon: Send },
  accepted: { label: "Accepté", color: "#16A34A", icon: CheckCircle2 },
  cancelled: { label: "Annulé", color: "#EF4444", icon: XCircle },
};

function formatDate(ts: number): string {
  try { return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}

function vendorIdNow(): string { return ensureAccountId().id; }
function vendorDisplayName(): string {
  const p = getUserProfile();
  if (!p) return "Vendeur";
  return p.businessName?.trim() || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Vendeur";
}

function getMyResponse(d: Devis, vid: string): DevisResponse | undefined {
  return d.responses.find((r) => r.vendorId === vid);
}

/* ─── Modale de réponse ─── */
function RespondModal({ devis, onClose }: { devis: Devis; onClose: () => void }) {
  const vid = vendorIdNow();
  const existing = getMyResponse(devis, vid);
  const [items, setItems] = useState<{ name: string; qty: string; unitPrice: string }[]>(() => {
    if (existing?.items?.length) {
      return existing.items.map((i) => ({ name: i.name, qty: String(i.qty), unitPrice: String(i.unitPrice) }));
    }
    return devis.products.map((p) => ({ name: p.name, qty: String(p.qty), unitPrice: "" }));
  });
  const [leadTime, setLeadTime] = useState(existing?.leadTime ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0),
    [items],
  );

  const setItem = (i: number, patch: Partial<{ name: string; qty: string; unitPrice: string }>) =>
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const submit = async () => {
    const cleaned: DevisResponseItem[] = items
      .map((it) => ({ name: it.name.trim(), qty: parseFloat(it.qty) || 0, unitPrice: parseFloat(it.unitPrice) || 0 }))
      .filter((it) => it.name && it.qty > 0 && it.unitPrice > 0);
    if (cleaned.length === 0) { toast.error("Renseignez au moins une ligne avec prix unitaire"); return; }
    setSubmitting(true);
    const res = await respondDevis(
      devis.id,
      {
        responseId: existing?.id,
        vendorName: vendorDisplayName(),
        price: cleaned.reduce((s, it) => s + it.qty * it.unitPrice, 0),
        leadTime: leadTime.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cleaned,
      },
      vid,
    );
    setSubmitting(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(existing ? "Devis mis à jour" : "Devis envoyé à l'acheteur");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-gray-900">{existing ? "Mettre à jour ma réponse" : "Répondre au devis"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{devis.id}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {devis.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" /> {devis.location}
            </div>
          )}
          {devis.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-900">
              <span className="block text-xs uppercase tracking-wide opacity-70 mb-1">Note acheteur</span>
              {devis.notes}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-700">Lignes du devis</p>
            {items.map((it, i) => {
              const sub = (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0);
              return (
                <div key={`${devis.id}-line-${i}`} className="border border-gray-200 rounded-2xl p-3 space-y-2">
                  <input
                    value={it.name}
                    onChange={(e) => setItem(i, { name: e.target.value })}
                    placeholder="Produit"
                    className="w-full text-sm bg-transparent outline-none border-b border-gray-100 pb-1"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={it.qty}
                      onChange={(e) => setItem(i, { qty: e.target.value })}
                      placeholder="Qté"
                      inputMode="decimal"
                      className="text-sm bg-gray-50 rounded-xl px-2 py-2 outline-none"
                    />
                    <input
                      value={it.unitPrice}
                      onChange={(e) => setItem(i, { unitPrice: e.target.value })}
                      placeholder="PU FCFA"
                      inputMode="decimal"
                      className="text-sm bg-gray-50 rounded-xl px-2 py-2 outline-none"
                    />
                    <div className="text-sm text-right pr-1 self-center text-gray-700">
                      {sub > 0 ? `${formatPrice(sub)} FCFA` : "-"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-gray-500">Délai de livraison</label>
            <input
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="Ex : 5 jours ouvrés"
              className="w-full text-sm bg-gray-50 rounded-xl px-3 py-2.5 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-gray-500">Notes pour l'acheteur</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Conditions, paiement, garantie…"
              className="w-full text-sm bg-gray-50 rounded-xl px-3 py-2.5 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <span className="text-sm text-gray-600">Total proposé</span>
            <span className="text-gray-900">{formatPrice(total)} FCFA</span>
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full text-white py-3 rounded-2xl disabled:opacity-60"
            style={{ background: "#16A34A" }}
          >
            {submitting ? "Envoi…" : existing ? "Mettre à jour" : "Envoyer la réponse"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Page principale ─── */
export function MyDevisPage() {
  const navigate = useNavigate();
  useSyncExternalStore(subscribeProfile, getUserProfile, getUserProfile);
  const inbox = useSyncExternalStore(subscribeDevis, getInboxDevis, getInboxDevis);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "todo" | "sent" | "won" | "lost">("todo");
  const [selected, setSelected] = useState<Devis | null>(null);
  const vid = vendorIdNow();

  useEffect(() => { refreshInboxDevis().catch(() => undefined); }, []);

  const profile = getUserProfile();
  const allowed = isSeller(profile);

  const enriched = useMemo(() => inbox.map((d) => {
    const mine = getMyResponse(d, vid);
    const won = d.status === "accepted" && d.acceptedResponseId === mine?.id;
    const lost = d.status === "accepted" && !!mine && d.acceptedResponseId !== mine?.id;
    return { devis: d, mine, won, lost };
  }), [inbox, vid]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(({ devis, mine, won, lost }) => {
      if (tab === "todo" && (mine || devis.status !== "open")) return false;
      if (tab === "sent" && (!mine || devis.status !== "open")) return false;
      if (tab === "won" && !won) return false;
      if (tab === "lost" && !lost) return false;
      if (!q) return true;
      return (
        devis.id.toLowerCase().includes(q) ||
        devis.products.some((p) => p.name.toLowerCase().includes(q)) ||
        (devis.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [enriched, query, tab]);

  const counts = useMemo(() => ({
    all: enriched.length,
    todo: enriched.filter((e) => !e.mine && e.devis.status === "open").length,
    sent: enriched.filter((e) => e.mine && e.devis.status === "open").length,
    won: enriched.filter((e) => e.won).length,
    lost: enriched.filter((e) => e.lost).length,
  }), [enriched]);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900">Devis reçus</h1>
            <p className="text-xs text-gray-500">Demandes de cotation envoyées à votre boutique</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
            <Inbox className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {!allowed && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              Ouvrez une boutique pour recevoir des demandes de devis acheteurs.
            </div>
          </div>
        )}

        {/* Recherche */}
        <div className="bg-white rounded-2xl border border-gray-100 p-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (produit, ville, ID)…"
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {([
            ["todo", "À traiter", counts.todo],
            ["sent", "Envoyés", counts.sent],
            ["won", "Gagnés", counts.won],
            ["lost", "Perdus", counts.lost],
            ["all", "Tous", counts.all],
          ] as const).map(([k, label, n]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
                tab === k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {label} <span className="opacity-70 ml-1">{n}</span>
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 grid place-items-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-700">Aucun devis ici</p>
            <p className="text-xs text-gray-500 mt-1">
              Les demandes apparaissent dès qu'un acheteur cible votre boutique.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ devis, mine, won, lost }) => {
              const cfg = STATUS_CONFIG[devis.status];
              const Icon = cfg.icon;
              return (
                <button
                  key={devis.id}
                  onClick={() => setSelected(devis)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{devis.id}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(devis.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {devis.products.map((p) => `${p.qty} ${p.unit} ${p.name}`).join(" · ")}
                      </p>
                      {devis.location && (
                        <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {devis.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                        style={{ background: `${cfg.color}1A`, color: cfg.color }}
                      >
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                      {won && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <BadgeCheck className="w-3 h-3" /> Vous avez gagné
                        </span>
                      )}
                      {lost && <span className="text-xs text-gray-400">Non retenu</span>}
                      {mine && devis.status === "open" && (
                        <span className="text-xs text-blue-600">Réponse envoyée</span>
                      )}
                    </div>
                  </div>

                  {mine && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="text-gray-600 inline-flex items-center gap-2">
                        <Package className="w-4 h-4" /> Votre offre
                      </span>
                      <span className="text-gray-900">{formatPrice(mine.price)} FCFA</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Détail / réponse */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            devis={selected}
            allowed={allowed}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Modale de détail ─── */
function DetailModal({ devis, allowed, onClose }: { devis: Devis; allowed: boolean; onClose: () => void }) {
  const [responding, setResponding] = useState(false);
  const vid = vendorIdNow();
  const mine = getMyResponse(devis, vid);
  const cfg = STATUS_CONFIG[devis.status];
  const Icon = cfg.icon;
  const won = devis.status === "accepted" && devis.acceptedResponseId === mine?.id;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-gray-900">Détail du devis</h3>
            <p className="text-xs text-gray-500 mt-0.5">{devis.id}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ background: `${cfg.color}1A`, color: cfg.color }}
          >
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">Produits demandés</p>
            <ul className="space-y-1">
              {devis.products.map((p, i) => (
                <li key={`p-${i}`} className="text-sm text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{p.qty} {p.unit} · {p.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {(devis.location || devis.deadline) && (
            <div className="grid grid-cols-2 gap-2">
              {devis.location && (
                <div className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-xs text-gray-500">Livraison</p>
                  <p className="text-sm text-gray-900">{devis.location}</p>
                </div>
              )}
              {devis.deadline && (
                <div className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-xs text-gray-500">Échéance</p>
                  <p className="text-sm text-gray-900">{devis.deadline}</p>
                </div>
              )}
            </div>
          )}

          {devis.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-900">
              <span className="block text-xs uppercase tracking-wide opacity-70 mb-1 inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Note acheteur
              </span>
              {devis.notes}
            </div>
          )}

          {mine && (
            <div className="border border-gray-200 rounded-2xl p-3">
              <p className="text-xs text-gray-500 mb-2">Votre offre actuelle</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">{formatPrice(mine.price)} FCFA</span>
              </div>
              {mine.leadTime && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-700">Délai</span>
                  <span className="text-gray-900">{mine.leadTime}</span>
                </div>
              )}
              {mine.notes && <p className="text-xs text-gray-600 mt-2">{mine.notes}</p>}
              {won && (
                <div className="mt-2 text-sm text-emerald-700 inline-flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4" /> Offre retenue par l'acheteur
                </div>
              )}
            </div>
          )}

          {devis.status === "open" && allowed && (
            <button
              onClick={() => setResponding(true)}
              className="w-full text-white py-3 rounded-2xl"
              style={{ background: "#16A34A" }}
            >
              {mine ? "Mettre à jour ma réponse" : "Répondre à ce devis"}
            </button>
          )}
          {devis.status === "cancelled" && (
            <div className="text-sm text-center text-gray-500">L'acheteur a annulé cette demande.</div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {responding && (
          <RespondModal devis={devis} onClose={() => { setResponding(false); onClose(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MyDevisPage;
