import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { onAuthChange, toAppUser, ensureUserDocument } from "./services";

/**
 * Subscribes to Firebase onAuthStateChanged and syncs with Zustand store.
 * Also ensures a Firestore user document exists on sign-in.
 * Call this once in the root layout.
 */
export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(toAppUser(firebaseUser));
        // Create Firestore doc if first time (fire-and-forget, don't block UI)
        ensureUserDocument(firebaseUser).catch(console.error);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, [setUser, setStatus]);
}
