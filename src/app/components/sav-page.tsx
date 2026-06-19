import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Wrench,
  Scissors,
  Smartphone,
  Settings2,
  Shield,
  Star,
  BadgeCheck,
  MapPin,
  Phone,
  ChevronRight,
  Clock,
  CheckCircle2,
  Search,
  MessageSquare,
  Calendar,
  Package,
  Truck,
  HeartHandshake,
  Cog,
  Hammer,
  Shirt,
  Monitor,
  Car,
  Zap,
  ThumbsUp,
  FileText,
  AlertTriangle,
  X,
  Users,
  ArrowRight,
  CircleDollarSign,
  RotateCcw,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { CouponStrip } from "./promo-widgets";
import { IMG, savCategories, prestataires, savRequests, statusMap, type SavCategory } from "./sav-data";


/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type Tab = "services" | "prestataires" | "demandes";

/* ═══════════════════════════════════════════
   DEMANDE SAV MODAL
   ═══════════════════════════════════════════ */
function DemandeSavModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
            Nouvelle demande SAV
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#E11D2E" : "#E5E7EB" }} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Quel produit concerne votre demande ?</h4>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>N° de commande IPPOO</label>
                <input type="text" placeholder="Ex : CMD-2026-001" className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Produit concerné</label>
                <input type="text" placeholder="Nom du produit acheté" className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Type de service souhaité</label>
                <select className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }}>
                  <option>Choisir un type...</option>
                  <option>Retouche / Ajustement textile</option>
                  <option>Réparation / Remplacement</option>
                  <option>Maintenance / Entretien technique</option>
                  <option>Service auto / Mécanique</option>
                  <option>Installation / Service à domicile</option>
                  <option>Autre demande</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Décrivez votre besoin</h4>
              <textarea
                placeholder="Décrivez le problème ou le service souhaité en détail (nature du défaut, mesures pour retouches, type d'intervention...)."
                rows={4}
                className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none resize-none mt-1"
                style={{ fontSize: 13 }}
              />
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Photos (optionnel)</label>
                <button className="mt-1 w-full py-3 border-2 border-dashed border-[#E5E7EB] rounded-xl flex items-center justify-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Ajouter des photos</span>
                </button>
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Localisation</label>
                <input type="text" placeholder="Votre ville / quartier" className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Urgence</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { label: "Normal", desc: "3-5 jours", color: "#16A34A" },
                    { label: "Rapide", desc: "24-48h", color: "#F97316" },
                    { label: "Urgent", desc: "< 12h", color: "#E11D2E" },
                  ].map((u) => (
                    <button
                      key={u.label}
                      className="flex-1 py-2 rounded-xl border border-border text-center"
                      onClick={() => toast.info(`Priorité : ${u.label}`)}
                    >
                      <p style={{ fontSize: 12, fontWeight: 700, color: u.color }}>{u.label}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 9 }}>{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Choisir un prestataire</h4>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                Sélectionnez un prestataire ou laissez IPPOO vous attribuer le mieux noté de votre zone.
              </p>
              <div className="bg-[#FFF7ED] rounded-xl p-3 flex items-center gap-3">
                <input type="radio" name="prestataire" defaultChecked className="w-4 h-4 accent-[#E11D2E]" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Attribution automatique IPPOO</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Nous sélectionnons le prestataire le mieux noté et disponible
                  </p>
                </div>
              </div>
              {prestataires.filter((p) => p.available).slice(0, 4).map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border cursor-pointer">
                  <input type="radio" name="prestataire" className="w-4 h-4 accent-[#E11D2E]" />
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
                      {p.name} <BadgeCheck className="w-3 h-3 text-[#16A34A]" />
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: 10 }}>{p.specialty} · {p.location}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{p.rating}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-border"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Retour
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-xl text-white bg-[#E11D2E]"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={() => {
                  toast.success("Demande SAV #SAV-004 créée ! Un prestataire vous contactera sous 24h.");
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl text-white bg-gradient-to-r from-[#FF6A00] to-[#FF4400] flex items-center justify-center gap-2"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
              >
                <ShieldCheck className="w-4 h-4" /> Envoyer la demande
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SERVICE DETAIL MODAL
   ═══════════════════════════════════════════ */
function ServiceDetailModal({ category, onClose, onDemande }: { category: SavCategory; onClose: () => void; onDemande: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
      >
        {/* Image header */}
        <div className="relative h-40 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          <img src={category.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${category.color}E6 0%, ${category.color}44 60%, transparent 100%)` }} />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <category.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>
                {category.name}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#374151" }}>{category.description}</p>

          {/* Services list */}
          <div>
            <h4 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>Services disponibles</h4>
            <div className="space-y-2.5">
              {category.services.map((service, i) => (
                <div key={i} className="bg-[#F9F5F0] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{service.name}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11, lineHeight: "15px" }}>{service.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: 10, fontWeight: 700, color: category.color, background: `${category.color}15` }}>
                      {service.price}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 10 }}>
                      <Clock className="w-3 h-3" /> {service.delay}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prestataires related */}
          <div>
            <h4 className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>Prestataires recommandés</h4>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {prestataires.filter((p) => p.category === category.id).map((p) => (
                <div key={p.id} className="shrink-0 bg-white rounded-xl border border-border p-3 w-48">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate" style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 9 }}>{p.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{p.rating}</span>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: 9 }}>({p.reviews} avis)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-2">
            <button
              onClick={() => { onDemande(); onClose(); }}
              className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: category.gradient, fontFamily: "Poppins", fontWeight: 800, fontSize: 13 }}
            >
              <Wrench className="w-4 h-4" /> Demander ce service
            </button>
            <button
              onClick={() => { navigate("/messagerie"); onClose(); }}
              className="px-4 py-3 rounded-xl border border-border"
            >
              <MessageSquare className="w-5 h-5 text-[#F97316]" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export function SavPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SavCategory | null>(null);
  const [showDemande, setShowDemande] = useState(false);
  const [filterCat, setFilterCat] = useState("tous");

  const tabs = [
    { key: "services" as const, label: "Services", icon: Wrench },
    { key: "prestataires" as const, label: "Prestataires", icon: Users },
    { key: "demandes" as const, label: "Mes demandes", icon: FileText },
  ];

  const filteredPrestataires = prestataires.filter((p) => {
    const matchCat = filterCat === "tous" || p.category === filterCat;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            Service Après-Vente
          </h3>
          <button
            onClick={() => setShowDemande(true)}
            className="px-3 py-1.5 bg-[#FF6A00] text-white rounded-xl flex items-center gap-1"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            <Wrench className="w-3.5 h-3.5" /> Demande
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={IMG.satisfied} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E11D2E]/90 via-[#E11D2E]/80 to-[#F97316]/70" />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)" }} />

        <div className="relative z-10 px-4 pt-6 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800 }}>
                <ShieldCheck className="w-3 h-3" /> SAV IPPOO
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800 }}>
                <Users className="w-3 h-3" /> {prestataires.length} PRESTATAIRES
              </div>
            </div>
            <h1 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px" }}>
              Vous n'êtes jamais seul<br />après l'achat
            </h1>
            <p className="text-white/80" style={{ fontSize: 12, lineHeight: 1.6 }}>
              Retouches textile, réparations, maintenance, services à domicile, IPPOO vous oriente vers la bonne solution avec des prestataires vérifiés.
            </p>

            {/* Stats */}
            <div className="flex gap-3 mt-4">
              {[
                { value: `${savCategories.length}`, label: "Catégories", icon: Wrench },
                { value: `${prestataires.length}+`, label: "Prestataires", icon: BadgeCheck },
                { value: "4.7", label: "Note moy.", icon: Star },
              ].map((s, i) => (
                <div key={i} className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                  <s.icon className="w-4 h-4 text-[#FBBF24] mx-auto mb-1" />
                  <p className="text-white" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16 }}>{s.value}</p>
                  <p className="text-white/60" style={{ fontSize: 9, fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[112px] z-30 bg-white border-b border-border px-4">
        <div className="flex gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #E11D2E, #F97316)" : "#F3F4F6",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "Poppins",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* ═══ SERVICES ═══ */}
        {activeTab === "services" && (
          <div className="space-y-4">
            {/* Value prop */}
            <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] rounded-2xl p-4 border border-[#E8A817]/20">
              <h4 className="flex items-center gap-2 mb-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <HeartHandshake className="w-5 h-5 text-[#E8A817]" /> Le SAV selon IPPOO
              </h4>
              <p className="text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.6 }}>
                Un point d'entrée simple et pratique pour trouver la bonne solution après achat : retouches, réparations, maintenance ou installation, avec des prestataires identifiés et une démarche rassurante.
              </p>
            </div>

            {/* Categories grid */}
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Nos services
            </h3>
            <div className="space-y-3">
              {savCategories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-0">
                    {/* Image */}
                    <div className="w-24 sm:w-28 shrink-0 relative overflow-hidden">
                      <img src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `${cat.color}30` }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                          <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{cat.name}</h4>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mb-2" style={{ fontSize: 10, lineHeight: "14px" }}>
                        {cat.description.slice(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: 9, fontWeight: 700, background: `${cat.color}10`, color: cat.color }}>
                          {cat.services.length} services
                        </span>
                        <span className="flex items-center gap-1 ml-auto" style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>
                          Voir détails <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-border p-4 mt-2">
              <h4 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Lightbulb className="w-5 h-5 text-[#E8A817]" /> Comment ça marche
              </h4>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Décrivez votre besoin", desc: "Produit, type de service, photos si nécessaire", color: "#E11D2E" },
                  { step: 2, title: "IPPOO vous oriente", desc: "Prestataire recommandé selon votre zone et votre besoin", color: "#F97316" },
                  { step: 3, title: "Le prestataire intervient", desc: "Devis transparent, intervention, suivi en temps réel", color: "#16A34A" },
                  { step: 4, title: "Vous validez et notez", desc: "Confirmez la bonne exécution et laissez un avis", color: "#3B82F6" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: item.color }}>
                      <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 12 }}>{item.step}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, #E11D2E, #F97316)" }}>
              <ShieldCheck className="w-10 h-10 text-white/80 mx-auto mb-3" />
              <h3 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 18 }}>
                Besoin d'un service après-vente ?
              </h3>
              <p className="text-white/70 mb-4" style={{ fontSize: 12 }}>
                IPPOO vous accompagne avec des prestataires vérifiés et une démarche simplifiée.
              </p>
              <button
                onClick={() => setShowDemande(true)}
                className="bg-white text-[#E11D2E] px-6 py-3 rounded-xl active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}
              >
                Faire une demande SAV
              </button>
            </div>

            <CouponStrip
              code="SAV10"
              label="SAV IPPOO"
              discount="-10% sur votre 1ère prestation"
              condition="Valable pour tout 1er service SAV via IPPOO"
              color="#E11D2E"
              expiry="Offre permanente"
            />
          </div>
        )}

        {/* ═══ PRESTATAIRES ═══ */}
        {activeTab === "prestataires" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un prestataire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] rounded-xl border-none"
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { key: "tous", label: "Tous" },
                ...savCategories.map((c) => ({ key: c.id, label: c.shortName })),
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFilterCat(cat.key)}
                  className="shrink-0 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: filterCat === cat.key ? "#E11D2E" : "#F3F4F6",
                    color: filterCat === cat.key ? "#fff" : "#6B7280",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Prestataires list */}
            <div className="space-y-3">
              {filteredPrestataires.map((prest, i) => (
                <motion.div
                  key={prest.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-border overflow-hidden"
                >
                  <div className="h-1" style={{ background: prest.color }} />
                  <div className="p-3.5">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                        <img src={prest.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="flex items-center gap-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                              {prest.name} <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                            </h4>
                            <p className="text-muted-foreground" style={{ fontSize: 10 }}>{prest.specialty}</p>
                          </div>
                          <span
                            className="shrink-0 px-2 py-0.5 rounded-full text-white"
                            style={{ fontSize: 8, fontWeight: 800, background: prest.badge === "TOP" ? "#E11D2E" : prest.badge === "VIP" ? "linear-gradient(135deg, #E8A817, #FBBF24)" : prest.badge === "PRO" ? "#3B82F6" : "#16A34A" }}
                          >
                            {prest.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#F0B429] text-[#F0B429]" />
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{prest.rating}</span>
                            <span className="text-muted-foreground" style={{ fontSize: 9 }}>({prest.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#F97316]" />
                            <span className="text-muted-foreground" style={{ fontSize: 10 }}>{prest.location}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            <div className="w-2 h-2 rounded-full" style={{ background: prest.available ? "#16A34A" : "#EF4444" }} />
                            <span style={{ fontSize: 9, fontWeight: 600, color: prest.available ? "#16A34A" : "#EF4444" }}>
                              {prest.available ? "Disponible" : "Indisponible"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowDemande(true)}
                        className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        style={{ background: prest.color, fontFamily: "Poppins", fontWeight: 700, fontSize: 12, opacity: prest.available ? 1 : 0.5 }}
                        disabled={!prest.available}
                      >
                        <Wrench className="w-4 h-4" /> Demander un service
                      </button>
                      <button
                        onClick={() => navigate("/messagerie")}
                        className="px-4 py-2.5 rounded-xl border border-border"
                      >
                        <MessageSquare className="w-4 h-4 text-[#F97316]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MES DEMANDES ═══ */}
        {activeTab === "demandes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
                Mes demandes SAV
              </h3>
              <button
                onClick={() => setShowDemande(true)}
                className="px-3 py-1.5 bg-[#FF6A00] text-white rounded-xl flex items-center gap-1"
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                <Wrench className="w-3.5 h-3.5" /> Nouvelle
              </button>
            </div>

            {savRequests.length > 0 ? (
              <div className="space-y-3">
                {savRequests.map((req, i) => {
                  const st = statusMap[req.status];
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="h-1" style={{ background: st.color }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{req.id}</h4>
                            <p className="text-muted-foreground" style={{ fontSize: 10 }}>{req.date}</p>
                          </div>
                          <span
                            className="shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1"
                            style={{ fontSize: 10, fontWeight: 700, color: st.color, background: `${st.color}15` }}
                          >
                            <st.icon className="w-3 h-3" /> {st.label}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Produit</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{req.product}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Service</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{req.type}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Prestataire</span>
                            <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
                              <BadgeCheck className="w-3 h-3 text-[#16A34A]" /> {req.prestataire}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Date prévue</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{req.eta}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {req.status === "en_cours" && (
                            <button
                              onClick={() => navigate("/messagerie")}
                              className="flex-1 py-2.5 rounded-xl border border-border flex items-center justify-center gap-2"
                              style={{ fontSize: 12, fontWeight: 600 }}
                            >
                              <MessageSquare className="w-4 h-4 text-[#F97316]" /> Contacter le prestataire
                            </button>
                          )}
                          {req.status === "termine" && (
                            <button
                              onClick={() => toast.success("Merci pour votre avis !")}
                              className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white flex items-center justify-center gap-2"
                              style={{ fontSize: 12, fontWeight: 700 }}
                            >
                              <ThumbsUp className="w-4 h-4" /> Laisser un avis
                            </button>
                          )}
                          {req.status === "planifie" && (
                            <button
                              onClick={() => toast.info("Rappel programmé pour le " + req.eta)}
                              className="flex-1 py-2.5 rounded-xl border border-border flex items-center justify-center gap-2"
                              style={{ fontSize: 12, fontWeight: 600 }}
                            >
                              <Calendar className="w-4 h-4 text-[#3B82F6]" /> Confirmer le RDV
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground" style={{ fontSize: 14 }}>Aucune demande SAV</p>
                <button
                  onClick={() => setShowDemande(true)}
                  className="mt-3 px-5 py-2.5 bg-[#FF6A00] text-white rounded-xl"
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  Faire une demande
                </button>
              </div>
            )}

            {/* Garanties */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <Shield className="w-5 h-5 text-[#E11D2E]" /> Garanties IPPOO SAV
              </h4>
              <div className="space-y-2">
                {[
                  "Prestataires vérifiés et notés par la communauté",
                  "Devis transparent avant toute intervention",
                  "Paiement sécurisé via IPPOO CASH",
                  "Suivi en temps réel de votre demande",
                  "Médiation IPPOO en cas de litige",
                  "Satisfaction garantie ou intervention reprise",
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#FFF7ED] rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedCategory && (
          <ServiceDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onDemande={() => setShowDemande(true)}
          />
        )}
        {showDemande && <DemandeSavModal onClose={() => setShowDemande(false)} />}
      </AnimatePresence>
    </div>
  );
}