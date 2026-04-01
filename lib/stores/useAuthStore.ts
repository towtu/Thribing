import { create } from "zustand";
import type { AppUser, AuthStatus } from "@/features/auth/types";

interface AuthState {
  user: AppUser | null;
  status: AuthStatus;
  setUser: (user: AppUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",
  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
  clearAuth: () => set({ user: null, status: "unauthenticated" }),
}));
