import { useSyncExternalStore, useEffect } from "react";
import { getAdminState, subscribeAdmin, hydrateAdmin } from "./data";

export function useAdmin() {
  useEffect(() => { void hydrateAdmin(); }, []);
  return useSyncExternalStore(subscribeAdmin, getAdminState, getAdminState);
}

export function refreshAdmin() { return hydrateAdmin(true); }
