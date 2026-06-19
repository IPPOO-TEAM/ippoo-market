// Taxonomie complète IPPOO Market - 20 méga-catégories, sous-catégories et items.
// Source unique pour le navigateur de catalogue.

export type CatalogItem = {
  name: string;
  image?: string;
  children?: CatalogItem[];
};

export type CatalogCategory = {
  id: string;
  code: string;
  icon: string;
  name: string;
  color: string;
  image?: string;
  children: CatalogItem[];
};

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

export const CATEGORY_IMAGES: Record<string, string> = {
  telephonie:    IMG("photo-1719945421298-f03d3d80c3e1"),
  informatique:  IMG("photo-1511385348-a52b4a160dc2"),
  electronique:  IMG("photo-1651340675491-6fb0bfb5c4ea"),
  electromenager:IMG("photo-1721613877687-c9099b698faa"),
  "mode-femme":  IMG("photo-1532453288672-3a27e9be9efd"),
  "mode-homme":  IMG("photo-1618886614638-80e3c103d31a"),
  "enfants-bebe":IMG("photo-1498940757830-82f7813bf178"),
  beaute:        IMG("photo-1596462502278-27bfdc403348"),
  sante:         IMG("photo-1576602976047-174e57a47881"),
  "maison-deco": IMG("photo-1558442074-3c19857bc1dc"),
  alimentation:  IMG("photo-1630960411440-10f7b59717ba"),
  sport:         IMG("photo-1591311630200-ffa9120a540f"),
  gaming:        IMG("photo-1493711662062-fa541adb3fc8"),
  "auto-moto":   IMG("photo-1625811485537-af2c05a0232d"),
  bricolage:     IMG("photo-1426927308491-6380b6a9936f"),
  librairie:     IMG("photo-1532012197267-da84d127e765"),
  musique:       IMG("photo-1510915361894-db8b60106cb1"),
  voyage:        IMG("photo-1639598003276-8a70fcaaad6c"),
  services:      IMG("photo-1549923746-c502d488b3ea"),
  artisanat:     IMG("photo-1534413340928-7bd74b65196f"),
};

export const CATALOG: CatalogCategory[] = [
  {
    id: "telephonie",
    code: "1",
    icon: "Smartphone",
    name: "Téléphonie & Objets connectés",
    color: "#3B82F6",
    children: [
      { name: "Smartphones Android" },
      { name: "Smartphones iOS" },
      { name: "Téléphones basiques" },
      { name: "Téléphones professionnels" },
      { name: "Tablettes" },
      { name: "iPad & tablettes premium" },
      { name: "Coques & protections" },
      { name: "Verres trempés" },
      { name: "Chargeurs & adaptateurs" },
      { name: "Câbles USB / Type-C / Lightning" },
      { name: "Powerbanks" },
      { name: "Écouteurs & casques" },
      { name: "Montres connectées" },
      { name: "Bracelets connectés" },
      { name: "Accessoires Bluetooth" },
      { name: "Cartes mémoire & stockage" },
    ],
  },
  {
    id: "informatique",
    code: "2",
    icon: "Laptop",
    name: "Informatique & High-Tech",
    color: "#6366F1",
    children: [
      { name: "Ordinateurs portables" },
      { name: "PC de bureau" },
      { name: "MacBook & iMac" },
      { name: "Écrans & moniteurs" },
      { name: "Imprimantes" },
      { name: "Scanner" },
      { name: "Claviers" },
      { name: "Souris" },
      { name: "Tapis de souris" },
      { name: "Disques durs / SSD" },
      { name: "RAM" },
      { name: "Cartes graphiques" },
      { name: "Processeurs" },
      { name: "Cartes mères" },
      { name: "Onduleurs" },
      { name: "Routeurs & modems" },
      { name: "Répéteurs WiFi" },
      { name: "Serveurs & NAS" },
      { name: "Accessoires PC" },
    ],
  },
  {
    id: "electronique",
    code: "3",
    icon: "Tv",
    name: "Électronique & Multimédia",
    color: "#0EA5E9",
    children: [
      { name: "Télévisions LED / Smart TV" },
      { name: "Projecteurs" },
      { name: "Home cinéma" },
      { name: "Barres de son" },
      { name: "Amplificateurs" },
      { name: "Radios" },
      { name: "Caméras vidéo" },
      { name: "Appareils photo" },
      { name: "Drones" },
      { name: "Caméras de surveillance" },
      { name: "Alarmes connectées" },
      { name: "Accessoires photo/vidéo" },
    ],
  },
  {
    id: "electromenager",
    code: "4",
    icon: "Refrigerator",
    name: "Électroménager & Maison",
    color: "#9333EA",
    children: [
      { name: "Réfrigérateurs" },
      { name: "Congélateurs" },
      { name: "Cuisinières" },
      { name: "Fours & micro-ondes" },
      { name: "Blenders & mixeurs" },
      { name: "Machines à café" },
      { name: "Bouilloires" },
      { name: "Fers à repasser" },
      { name: "Machines à laver" },
      { name: "Aspirateurs" },
      { name: "Ventilateurs" },
      { name: "Climatiseurs" },
      { name: "Chauffe-eau" },
      { name: "Appareils de cuisine" },
    ],
  },
  {
    id: "mode-femme",
    code: "5",
    icon: "Shirt",
    name: "Mode Femme",
    color: "#EC4899",
    children: [
      { name: "Robes" }, { name: "Jupes" }, { name: "Pantalons" }, { name: "Tops & chemises" },
      { name: "T-shirts" }, { name: "Tenues traditionnelles" }, { name: "Lingerie" },
      { name: "Maillots de bain" }, { name: "Chaussures" }, { name: "Sandales" }, { name: "Talons" },
      { name: "Sacs à main" }, { name: "Bijoux" }, { name: "Accessoires" },
    ],
  },
  {
    id: "mode-homme",
    code: "6",
    icon: "Shirt",
    name: "Mode Homme",
    color: "#1E40AF",
    children: [
      { name: "Chemises" }, { name: "T-shirts" }, { name: "Pantalons" }, { name: "Jeans" },
      { name: "Costumes" }, { name: "Tenues traditionnelles" }, { name: "Sous-vêtements" },
      { name: "Chaussures" }, { name: "Sneakers" }, { name: "Sandales" }, { name: "Montres" },
      { name: "Ceintures" }, { name: "Sacs" },
    ],
  },
  {
    id: "enfants-bebe",
    code: "7",
    icon: "Baby",
    name: "Enfants & Bébé",
    color: "#FBBF24",
    children: [
      { name: "Vêtements bébé" }, { name: "Vêtements enfants" }, { name: "Chaussures enfants" },
      { name: "Jouets éducatifs" }, { name: "Jouets électroniques" }, { name: "Peluches" },
      { name: "Landaux & poussettes" }, { name: "Lits bébé" }, { name: "Biberons" },
      { name: "Produits d'hygiène bébé" }, { name: "Sacs scolaires" },
    ],
  },
  {
    id: "beaute",
    code: "8",
    icon: "Sparkles",
    name: "Beauté & Cosmétique",
    color: "#F0278E",
    children: [
      { name: "Maquillage" }, { name: "Fonds de teint" }, { name: "Rouge à lèvres" },
      { name: "Crèmes visage" }, { name: "Soins peau" }, { name: "Soins cheveux" },
      { name: "Huiles naturelles" }, { name: "Parfums femme" }, { name: "Parfums homme" },
      { name: "Kits beauté" }, { name: "Produits bio" },
    ],
  },
  {
    id: "sante",
    code: "9",
    icon: "HeartPulse",
    name: "Santé & Hygiène",
    color: "#10B981",
    children: [
      { name: "Médicaments OTC" }, { name: "Compléments alimentaires" }, { name: "Matériel médical" },
      { name: "Tensiomètres" }, { name: "Thermomètres" }, { name: "Masques & protection" },
      { name: "Produits hygiène" }, { name: "Dentifrice & brosses" }, { name: "Désinfectants" },
      { name: "Premiers soins" },
    ],
  },
  {
    id: "maison-deco",
    code: "10",
    icon: "Sofa",
    name: "Maison & Décoration",
    color: "#16A34A",
    children: [
      { name: "Canapés" }, { name: "Tables" }, { name: "Chaises" }, { name: "Lits" },
      { name: "Matelas" }, { name: "Armoires" }, { name: "Rideaux" }, { name: "Tapis" },
      { name: "Décoration murale" }, { name: "Luminaires" }, { name: "Lampes" },
      { name: "Ustensiles cuisine" }, { name: "Vaisselle" }, { name: "Rangements" },
    ],
  },
  {
    id: "alimentation",
    code: "11",
    icon: "UtensilsCrossed",
    name: "Alimentation & Supermarché",
    color: "#FF6B00",
    children: [
      {
        name: "11.1 Produits secs",
        children: [
          { name: "Riz (local, importé, parfumé)" },
          { name: "Haricots & légumineuses" },
          { name: "Farines (maïs, blé, manioc, igname)" },
          { name: "Pâtes alimentaires" },
          { name: "Semoule & couscous" },
          { name: "Produits déshydratés" },
          { name: "Céréales petit-déjeuner" },
        ],
      },
      {
        name: "11.2 Riz & céréales",
        children: [
          { name: "Riz blanc" }, { name: "Riz complet" }, { name: "Riz parfumé (basmati, thai)" },
          { name: "Maïs" }, { name: "Mil & sorgho" }, { name: "Avoine" }, { name: "Blé" },
          { name: "Quinoa & céréales importées" },
        ],
      },
      {
        name: "11.3 Pâtes alimentaires",
        children: [
          { name: "Spaghetti" }, { name: "Macaroni" }, { name: "Penne" },
          { name: "Nouilles instantanées" }, { name: "Lasagnes" }, { name: "Pâtes complètes" },
          { name: "Pâtes sans gluten" },
        ],
      },
      {
        name: "11.4 Huiles & matières grasses",
        children: [
          { name: "Huile de palme" }, { name: "Huile d'arachide" }, { name: "Huile de tournesol" },
          { name: "Huile d'olive" }, { name: "Margarine" }, { name: "Beurre" }, { name: "Ghee" },
        ],
      },
      {
        name: "11.5 Épices & condiments",
        children: [
          { name: "Piment (sec, poudre, frais)" }, { name: "Sel & sel iodé" }, { name: "Poivre" },
          { name: "Cubes alimentaires" }, { name: "Curry" }, { name: "Gingembre" },
          { name: "Ail en poudre" }, { name: "Mélanges d'épices locales" },
        ],
      },
      {
        name: "11.6 Boissons",
        children: [
          { name: "Sodas" }, { name: "Boissons énergétiques" }, { name: "Eaux minérales" },
          { name: "Eaux gazeuses" }, { name: "Thés & infusions" }, { name: "Cafés" },
          { name: "Boissons lactées" }, { name: "Boissons locales traditionnelles" },
        ],
      },
      {
        name: "11.7 Jus naturels",
        children: [
          { name: "Jus d'orange" }, { name: "Jus de mangue" }, { name: "Jus d'ananas" },
          { name: "Jus de bissap" }, { name: "Jus de gingembre" }, { name: "Jus de fruits mixtes" },
          { name: "Jus artisanaux locaux" },
        ],
      },
      {
        name: "11.8 Produits frais",
        children: [
          {
            name: "11.8.1 Légumes frais",
            children: [
              { name: "Tomates fraîches" }, { name: "Oignons" }, { name: "Piments frais" },
              { name: "Carottes" }, { name: "Choux" }, { name: "Aubergines" },
              { name: "Concombres" }, { name: "Épinards & feuilles vertes" }, { name: "Gombo" },
              { name: "Salades" }, { name: "Betteraves" }, { name: "Haricots verts" },
            ],
          },
          {
            name: "11.8.2 Fruits frais",
            children: [
              { name: "Bananes" }, { name: "Mangues" }, { name: "Oranges" }, { name: "Ananas" },
              { name: "Papayes" }, { name: "Pastèques" }, { name: "Avocats" },
              { name: "Citrons & limes" }, { name: "Pommes" }, { name: "Raisins" },
              { name: "Fruits locaux saisonniers" },
            ],
          },
          {
            name: "11.8.3 Viandes fraîches",
            children: [
              { name: "Bœuf" }, { name: "Poulet entier" }, { name: "Découpes de poulet" },
              { name: "Mouton / chèvre" }, { name: "Porc" },
              { name: "Abats (foie, cœur, tripes)" }, { name: "Viande hachée" },
              { name: "Viande marinée" },
            ],
          },
          {
            name: "11.8.4 Poissons frais",
            children: [
              { name: "Tilapia" }, { name: "Carpe" }, { name: "Poisson capitaine" },
              { name: "Sardines fraîches" }, { name: "Poissons fumés frais" },
              { name: "Poissons entiers" }, { name: "Filets de poisson" },
            ],
          },
          {
            name: "11.8.5 Fruits de mer",
            children: [
              { name: "Crevettes" }, { name: "Gambas" }, { name: "Crabes" }, { name: "Moules" },
              { name: "Coquillages" }, { name: "Calamars" }, { name: "Poulpe" },
            ],
          },
          {
            name: "11.8.6 Produits laitiers frais",
            children: [
              { name: "Lait frais" }, { name: "Yaourt nature" }, { name: "Yaourt aux fruits" },
              { name: "Fromage frais" }, { name: "Crème fraîche" }, { name: "Beurre artisanal" },
            ],
          },
          {
            name: "11.8.7 Produits frais locaux",
            children: [
              { name: "Feuilles traditionnelles (adémè, crincrin, etc.)" },
              { name: "Produits agricoles du marché local" },
              { name: "Tubercules frais (igname, manioc, patate douce)" },
              { name: "Produits bio de ferme" }, { name: "Produits artisanaux frais" },
            ],
          },
          {
            name: "11.8.8 Produits frais transformés",
            children: [
              { name: "Jus frais pressés" }, { name: "Salades prêtes à consommer" },
              { name: "Viandes marinées fraîches" }, { name: "Poissons nettoyés" },
              { name: "Mélanges de légumes prêts cuisson" },
            ],
          },
          {
            name: "11.8.9 Produits frais emballés",
            children: [
              { name: "Légumes lavés et emballés" }, { name: "Fruits découpés" },
              { name: "Viandes sous vide" }, { name: "Poissons conditionnés" },
              { name: "Plateaux mixtes (viande + légumes)" },
            ],
          },
        ],
      },
      {
        name: "11.9 Conserves & produits longue durée",
        children: [
          { name: "Sardines en boîte" }, { name: "Thon en conserve" }, { name: "Tomates en boîte" },
          { name: "Haricots en conserve" }, { name: "Soupes instantanées" },
          { name: "Laits concentrés" }, { name: "Produits stérilisés" },
        ],
      },
      {
        name: "11.10 Snacks & confiseries",
        children: [
          { name: "Biscuits" }, { name: "Chocolats" }, { name: "Bonbons" }, { name: "Chips" },
          { name: "Cacahuètes" }, { name: "Barres énergétiques" }, { name: "Produits sucrés locaux" },
        ],
      },
      {
        name: "11.11 Produits bébé (alimentaires)",
        children: [
          { name: "Laits infantiles" }, { name: "Céréales bébé" }, { name: "Compotes" },
          { name: "Purées infantiles" }, { name: "Snacks pour bébé" }, { name: "Biscuits bébé" },
        ],
      },
      {
        name: "11.12 Produits ménagers",
        children: [
          { name: "Lessive" }, { name: "Savon" }, { name: "Liquide vaisselle" },
          { name: "Désinfectants" }, { name: "Eau de javel" }, { name: "Nettoyants multi-usages" },
          { name: "Produits d'entretien cuisine" }, { name: "Produits d'entretien sol" },
        ],
      },
      {
        name: "11.13 Produits locaux & traditionnels",
        children: [
          { name: "Produits agricoles locaux" }, { name: "Farines locales" },
          { name: "Tubercules (igname, manioc)" },
          { name: "Produits fermentés (attiéké, gari…)" }, { name: "Huile artisanale" },
          { name: "Épices locales" }, { name: "Produits bio du terroir" },
        ],
      },
    ],
  },
  {
    id: "sport",
    code: "12",
    icon: "Dumbbell",
    name: "Sport & Loisirs",
    color: "#F97316",
    children: [
      { name: "Fitness" }, { name: "Musculation" }, { name: "Haltères" }, { name: "Tapis de yoga" },
      { name: "Ballons" }, { name: "Maillots de sport" }, { name: "Chaussures de sport" },
      { name: "Vélos" }, { name: "Trottinettes" }, { name: "Camping" }, { name: "Jeux de plein air" },
      { name: "Jeux de société" },
    ],
  },
  {
    id: "gaming",
    code: "13",
    icon: "Gamepad2",
    name: "Gaming & Loisirs numériques",
    color: "#8B5CF6",
    children: [
      { name: "Consoles de jeux" }, { name: "Jeux vidéo" }, { name: "Manettes" },
      { name: "Casques gaming" }, { name: "Accessoires gaming" }, { name: "PC gaming" },
      { name: "Cartes cadeaux" },
    ],
  },
  {
    id: "auto-moto",
    code: "14",
    icon: "Car",
    name: "Auto & Moto",
    color: "#DC2626",
    children: [
      { name: "Pièces détachées" }, { name: "Accessoires voiture" }, { name: "Accessoires moto" },
      { name: "Pneus" }, { name: "Batteries voiture" }, { name: "Huiles moteur" },
      { name: "GPS voiture" }, { name: "Autoradios" }, { name: "Casques moto" },
      { name: "Équipements sécurité" },
    ],
  },
  {
    id: "bricolage",
    code: "15",
    icon: "Wrench",
    name: "Bricolage & Construction",
    color: "#78716C",
    children: [
      { name: "Outils manuels" }, { name: "Perceuses" }, { name: "Marteaux" }, { name: "Scies" },
      { name: "Tournevis" }, { name: "Électricité bâtiment" }, { name: "Plomberie" },
      { name: "Peinture" }, { name: "Ciment & matériaux" }, { name: "Vis & boulons" },
    ],
  },
  {
    id: "librairie",
    code: "16",
    icon: "BookOpen",
    name: "Librairie & Papeterie",
    color: "#6366F1",
    children: [
      { name: "Livres scolaires" }, { name: "Romans" }, { name: "Cahiers" }, { name: "Stylos" },
      { name: "Fournitures bureau" }, { name: "Agenda" }, { name: "Sacs scolaires" },
      { name: "Matériel artistique" },
    ],
  },
  {
    id: "musique",
    code: "17",
    icon: "Music",
    name: "Musique & Instruments",
    color: "#A855F7",
    children: [
      { name: "Guitares" }, { name: "Pianos" }, { name: "Batteries" }, { name: "Microphones" },
      { name: "Enceintes musicales" }, { name: "Instruments traditionnels" },
      { name: "Accessoires musique" },
    ],
  },
  {
    id: "voyage",
    code: "18",
    icon: "Luggage",
    name: "Voyage & Bagagerie",
    color: "#0D9488",
    children: [
      { name: "Valises" }, { name: "Sacs de voyage" }, { name: "Sacs à dos" },
      { name: "Accessoires voyage" }, { name: "Oreillers de voyage" },
    ],
  },
  {
    id: "services",
    code: "19",
    icon: "Briefcase",
    name: "Services (Marketplace hybride)",
    color: "#0EA5E9",
    children: [
      { name: "Livraison" }, { name: "Transport" }, { name: "Réparation téléphone" },
      { name: "Réparation électroménager" }, { name: "Design graphique" },
      { name: "Développement web" }, { name: "Formation" }, { name: "Coaching" },
      { name: "Freelance divers" },
    ],
  },
  {
    id: "artisanat",
    code: "20",
    icon: "Palette",
    name: "Produits locaux & artisanat",
    color: "#E8A817",
    children: [
      { name: "Artisanat africain" }, { name: "Pagnes & tissus" }, { name: "Bijoux artisanaux" },
      { name: "Sculptures" }, { name: "Produits naturels" }, { name: "Cosmétiques locaux" },
      { name: "Aliments locaux" },
    ],
  },
];

for (const c of CATALOG) {
  if (!c.image && CATEGORY_IMAGES[c.id]) c.image = CATEGORY_IMAGES[c.id];
}

// Dictionnaire sémantique : chaque sous-catégorie reçoit une image qui illustre
// fidèlement son intitulé (lecture du nom français, fallback parent en dernier
// recours). Aucune attribution aléatoire — chaque entrée a été choisie.
// L'ordre des clés compte : la première qui matche le nom normalisé gagne, donc
// on place les termes les plus spécifiques en haut.
// Seules les entrées avec un visuel TRÈS spécifique restent ici. Les sous-
// catégories sans match certain héritent simplement de l'image de leur catégorie
// parente (toujours topique) plutôt que d'une image générique trompeuse.
const KEYWORD_IMAGES: Array<[RegExp, string]> = [
  // Téléphonie — visuels distincts par type d'objet
  [/iphone|ios|ipad|tablette/, "photo-1662893170097-d6563d0093d3"],
  [/smartphone|android/, "photo-1741061963569-9d0ef54d10d2"],
  [/ecouteur|casque audio|casque(?! gaming)|bluetooth/, "photo-1577174881658-0f30ed549adc"],
  [/montre connectee|bracelet connecte|smartwatch/, "photo-1665860455418-017fa50d29bc"],
  [/chargeur|powerbank|cable\b|adaptateur|coque|verre trempe|carte memoire/, "photo-1557767382-97b28f5488e7"],

  // Informatique
  [/macbook|imac|ordinateur portable|laptop|mac\b/, "photo-1511385348-a52b4a160dc2"],
  [/ecran|moniteur/, "photo-1527443224154-c4a3942d3acf"],
  [/imprimante|scanner/, "photo-1613395450289-e560907d9308"],
  [/clavier|souris|tapis de souris/, "photo-1595044426077-d36d9236d54a"],
  [/routeur|modem|repeteur|wifi/, "photo-1606904825846-647eb07f5be2"],
  [/pc de bureau|disque dur|ssd|ram\b|carte graphique|processeur|carte mere|onduleur|serveur|nas\b/, "photo-1632749042303-7f7a18ed6ff0"],

  // Électronique
  [/television|smart tv|\btv\b/, "photo-1646861039459-fd9e3aabf3fb"],
  [/home cinema|barre de son|amplificateur|enceinte/, "photo-1703528696307-c9008a679141"],
  [/\bradio\b/, "photo-1624347443725-dac2bcc04c82"],
  [/camera video|appareil photo|accessoire photo/, "photo-1495745966610-2a67f2297e5e"],
  [/drone/, "photo-1473968512647-3e447244af8f"],
  [/camera de surveillance|alarme/, "photo-1589935447067-5531094415d1"],

  // Électroménager
  [/refrigerateur|congelateur/, "photo-1762811003338-aef30274513b"],
  [/cuisiniere|four|micro-onde/, "photo-1623114112815-74a4b9fe505d"],
  [/blender|mixeur/, "photo-1638792958866-9b3f787ec709"],
  [/machine a cafe|cafetiere|bouilloire/, "photo-1616388761741-a5936c6f61f6"],
  [/fer a repasser/, "photo-1489274495757-95c7c837b101"],
  [/machine a laver|lave-linge/, "photo-1626806819282-2c1dc01a5e0c"],
  [/aspirateur/, "photo-1686178827149-6d55c72d81df"],
  [/ventilateur/, "photo-1601084195907-44baaa49dabd"],
  [/climatiseur|chauffe-eau/, "photo-1718203862467-c33159fdc504"],

  // Mode femme
  [/robe|jupe/, "photo-1533659828870-95ee305cee3e"],
  [/talon|escarpin|sandale/, "photo-1535043934128-cf0b28d52f95"],
  [/sac a main/, "photo-1589363358751-ab05797e5629"],
  [/bijou|collier/, "photo-1601121141461-9d6647bca1ed"],
  [/lingerie/, "photo-1568441556126-f36ae0900180"],
  [/maillot de bain/, "photo-1581588636584-5c447d2c9d97"],
  [/tenue traditionnelle/, "photo-1515658323406-25d61c141a6e"],

  // Mode homme
  [/costume/, "photo-1617137968427-85924c800a22"],
  [/chemise|t-shirt/, "photo-1581655353564-df123a1eb820"],
  [/jean|pantalon/, "photo-1602293589930-45aad59ba3ab"],
  [/sneakers|chaussure/, "photo-1512374382149-233c42b6a83b"],
  [/ceinture/, "photo-1664286074176-5206ee5dc878"],
  [/^montres?$|montre(?! connectee)/, "photo-1524592094714-0f0654e20314"],

  // Enfants & bébé
  [/peluche/, "photo-1648311203209-da34f7d0d800"],
  [/jouet/, "photo-1545558014-8692077e9b5c"],
  [/vetement bebe|vetement enfant|chaussure enfant|landau|poussette|lit bebe|biberon|hygiene bebe|sac scolaire/, "photo-1617331140180-e8262094733a"],

  // Aliments frais — visuels distincts par type
  [/tomate(?! en boite)/, "photo-1593105544559-ecb03bf76f82"],
  [/oignon|carotte|chou|aubergine|concombre|epinard|feuille verte|gombo|salade|haricot vert|betterave|legume frais|legumes frais/, "photo-1593105544559-ecb03bf76f82"],
  [/tilapia|carpe|capitaine|sardine fraiche|poisson(?! en| en boite)|crevette|gamba|crabe|moule|coquillage|calamar|poulpe|fruit de mer/, "photo-1553659971-f01207815844"],

  // Cuisine sèche & épices — visuel piments uniquement quand pertinent
  [/piment|poivre|curry|gingembre|ail en poudre|epice|cube alimentaire/, "photo-1629285464605-8e6493153fdb"],

  // Ménager
  [/lessive|savon|liquide vaisselle|javel|nettoyant|entretien/, "photo-1740657254989-42fe9c3b8cce"],

  // Sport — visuel par discipline quand identifiable
  [/musculation|haltere|fitness/, "photo-1591311630200-ffa9120a540f"],

  // Gaming
  [/console|jeu video|manette|casque gaming|accessoire gaming|pc gaming/, "photo-1493711662062-fa541adb3fc8"],

  // Auto & moto
  [/casque moto/, "photo-1611004061856-ccc3cbe944b2"],

  // Musique
  [/batterie\b/, "photo-1519892300165-cb5542fb47c7"],
];

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickImageFor(name: string, fallback?: string): string | undefined {
  // On retire les préfixes numériques style "11.8.1 " pour matcher le mot-clé.
  const cleaned = normalizeStr(name).replace(/^\d+(\.\d+)*\s*/, "");
  for (const [re, id] of KEYWORD_IMAGES) {
    if (re.test(cleaned)) return IMG(id);
  }
  return fallback;
}

// Deterministic unique-image enforcer: when a candidate URL has already been
// used elsewhere in the catalogue, fall back to a Picsum seed derived from the
// item path so every node ends up with a strictly unique visual.
const USED_IMAGES = new Set<string>();
for (const url of Object.values(CATEGORY_IMAGES)) USED_IMAGES.add(url);

function slugify(s: string): string {
  return normalizeStr(s).replace(/\s+/g, "-").slice(0, 60);
}

function uniqueImage(candidate: string | undefined, seedPath: string, itemName: string): string {
  if (candidate && !USED_IMAGES.has(candidate)) {
    USED_IMAGES.add(candidate);
    return candidate;
  }
  // Fallback : génération d'image placeholder via Picsum avec seed déterministe
  // pour garantir une image unique et stable par sous-catégorie.
  const sig = slugify(seedPath);
  let hash = 0;
  for (let i = 0; i < sig.length; i++) {
    hash = ((hash << 5) - hash + sig.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash) % 1000;
  const url = `https://picsum.photos/seed/${seed}-${sig.slice(0, 30)}/240/240`;
  USED_IMAGES.add(url);
  return url;
}

function applyImagesRecursive(items: CatalogItem[], parentImg: string | undefined, parentPath: string) {
  for (const it of items) {
    const path = `${parentPath}/${it.name}`;
    const candidate = it.image ?? pickImageFor(it.name, parentImg);
    it.image = uniqueImage(candidate, path, it.name);
    if (it.children && it.children.length) {
      applyImagesRecursive(it.children, it.image, path);
    }
  }
}

for (const c of CATALOG) {
  applyImagesRecursive(c.children, c.image, c.id);
}

function countLeaves(items: CatalogItem[]): number {
  let n = 0;
  for (const it of items) {
    if (it.children && it.children.length) n += countLeaves(it.children);
    else n += 1;
  }
  return n;
}

export function categoryItemCount(c: CatalogCategory): number {
  return countLeaves(c.children);
}

export function findCategory(id: string): CatalogCategory | undefined {
  return CATALOG.find((c) => c.id === id);
}
