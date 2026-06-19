import { useNavigate } from "react-router";
import { ArrowLeft, Home, Search, AlertTriangle } from "lucide-react";

export function GenericPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-24">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Page introuvable</h3>
      </div>

      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-10 h-10 text-[#F97316]" />
        </div>
        <h1 className="mb-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 28, color: "#1A1A2E" }}>
          404
        </h1>
        <h2 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
          Page introuvable
        </h2>
        <p className="text-muted-foreground mb-6" style={{ fontSize: 14, lineHeight: 1.6 }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
          Retournez à l'accueil ou explorez le catalogue.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-[#FF6A00] to-[#FF4400] flex items-center gap-2 active:scale-95 transition-transform"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
          <button
            onClick={() => navigate("/explorer")}
            className="px-5 py-3 rounded-xl border-2 border-[#E11D2E] text-[#E11D2E] flex items-center gap-2 active:scale-95 transition-transform"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
          >
            <Search className="w-4 h-4" /> Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
