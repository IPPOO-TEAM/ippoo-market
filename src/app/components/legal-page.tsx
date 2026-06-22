/* ═══════════════════════════════════════════
   IPPOO - Pages légales
   Conditions générales d'utilisation et politique
   de confidentialité. Pages publiques accessibles
   depuis le signup, le footer et les paramètres.
   ═══════════════════════════════════════════ */

import { useNavigate, useParams } from "react-router";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

type Section = { title: string; body: string };

type Doc = {
  kind: "cgu" | "confidentialite";
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: Section[];
};

const DOCS: Record<Doc["kind"], Doc> = {
  cgu: {
    kind: "cgu",
    title: "Conditions générales d'utilisation",
    subtitle: "Règles d'usage de la plateforme IPPOO Market",
    updatedAt: "19 mai 2026",
    sections: [
      {
        title: "1. Objet",
        body: "Les présentes conditions régissent l'accès et l'utilisation de la plateforme IPPOO Market, accessible via le site web et l'application mobile. En créant un compte ou en utilisant le service, vous acceptez sans réserve l'ensemble des présentes conditions.",
      },
      {
        title: "2. Éligibilité",
        body: "L'inscription est ouverte à toute personne physique majeure (18 ans ou plus) ou personne morale dûment immatriculée. Les vendeurs professionnels doivent fournir les justificatifs d'activité (RCCM, IFU) demandés lors de l'onboarding.",
      },
      {
        title: "3. Compte utilisateur",
        body: "Vous êtes responsable de la confidentialité de vos identifiants (mot de passe, code PIN, empreinte biométrique). Toute action effectuée depuis votre compte est réputée avoir été faite par vous. En cas de perte ou de compromission, signalez-le immédiatement via support@ippoo.com.",
      },
      {
        title: "4. Services proposés",
        body: "IPPOO Market met en relation acheteurs et vendeurs en Afrique de l'Ouest. La plateforme propose : catalogue produits, paiement protégé (commission 8 %), livraison via partenaires ou retrait, programme VIP, gestion multi-boutiques pour les vendeurs.",
      },
      {
        title: "5. Commandes et paiements",
        body: "Toute commande validée est ferme et engage acheteur et vendeur. Les fonds sont conservés sur un compte sécurisé IPPOO jusqu'à confirmation de réception. Les moyens de paiement acceptés sont : MTN MoMo, Moov Money, Celtiis Cash, carte bancaire et paiement à la livraison (selon disponibilité du vendeur).",
      },
      {
        title: "6. Obligations du vendeur",
        body: "Le vendeur s'engage à proposer des produits conformes à la description, à respecter les délais annoncés, à honorer les commandes acceptées et à ne pas vendre de produits illicites ou contrefaits. Tout manquement peut entraîner la suspension immédiate de la boutique.",
      },
      {
        title: "7. Obligations de l'acheteur",
        body: "L'acheteur s'engage à fournir des informations exactes (adresse, contact), à être présent ou disponible pour la livraison, et à régler le montant dû. Tout refus de réception abusif peut être facturé.",
      },
      {
        title: "8. Litiges et SAV",
        body: "En cas de litige, contactez d'abord le vendeur via la messagerie intégrée. Si aucun accord n'est trouvé sous 7 jours, ouvrez un ticket SAV depuis votre commande. IPPOO interviendra pour trancher et débloquer les fonds vers la partie de bonne foi.",
      },
      {
        title: "9. Suspension et résiliation",
        body: "IPPOO se réserve le droit de suspendre ou de résilier tout compte en cas de fraude, de violation des présentes conditions, de comportement nuisible ou de demande de l'autorité judiciaire. La résiliation à l'initiative de l'utilisateur s'effectue depuis Paramètres > Compte > Supprimer mon compte.",
      },
      {
        title: "10. Responsabilité",
        body: "IPPOO agit comme intermédiaire technique. La responsabilité de la qualité, de la conformité et de la livraison des produits incombe au vendeur. IPPOO ne saurait être tenue responsable de dommages indirects résultant de l'utilisation du service.",
      },
      {
        title: "11. Modifications",
        body: "Les présentes conditions peuvent évoluer. Les modifications substantielles sont notifiées par email ou via une notification dans l'application au moins 15 jours avant leur entrée en vigueur.",
      },
      {
        title: "12. Droit applicable",
        body: "Les présentes conditions sont régies par le droit béninois. Tout litige non résolu à l'amiable sera soumis à la compétence des tribunaux de Cotonou.",
      },
    ],
  },
  confidentialite: {
    kind: "confidentialite",
    title: "Politique de confidentialité",
    subtitle: "Comment IPPOO collecte, utilise et protège vos données",
    updatedAt: "19 mai 2026",
    sections: [
      {
        title: "1. Données collectées",
        body: "Nous collectons les données que vous nous fournissez (nom, prénom, email, téléphone, adresse, photo de profil, documents KYC) et les données générées par votre usage (commandes, transactions, messages, préférences, historique de navigation). Pour les vendeurs : informations professionnelles (RCCM, IFU, secteur d'activité, photos boutique).",
      },
      {
        title: "2. Finalités du traitement",
        body: "Vos données sont utilisées pour : créer et gérer votre compte, traiter vos commandes et paiements, vous contacter pour le suivi (SMS, push, email), améliorer notre service, prévenir la fraude, respecter nos obligations légales (facturation, KYC, anti-blanchiment).",
      },
      {
        title: "3. Base légale",
        body: "Le traitement repose sur : votre consentement (lors de l'inscription), l'exécution du contrat (traitement des commandes), nos obligations légales (facturation, KYC), notre intérêt légitime (prévention de la fraude, amélioration du service).",
      },
      {
        title: "4. Partage des données",
        body: "Vos données ne sont jamais vendues. Elles peuvent être partagées avec : les vendeurs (nom, adresse, téléphone - strict nécessaire à la livraison), les partenaires logistiques (livreurs), les prestataires de paiement (MTN, Moov, Celtiis, banques), les autorités sur réquisition légale.",
      },
      {
        title: "5. Conservation",
        body: "Les données de compte sont conservées tant que votre compte est actif. Après suppression, certaines données (factures, transactions) sont archivées 10 ans pour respect des obligations comptables et fiscales. Les données de navigation sont supprimées après 13 mois.",
      },
      {
        title: "6. Sécurité",
        body: "Les communications sont chiffrées en TLS 1.3. Les mots de passe sont hachés via PBKDF2. Les codes PIN sont hachés avec sel unique par compte. Les données sensibles (documents KYC) sont stockées dans des buckets privés Supabase avec accès par URL signées temporaires.",
      },
      {
        title: "7. Vos droits",
        body: "Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité, d'opposition et de limitation. Vous pouvez exercer ces droits depuis Paramètres > Confidentialité, ou par email à privacy@ippoo.com. Une réponse vous sera apportée sous 30 jours.",
      },
      {
        title: "8. Cookies et traceurs",
        body: "Nous utilisons des cookies strictement nécessaires (session, sécurité) et, sous réserve de votre consentement, des cookies analytiques pour mesurer l'usage et améliorer l'application. Vous pouvez configurer vos préférences depuis Paramètres > Confidentialité.",
      },
      {
        title: "9. Transferts internationaux",
        body: "Vos données sont hébergées en Union européenne (Supabase / AWS Frankfurt). Aucun transfert vers un pays tiers n'a lieu sans garanties appropriées (clauses contractuelles types).",
      },
      {
        title: "10. Mineurs",
        body: "Le service est réservé aux personnes majeures. Si nous découvrons qu'un compte appartient à un mineur, il est immédiatement supprimé et les données associées sont effacées.",
      },
      {
        title: "11. Contact DPO",
        body: "Pour toute question relative à vos données personnelles, contactez notre Délégué à la Protection des Données : dpo@ippoo.com. Vous pouvez également saisir l'autorité de contrôle compétente (APDP au Bénin).",
      },
    ],
  },
};

export function LegalPage() {
  const { kind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const doc = kind && (kind === "cgu" || kind === "confidentialite") ? DOCS[kind] : null;

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Document introuvable.</p>
      </div>
    );
  }

  const Icon = doc.kind === "cgu" ? FileText : ShieldCheck;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted" aria-label="Retour">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>
            {doc.title}
          </h1>
          <p className="truncate text-muted-foreground" style={{ fontSize: 12 }}>
            {doc.subtitle}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#E11D2E20,#F9731620)" }}
        >
          <Icon className="w-5 h-5 text-[#E11D2E]" />
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <p className="text-muted-foreground mb-5" style={{ fontSize: 12 }}>
          Dernière mise à jour : {doc.updatedAt}
        </p>
        <div className="space-y-5">
          {doc.sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>
                {s.title}
              </h2>
              <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.65 }}>
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground mt-4 text-center" style={{ fontSize: 11 }}>
        Une question ? Écrivez à{" "}
        <a href="mailto:legal@ippoo.com" className="text-[#E11D2E] underline">
          legal@ippoo.com
        </a>
      </p>
    </div>
  );
}
