/* Circuit breaker for the optional Supabase backend.
   When the edge function isn't reachable, mark it offline for the rest
   of the session so we don't spam the console with retries. */

import { logger } from "./logger";

let offline = false;

export function isBackendOffline(): boolean {
  return offline;
}

export function markBackendOffline(source: string, err: unknown): void {
  if (offline) return;
  offline = true;
  logger.warn(`Backend unreachable (${source}): ${(err as Error)?.message ?? err}. Subsequent calls will use cached data only.`);
}

/** True if the error is a network-level failure (Failed to fetch, abort, etc.). */
export function isNetworkError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? String(err);
  return (
    err instanceof TypeError ||
    /Failed to fetch|NetworkError|Network request failed|fetch failed/i.test(msg)
  );
}
