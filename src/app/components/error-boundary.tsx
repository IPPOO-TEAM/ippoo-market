import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export function RouteErrorBoundary() {
  const error = useRouteError() as unknown;
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Une erreur inattendue est survenue";
  const stack = error instanceof Error ? error.stack : "";
  // eslint-disable-next-line no-console
  console.error("[IPPOO ErrorBoundary]", error);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#FFF7ED] to-[#FEE2E2]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#E11D2E]" />
          </div>
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Oups, un souci est survenu</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>IPPOO Market</p>
          </div>
        </div>
        <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>
          {message}
        </p>
        {stack && (
          <pre className="text-muted-foreground mb-3 max-h-48 overflow-auto bg-muted/40 rounded-lg p-2" style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>
            {stack}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { window.location.reload(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center gap-2"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <RefreshCw className="w-4 h-4" /> Recharger
          </button>
          <button
            onClick={() => { navigate("/"); setTimeout(() => window.location.reload(), 50); }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border flex items-center justify-center gap-2"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
