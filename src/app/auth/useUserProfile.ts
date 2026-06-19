import { useSyncExternalStore } from "react";
import { SERVER_SNAPSHOT, getUserProfile, subscribe } from "./user-profile";

export function useUserProfile() {
  return useSyncExternalStore(subscribe, getUserProfile, () => SERVER_SNAPSHOT);
}
