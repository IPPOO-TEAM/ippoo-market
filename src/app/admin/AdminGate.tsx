import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Shield, Lock, ShieldAlert, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { loginAdmin, getLockoutRemaining, useAdminAccess, logoutAdmin } from "./auth";

export function AdminGate() {
  const access = useAdminAccess();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockoutMs, setLockoutMs] = useState(() => getLockoutRemaining());

  useEffect(() => {
    if (access.pinAuthorized) return;
    const tick = () => setLockoutMs(getLockoutRemaining());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [access.pinAuthorized]);

  // 1. Chargement initial : on vérifie d'abord côté serveur
  if (access.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Vérification du rôle administrateur…</p>
        </div>
      </div>
    );
  }

  // 2. Pas autorisé côté serveur → refus net
  if (!access.serverAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6 text-[#E11D2E]" />
          </div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#0F172A" }}>
            Accès refusé
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            {access.email
              ? <>L'email <b>{access.email}</b> n'est pas dans la liste des administrateurs autorisés.</>
              : <>Connecte-toi avec un compte administrateur, puis recharge cette page.</>}
          </p>
          {access.error && (
            <p className="text-[#E11D2E] mt-3" style={{ fontSize: 11, fontWeight: 600 }}>
              {access.error}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => { void access.refresh(); }}
              className="w-full px-4 py-2.5 rounded-xl border border-border"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Re-vérifier
            </button>
            <button
              onClick={() => navigate("/connexion")}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] text-white"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              Changer de compte
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 rounded-xl"
              style={{ fontSize: 12, color: "#64748B" }}
            >
              Retour à la marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Serveur ok mais PIN local non saisi → demande PIN
  if (!access.pinAuthorized) {
    const locked = lockoutMs > 0;
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      const r = loginAdmin(pin);
      if (!r.ok) {
        setError(r.error);
        setPin("");
        return;
      }
      setError(null);
      toast.success("Bienvenue dans le back-office");
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>IPPOO Admin</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                {access.email} · 2ᵉ facteur PIN
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>PIN administrateur</span>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(null); }}
                  placeholder="••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30 tracking-widest text-center"
                  style={{ fontSize: 18, fontWeight: 700 }}
                />
              </div>
            </label>

            {error && (
              <p className="text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>{error}</p>
            )}

            {locked && (
              <p className="text-[#E11D2E] text-center" style={{ fontSize: 12, fontWeight: 700 }}>
                Verrouillé · réessayez dans {Math.ceil(lockoutMs / 1000)}s
              </p>
            )}

            <button
              type="submit"
              disabled={pin.length < 4 || locked}
              className="w-full px-4 py-2.5 rounded-xl bg-[#E11D2E] text-white disabled:opacity-50"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              Se connecter
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { logoutAdmin(); void access.refresh(); }}
                className="flex-1 px-3 py-2 rounded-xl border border-border flex items-center justify-center gap-1"
                style={{ fontSize: 12 }}
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 px-3 py-2 rounded-xl border border-border"
                style={{ fontSize: 12 }}
              >
                Marketplace
              </button>
            </div>

            <p className="text-muted-foreground text-center pt-2" style={{ fontSize: 10 }}>
              PIN par défaut : 1234 · modifiable dans Paramètres
            </p>
          </form>
        </div>
      </div>
    );
  }

  // 4. Tout est vert
  return <Outlet />;
}
