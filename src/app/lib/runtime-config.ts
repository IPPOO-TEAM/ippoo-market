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

import { projectId, publicAnonKey } from "/utils/supabase/info";

const env = (import.meta as any).env ?? {};

function pick(key: string, fallback = ""): string {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

/** URL racine du projet Supabase (self-hosted ou cloud). */
export const SUPABASE_URL = pick(
  "VITE_SUPABASE_URL",
  `https://${projectId}.supabase.co`,
);

/** Clé anonyme publique Supabase (publique par design, peut être bundlée). */
export const SUPABASE_ANON_KEY = pick("VITE_SUPABASE_ANON_KEY", publicAnonKey);

/** Base des Edge Functions. Surchargeable si le routage diffère en self-hosted. */
export const FUNCTIONS_BASE = pick(
  "VITE_SUPABASE_FUNCTIONS_URL",
  `${SUPABASE_URL}/functions/v1/make-server-cc347259`,
);

/** Clé publique FedaPay (pk_…). La clé secrète reste côté serveur. */
export const FEDAPAY_PUBLIC_KEY = pick("VITE_FEDAPAY_PUBLIC_KEY", "");

/** True si on tourne sur une infra self-hosted explicitement configurée. */
export const IS_SELF_HOSTED = !!pick("VITE_SUPABASE_URL");
