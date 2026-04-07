import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useGroupStore } from "@/lib/stores/useGroupStore";
import {
  subscribeToMyGroups,
  subscribeToGroupInvites,
  subscribeToGroupMembers,
} from "./services";

/** Subscribe to groups and invites for the current user */
export function useGroupSubscription() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { setGroups, setInvites, setGroupMembers, setLoading } = useGroupStore();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const unsubGroups = subscribeToMyGroups(uid, (groups) => {
      setGroups(groups);
      setLoading(false);
    });
    const unsubInvites = subscribeToGroupInvites(uid, setInvites);

    return () => {
      unsubGroups();
      unsubInvites();
    };
  }, [uid]);
}

/** Subscribe to members of a specific group */
export function useGroupMembers(groupId: string | null) {
  const setGroupMembers = useGroupStore((s) => s.setGroupMembers);

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroupMembers(groupId, (members) => {
      setGroupMembers(groupId, members);
    });
    return () => unsub();
  }, [groupId]);
}
