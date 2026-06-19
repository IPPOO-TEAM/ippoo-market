/* ═══════════════════════════════════════════
   IPPOO — Hook session Supabase (réactif)
   Émet l'état session + suit auth.onAuthStateChange.
   ═══════════════════════════════════════════ */

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { broadcastAuth, subscribeAuth } from "./cross-tab";

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!dead) {
        setSession(data.session ?? null);
        setLoading(false);
        if (data.session) {
          void import("../notifications/web-push").then((m) => m.syncPushSubscription()).catch(() => undefined);
        }
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (dead) return;
      setSession(s ?? null);
      if (event === "SIGNED_OUT") broadcastAuth("logout");
      else if (event === "SIGNED_IN") {
        broadcastAuth("login");
        void import("../notifications/web-push").then((m) => m.syncPushSubscription()).catch(() => undefined);
      }
    });
    const unsub = subscribeAuth(async (ev) => {
      if (dead) return;
      if (ev.type === "logout") {
        const { data } = await sb.auth.getSession();
        if (!data.session) setSession(null);
      } else if (ev.type === "login") {
        const { data } = await sb.auth.getSession();
        setSession(data.session ?? null);
      }
    });
    return () => { dead = true; sub.subscription.unsubscribe(); unsub(); };
  }, []);

  return { session, loading };
}
