import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useFriendsStore } from "@/lib/stores/useFriendsStore";
import { subscribeToFriends, getMyUsername, syncUserProfile, ensureUserProfile } from "./services";

/** Subscribe to the current user's friends in real-time */
export function useFriendsSubscription() {
  const uid = useAuthStore((s) => s.user?.uid);
  const setFriends = useFriendsStore((s) => s.setFriends);
  const setLoading = useFriendsStore((s) => s.setLoading);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = subscribeToFriends(uid, (friends) => {
      setFriends(friends);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);
}

/** Ensure the user's public profile exists and load their username */
export function useUserProfile() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.player_class);
  const setUsername = useFriendsStore((s) => s.setUsername);

  useEffect(() => {
    if (!uid || !user) return;
    ensureUserProfile(uid, {
      displayName: user.displayName,
      photoURL: user.photoURL,
      level,
      player_class: playerClass,
    }).catch(console.error);
    getMyUsername(uid).then((username) => setUsername(username)).catch(console.error);
  }, [uid]);
}
