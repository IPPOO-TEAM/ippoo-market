import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  ShieldCheck,
  Truck,
  Package,
  CreditCard,
  Star,
  Users,
  Store,
  Gift,
  Shield,
  Clock,
  CheckCircle2,
  Globe,
  BookOpen,
  Headphones,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { BottomSheet } from "../native/BottomSheet";

/* ═══════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════ */
interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FaqItem[] = [
  {
    category: "Acheter",
    question: "Comment acheter en gros sur IPPOO ?",
    answer: "Sur IPPOO, vous explorez le catalogue par catégorie ou via la recherche. Chaque fiche produit affiche le prix unitaire, le prix par palier, le minimum de commande (MOQ), les conditions de livraison et le vendeur. Ajoutez au panier, validez et payez via IPPOO CASH ou Mobile Money. Votre commande est sécurisée par le paiement protégé IPPOO.",
  },
  {
    category: "Acheter",
    question: "Comment fonctionne le paiement protégé ?",
    answer: "Le paiement protégé protège acheteurs et vendeurs. Quand vous payez, les fonds sont sécurisés sur IPPOO CASH. Le vendeur est notifié et prépare la commande. Les fonds ne sont libérés au vendeur qu'après votre confirmation de réception. En cas de litige, IPPOO intervient comme médiateur.",
  },
  {
    category: "Acheter",
    question: "Comment suivre ma livraison ?",
    answer: "Depuis 'Mes Commandes', cliquez sur votre commande pour voir le suivi en temps réel. Vous recevez des notifications à chaque étape : préparation, expédition, en route, livré. Vous pouvez aussi contacter le vendeur directement via la messagerie intégrée.",
  },
  {
    category: "Acheter",
    question: "Quels sont les modes de livraison ?",
    answer: "IPPOO propose 3 modes : livraison standard (3-5 jours), livraison express (24-48h, supplément), et retrait en hub IPPOO (gratuit). Les zones couvertes et tarifs dépendent du vendeur et de votre localisation. Tout est affiché avant validation.",
  },
  {
    category: "Acheter",
    question: "Comment demander un remboursement ?",
    answer: "Si le produit reçu ne correspond pas à la commande (qualité, quantité, état), vous avez 48h pour ouvrir un litige depuis 'Mes Commandes'. Joignez des photos. IPPOO examine le dossier et peut ordonner un remboursement total ou partiel via IPPOO CASH. Les fonds n'étant pas encore libérés, la protection est maximale.",
  },
  {
    category: "Vendre",
    question: "Comment ouvrir une boutique vendeur ?",
    answer: "Allez sur 'Devenir Vendeur', remplissez votre profil (nom, activité, localisation, pièces justificatives), ajoutez vos premiers produits avec photos, prix et conditions. Après vérification (24-72h), votre boutique est active. Vous pouvez gérer vos produits, commandes et revenus depuis votre tableau de bord vendeur.",
  },
  {
    category: "Vendre",
    question: "Quelles commissions prend IPPOO ?",
    answer: "IPPOO prélève une commission de 3 à 8% selon la catégorie et le volume. Les vendeurs VIP bénéficient de taux réduits. Les frais sont transparents et affichés avant chaque transaction. Il n'y a pas de frais d'inscription ni d'abonnement mensuel.",
  },
  {
    category: "Vendre",
    question: "Comment recevoir mes paiements ?",
    answer: "Vos ventes sont créditées sur votre IPPOO CASH après confirmation de réception par l'acheteur. Vous pouvez retirer vers Mobile Money (MTN, Moov) ou compte bancaire. Les retraits sont traités sous 24-48h. Le solde minimum de retrait est de 5 000 FCFA.",
  },
  {
    category: "IPPOO CASH",
    question: "Comment recharger mon IPPOO CASH ?",
    answer: "Depuis 'IPPOO CASH', cliquez 'Recharger' et choisissez : Mobile Money (MTN MoMo, Moov Money), virement bancaire, ou dépôt en point relais. Les rechargements Mobile Money sont instantanés. Le virement bancaire prend 24-48h.",
  },
  {
    category: "IPPOO CASH",
    question: "Comment fonctionne le programme VIP ?",
    answer: "Le programme VIP récompense votre fidélité. Bronze (0-500k FCFA/mois) : cashback 1%. Argent (500k-2M) : cashback 2% + livraison prioritaire. Or (2M+) : cashback 3% + support dédié + offres exclusives. Votre statut se met à jour automatiquement.",
  },
  {
    category: "Communautés",
    question: "Comment rejoindre un groupement d'achat ?",
    answer: "Allez sur 'Communautés', parcourez les groupements actifs, et cliquez 'Rejoindre'. Le leader du groupement valide votre adhésion. Vous pouvez ensuite participer aux achats groupés, bénéficier des prix négociés et suivre les commandes du groupe.",
  },
  {
    category: "Communautés",
    question: "Comment créer mon propre groupement ?",
    answer: "Depuis 'Communautés' > 'Créer', définissez le nom, la catégorie et la zone géographique de votre groupement. Invitez des membres par lien ou QR code. Lancez votre premier achat groupé en fixant produit, quantité cible, délai et conditions. IPPOO gère la collecte et la coordination.",
  },
  {
    category: "Sécurité",
    question: "Mes données personnelles sont-elles protégées ?",
    answer: "IPPOO respecte la réglementation sur la protection des données. Vos informations personnelles ne sont jamais partagées avec des tiers sans votre consentement. Les paiements sont chiffrés et sécurisés. L'authentification à deux facteurs est disponible pour votre compte.",
  },
  {
    category: "Sécurité",
    question: "Comment signaler un vendeur ou un problème ?",
    answer: "Depuis la fiche vendeur ou la page commande, utilisez le bouton 'Signaler'. Décrivez le problème et joignez des preuves (photos, screenshots). L'équipe IPPOO examine sous 24h et prend les mesures nécessaires : avertissement, suspension ou remboursement.",
  },
];

const faqCategories = ["Tout", "Acheter", "Vendre", "IPPOO CASH", "Communautés", "Sécurité"];

/* ═══════════════════════════════════════════
   GUIDES DATA
   ═══════════════════════════════════════════ */
const guides = [
  { title: "Guide de l'acheteur", desc: "Tout savoir pour bien acheter en gros", icon: Package, color: "#E11D2E" },
  { title: "Guide du vendeur", desc: "Ouvrir et gérer sa boutique IPPOO", icon: Store, color: "#E8A817" },
  { title: "Guide IPPOO CASH", desc: "Recharger, payer, retirer en toute sécurité", icon: CreditCard, color: "#16A34A" },
  { title: "Guide des Communautés", desc: "Créer et gérer un groupement d'achat", icon: Users, color: "#3B82F6" },
  { title: "Guide de la livraison", desc: "Modes, suivi et retrait en hub", icon: Truck, color: "#F97316" },
  { title: "Guide de sécurité", desc: "Paiement protégé, signalement et protection", icon: Shield, color: "#7C3AED" },
];

/* ═══════════════════════════════════════════
   LEGAL DOCS
   ═══════════════════════════════════════════ */
const legalDocs = [
  "Conditions générales d'utilisation (CGU)",
  "Conditions générales de vente (CGV)",
  "Politique de confidentialité",
  "Politique retours & remboursements",
  "Politique KYC/KYB",
  "Charte qualité vendeurs",
];

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export function AidePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"faq" | "guides" | "contact" | "legal">("faq");
  const [showTicketForm, setShowTicketForm] = useState(false);

  const filteredFaq = faqData.filter((f) => {
    const matchCat = activeCategory === "Tout" || f.category === activeCategory;
    const matchSearch = !searchQuery || f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const tabs = [
    { key: "faq" as const, label: "FAQ", icon: HelpCircle },
    { key: "guides" as const, label: "Guides", icon: BookOpen },
    { key: "contact" as const, label: "Contact", icon: Headphones },
    { key: "legal" as const, label: "Légal", icon: FileText },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
          Aide & Support
        </h3>
      </div>

      {/* Hero */}
      <div className="px-4 py-6" style={{ background: "linear-gradient(135deg, #16A34A, #059669)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <HelpCircle className="w-10 h-10 text-white/80 mx-auto mb-2" />
          <h2 className="text-white mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20 }}>
            Comment pouvons-nous vous aider ?
          </h2>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-none"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[112px] z-30 bg-white border-b border-border px-4">
        <div className="flex gap-1 py-2 max-w-5xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #16A34A, #059669)" : "#F3F4F6",
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
        {/* ═══ FAQ ═══ */}
        {activeTab === "faq" && (
          <div className="space-y-4">
            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="shrink-0 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: activeCategory === cat ? "#16A34A" : "#F3F4F6",
                    color: activeCategory === cat ? "#fff" : "#6B7280",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ items */}
            <div className="space-y-2">
              {filteredFaq.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#16A34A15" }}>
                      <HelpCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{faq.question}</p>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>{faq.category}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 ml-9">
                          <div className="bg-[#F0FDF4] rounded-xl p-3">
                            <p className="text-[#374151]" style={{ fontSize: 12, lineHeight: 1.7 }}>
                              {faq.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-muted-foreground" style={{ fontSize: 10 }}>Cette réponse vous a aidé ?</span>
                            <button
                              onClick={() => toast.success("Merci pour votre retour !")}
                              className="px-2 py-0.5 rounded-lg bg-[#16A34A]/10 text-[#16A34A]"
                              style={{ fontSize: 10, fontWeight: 600 }}
                            >
                              👍 Oui
                            </button>
                            <button
                              onClick={() => setShowTicketForm(true)}
                              className="px-2 py-0.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444]"
                              style={{ fontSize: 10, fontWeight: 600 }}
                            >
                              👎 Non
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {filteredFaq.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>Aucun résultat pour "{searchQuery}"</p>
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#16A34A] text-white"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  Contacter le support
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ GUIDES ═══ */}
        {activeTab === "guides" && (
          <div className="space-y-3">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Guides & Tutoriels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guides.map((guide, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => toast.success(`Ouverture du ${guide.title}...`)}
                  className="bg-white rounded-2xl border border-border p-4 cursor-pointer active:scale-[0.98] transition-transform flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${guide.color}15` }}>
                    <guide.icon className="w-6 h-6" style={{ color: guide.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>{guide.title}</h4>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{guide.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.div>
              ))}
            </div>

            {/* Video tutorials placeholder */}
            <div className="bg-gradient-to-r from-[#16A34A] to-[#059669] rounded-2xl p-5 text-center mt-4">
              <BookOpen className="w-10 h-10 text-white/80 mx-auto mb-2" />
              <h4 className="text-white mb-1" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
                Tutos vidéo IPPOO
              </h4>
              <p className="text-white/70 mb-3" style={{ fontSize: 12 }}>
                Apprenez en regardant nos vidéos pas à pas
              </p>
              <button
                onClick={() => toast.success("Chaîne vidéo IPPOO bientôt disponible !")}
                className="bg-white text-[#16A34A] px-5 py-2.5 rounded-xl"
                style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
              >
                Voir les vidéos
              </button>
            </div>
          </div>
        )}

        {/* ═══ CONTACT ═══ */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Contactez-nous
            </h3>

            {/* Quick contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Phone, label: "Appeler le support", desc: "+229 97 XX XX XX", action: "Lun-Sam 8h-20h", color: "#16A34A" },
                { icon: Mail, label: "Email support", desc: "support@ippoo.market", action: "Réponse sous 24h", color: "#3B82F6" },
                { icon: MessageSquare, label: "Chat en direct", desc: "Assistance immédiate", action: "En ligne maintenant", color: "#E11D2E" },
              ].map((contact, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    if (contact.label === "Chat en direct") navigate("/messagerie");
                    else toast.success(`${contact.label} : ${contact.desc}`);
                  }}
                  className="bg-white rounded-2xl border border-border p-4 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${contact.color}15` }}>
                    <contact.icon className="w-5 h-5" style={{ color: contact.color }} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700 }}>{contact.label}</h4>
                  <p style={{ fontSize: 12, fontWeight: 500 }}>{contact.desc}</p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1" style={{ fontSize: 10 }}>
                    <Clock className="w-3 h-3" /> {contact.action}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Ticket form */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
                <AlertTriangle className="w-5 h-5 text-[#F97316]" /> Ouvrir un ticket de support
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Sujet</label>
                  <select className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1" style={{ fontSize: 13 }}>
                    <option>Problème de commande</option>
                    <option>Problème de paiement</option>
                    <option>Problème de livraison</option>
                    <option>Signaler un vendeur</option>
                    <option>Demande de remboursement</option>
                    <option>Problème technique</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>N° de commande (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex : CMD-2026-001"
                    className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>Description</label>
                  <textarea
                    placeholder="Décrivez votre problème en détail..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none mt-1 resize-none"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <button
                  onClick={() => toast.success("Ticket #TKT-2026-047 créé ! Réponse sous 24h.")}
                  className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-[#16A34A] to-[#059669] flex items-center justify-center gap-2"
                  style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Envoyer le ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ LEGAL ═══ */}
        {activeTab === "legal" && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Documents légaux
            </h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {legalDocs.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => toast.success(`Ouverture de : ${doc}`)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F9F5F0] transition-colors border-b border-[#F3F4F6] last:border-b-0"
                >
                  <FileText className="w-5 h-5 text-[#16A34A] shrink-0" />
                  <span className="flex-1" style={{ fontSize: 13, fontWeight: 500 }}>{doc}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>

            {/* App info */}
            <div className="bg-[#F9F5F0] rounded-2xl p-4 text-center">
              <Globe className="w-8 h-8 text-[#E8A817] mx-auto mb-2" />
              <h4 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>IPPOO Market</h4>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>Version 2.1.0 · Mars 2026</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: 10 }}>
                © 2026 IPPOO Market. Tous droits réservés.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomSheet
        open={showTicketForm}
        onClose={() => setShowTicketForm(false)}
        title="Besoin d'aide supplémentaire ?"
        snapPoints={[0.55, 0.9]}
      >
        <div className="space-y-3">
          <textarea
            placeholder="Décrivez votre question ou problème..."
            rows={5}
            className="w-full px-3 py-2.5 bg-[#F3F4F6] rounded-xl border-none resize-none"
            style={{ fontSize: 13 }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowTicketForm(false)}
              className="px-6 py-3 rounded-xl border border-border press-feedback"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              Annuler
            </button>
            <button
              onClick={() => { toast.success("Message envoyé au support !"); setShowTicketForm(false); }}
              data-haptic="success"
              className="flex-1 py-3 rounded-xl text-white bg-[#16A34A] press-feedback"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              Envoyer
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}