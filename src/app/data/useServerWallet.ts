/* ═══════════════════════════════════════════
   IPPOO — Hook wallet serveur
   Charge le solde + transactions depuis l'Edge Function et
   se ré-synchronise sur changement de session.
   ═══════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "../auth/useSession";
import { fetchWallet, type WalletSnapshot } from "./wallet-server";

export function useServerWallet(): {
  data: WalletSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { session } = useSession();
  const [data, setData] = useState<WalletSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) { setData(null); return; }
    setLoading(true); setError(null);
    try {
      const snap = await fetchWallet();
      setData(snap);
    } catch (e) {
      setError((e as Error)?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}
