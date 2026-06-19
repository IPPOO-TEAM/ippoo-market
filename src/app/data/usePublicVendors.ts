import { useEffect, useSyncExternalStore } from "react";
import {
  getPublicVendors,
  refreshPublicVendors,
  subscribePublicVendors,
  SERVER_SNAPSHOT,
  type PublicVendor,
} from "./public-vendors";

export function usePublicVendors(): PublicVendor[] {
  const items = useSyncExternalStore(
    subscribePublicVendors,
    getPublicVendors,
    () => SERVER_SNAPSHOT,
  );
  useEffect(() => {
    refreshPublicVendors().catch(() => undefined);
  }, []);
  return items;
}
