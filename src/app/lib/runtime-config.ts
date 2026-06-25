/* ═══════════════════════════════════════════
   IPPOO — Configuration runtime (frontend)
   Source unique de vérité pour les URLs/clés publiques.

   Priorité de résolution :
   1. Variables d'environnement Cloudflare/Vite (VITE_*) — production
   2. Fichier auto-généré Figma (utils/supabase/info) — preview Figma

   ⚠️ Ne contient QUE des valeurs publiques (URL + anon key Supabase,
   clés "public"/"publishable" des prestataires). Les secrets
   (service-role, FedaPay secret, Resend, Google Translate) ne sont
   JAMAIS ici : ils vivent côté serveur (secrets Edge Function / Worker).
   ═══════════════════════════════════════════ */

import { publicAnonKey } from "/utils/supabase/info";

const env = (import.meta as any).env ?? {};

function pick(key: string, fallback = ""): string {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

/* ── Instance IPPOO self-hosted (valeurs PUBLIQUES, sûres à committer) ──
   URL Kong + clé anonyme. Surchargeables par variables d'env Cloudflare
   (VITE_*) sans toucher au code. Les SECRETS (service-role, JWT secret,
   mot de passe Postgres) ne sont JAMAIS ici : ils restent côté serveur. */
const SELF_HOSTED_URL = "https://ippoomarketdatabase.ippoo-aptdc.com";
const SELF_HOSTED_ANON_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MjM0NDk0MCwiZXhwIjo0OTM4MDE4NTQwLCJyb2xlIjoiYW5vbiJ9.Z6jNjLS7oLdnCy8l827G7FdUoaElRJnCTYLpb6yGjsU";

/** URL racine du projet Supabase (self-hosted ou cloud). */
export const SUPABASE_URL = pick("VITE_SUPABASE_URL", SELF_HOSTED_URL);

/** Clé anonyme publique Supabase (publique par design, peut être bundlée). */
export const SUPABASE_ANON_KEY = pick("VITE_SUPABASE_ANON_KEY", SELF_HOSTED_ANON_KEY || publicAnonKey);

/** Base des Edge Functions. Surchargeable si le routage diffère en self-hosted. */
export const FUNCTIONS_BASE = pick(
  "VITE_SUPABASE_FUNCTIONS_URL",
  `${SUPABASE_URL}/functions/v1/make-server-cc347259`,
);

/** Clé publique FedaPay (pk_…). La clé secrète reste côté serveur. */
export const FEDAPAY_PUBLIC_KEY = pick("VITE_FEDAPAY_PUBLIC_KEY", "");

/** True si on pointe vers l'instance self-hosted IPPOO (et non le cloud Figma). */
export const IS_SELF_HOSTED = SUPABASE_URL === SELF_HOSTED_URL || !!pick("VITE_SUPABASE_URL");
