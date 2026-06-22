import {
  Wrench, Scissors, Cog, Hammer, Car, Calendar, CheckCircle2,
  Clock, FileText, Star, Users, BadgeCheck,
} from "lucide-react";

/* ═══════════════════════════════════════════
   IMAGES
   ═══════════════════════════════════════════ */
export const IMG = {
  tailor: "https://images.unsplash.com/photo-1760630856713-ca747c098b48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwdGFpbG9yJTIwc2V3aW5nJTIwbWFjaGluZSUyMHRleHRpbGUlMjBhbHRlcmF0aW9uc3xlbnwxfHx8fDE3NzI5MzUxOTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  repair: "https://images.unsplash.com/photo-1679134015859-6281e4382065?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHJlcGFpciUyMHRlY2huaWNpYW4lMjB3b3Jrc2hvcCUyMEFmcmljYXxlbnwxfHx8fDE3NzI5MzUxOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  maintenance: "https://images.unsplash.com/photo-1758767355046-1986dda2d967?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWludGVuYW5jZSUyMHdvcmtlciUyMHRvb2xzJTIwZXF1aXBtZW50JTIwc2VydmljZXxlbnwxfHx8fDE3NzI5MzUxOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  support: "https://images.unsplash.com/photo-1758691462848-ba1e929da259?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjBzdXBwb3J0JTIwZGVzayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzI5MzUxOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  satisfied: "https://images.unsplash.com/photo-1575544344887-5af0ee295d97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tYW4lMjBoYXBweSUyMHNhdGlzZmllZCUyMHNob3BwaW5nJTIwZGVsaXZlcnl8ZW58MXx8fHwxNzcyOTM1MTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  plumber: "https://images.unsplash.com/photo-1618228298959-0198d476d2ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwZWxlY3RyaWNpYW4lMjBob21lJTIwcmVwYWlyJTIwYXJ0aXNhbnxlbnwxfHx8fDE3NzI5MzUyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  mechanic: "https://images.unsplash.com/photo-1526583038916-f138f908476b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBtZWNoYW5pYyUyMGF1dG8lMjByZXBhaXIlMjBnYXJhZ2UlMjBBZnJpY2F8ZW58MXx8fHwxNzcyOTM1MjAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ═══════════════════════════════════════════
   SAV CATEGORIES
   ═══════════════════════════════════════════ */
export interface SavCategory {
  id: string;
  name: string;
  shortName: string;
  icon: typeof Wrench;
  color: string;
  gradient: string;
  image: string;
  description: string;
  services: { name: string; desc: string; price: string; delay: string }[];
}

export const savCategories: SavCategory[] = [
  {
    id: "textile",
    name: "Retouches & Ajustements Textile",
    shortName: "Textile",
    icon: Scissors,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #F472B6)",
    image: IMG.tailor,
    description: "Pour vos achats textile, wax, bazin, prêt-à-porter, nous vous orientons vers des couturiers et retoucheurs vérifiés, afin que votre article tombe bien, dure plus longtemps et corresponde exactement à vos attentes.",
    services: [
      { name: "Retouche simple", desc: "Ourlet, ajustement taille, raccourcissement", price: "1 500 - 5 000 FCFA", delay: "24-48h" },
      { name: "Retouche complexe", desc: "Transformation, ajout poches, modification coupe", price: "5 000 - 15 000 FCFA", delay: "48-72h" },
      { name: "Couture sur mesure", desc: "Confection complète à partir de tissu acheté", price: "8 000 - 35 000 FCFA", delay: "3-7 jours" },
      { name: "Broderie & Personnalisation", desc: "Broderie, marquage, décorations sur commande", price: "3 000 - 12 000 FCFA", delay: "2-5 jours" },
    ],
  },
  {
    id: "reparation",
    name: "Réparation & Remplacement",
    shortName: "Réparation",
    icon: Wrench,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
    image: IMG.repair,
    description: "Pour vos biens de consommation et équipements du quotidien, électronique, électroménager, outillage, nous vous guidons vers des réparateurs fiables, des pièces de rechange authentiques et des prestataires capables d'intervenir correctement.",
    services: [
      { name: "Diagnostic gratuit", desc: "Évaluation de la panne ou du défaut, devis transparent", price: "Gratuit", delay: "Immédiat" },
      { name: "Réparation standard", desc: "Écran, batterie, connecteur, composant courant", price: "5 000 - 25 000 FCFA", delay: "1-3 jours" },
      { name: "Remplacement de pièce", desc: "Pièce détachée certifiée + main-d'œuvre", price: "8 000 - 50 000 FCFA", delay: "2-5 jours" },
      { name: "Échange standard", desc: "Remplacement de l'article si réparation impossible", price: "Selon article", delay: "3-7 jours" },
    ],
  },
  {
    id: "technique",
    name: "Prestations Techniques & Maintenance",
    shortName: "Technique",
    icon: Cog,
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #FB923C)",
    image: IMG.maintenance,
    description: "Pour vos besoins plus techniques, maintenance d'équipements, entretiens suivis, installations, IPPOO vous oriente vers des professionnels qualifiés afin de prolonger la durée de vie de vos achats et de mieux rentabiliser votre dépense.",
    services: [
      { name: "Maintenance préventive", desc: "Entretien planifié, nettoyage, contrôle régulier", price: "10 000 - 30 000 FCFA", delay: "Sur RDV" },
      { name: "Installation & Mise en service", desc: "Pose, raccordement, paramétrage, test de bon fonctionnement", price: "15 000 - 45 000 FCFA", delay: "24-72h" },
      { name: "Contrat d'entretien", desc: "Suivi trimestriel ou semestriel, interventions incluses", price: "À partir de 25 000 FCFA/trim.", delay: "Planifié" },
      { name: "Intervention urgente", desc: "Dépannage rapide, panne critique, situation bloquante", price: "20 000 - 60 000 FCFA", delay: "4-12h" },
    ],
  },
  {
    id: "auto",
    name: "Services Auto & Mécanique",
    shortName: "Auto",
    icon: Car,
    color: "#7C3AED",
    gradient: "linear-gradient(135deg, #7C3AED, #A78BFA)",
    image: IMG.mechanic,
    description: "Pour vos achats de pièces auto, accessoires ou équipements de transport, nous vous connectons à des mécaniciens, électriciens auto et carrossiers de confiance pour une pose et un suivi professionnels.",
    services: [
      { name: "Montage pièces", desc: "Pose de pièces achetées sur IPPOO (freins, filtres, batterie...)", price: "5 000 - 30 000 FCFA", delay: "1-4h" },
      { name: "Diagnostic mécanique", desc: "Bilan complet véhicule, identification des pannes", price: "10 000 - 20 000 FCFA", delay: "1-2h" },
      { name: "Entretien périodique", desc: "Vidange, contrôle niveaux, filtres, rotation pneus", price: "15 000 - 40 000 FCFA", delay: "2-4h" },
      { name: "Électricité auto", desc: "Câblage, alternateur, démarreur, éclairage", price: "10 000 - 50 000 FCFA", delay: "2-8h" },
    ],
  },
  {
    id: "domicile",
    name: "Services à Domicile",
    shortName: "Domicile",
    icon: Hammer,
    color: "#16A34A",
    gradient: "linear-gradient(135deg, #16A34A, #22C55E)",
    image: IMG.plumber,
    description: "Pour les achats liés à l'habitat, plomberie, électricité, menuiserie, peinture, IPPOO vous met en relation avec des artisans locaux qualifiés pour la pose, l'installation et la finition.",
    services: [
      { name: "Plomberie", desc: "Installation, réparation, raccordement sanitaire", price: "10 000 - 40 000 FCFA", delay: "24-48h" },
      { name: "Électricité", desc: "Installation, dépannage, mise aux normes", price: "8 000 - 35 000 FCFA", delay: "24-48h" },
      { name: "Menuiserie", desc: "Montage meubles, étagères, aménagements", price: "10 000 - 50 000 FCFA", delay: "1-3 jours" },
      { name: "Peinture & Finition", desc: "Application, préparation murs, finitions décoratives", price: "15 000 - 60 000 FCFA", delay: "1-5 jours" },
    ],
  },
];

/* ═══════════════════════════════════════════
   MOCK PRESTATAIRES
   ═══════════════════════════════════════════ */
export const prestataires = [
  { id: 1, name: "Couture Express Dantokpa", specialty: "Retouches textile", category: "textile", location: "Cotonou", rating: 4.8, reviews: 245, badge: "TOP", color: "#EC4899", image: IMG.tailor, available: true },
  { id: 2, name: "TechFix Bénin", specialty: "Réparation électronique", category: "reparation", location: "Cotonou", rating: 4.7, reviews: 189, badge: "VÉRIFIÉ", color: "#3B82F6", image: IMG.repair, available: true },
  { id: 3, name: "MaintenPro SARL", specialty: "Maintenance industrielle", category: "technique", location: "Cotonou", rating: 4.6, reviews: 134, badge: "PRO", color: "#F97316", image: IMG.maintenance, available: true },
  { id: 4, name: "AutoStar Garage", specialty: "Mécanique générale", category: "auto", location: "Porto-Novo", rating: 4.5, reviews: 98, badge: "VÉRIFIÉ", color: "#7C3AED", image: IMG.mechanic, available: false },
  { id: 5, name: "BricoPro Services", specialty: "Multi-corps de métier", category: "domicile", location: "Cotonou", rating: 4.9, reviews: 312, badge: "TOP", color: "#16A34A", image: IMG.plumber, available: true },
  { id: 6, name: "Mama Couture VIP", specialty: "Couture sur mesure", category: "textile", location: "Porto-Novo", rating: 4.8, reviews: 167, badge: "VIP", color: "#EC4899", image: IMG.tailor, available: true },
  { id: 7, name: "SmartRepair Mobile", specialty: "Réparation smartphones", category: "reparation", location: "Parakou", rating: 4.4, reviews: 78, badge: "VÉRIFIÉ", color: "#3B82F6", image: IMG.repair, available: true },
  { id: 8, name: "ElecDom Bénin", specialty: "Électricité domicile", category: "domicile", location: "Cotonou", rating: 4.7, reviews: 203, badge: "PRO", color: "#16A34A", image: IMG.plumber, available: true },
];

/* ═══════════════════════════════════════════
   MOCK SAV REQUESTS
   ═══════════════════════════════════════════ */
// Aucune demande SAV pré-existante pour un nouveau compte.
export const savRequests: Array<{
  id: string; product: string; type: string;
  status: "en_cours" | "termine" | "planifie";
  prestataire: string; date: string; eta: string;
}> = [];

export const statusMap = {
  en_cours: { label: "En cours", color: "#F97316", icon: Clock },
  termine: { label: "Terminé", color: "#16A34A", icon: CheckCircle2 },
  planifie: { label: "Planifié", color: "#3B82F6", icon: Calendar },
};
