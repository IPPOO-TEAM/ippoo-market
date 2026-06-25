/* ═══════════════════════════════════════════
   IPPOO — AdminGate (auth admin AUTONOME)
   ─────────────────────────────────────────
   Aucun lien avec le compte utilisateur Supabase. L'admin saisit
   email + mot de passe → vérification serveur (IPPOO_ADMIN_EMAILS +
   IPPOO_ADMIN_PASSWORD) → token signé HMAC stocké séparément.
   PIN local en 2ᵉ facteur (verrouille l'onglet).
   ═══════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Shield, Lock, Mail, KeyRound, Loader2, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  loginAdminServer,
  logoutAdminServer,
  useAdminWhoami,
  getAdminEmail,
} from "./admin-session";
import { loginAdmin as validatePin, getLockoutRemaining, useAdminAuth, logoutAdmin as clearPin } from "./auth";

export function AdminGate() {
  const navigate = useNavigate();
  const whoami = useAdminWhoami();
  const pinAuthorized = useAdminAuth();

  const [email, setEmail] = useState(() => getAdminEmail() ?? "");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutMs, setLockoutMs] = useState(() => getLockoutRemaining());

  useEffect(() => {
    if (pinAuthorized) return;
    const tick = () => setLockoutMs(getLockoutRemaining());
    const id = setInterval(tick, 1000); tick();
    return () => clearInterval(id);
  }, [pinAuthorized]);

  /* ─── 1. Vérification de la session serveur (au boot) ─── */
  if (whoami.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Vérification de la session admin…</p>
        </div>
      </div>
    );
  }

  /* ─── 2. Pas connecté admin → formulaire email+password ─── */
  if (!whoami.isAdmin) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true); setError(null);
      const r = await loginAdminServer(email.trim(), password);
      setSubmitting(false);
      if (!r.ok) { setError(r.error); setPassword(""); return; }
      toast.success("Authentification admin réussie");
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D2E] to-[#BE123C] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>IPPOO Admin</p>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>Accès réservé administrateurs</p>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 shrink-0" />
            <p className="text-foreground/80" style={{ fontSize: 11 }}>
              Cet espace est <strong>strictement séparé</strong> des comptes utilisateurs et vendeurs.
              Seuls les emails autorisés par le serveur peuvent s'y connecter.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Email administrateur</span>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" autoComplete="username" required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="admin@ippoo.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
                  style={{ fontSize: 13 }}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Mot de passe administrateur</span>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" autoComplete="current-password" required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
                  style={{ fontSize: 13 }}
                />
              </div>
            </label>

            {error && (
              <p className="text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full px-4 py-2.5 rounded-xl bg-[#E11D2E] text-white disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Se connecter
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full px-3 py-2 rounded-xl text-muted-foreground"
              style={{ fontSize: 12 }}
            >
              Retour à la marketplace
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── 3. Connecté serveur → 2ᵉ facteur PIN local ─── */
  if (!pinAuthorized) {
    const locked = lockoutMs > 0;
    const submitPin = (e: React.FormEvent) => {
      e.preventDefault();
      const r = validatePin(pin);
      if (!r.ok) { setError(r.error); setPin(""); return; }
      setError(null);
      toast.success("Bienvenue dans le back-office");
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D2E] to-[#BE123C] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>IPPOO Admin</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                {whoami.email} · 2ᵉ facteur PIN
              </p>
            </div>
          </div>

          <form onSubmit={submitPin} className="space-y-3">
            <label className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>PIN administrateur</span>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" inputMode="numeric" autoFocus
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(null); }}
                  placeholder="••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30 tracking-widest text-center"
                  style={{ fontSize: 18, fontWeight: 700 }}
                />
              </div>
            </label>

            {error && <p className="text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>{error}</p>}
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
              Valider
            </button>

            <button
              type="button"
              onClick={async () => { clearPin(); await logoutAdminServer(); navigate("/"); }}
              className="w-full px-3 py-2 rounded-xl border border-border inline-flex items-center justify-center gap-1"
              style={{ fontSize: 12 }}
            >
              <LogOut className="w-3.5 h-3.5" /> Déconnexion admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── 4. Tout OK → on rend le back-office ─── */
  return <Outlet />;
}
