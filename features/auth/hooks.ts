import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import {
  onAuthChange,
  toAppUser,
  ensureUserDocument,
} from "./services";

export function useAuthListener() {
  // Guard against re-entrant signOut calls inside onAuthStateChanged
  const signingOut = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (signingOut.current) return;

      if (firebaseUser) {
        // Google users are always verified; email/password users must verify
        const isGoogleUser = firebaseUser.providerData.some(
          (p) => p.providerId === "google.com"
        );

        if (!isGoogleUser && !firebaseUser.emailVerified) {
          // Unverified email user — sign them out, but guard against loop
          signingOut.current = true;
          try {
            const { signOutUser } = await import("./services");
            await signOutUser();
          } finally {
            signingOut.current = false;
          }
          return;
        }

        useAuthStore.getState().setUser(toAppUser(firebaseUser));
        ensureUserDocument(firebaseUser).catch(console.error);
      } else {
        useAuthStore.getState().setUser(null);
      }
    });
    return unsubscribe;
  }, []);
}
