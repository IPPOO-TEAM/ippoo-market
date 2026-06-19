/* ═══════════════════════════════════════════
   IPPOO Market — Classification des activités
   Structure : Secteur → Sous-secteur → Niches (métiers).
   Utilisé par le formulaire d'inscription pour le sélecteur cascadant
   Secteur → Sous-secteur → Niche.
   ═══════════════════════════════════════════ */

export type Subsector = {
  id: string;
  label: string;
  niches: string[];
};

export type Sector = {
  id: "primaire" | "secondaire" | "tertiaire";
  label: string;
  icon: string;
  description: string;
  subsectors: Subsector[];
};

export const SECTORS: Sector[] = [
  {
    id: "primaire",
    label: "Secteur Primaire",
    icon: "🌾",
    description: "Agriculture, élevage, pêche, exploitation des ressources naturelles",
    subsectors: [
      {
        id: "cultures-vivrieres",
        label: "Cultures vivrières",
        niches: [
          "Cultivateur de maïs",
          "Cultivateur de riz",
          "Cultivateur de sorgho",
          "Cultivateur de mil",
          "Cultivateur de niébé",
          "Cultivateur de soja",
          "Cultivateur d'arachide",
          "Producteur de manioc",
          "Producteur d'igname",
          "Producteur de patate douce",
          "Producteur de taro",
          "Producteur de banane plantain",
          "Jardinier vivrier",
          "Producteur de légumes locaux",
        ],
      },
      {
        id: "maraichage",
        label: "Maraîchage",
        niches: [
          "Producteur de tomate",
          "Producteur de piment",
          "Producteur de poivron",
          "Producteur d'oignon",
          "Producteur d'ail",
          "Producteur de laitue",
          "Producteur de concombre",
          "Producteur de choux",
          "Producteur de carotte",
          "Producteur d'aubergine africaine",
          "Producteur de feuilles (gboma, amarante, basilic, menthe)",
        ],
      },
      {
        id: "fruits",
        label: "Fruits",
        niches: [
          "Producteur d'ananas",
          "Producteur de mangue",
          "Producteur d'orange",
          "Producteur de citron",
          "Producteur de goyave",
          "Producteur de papaye",
          "Producteur de pastèque",
          "Producteur de banane douce",
          "Producteur de noix de coco",
        ],
      },
      {
        id: "cultures-industrielles",
        label: "Cultures industrielles",
        niches: [
          "Producteur de coton",
          "Producteur de noix de cajou",
          "Producteur de palmier à huile",
          "Producteur de cacao",
          "Producteur de café",
          "Producteur de tabac",
          "Producteur de soja industriel",
        ],
      },
      {
        id: "elevage-traditionnel",
        label: "Élevage traditionnel",
        niches: [
          "Éleveur bovin",
          "Éleveur ovin",
          "Éleveur caprin",
          "Éleveur porcin",
          "Éleveur de chevaux",
          "Éleveur d'ânes",
        ],
      },
      {
        id: "aviculture",
        label: "Aviculture",
        niches: [
          "Éleveur poulets de chair",
          "Éleveur pondeuses",
          "Éleveur pintades",
          "Éleveur cailles",
          "Éleveur canards",
          "Éleveur dindons",
          "Producteur d'œufs",
        ],
      },
      {
        id: "autres-elevages",
        label: "Autres élevages",
        niches: [
          "Apiculteur",
          "Héliciculteur (escargots)",
          "Cuniculture (lapins)",
          "Éleveur de poissons (aquaculture)",
        ],
      },
      {
        id: "peche",
        label: "Pêche",
        niches: [
          "Pêcheur artisanal",
          "Pêcheur lagunaire",
          "Pêcheur de rivière",
          "Pêcheur maritime (barques)",
          "Poseur de nasses",
          "Fabricant de filets",
          "Mareyeur",
          "Fumeur de poisson",
          "Sécheur de poisson",
          "Vendeur de poisson frais",
          "Vendeur de crustacés",
          "Producteur d'écrevisses",
        ],
      },
      {
        id: "ressources-naturelles",
        label: "Ressources naturelles",
        niches: [
          "Charbonnier (fabrication charbon de bois)",
          "Collecteur de bois de chauffe",
          "Exploitant de sable",
          "Exploitant de latérite",
          "Exploitant de gravier",
          "Cueilleur de plantes médicinales",
          "Collecteur de feuilles (palme, rônier)",
          "Exploitant de fibres naturelles (raphia, bambou)",
          "Producteur d'argile",
        ],
      },
    ],
  },
  {
    id: "secondaire",
    label: "Secteur Secondaire",
    icon: "🏭",
    description: "Transformation, artisanat, fabrication, industrie",
    subsectors: [
      {
        id: "transfo-manioc",
        label: "Produits du manioc",
        niches: [
          "Transformateur de gari",
          "Transformateur de tapioca",
          "Transformateur de cossettes",
          "Producteur d'attiéké",
          "Vente de pâte de manioc",
        ],
      },
      {
        id: "transfo-cereales",
        label: "Produits céréaliers",
        niches: [
          "Meunier",
          "Transformateur de farine de maïs",
          "Transformateur de farine de riz",
          "Fabricant de akassa / pâte",
          "Fabricant de bouillies locales",
        ],
      },
      {
        id: "huiles",
        label: "Huiles",
        niches: [
          "Producteur d'huile rouge",
          "Producteur d'huile palmiste",
          "Producteur d'huile d'arachide",
          "Producteur d'huile de soja",
        ],
      },
      {
        id: "produits-animaux",
        label: "Produits animaux",
        niches: [
          "Boucherie artisanale",
          "Abattage informel",
          "Charcutier traditionnel",
        ],
      },
      {
        id: "produits-laitiers",
        label: "Produits laitiers",
        niches: [
          "Producteur de fromage peulh",
          "Producteur de yaourt artisanal",
          "Producteur de lait caillé",
        ],
      },
      {
        id: "produits-sucres",
        label: "Produits sucrés & boissons",
        niches: [
          "Fabricant de jus locaux (gingembre, bissap, zobo)",
          "Fabricant de sirops",
          "Fabricant de confitures",
        ],
      },
      {
        id: "boulangerie",
        label: "Boulangerie / Pâtisserie",
        niches: [
          "Boulanger traditionnel",
          "Fabricant de beignets",
          "Fabricant de gâteaux locaux",
          "Fabricant de galettes",
        ],
      },
      {
        id: "metal",
        label: "Métal & Mécanique",
        niches: [
          "Soudeur",
          "Métallier",
          "Forgeron",
          "Fabricant de portails",
          "Fabricant d'outils agricoles",
          "Réparateur auto",
          "Réparateur moto",
          "Réparateur de vélos",
          "Bobineur",
          "Tôlier",
        ],
      },
      {
        id: "bois",
        label: "Bois & Menuiserie",
        niches: [
          "Menuisier bois",
          "Charpentier",
          "Fabricant de meubles",
          "Fabricant de lits",
          "Fabricant de tables",
          "Fabricant de portes",
        ],
      },
      {
        id: "textile",
        label: "Textile & Mode",
        niches: [
          "Couturier",
          "Styliste",
          "Brodeur",
          "Tisserand",
          "Fabricant de pagnes tissés",
          "Fabricant de sacs artisanaux",
          "Fabricant de sandales en pagne",
          "Teinturière / batik",
        ],
      },
      {
        id: "cuir",
        label: "Cuir & Accessoires",
        niches: [
          "Cordonnier",
          "Fabricant de chaussures",
          "Fabricant de ceintures",
          "Fabricant de sacs en cuir",
        ],
      },
      {
        id: "cosmetique",
        label: "Cosmétique & Hygiène",
        niches: [
          "Savonnier (savon noir, savon de toilette)",
          "Fabricant d'huiles naturelles (coco, karité, neem)",
          "Fabricant de pommades naturelles",
          "Fabricant de parfums artisanaux",
        ],
      },
      {
        id: "materiaux",
        label: "Matériaux de construction",
        niches: [
          "Fabricant de briques en terre",
          "Fabricant de briques ciment",
          "Fabricant de carreaux artisanaux",
          "Fabricant de peintures locales",
        ],
      },
      {
        id: "artisanat",
        label: "Artisanat divers",
        niches: [
          "Sculpteur",
          "Peintre sur toile",
          "Fabricant de bijoux",
          "Fabricant d'objets décoratifs",
          "Fabricant d'ustensiles traditionnels",
          "Fabricant de balais",
          "Fabricant de paniers",
        ],
      },
    ],
  },
  {
    id: "tertiaire",
    label: "Secteur Tertiaire",
    icon: "🛒",
    description: "Commerce, distribution, logistique et services",
    subsectors: [
      {
        id: "grossiste-alim",
        label: "Distribution alimentaire",
        niches: [
          "Grossiste céréales",
          "Semi-grossiste céréales",
          "Grossiste tubercules",
          "Grossiste volailles",
          "Grossiste poissons",
          "Dépôt d'œufs",
          "Dépôt de boissons",
          "Dépôt d'eau minérale",
          "Grossiste jus",
          "Grossiste fruits et légumes",
        ],
      },
      {
        id: "grossiste-non-alim",
        label: "Distribution non alimentaire",
        niches: [
          "Grossiste produits cosmétiques",
          "Grossiste produits ménagers",
          "Grossiste chaussures",
          "Grossiste vêtements",
          "Grossiste sacs",
          "Grossiste pièces détachées moto",
          "Grossiste pièces détachées auto",
          "Grossiste matériaux de construction",
        ],
      },
      {
        id: "commerce-alim",
        label: "Commerce alimentaire (détail)",
        niches: [
          "Revendeur vivriers",
          "Revendeur légumes frais",
          "Revendeur poissons frais",
          "Revendeur poissons fumés",
          "Revendeur viandes",
          "Revendeur volailles",
          "Revendeur épices",
          "Revendeur huiles alimentaires",
          "Revendeur pains",
          "Revendeur boissons",
          "Marchande de beignets",
          "Marchande de bouillies",
          "Marchande de fruits",
        ],
      },
      {
        id: "commerce-non-alim",
        label: "Commerce non alimentaire (détail)",
        niches: [
          "Vendeur de vêtements",
          "Vendeur de friperie",
          "Vendeur d'articles pour bébés",
          "Vendeur de sacs",
          "Vendeur de téléphones",
          "Vendeur de coques & accessoires",
          "Vendeur d'appareils électroménagers",
          "Vendeur d'ustensiles de cuisine",
          "Vendeur de meubles d'occasion",
          "Vendeur de tapis",
          "Vendeur de chaussures",
        ],
      },
      {
        id: "transport",
        label: "Transport & Logistique",
        niches: [
          "Conducteur de taxi-moto",
          "Conducteur taxi tricycle",
          "Conducteur taxi-bus",
          "Transporteur de marchandises",
          "Transporteur à tricycle cargo",
        ],
      },
      {
        id: "services-perso",
        label: "Services personnels",
        niches: [
          "Coiffeuse",
          "Coiffeur",
          "Tresseuse",
          "Esthéticienne",
          "Maquilleuse",
          "Barbier",
          "Lavandière",
        ],
      },
      {
        id: "reparation",
        label: "Réparation & Maintenance",
        niches: [
          "Réparateur téléphone",
          "Réparateur ordinateurs",
          "Réparateur électroménagers",
          "Réparateur télévision",
          "Réparateur ventilateurs",
          "Réparateur groupes électrogènes",
          "Réparateur panneaux solaires",
        ],
      },
      {
        id: "restauration",
        label: "Restauration & Boissons",
        niches: [
          "Restauratrice de rue",
          "Vendeur de grillades",
          "Vendeur de brochettes",
          "Vendeur de sandwichs",
          "Vendeur de café / thé",
          "Gérant de maquis",
          "Gérant de bar local",
        ],
      },
      {
        id: "services-divers",
        label: "Services divers",
        niches: [
          "Photographe",
          "Vidéaste",
          "Imprimeur de rue",
          "Agent de nettoyage",
          "Agent de gardiennage",
          "Laveur de vitres",
          "Laveur de motos",
          "Laveur de voitures",
          "Dépanneur rapide",
          "Changeur de monnaie",
        ],
      },
    ],
  },
];

export type CircuitId = "producteur" | "transformateur" | "distributeur" | "revendeur";

export type Circuit = {
  id: CircuitId;
  label: string;
  description: string;
  icon: string;
};

export const CIRCUITS: Circuit[] = [
  { id: "producteur",     label: "Producteur",          description: "Agriculture, élevage, pêche, coopératives", icon: "🌿" },
  { id: "transformateur", label: "Transformateur",      description: "Agro-transformation, artisanat, industrie", icon: "🏭" },
  { id: "distributeur",   label: "Distributeur",        description: "Grossiste, semi-grossiste, importateur",    icon: "🚚" },
  { id: "revendeur",      label: "Revendeur / Commerçant", description: "Boutique, supermarché, e-commerce",      icon: "🛒" },
];

export type JuridicalForm =
  | "individuelle"
  | "ei"
  | "sarl"
  | "sa"
  | "cooperative"
  | "association"
  | "gie"
  | "autre";

export const JURIDICAL_FORMS: { id: JuridicalForm; label: string }[] = [
  { id: "individuelle", label: "Entreprise individuelle (personne physique)" },
  { id: "ei",           label: "EI / Auto-entrepreneur" },
  { id: "sarl",         label: "SARL" },
  { id: "sa",           label: "SA" },
  { id: "cooperative",  label: "Coopérative" },
  { id: "association",  label: "Association" },
  { id: "gie",          label: "GIE (Groupement d'Intérêt Économique)" },
  { id: "autre",        label: "Autre" },
];

export function getSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id);
}

export function getSubsectors(sectorId: string): Subsector[] {
  return getSector(sectorId)?.subsectors ?? [];
}

export function getNiches(sectorId: string, subsectorId: string): string[] {
  return getSubsectors(sectorId).find((s) => s.id === subsectorId)?.niches ?? [];
}
