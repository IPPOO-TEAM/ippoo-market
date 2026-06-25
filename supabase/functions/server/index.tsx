/* ═══════════════════════════════════════════════════════════════
   IPPOO Market — Edge Function (point d'entrée)
   Architecture orientée services : chaque domaine métier est isolé
   dans son propre module de routes (./routes/*.tsx) et monté ici sur
   une instance Hono unique. L'infrastructure transverse (client
   Supabase, auth, rate-limit, stockage, wallet, push, audit) est
   centralisée dans ./_shared.tsx.

   ⚠️ Les chemins d'URL restent identiques à l'ancienne version
   monolithique — aucun changement côté frontend n'est requis.
   ═══════════════════════════════════════════════════════════════ */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

import { PREFIX, bootstrapBucket } from "./_shared.tsx";

import { registerAuth } from "./routes/auth.tsx";
import { registerStorage } from "./routes/storage.tsx";
import { registerUserKv } from "./routes/user-kv.tsx";
import { registerVendors } from "./routes/vendors.tsx";
import { registerProducts } from "./routes/products.tsx";
import { registerGroups } from "./routes/groups.tsx";
import { registerDevis } from "./routes/devis.tsx";
import { registerPin } from "./routes/pin.tsx";
import { registerWallet } from "./routes/wallet.tsx";
import { registerOrders } from "./routes/orders.tsx";
import { registerKyc } from "./routes/kyc.tsx";
import { registerPush } from "./routes/push.tsx";
import { registerMessaging } from "./routes/messaging.tsx";
import { registerReviews } from "./routes/reviews.tsx";
import { registerShopReviews } from "./routes/shop-reviews.tsx";
import { registerSettings } from "./routes/settings.tsx";
import { registerSubscriptions } from "./routes/subscriptions.tsx";
import { registerSupport } from "./routes/support.tsx";
import { registerAdmin } from "./routes/admin.tsx";
import { registerAnnouncements } from "./routes/announcements.tsx";

const app = new Hono();
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    // `x-admin-token` : session admin autonome (whoami/logout + pages admin).
    // `apikey` / `x-client-info` : envoyés par supabase-js.
    allowHeaders: ["Content-Type", "Authorization", "x-admin-token", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Crée le bucket de stockage au démarrage si absent (idempotent).
bootstrapBucket();

// Health check
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ─── Montage des modules de services ───────────────────────────
registerAuth(app);
registerStorage(app);
registerUserKv(app);
registerVendors(app);
registerProducts(app);
registerGroups(app);
registerDevis(app);
registerPin(app);
registerWallet(app);
registerOrders(app);
registerKyc(app);
registerPush(app);
registerMessaging(app);
registerReviews(app);
registerShopReviews(app);
registerSettings(app);
registerSubscriptions(app);
registerSupport(app);
registerAdmin(app);
registerAnnouncements(app);

Deno.serve(app.fetch);
