/* ═══════════════════════════════════════════
   IPPOO — Garde d'authentification
   Bloque l'accès aux pages privées si l'utilisateur n'est pas connecté.
   Redirige vers /connexion en mémorisant la destination pour revenir
   automatiquement après login.
   ═══════════════════════════════════════════ */

import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useSession } from "./useSession";

export function RequireAuth() {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#E11D2E]" />
      </div>
    );
  }

  if (!session) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/connexion?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}
