import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { HomePage } from "./components/home-page";
import { RouteErrorBoundary } from "./components/error-boundary";
import { RouteHydrateFallback } from "./components/route-hydrate-fallback";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminGate } from "./admin/AdminGate";
import { RequireAuth } from "./auth/AuthGate";

// Lazy helpers : on importe les composants à la demande pour découper le
// bundle initial. Le Layout et la HomePage restent eager (premier rendu).
type LazyDef = { lazy: () => Promise<{ Component: React.ComponentType }> };

const lazyComponent = (
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
): LazyDef => ({
  lazy: async () => {
    try {
      const mod = await loader();
      return { Component: mod[exportName] as React.ComponentType };
    } catch (e: any) {
      // Cas typique après redéploiement : un chunk dynamique a été supprimé
      // côté serveur, le navigateur tient encore l'ancien hash. On force un
      // reload pour réhydrater la nouvelle map de chunks (une seule fois
      // par session pour éviter les boucles).
      const msg = String(e?.message || e);
      const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg);
      if (isChunkError && typeof window !== "undefined") {
        const KEY = "ippoo:chunk-reload-at";
        const last = Number(sessionStorage.getItem(KEY) || "0");
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(KEY, String(Date.now()));
          window.location.reload();
          return { Component: () => null as any };
        }
      }
      throw e;
    }
  },
});

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: RouteHydrateFallback,
    children: [
      // ─── Pages publiques (vitrine + auth) ───────────────
      { index: true, Component: HomePage },
      { path: "explorer", ...lazyComponent(() => import("./components/explorer-page"), "ExplorerPage") },
      { path: "catalogue", ...lazyComponent(() => import("./components/catalogue-page"), "CataloguePage") },
      { path: "boutique/:shopId", ...lazyComponent(() => import("./components/boutique-page"), "BoutiquePage") },
      { path: "produit/:id", ...lazyComponent(() => import("./components/product-page"), "ProductPage") },
      { path: "vendeurs", ...lazyComponent(() => import("./components/vendors-page"), "VendorsPage") },
      { path: "vendeur/:id", ...lazyComponent(() => import("./components/vendor-shop-page"), "VendorShopPage") },
      { path: "promos", ...lazyComponent(() => import("./components/promos-page"), "PromosPage") },
      { path: "marche", ...lazyComponent(() => import("./components/marche-page"), "MarcheHubPage") },
      { path: "marche/:slug", ...lazyComponent(() => import("./components/marche-page"), "MarcheDetailPage") },
      { path: "aide", ...lazyComponent(() => import("./components/aide-page"), "AidePage") },
      { path: "blog", ...lazyComponent(() => import("./components/blog-page"), "BlogPage") },
      { path: "blog/article/:id", ...lazyComponent(() => import("./components/blog-article-page"), "BlogArticlePage") },
      { path: "groupements", ...lazyComponent(() => import("./components/groupements-page"), "GroupementsPage") },
      { path: "groupements/:id", ...lazyComponent(() => import("./components/groupements-page"), "GroupementDetailPage") },
      { path: "comparateur", ...lazyComponent(() => import("./components/comparateur-page"), "ComparateurPage") },
      { path: "comparateur/produit/:productId", ...lazyComponent(() => import("./components/comparateur/comparison-detail-page"), "ComparisonDetailPage") },
      { path: "comparateur/article/:id", ...lazyComponent(() => import("./components/blog-article-page"), "BlogArticlePage") },
      { path: "connexion", ...lazyComponent(() => import("./components/auth-page"), "AuthPage") },
      { path: "inscription", ...lazyComponent(() => import("./components/auth-page"), "AuthPage") },
      { path: "auth", ...lazyComponent(() => import("./components/auth-page"), "AuthPage") },
      { path: "legal/:kind", ...lazyComponent(() => import("./components/legal-page"), "LegalPage") },

      // ─── Pages privées (auth requise) ───────────────────
      {
        Component: RequireAuth,
        children: [
          { path: "commandes", ...lazyComponent(() => import("./components/orders-page"), "OrdersPage") },
          { path: "commande/:id", ...lazyComponent(() => import("./components/order-detail-page"), "OrderDetailPage") },
          { path: "wallet", ...lazyComponent(() => import("./components/wallet-page"), "WalletPage") },
          { path: "profil", ...lazyComponent(() => import("./components/profile-page"), "ProfilePage") },
          { path: "panier", ...lazyComponent(() => import("./components/cart-page"), "CartPage") },
          { path: "messagerie", ...lazyComponent(() => import("./components/messaging-page"), "MessagingPage") },
          { path: "transactions", ...lazyComponent(() => import("./components/transactions-page"), "TransactionsPage") },
          { path: "factures", ...lazyComponent(() => import("./components/factures-page"), "FacturesPage") },
          { path: "facture/:id", ...lazyComponent(() => import("./components/facture-detail-page"), "FactureDetailPage") },
          { path: "scan/:uid", ...lazyComponent(() => import("./components/scanner-page"), "ScanLookupPage") },
          { path: "scanner", ...lazyComponent(() => import("./components/scanner-page"), "ScannerPage") },
          { path: "pay", ...lazyComponent(() => import("./components/pay-page"), "PayPage") },
          { path: "boutique", ...lazyComponent(() => import("./components/my-shop-page"), "MyShopPage") },
          { path: "boutique/produits", ...lazyComponent(() => import("./components/my-products-page"), "MyProductsPage") },
          { path: "boutique/produits/etiquettes", ...lazyComponent(() => import("./components/my-product-labels-page"), "MyProductLabelsPage") },
          { path: "boutique/produits/:id", ...lazyComponent(() => import("./components/my-product-detail-page"), "MyProductDetailPage") },
          { path: "boutique/analytics", ...lazyComponent(() => import("./components/my-analytics-page"), "MyAnalyticsPage") },
          { path: "boutique/commandes", ...lazyComponent(() => import("./components/my-shop-orders-page"), "MyShopOrdersPage") },
          { path: "boutique/promotions", ...lazyComponent(() => import("./components/my-promos-page"), "MyPromosPage") },
          { path: "boutique/avis", ...lazyComponent(() => import("./components/my-reviews-page"), "MyReviewsPage") },
          { path: "boutique/clients", ...lazyComponent(() => import("./components/my-customers-page"), "MyCustomersPage") },
          { path: "boutique/devis", ...lazyComponent(() => import("./components/my-devis-page"), "MyDevisPage") },
          { path: "boutique/groupements", ...lazyComponent(() => import("./components/vendor-groups-page"), "VendorGroupsPage") },
          { path: "favoris-boutiques", ...lazyComponent(() => import("./components/followed-shops-page"), "FollowedShopsPage") },
          { path: "prix-surveilles", ...lazyComponent(() => import("./components/my-watched-prices-page"), "MyWatchedPricesPage") },
          { path: "devenir-vendeur", ...lazyComponent(() => import("./components/devenir-vendeur-page"), "DevenirVendeurPage") },
          { path: "vendeur-comptabilite", ...lazyComponent(() => import("./components/vendeur-comptabilite-page"), "VendeurComptabilitePage") },
          { path: "jeux", ...lazyComponent(() => import("./components/jeux-page"), "JeuxPage") },
          { path: "vip", ...lazyComponent(() => import("./components/vip-page"), "VipPage") },
          { path: "parametres", ...lazyComponent(() => import("./components/parametres-page"), "ParametresPage") },
          { path: "communautes", ...lazyComponent(() => import("./components/communities-page"), "CommunitiesPage") },
          { path: "profils", ...lazyComponent(() => import("./components/profiles-page"), "ProfilesHubPage") },
          { path: "profils/:type", ...lazyComponent(() => import("./components/profiles-page"), "ProfileDetailPage") },
          { path: "profils/:type/inscription", ...lazyComponent(() => import("./components/profile-registration-page"), "ProfileRegistrationPage") },
          { path: "devis", ...lazyComponent(() => import("./components/devis-page"), "DevisPage") },
          { path: "sav", ...lazyComponent(() => import("./components/sav-page"), "SavPage") },
          { path: "comite-entreprise", ...lazyComponent(() => import("./components/comite-entreprise-page"), "ComiteEntreprisePage") },
          { path: "comite-entreprise/inscription", ...lazyComponent(() => import("./components/comite-entreprise-page"), "CERegistrationPage") },
          { path: "comite-entreprise/approvisionnement", ...lazyComponent(() => import("./components/ce-approvisionnement-page"), "CEApprovisionnementPage") },
          { path: "crm", ...lazyComponent(() => import("./components/crm-page"), "CrmPage") },
          { path: "parrainage", ...lazyComponent(() => import("./components/parrainage-page"), "ParrainagePage") },
          { path: "cotation", ...lazyComponent(() => import("./components/cotation-page"), "CotationPage") },
          { path: "international", ...lazyComponent(() => import("./components/international-page"), "InternationalPage") },
          { path: "achat-groupe", ...lazyComponent(() => import("./components/achat-groupe-page"), "AchatGroupePage") },
          { path: "ressources", ...lazyComponent(() => import("./components/ressources-page"), "RessourcesPage") },
          { path: "notifications", ...lazyComponent(() => import("./components/notifications-page"), "NotificationsPage") },
          { path: "checkout", ...lazyComponent(() => import("./components/checkout-page"), "CheckoutPage") },
        ],
      },

      { path: "*", ...lazyComponent(() => import("./components/generic-page"), "GenericPage") },
    ],
  },
  {
    path: "/admin",
    Component: AdminGate,
    ErrorBoundary: RouteErrorBoundary,
    children: [{
      path: "",
      Component: AdminLayout,
      children: [
        { index: true, ...lazyComponent(() => import("./admin/dashboard-admin-page"), "AdminDashboardPage") },
        { path: "analytics", ...lazyComponent(() => import("./admin/extra-pages"), "AdminAnalyticsPage") },
        { path: "commandes", ...lazyComponent(() => import("./admin/orders-admin-page"), "AdminOrdersPage") },
        { path: "categories", ...lazyComponent(() => import("./admin/extra-pages"), "AdminCategoriesPage") },
        { path: "reversements", ...lazyComponent(() => import("./admin/extra-pages"), "AdminPayoutsPage") },
        { path: "comptabilite", ...lazyComponent(() => import("./admin/comptabilite-page"), "AdminComptabilitePage") },
        { path: "escrow", ...lazyComponent(() => import("./admin/escrow-page"), "AdminEscrowPage") },
        { path: "kyc", ...lazyComponent(() => import("./admin/kyc-page"), "AdminKycPage") },
        { path: "audit", ...lazyComponent(() => import("./admin/extra-pages"), "AdminAuditPage") },
        { path: "produits", ...lazyComponent(() => import("./admin/products-admin-page"), "AdminProductsPage") },
        { path: "vendeurs", ...lazyComponent(() => import("./admin/vendors-admin-page"), "AdminVendorsPage") },
        { path: "utilisateurs", ...lazyComponent(() => import("./admin/users-admin-page"), "AdminUsersPage") },
        { path: "abonnements", ...lazyComponent(() => import("./admin/subscriptions-admin-page"), "AdminSubscriptionsPage") },
        { path: "transactions", ...lazyComponent(() => import("./admin/transactions-admin-page"), "AdminTransactionsPage") },
        { path: "promos", ...lazyComponent(() => import("./admin/promos-admin-page"), "AdminPromosPage") },
        { path: "avis", ...lazyComponent(() => import("./admin/reviews-admin-page"), "AdminReviewsPage") },
        { path: "support", ...lazyComponent(() => import("./admin/support-admin-page"), "AdminSupportPage") },
        { path: "contenus", ...lazyComponent(() => import("./admin/content-page"), "AdminContentPage") },
        { path: "moderation", ...lazyComponent(() => import("./admin/moderation-admin-page"), "AdminModerationPage") },
        { path: "groupements-vendeurs", ...lazyComponent(() => import("./admin/vendor-groups-admin-page"), "AdminVendorGroupsPage") },
        { path: "litiges", ...lazyComponent(() => import("./admin/disputes-admin-page"), "AdminDisputesPage") },
        { path: "equipe", ...lazyComponent(() => import("./admin/team-admin-page"), "AdminTeamPage") },
        { path: "annonces", ...lazyComponent(() => import("./admin/announcements-admin-page"), "AdminAnnouncementsPage") },
        { path: "parametres", ...lazyComponent(() => import("./admin/settings-admin-page"), "AdminSettingsPage") },
      ],
    }],
  },
]);
