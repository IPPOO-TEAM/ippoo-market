/* ═══════════════════════════════════════════════════════════════
   IPPOO — Couche d'accès relationnel (transition KV → Postgres)
   `tableReady`/`resetTableCache` vivent désormais dans _shared.tsx
   (afin que les helpers wallet partagés puissent les utiliser sans
   cycle d'import). Ce module reste le point d'entrée des modules de
   domaine et réexporte le client + les utilitaires de table.
   ═══════════════════════════════════════════════════════════════ */

export { supabase, tableReady, resetTableCache } from "./_shared.tsx";
