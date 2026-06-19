import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Globe, MapPin, Truck, CreditCard,
  CheckCircle2, FileText,
  DollarSign,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const P = "#1E40AF";
const PL = "#EFF6FF";
const GREEN = "#16A34A";
const GOLD = "#E8A817";
const RED = "#E11D2E";
const ORANGE = "#F97316";

const IMG = {
  hero: "https://images.unsplash.com/photo-1647347553717-16b5b51f519a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwc2hpcHBpbmclMjBjb250YWluZXJzJTIwY2FyZ28lMjBBZnJpY2F8ZW58MXx8fHwxNzczMzMwNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

type Tab = "service" | "demande" | "suivi";

const countries = [
  { name: "Bénin", flag: "🇧🇯", zone: "Afrique de l'Ouest", active: true },
  { name: "Togo", flag: "🇹🇬", zone: "Afrique de l'Ouest", active: true },
  { name: "Nigeria", flag: "🇳🇬", zone: "Afrique de l'Ouest", active: true },
  { name: "Ghana", flag: "🇬🇭", zone: "Afrique de l'Ouest", active: true },
  { name: "Côte d'Ivoire", flag: "🇨🇮", zone: "Afrique de l'Ouest", active: true },
  { name: "Sénégal", flag: "🇸🇳", zone: "Afrique de l'Ouest", active: true },
  { name: "Burkina Faso", flag: "🇧🇫", zone: "Afrique de l'Ouest", active: true },
  { name: "Niger", flag: "🇳🇪", zone: "Afrique de l'Ouest", active: true },
  { name: "Mali", flag: "🇲🇱", zone: "Afrique de l'Ouest", active: true },
  { name: "Cameroun", flag: "🇨🇲", zone: "Afrique Centrale", active: true },
  { name: "Gabon", flag: "🇬🇦", zone: "Afrique Centrale", active: true },
  { name: "RD Congo", flag: "🇨🇩", zone: "Afrique Centrale", active: false },
  { name: "France", flag: "🇫🇷", zone: "Europe (Diaspora)", active: true },
  { name: "Belgique", flag: "🇧🇪", zone: "Europe (Diaspora)", active: true },
  { name: "USA", flag: "🇺🇸", zone: "Amériques (Diaspora)", active: false },
  { name: "Canada", flag: "🇨🇦", zone: "Amériques (Diaspora)", active: false },
];

const steps = [
  { step: 1, title: "Indiquez votre besoin", desc: "Produit, quantité, qualité, budget, délai souhaité", icon: FileText, color: P },
  { step: 2, title: "Choisissez la destination", desc: "Pays et ville de livraison, ou point de retrait", icon: MapPin, color: ORANGE },
  { step: 3, title: "Recevez une estimation", desc: "Prix produit + logistique + taxes estimées (sous réserve)", icon: DollarSign, color: GREEN },
  { step: 4, title: "Confirmez & payez", desc: "Multi-devises : FCFA, EUR, USD, Mobile Money, carte, virement", icon: CreditCard, color: GOLD },
  { step: 5, title: "Tracking en temps réel", desc: "Préparation → Expédition → Douane → Livraison", icon: Truck, color: "#7C3AED" },
];

const devises = [
  { code: "FCFA", symbol: "F", taux: "1.00", base: true },
  { code: "EUR", symbol: "€", taux: "655.96 FCFA", base: false },
  { code: "USD", symbol: "$", taux: "605.12 FCFA", base: false },
  { code: "GBP", symbol: "£", taux: "765.30 FCFA", base: false },
];

const trackingOrders = [
  { ref: "INT-2026-008", dest: "Lomé, Togo", status: "En transit", progress: 65, items: "Riz 25kg x50, Huile 20L x30", color: ORANGE },
  { ref: "INT-2026-007", dest: "Abidjan, Côte d'Ivoire", status: "Douane", progress: 80, items: "Textile Wax x200, Karité x50", color: "#7C3AED" },
  { ref: "INT-2026-006", dest: "Paris, France", status: "Livré", progress: 100, items: "Pack diaspora alimentaire", color: GREEN },
];

const RFQ_KEY = "ippoo:int-rfqs";
type MyRfq = { ref: string; dest: string; status: string; progress: number; items: string; color: string; createdAt: number };
function loadMyRfqs(): MyRfq[] {
  try { const raw = scopedGetItem(RFQ_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveMyRfqs(list: MyRfq[]) {
  scopedSetItem(RFQ_KEY, JSON.stringify(list));
}

export function InternationalPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("service");
  const [rfqForm, setRfqForm] = useState({ product: "", quantity: "", quality: "", budget: "", delay: "", countryFrom: "Bénin", countryTo: "", cityTo: "", notes: "" });
  const [myRfqs, setMyRfqs] = useState<MyRfq[]>([]);
  const [confirm, setConfirm] = useState<MyRfq | null>(null);

  useEffect(() => { setMyRfqs(loadMyRfqs()); }, []);

  const submitRfq = () => {
    if (!rfqForm.product.trim() || !rfqForm.quantity.trim() || !rfqForm.countryTo || !rfqForm.cityTo.trim()) {
      toast.error("Renseignez produit, quantité, pays et ville");
      return;
    }
    const ref = `INT-RFQ-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const newRfq: MyRfq = {
      ref,
      dest: `${rfqForm.cityTo}, ${rfqForm.countryTo}`,
      status: "En attente de réponses",
      progress: 5,
      items: `${rfqForm.product}${rfqForm.quantity ? ` — ${rfqForm.quantity}` : ""}`,
      color: P,
      createdAt: Date.now(),
    };
    const next = [newRfq, ...myRfqs];
    setMyRfqs(next);
    saveMyRfqs(next);
    setRfqForm({ product: "", quantity: "", quality: "", budget: "", delay: "", countryFrom: "Bénin", countryTo: "", cityTo: "", notes: "" });
    setConfirm(newRfq);
  };

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "service", label: "Le service", icon: Globe },
    { key: "demande", label: "Demande", icon: FileText },
    { key: "suivi", label: "Suivi", icon: Truck },
  ];

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <Globe className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>International</h1>
          <p style={{ fontSize: 11, color: "#6B7280" }}>Sourcing & livraison multi-pays</p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        <ImageWithFallback src={IMG.hero} alt="International" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(30,64,175,0.88), rgba(59,130,246,0.7))" }} />
        <div className="absolute inset-0 flex items-center p-4">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#FFF", lineHeight: 1.15 }}>Commandez depuis<br/>n'importe où</p>
            <p className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Sourcing Afrique, livraison sous-région & diaspora</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#6B7280" }}>
              <TI className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-3.5">

        {activeTab === "service" && (
          <>
            <div className="rounded-xl p-3.5" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                Indiquez votre <span style={{ fontWeight: 700 }}>pays, votre besoin</span>, et recevez une solution complète : <span style={{ fontWeight: 700, color: P }}>approvisionnement + logistique + livraison</span> au meilleur coût. Un vrai service, pas un simple catalogue.
              </p>
            </div>

            {/* How it works */}
            <div className="rounded-xl p-4" style={{ background: "#FFF" }}>
              <p className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Comment ça marche</p>
              <div className="relative">
                <div className="absolute left-[20px] top-[22px] bottom-[22px] w-0.5" style={{ background: "#E5E7EB" }} />
                <div className="space-y-4">
                  {steps.map(s => {
                    const SI = s.icon;
                    return (
                      <div key={s.step} className="flex items-start gap-3.5 relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10" style={{ background: `${s.color}12`, border: `2px solid ${s.color}` }}>
                          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: s.color }}>{s.step}</span>
                        </div>
                        <div className="min-w-0 pt-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <SI className="w-4 h-4" style={{ color: s.color }} />
                            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>{s.title}</p>
                          </div>
                          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Countries */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Pays couverts</p>
              <div className="grid grid-cols-4 gap-2">
                {countries.map((c, i) => (
                  <div key={i} className="rounded-xl py-2.5 px-1.5 text-center" style={{ background: c.active ? "#FFF" : "#F9FAFB", border: `1px solid ${c.active ? "#E5E7EB" : "#F3F4F6"}`, opacity: c.active ? 1 : 0.6 }}>
                    <span style={{ fontSize: 20 }}>{c.flag}</span>
                    <p className="truncate mt-0.5" style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>{c.name}</p>
                    {!c.active && <span style={{ fontSize: 8, color: "#9CA3AF" }}>Bientôt</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Devises */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Multi-devises</p>
              <div className="grid grid-cols-4 gap-2">
                {devises.map(d => (
                  <div key={d.code} className="rounded-lg p-2.5 text-center" style={{ background: `${P}06` }}>
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: P }}>{d.symbol}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{d.code}</p>
                    {!d.base && <p style={{ fontSize: 9, color: "#9CA3AF" }}>{d.taux}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Paiements */}
            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Modes de paiement</p>
              {["Carte bancaire (Visa, Mastercard)", "Mobile Money (MTN, Moov, Orange)", "Virement international", "Paiement échelonné (sous conditions)", "IPPOO CASH"].map((m, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{m}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setActiveTab("demande")} className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${P}, #3B82F6)`, fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
              <FileText className="w-4 h-4" /> Faire une demande de cotation
            </button>
          </>
        )}

        {activeTab === "demande" && (
          <>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Demande de cotation (RFQ)</p>
            <div className="rounded-xl p-3.5" style={{ background: PL, borderLeft: `4px solid ${P}` }}>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>Décrivez votre besoin. Nous vous répondons sous 48h avec une estimation complète (prix + logistique + taxes).</p>
            </div>

            <div className="space-y-3">
              <RfqField label="Produit(s) souhaité(s) *" value={rfqForm.product} onChange={v => setRfqForm({...rfqForm, product: v})} placeholder="Ex: Riz Parfumé 25kg, Huile de palme 20L" />
              <div className="grid grid-cols-2 gap-3">
                <RfqField label="Quantité *" value={rfqForm.quantity} onChange={v => setRfqForm({...rfqForm, quantity: v})} placeholder="Ex: 100 sacs" />
                <RfqField label="Qualité/Grade" value={rfqForm.quality} onChange={v => setRfqForm({...rfqForm, quality: v})} placeholder="Premium, Standard..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RfqField label="Budget estimé" value={rfqForm.budget} onChange={v => setRfqForm({...rfqForm, budget: v})} placeholder="En FCFA" />
                <RfqField label="Délai souhaité" value={rfqForm.delay} onChange={v => setRfqForm({...rfqForm, delay: v})} placeholder="Ex: 2 semaines" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Pays destination *</label>
                  <select value={rfqForm.countryTo} onChange={e => setRfqForm({...rfqForm, countryTo: e.target.value})} className="w-full rounded-xl py-2.5 px-4 border border-gray-200" style={{ fontSize: 13, background: "#FFF" }}>
                    <option value="">Choisir</option>
                    {countries.filter(c => c.active).map(c => (
                      <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <RfqField label="Ville *" value={rfqForm.cityTo} onChange={v => setRfqForm({...rfqForm, cityTo: v})} placeholder="Lomé, Abidjan..." />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Notes complémentaires</label>
                <textarea value={rfqForm.notes} onChange={e => setRfqForm({...rfqForm, notes: e.target.value})} placeholder="Contraintes, documents requis..." className="w-full rounded-xl py-2.5 px-4 border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 13, minHeight: 80, background: "#FFF" }} />
              </div>
            </div>

            <button onClick={submitRfq} className="w-full py-3 rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${P}, #3B82F6)`, fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
              Envoyer la demande
            </button>
          </>
        )}

        {activeTab === "suivi" && (
          <>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>Suivi des commandes internationales</p>

            <div className="space-y-2.5">
              {myRfqs.map(o => (
                <div key={o.ref} className="rounded-xl p-3.5" style={{ background: "#FFF", border: `1px dashed ${P}40` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{o.ref}</span>
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: o.color }}>{o.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{o.dest}</span>
                    </div>
                  </div>
                  <p className="mb-2" style={{ fontSize: 12, color: "#6B7280" }}>{o.items}</p>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full" style={{ width: `${o.progress}%`, background: o.color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Demande envoyée</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Réponse sous 48 h</span>
                  </div>
                </div>
              ))}
              {trackingOrders.map(o => (
                <div key={o.ref} className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{o.ref}</span>
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: o.color }}>{o.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{o.dest}</span>
                    </div>
                  </div>
                  <p className="mb-2" style={{ fontSize: 12, color: "#6B7280" }}>{o.items}</p>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full" style={{ width: `${o.progress}%`, background: o.color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Préparation</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Livraison</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3.5" style={{ background: "#FFF" }}>
              <p className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>Statuts de tracking</p>
              {[
                { label: "Préparation", desc: "Commande en cours de préparation", color: "#9CA3AF" },
                { label: "Expédition", desc: "Marchandise en route", color: P },
                { label: "Douane", desc: "Formalités douanières en cours", color: ORANGE },
                { label: "Livraison", desc: "En cours de livraison finale", color: "#7C3AED" },
                { label: "Livré", desc: "Commande réceptionnée", color: GREEN },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{s.label}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setConfirm(null)} aria-label="Fermer" className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${GREEN}15` }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: GREEN }} />
            </div>
            <p className="text-center mt-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#1A1A2E" }}>Demande envoyée</p>
            <p className="text-center mt-1" style={{ fontSize: 13, color: "#6B7280" }}>
              Référence : <strong style={{ color: P }}>{confirm.ref}</strong>
            </p>
            <p className="text-center mt-1" style={{ fontSize: 12, color: "#6B7280" }}>
              Destination : {confirm.dest}
            </p>
            <p className="text-center mt-3 px-3 py-2 rounded-lg" style={{ fontSize: 12, color: "#374151", background: PL }}>
              Notre équipe sourcing vous répond sous <strong>48 heures</strong> avec une estimation complète (produit + logistique + taxes).
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setConfirm(null); setActiveTab("suivi"); }} className="flex-1 py-2.5 rounded-xl text-white" style={{ background: P, fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                Voir mes demandes
              </button>
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RfqField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl py-2.5 px-4 border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 13, background: "#FFF" }} />
    </div>
  );
}
