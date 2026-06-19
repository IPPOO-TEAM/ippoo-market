/* ═══════════════════════════════════════════
   Liste canonique des clés UI à traduire.
   Source = chaîne française exacte (sans espaces aux bords).
   À enrichir au fil de l'évolution de l'app.
   ═══════════════════════════════════════════ */

export const CANONICAL_KEYS: readonly string[] = [
  // Navigation
  "Accueil", "Explorer", "Promos", "Commandes", "Panier", "Profil",
  "Paramètres", "Notifications", "Wallet", "Aide", "Messagerie",
  "Vendeurs & Boutiques", "Communautés", "Achat Groupé", "Comparatif des prix",
  "Cotation des Prix", "Blog & Informations", "International", "Devis & Négociation",
  "Service Après-Vente", "CRM Commercial", "Parrainage & Commissions",
  "Ressources Média", "Transactions", "Factures & Documents", "Jeux & Cadeaux",
  "VIP & Bonus", "Mon Profil", "Comités d'Entreprise", "Circuit de Gros",

  // Actions
  "Rechercher", "Connexion", "Inscription", "Déconnexion", "Modifier",
  "Supprimer", "Ajouter", "Annuler", "Confirmer", "Enregistrer", "Retour",
  "Suivant", "Précédent", "Continuer", "Voir plus", "Fermer", "Valider",
  "Acheter", "Commander", "Payer", "Recharger", "Retirer", "Envoyer",
  "Filtrer", "Trier", "Partager", "Télécharger", "Importer", "Exporter",

  // Champs / labels
  "Email", "Téléphone", "Mot de passe", "Nom", "Prénom", "Nom complet",
  "Adresse", "Ville", "Pays", "Quantité", "Prix", "Total", "Sous-total",
  "Livraison", "Frais", "Description", "Catégorie", "Marque",
  "Date", "Heure", "Statut",

  // Statuts
  "En cours", "Terminé", "En attente", "Vérifié", "Annulé", "Livré",
  "Expédié", "Payé", "Impayé", "Approuvé", "Rejeté", "Disponible",
  "En rupture", "Nouveau", "Populaire", "Promo",

  // Wallet / paiement
  "Solde", "Crédit", "Débit", "Virement", "Mobile Money", "Carte bancaire",
  "Paiement à la livraison",

  // Catégories officielles
  "Alimentaire", "Boissons", "Hygiène", "Textile", "Électronique", "BTP",
  "Beauté", "Fournitures", "Auto/Moto", "Bébé/Enfant", "Équipements",
  "Industriel", "Maison", "Sport", "Luxe", "Services",

  // Phrases courantes
  "Bienvenue", "Merci", "Oui", "Non", "Chargement", "Erreur", "Succès",
  "Aucun résultat", "Réessayer", "Plus d'informations", "En savoir plus",
  "Contactez-nous", "Conditions générales", "Politique de confidentialité",
];

/** Seuil minimal de couverture pour qu'une langue apparaisse dans le sélecteur. */
export const COVERAGE_THRESHOLD = 0.9;

export function coverage(dict: Record<string, string>): number {
  let hit = 0;
  for (const k of CANONICAL_KEYS) {
    if (dict[k] && dict[k].trim().length > 0) hit++;
  }
  return hit / CANONICAL_KEYS.length;
}
