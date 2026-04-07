import { create } from "zustand";
import type { Friend } from "@/features/friends/types";

interface FriendsState {
  friends: Friend[];
  pendingReceived: Friend[];
  pendingSent: Friend[];
  username: string | null;
  loading: boolean;
  setFriends: (all: Friend[]) => void;
  setUsername: (username: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useFriendsStore = create<FriendsState>()((set) => ({
  friends: [],
  pendingReceived: [],
  pendingSent: [],
  username: null,
  loading: true,

  setFriends: (all) =>
    set({
      friends: all.filter((f) => f.status === "accepted"),
      pendingReceived: all.filter((f) => f.status === "pending_received"),
      pendingSent: all.filter((f) => f.status === "pending_sent"),
    }),

  setUsername: (username) => set({ username }),
  setLoading: (loading) => set({ loading }),
}));
