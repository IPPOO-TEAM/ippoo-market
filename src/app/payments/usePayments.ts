import { useSyncExternalStore } from "react";
import { getState, subscribe, SERVER_SNAPSHOT } from "./store";

export function usePayments() {
  return useSyncExternalStore(subscribe, getState, () => SERVER_SNAPSHOT);
}
