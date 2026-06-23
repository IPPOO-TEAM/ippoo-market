import { logger } from "../lib/logger";
/* ═══════════════════════════════════════════
   IPPOO - Client Supabase singleton (frontend)
   ═══════════════════════════════════════════ */

import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/runtime-config";

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storage: localStorage },
    });
  }
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch (e) {
    logger.warn(`getAccessToken error: ${e}`);
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session;
  } catch { return null; }
}
