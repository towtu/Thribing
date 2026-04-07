import { create } from "zustand";
import type { GroupHabit, GroupMember, GroupInvite } from "@/features/groups/types";

interface GroupState {
  groups: GroupHabit[];
  groupMembers: Record<string, GroupMember[]>;
  invites: GroupInvite[];
  loading: boolean;
  setGroups: (groups: GroupHabit[]) => void;
  setGroupMembers: (groupId: string, members: GroupMember[]) => void;
  setInvites: (invites: GroupInvite[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useGroupStore = create<GroupState>()((set) => ({
  groups: [],
  groupMembers: {},
  invites: [],
  loading: true,
  setGroups: (groups) => set({ groups }),
  setGroupMembers: (groupId, members) =>
    set((state) => ({ groupMembers: { ...state.groupMembers, [groupId]: members } })),
  setInvites: (invites) => set({ invites }),
  setLoading: (loading) => set({ loading }),
}));
