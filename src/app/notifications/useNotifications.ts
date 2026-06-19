import { useSyncExternalStore } from "react";
import { SERVER_SNAPSHOT, getNotifs, subscribe } from "./store";

export function useNotifications() {
  return useSyncExternalStore(subscribe, getNotifs, () => SERVER_SNAPSHOT);
}
