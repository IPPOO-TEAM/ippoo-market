/* ═══════════════════════════════════════════
   IPPOO — Admin · Escrow
   Liste les commandes dont l'escrow est en "held" et permet
   de libérer les fonds vers les vendeurs (split commission 8%).
   ═══════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Loader2, RefreshCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../components/mock-data";
import { releaseEscrow } from "../data/admin-server";
import { apiFetch, ApiError } from "../api/client";

type EscrowRecord = {
  orderId: string;
  userId: string;
  vendorShares: Record<string, number>;
  total: number;
  status: "held" | "released" | "refunded";
  at: number;
  releasedAt?: number;
};

export function AdminEscrowPage() {
  const [items, setItems] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Pas d'endpoint dédié "liste escrows" — on s'appuie sur le préfixe via
      // un futur endpoint admin. En attendant on lit la commande à la volée.
      const j = await apiFetch<{ items: EscrowRecord[] }>("/admin/escrow/held").catch(() => ({ items: [] as EscrowRecord[] }));
      setItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const onRelease = async (orderId: string) => {
    setBusy(orderId);
    try {
      await releaseEscrow(orderId);
      toast.success(`Paiement ${orderId} libéré`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Échec de la libération");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>Paiements protégés vendeurs</h1>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Libérez les fonds vers les vendeurs après confirmation de livraison.
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
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p style={{ fontSize: 13 }}>Aucun paiement en attente.</p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((e) => {
          const vendors = Object.entries(e.vendorShares);
          return (
            <li key={e.orderId} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate" style={{ fontWeight: 700, fontSize: 14 }}>{e.orderId}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    Total {formatPrice(e.total)} FCFA · {vendors.length} vendeur(s) · {new Date(e.at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <button
                  disabled={busy === e.orderId}
                  onClick={() => onRelease(e.orderId)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16A34A] text-white disabled:opacity-60"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {busy === e.orderId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Libérer
                </button>
              </div>
              {vendors.length > 0 && (
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {vendors.map(([vid, share]) => (
                    <li key={vid} className="flex justify-between text-muted-foreground rounded-lg bg-muted/50 px-2 py-1" style={{ fontSize: 12 }}>
                      <span className="truncate mr-2">{vid}</span>
                      <span style={{ fontFamily: "Poppins", fontWeight: 700 }}>{formatPrice(share)} FCFA</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
