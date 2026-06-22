import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, FileText, Plus, Clock, CheckCircle2, XCircle, Send, Package,
  MapPin, MessageSquare, Search, BadgeCheck, AlertCircle, Users, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { CouponStrip } from "./promo-widgets";
import {
  subscribeDevis, getMyDevis, refreshMyDevis, createDevis, acceptDevisResponse, cancelDevis,
  type Devis,
} from "../data/devis-server";
import {
  subscribePublicVendors, getPublicVendors, refreshPublicVendors, type PublicVendor,
} from "../data/public-vendors";

const STATUS_CONFIG: Record<Devis["status"], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "En attente", color: "#3B82F6", icon: Send },
  accepted: { label: "Accepté", color: "#16A34A", icon: CheckCircle2 },
  cancelled: { label: "Annulé", color: "#EF4444", icon: XCircle },
};

type TabFilter = "tous" | "open" | "responses" | "accepted";

function formatDate(ts: number): string {
  try { return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}

/* ─── NOUVEAU DEVIS ─── */
function NewDevisModal({ onClose, prefill }: { onClose: () => void; prefill?: { productName: string; vendor: string | null } | null }) {
  const vendors = useSyncExternalStore(subscribePublicVendors, getPublicVendors, getPublicVendors);
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<{ name: string; qty: string; unit: string }[]>(
    prefill?.productName ? [{ name: prefill.productName, qty: "", unit: "cartons" }] : [{ name: "", qty: "", unit: "cartons" }],
  );
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoSelect, setAutoSelect] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { refreshPublicVendors().catch(() => undefined); }, []);

  // Pré-sélection si le devis vient d'une fiche produit
  useEffect(() => {
    if (!prefill?.vendor) return;
    const match = vendors.find((v) => v.name === prefill.vendor && v.ownerId);
    if (match?.ownerId) {
      setSelected(new Set([match.ownerId]));
      setAutoSelect(false);
    }
  }, [prefill, vendors]);

  const addProduct = () => setProducts((p) => [...p, { name: "", qty: "", unit: "cartons" }]);
  const removeProduct = (i: number) => setProducts((p) => p.filter((_, j) => j !== i));

  const targetableVendors = useMemo(() => vendors.filter((v) => !!v.ownerId), [vendors]);

  const submit = async () => {
    const cleanedProducts = products
      .map((p) => ({ name: p.name.trim(), qty: parseFloat(p.qty) || 0, unit: p.unit }))
      .filter((p) => p.name && p.qty > 0);
    if (cleanedProducts.length === 0) { toast.error("Ajoutez au moins un produit avec une quantité"); return; }
    const targets = autoSelect
      ? targetableVendors.map((v) => v.ownerId!).slice(0, 20)
      : Array.from(selected);
    if (targets.length === 0) { toast.error("Sélectionnez au moins un vendeur"); return; }
    setSubmitting(true);
    const res = await createDevis({
      products: cleanedProducts,
      targetVendorIds: targets,
      deadline: deadline || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Devis envoyé à ${targets.length} vendeur${targets.length > 1 ? "s" : ""} !`);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Nouveau devis, Étape {step}/3</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#F97316" : "#E5E7EB" }} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Quels produits recherchez-vous ?</h4>
              {products.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" placeholder="Nom du produit" value={p.name}
                      onChange={(e) => { const c = [...products]; c[i].name = e.target.value; setProducts(c); }}
                      className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Quantité" value={p.qty}
                        onChange={(e) => { const c = [...products]; c[i].qty = e.target.value; setProducts(c); }}
                        className="flex-1 px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
                      <select value={p.unit}
                        onChange={(e) => { const c = [...products]; c[i].unit = e.target.value; setProducts(c); }}
                        className="px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }}>
                        {["cartons", "sacs", "pièces", "lots", "bidons", "kg", "unités"].map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {products.length > 1 && (
                    <button onClick={() => removeProduct(i)} className="p-2 text-red-500 mt-1"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button onClick={addProduct} className="w-full py-2 border-2 border-dashed border-[#F97316]/30 rounded-xl flex items-center justify-center gap-1 text-[#F97316]" style={{ fontSize: 12, fontWeight: 600 }}>
                <Plus className="w-4 h-4" /> Ajouter un produit
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Détails de la demande</h4>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Lieu de livraison</label>
                <input type="text" placeholder="Ex : Cotonou, Dantokpa" value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Date limite de réponse</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Notes / Conditions particulières</label>
                <textarea placeholder="Conditionnement préféré, qualité souhaitée, fréquence..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1 resize-none" style={{ fontSize: 13 }} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Choisir les vendeurs</h4>
              <label className="bg-[#FFF7ED] rounded-xl p-3 flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={autoSelect} onChange={(e) => setAutoSelect(e.target.checked)} className="w-4 h-4 accent-[#F97316]" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Sélection automatique IPPOO</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Envoyer à tous les vendeurs publiés ({targetableVendors.length})
                  </p>
                </div>
              </label>
              {!autoSelect && (
                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                  {targetableVendors.length === 0 && (
                    <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>
                      Aucun vendeur public pour le moment.
                    </p>
                  )}
                  {targetableVendors.map((v) => (
                    <label key={v.ownerId} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-border cursor-pointer">
                      <input type="checkbox"
                        checked={selected.has(v.ownerId!)}
                        onChange={(e) => {
                          setSelected((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(v.ownerId!); else n.delete(v.ownerId!);
                            return n;
                          });
                        }}
                        className="w-4 h-4 accent-[#F97316]" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <BadgeCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                        <span className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{v.name}</span>
                      </div>
                      {v.city && <span className="text-muted-foreground" style={{ fontSize: 10 }}>{v.city}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl border border-border"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>Retour</button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-xl text-white bg-[#F97316]"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>Suivant</button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-3 rounded-xl text-white bg-gradient-to-r from-[#F97316] to-[#E11D2E] flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}>
                <Send className="w-4 h-4" /> {submitting ? "Envoi..." : "Envoyer le devis"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── DÉTAIL ─── */
function DevisDetailModal({ devis, onClose }: { devis: Devis; onClose: () => void }) {
  const navigate = useNavigate();
  const vendors = useSyncExternalStore(subscribePublicVendors, getPublicVendors, getPublicVendors);
  const sc = STATUS_CONFIG[devis.status];

  const vendorName = (id: string): string => {
    const m = vendors.find((v) => v.ownerId === id);
    return m?.name ?? id.slice(0, 8);
  };

  const sorted = [...devis.responses].sort((a, b) => a.price - b.price);
  const totalEstime = devis.responses.length > 0
    ? Math.round(devis.responses.reduce((s, r) => s + r.price, 0) / devis.responses.length)
    : 0;
  const bestPrice = sorted[0]?.price ?? null;

  const accept = async (responseId: string, name: string) => {
    const res = await acceptDevisResponse(devis.id, responseId);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Offre de ${name} acceptée.`);
    onClose();
  };

  const cancel = async () => {
    const ok = await cancelDevis(devis.id);
    if (ok) { toast.success("Devis annulé"); onClose(); }
    else toast.error("Annulation impossible");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>{devis.id}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{formatDate(devis.createdAt)}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg flex items-center gap-1"
              style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: `${sc.color}15` }}>
              <sc.icon className="w-3.5 h-3.5" /> {sc.label}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h4 className="flex items-center gap-1.5 mb-2" style={{ fontWeight: 700, fontSize: 13 }}>
              <Package className="w-4 h-4 text-[#F97316]" /> Produits demandés
            </h4>
            {devis.products.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                <span style={{ fontSize: 13 }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{p.qty} {p.unit}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="flex items-center gap-1.5 mb-2" style={{ fontWeight: 700, fontSize: 13 }}>
              <Users className="w-4 h-4 text-[#3B82F6]" /> Vendeurs contactés ({devis.targetVendorIds.length})
            </h4>
            {devis.targetVendorIds.length > 0 ? devis.targetVendorIds.map((id) => (
              <div key={id} className="flex items-center gap-2 py-2 border-b border-[#F3F4F6]">
                <BadgeCheck className="w-4 h-4 text-[#16A34A]" />
                <span style={{ fontSize: 13 }}>{vendorName(id)}</span>
              </div>
            )) : (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>Aucun vendeur sélectionné</p>
            )}
          </div>

          <div className="bg-[#F9F5F0] rounded-xl p-3 space-y-2">
            {devis.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 12 }}>
                  <MapPin className="w-3.5 h-3.5" /> Livraison
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{devis.location}</span>
              </div>
            )}
            {devis.deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 12 }}>
                  <Clock className="w-3.5 h-3.5" /> Deadline
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{devis.deadline}</span>
              </div>
            )}
            {totalEstime > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>Moyenne offres</span>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#F97316" }}>{formatPrice(totalEstime)}</span>
              </div>
            )}
            {bestPrice != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>Meilleure offre</span>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#16A34A" }}>{formatPrice(bestPrice)}</span>
              </div>
            )}
          </div>

          {sorted.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5" style={{ fontWeight: 700, fontSize: 13 }}>
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Tableau comparatif ({sorted.length} offre{sorted.length > 1 ? "s" : ""})
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-1 px-2.5 py-2 bg-[#F9F5F0]"
                  style={{ fontSize: 10, fontWeight: 700, color: "#6B7280" }}>
                  <div className="col-span-5">Vendeur</div>
                  <div className="col-span-3 text-right">Prix</div>
                  <div className="col-span-2 text-center">Délai</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                {sorted.map((r, i) => {
                  const isAccepted = devis.acceptedResponseId === r.id;
                  return (
                    <div key={r.id} className="grid grid-cols-12 gap-1 items-center px-2.5 py-2.5 border-t border-[#F3F4F6]">
                      <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                        <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span className="truncate" style={{ fontSize: 12, fontWeight: 600 }}>{r.vendorName}</span>
                        {i === 0 && !isAccepted && (
                          <span className="px-1 py-0.5 rounded shrink-0" style={{ fontSize: 8, fontWeight: 800, background: "#16A34A15", color: "#16A34A" }}>TOP</span>
                        )}
                        {isAccepted && (
                          <span className="px-1 py-0.5 rounded shrink-0" style={{ fontSize: 8, fontWeight: 800, background: "#16A34A", color: "#fff" }}>ACCEPTÉ</span>
                        )}
                      </div>
                      <div className="col-span-3 text-right"
                        style={{ fontFamily: "Poppins", fontSize: 12, fontWeight: 800, color: i === 0 ? "#16A34A" : "#1A1A2E" }}>
                        {formatPrice(r.price)}
                      </div>
                      <div className="col-span-2 text-center" style={{ fontSize: 11, color: "#6B7280" }}>{r.leadTime ?? "-"}</div>
                      <div className="col-span-2 flex justify-end gap-1">
                        {devis.status === "open" && (
                          <button onClick={(e) => { e.stopPropagation(); accept(r.id, r.vendorName); }}
                            className="p-1.5 rounded-lg bg-[#16A34A] text-white" title="Accepter cette offre">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {devis.status === "open" && (
              <button onClick={cancel} className="flex-1 py-3 rounded-xl border border-border text-[#EF4444]"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                Annuler le devis
              </button>
            )}
            <button onClick={() => { navigate("/messagerie"); onClose(); }}
              className="px-4 py-3 rounded-xl border border-border">
              <MessageSquare className="w-5 h-5 text-[#F97316]" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── PAGE ─── */
export function DevisPage() {
  const navigate = useNavigate();
  const list = useSyncExternalStore(subscribeDevis, getMyDevis, getMyDevis);
  const [activeTab, setActiveTab] = useState<TabFilter>("tous");
  const [showNewDevis, setShowNewDevis] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [prefill, setPrefill] = useState<{ productName: string; vendor: string | null } | null>(null);

  useEffect(() => { refreshMyDevis().catch(() => undefined); }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ippoo:devis-intent");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      sessionStorage.removeItem("ippoo:devis-intent");
      if (parsed?.productName) {
        setPrefill({ productName: parsed.productName, vendor: parsed.vendor || null });
        setShowNewDevis(true);
        toast.success(`Devis pré-rempli : ${parsed.productName}`);
      }
    } catch { /* ignore */ }
  }, []);

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "tous", label: "Tous", count: list.length },
    { key: "open", label: "En attente", count: list.filter((d) => d.status === "open" && d.responses.length === 0).length },
    { key: "responses", label: "Réponses", count: list.filter((d) => d.status === "open" && d.responses.length > 0).length },
    { key: "accepted", label: "Acceptés", count: list.filter((d) => d.status === "accepted").length },
  ];

  const filtered = list.filter((d) => {
    const matchTab =
      activeTab === "tous" ||
      (activeTab === "open" && d.status === "open" && d.responses.length === 0) ||
      (activeTab === "responses" && d.status === "open" && d.responses.length > 0) ||
      (activeTab === "accepted" && d.status === "accepted");
    const matchSearch = !searchQuery
      || d.id.toLowerCase().includes(searchQuery.toLowerCase())
      || d.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchSearch;
  });

  const selected = selectedId ? list.find((d) => d.id === selectedId) ?? null : null;

  return (
    <div className="pb-24">
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <h3 className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Devis & Négociation</h3>
        <button onClick={() => setShowNewDevis(true)}
          className="px-3 py-1.5 bg-[#F97316] text-white rounded-xl flex items-center gap-1"
          style={{ fontSize: 12, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      <div className="px-4 py-5" style={{ background: "linear-gradient(135deg, #F97316, #E11D2E)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1"
              style={{ fontSize: 9, fontWeight: 800 }}>
              <FileText className="w-3 h-3" /> {list.length} DEVIS
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1"
              style={{ fontSize: 9, fontWeight: 800 }}>
              <CheckCircle2 className="w-3 h-3" /> {list.reduce((s, d) => s + d.responses.length, 0)} RÉPONSES
            </div>
          </div>
          <h2 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20 }}>
            Négociez les meilleurs prix
          </h2>
          <p className="text-white/70" style={{ fontSize: 12 }}>
            Demandez des devis multi-produits, comparez les offres et acceptez la meilleure
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher un devis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] rounded-xl border-none" style={{ fontSize: 13 }} />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #F97316, #E11D2E)" : "#F3F4F6",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
                fontSize: 11, fontWeight: 700,
              }}>
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full"
                style={{
                  fontSize: 9, fontWeight: 800,
                  background: activeTab === tab.key ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                  color: activeTab === tab.key ? "#fff" : "#6B7280",
                }}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((d, i) => {
            const sc = STATUS_CONFIG[d.status];
            const best = d.responses.length > 0 ? Math.min(...d.responses.map((r) => r.price)) : null;
            return (
              <motion.div key={d.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => setSelectedId(d.id)}
                className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                <div className="h-1" style={{ background: sc.color }} />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{d.id}</h4>
                      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{formatDate(d.createdAt)}</p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-lg flex items-center gap-1"
                      style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: `${sc.color}15` }}>
                      <sc.icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {d.products.map((p, j) => (
                      <span key={j} className="px-2 py-0.5 bg-[#F9F5F0] rounded-lg" style={{ fontSize: 10, fontWeight: 500 }}>
                        {p.name} × {p.qty}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {d.location && (
                      <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                        <MapPin className="w-3 h-3" /> {d.location}
                      </div>
                    )}
                    {d.deadline && (
                      <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                        <Clock className="w-3 h-3" /> {d.deadline}
                      </div>
                    )}
                    {d.responses.length > 0 && (
                      <div className="flex items-center gap-1 ml-auto"
                        style={{ fontSize: 10, fontWeight: 700, color: "#16A34A" }}>
                        <CheckCircle2 className="w-3 h-3" /> {d.responses.length} réponse{d.responses.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {best != null && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F4F6]">
                      <span className="text-muted-foreground" style={{ fontSize: 11 }}>Meilleure offre</span>
                      <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13, color: "#16A34A" }}>
                        {formatPrice(best)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3" style={{ fontSize: 14 }}>Aucun devis trouvé</p>
            <button onClick={() => setShowNewDevis(true)}
              className="px-4 py-2 bg-[#F97316] text-white rounded-xl inline-flex items-center gap-2"
              style={{ fontSize: 13, fontWeight: 700 }}>
              <Plus className="w-4 h-4" /> Lancer un premier devis
            </button>
          </div>
        )}

        <CouponStrip code="DEVIS10" label="Négoce" discount="-10% sur 1er devis accepté"
          condition="Valable pour toute 1ère commande passée via devis" color="#F97316" expiry="Offre permanente" />
      </div>

      <AnimatePresence>
        {showNewDevis && <NewDevisModal onClose={() => { setShowNewDevis(false); setPrefill(null); }} prefill={prefill} />}
        {selected && <DevisDetailModal devis={selected} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>
    </div>
  );
}

// Exports utilitaires conservés pour compat (non utilisés, mais pas de breakage si imports résiduels)
export type { Devis as DevisItem } from "../data/devis-server";
// PublicVendor importé seulement pour types ; pas d'export.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _vendorType: PublicVendor | null = null;
void _vendorType;
// AlertCircle importé pour homogénéité, pas utilisé directement.
void AlertCircle;
