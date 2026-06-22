/* ═══════════════════════════════════════════
   IPPOO - Admin · KYC
   Liste les dossiers KYC en attente et permet d'approuver / rejeter.
   ═══════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Loader2, RefreshCcw, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { decideKyc, listPendingKyc, type KycPending } from "../data/admin-server";
import { ApiError } from "../api/client";

export function AdminKycPage() {
  const [items, setItems] = useState<KycPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list = await listPendingKyc();
      setItems(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const onDecide = async (userId: string, decision: "approved" | "rejected") => {
    setBusy(userId);
    try {
      const reason = reasons[userId]?.trim() || undefined;
      await decideKyc({ userId, decision, reason });
      toast.success(decision === "approved" ? `KYC ${userId} approuvé` : `KYC ${userId} rejeté`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Échec de la décision KYC");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>Vérifications KYC</h1>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Approuvez ou rejetez les dossiers d'identité en attente.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          <RefreshCcw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 13 }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 px-3 py-2" style={{ fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground rounded-2xl border border-dashed border-border">
          <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p style={{ fontSize: 13 }}>Aucun dossier KYC en attente.</p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((k) => {
          const uid = k.userId ?? "-";
          return (
            <li key={uid} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="truncate" style={{ fontWeight: 700, fontSize: 14 }}>{uid}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    Statut : {k.status ?? "pending"}
                    {k.decidedAt ? ` · ${new Date(k.decidedAt).toLocaleString("fr-FR")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={busy === uid}
                    onClick={() => onDecide(uid, "approved")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-60"
                    style={{ fontSize: 13, fontWeight: 700 }}
                  >
                    {busy === uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approuver
                  </button>
                  <button
                    disabled={busy === uid}
                    onClick={() => onDecide(uid, "rejected")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white disabled:opacity-60"
                    style={{ fontSize: 13, fontWeight: 700 }}
                  >
                    {busy === uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                    Rejeter
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={reasons[uid] ?? ""}
                onChange={(e) => setReasons((r) => ({ ...r, [uid]: e.target.value }))}
                placeholder="Motif (optionnel, requis pour un rejet)"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-border bg-white outline-none focus:border-[#E11D2E]"
                style={{ fontSize: 13 }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
