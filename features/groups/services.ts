import {
  doc, collection, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
  query, where, onSnapshot, writeBatch, arrayUnion, arrayRemove,
  serverTimestamp, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GroupHabit, GroupMember, GroupInvite } from "./types";
import type { Difficulty } from "@/features/tasks/types";

function groupDoc(groupId: string) {
  return doc(db, "groupHabits", groupId);
}
function memberDoc(groupId: string, uid: string) {
  return doc(db, "groupHabits", groupId, "members", uid);
}
function inviteDoc(uid: string, groupId: string) {
  return doc(db, "users", uid, "groupInvites", groupId);
}

function docToGroup(d: any): GroupHabit {
  const data = d.data();
  return {
    id: d.id,
    title: data.title ?? "",
    notes: data.notes ?? "",
    difficulty: data.difficulty ?? 1,
    weekly_target: data.weekly_target ?? 1,
    session_target_count: data.session_target_count ?? null,
    session_unit: data.session_unit ?? null,
    created_by: data.created_by ?? "",
    member_uids: data.member_uids ?? [],
    created_at: data.created_at?.toDate?.() ?? new Date(),
  };
}

function docToMember(d: any): GroupMember {
  const data = d.data();
  return {
    uid: d.id,
    displayName: data.displayName ?? "",
    username: data.username ?? "",
    player_class: data.player_class ?? "adventurer",
    level: data.level ?? 1,
    status: data.status ?? "invited",
    weekly_completions: data.weekly_completions ?? [],
    session_current_count: data.session_current_count ?? 0,
    streak: data.streak ?? 0,
    joined_at: data.joined_at?.toDate?.() ?? new Date(),
  };
}

/** Create a new group habit (creator becomes first active member) */
export async function createGroupHabit(
  creatorUid: string,
  creatorProfile: { displayName: string; username: string; player_class: string; level: number },
  input: {
    title: string;
    notes?: string;
    difficulty: Difficulty;
    weekly_target: number;
    session_target_count?: number | null;
    session_unit?: string | null;
  }
): Promise<string> {
  const groupRef = await addDoc(collection(db, "groupHabits"), {
    title: input.title,
    notes: input.notes ?? "",
    difficulty: input.difficulty,
    weekly_target: input.weekly_target,
    session_target_count: input.session_target_count ?? null,
    session_unit: input.session_unit ?? null,
    created_by: creatorUid,
    member_uids: [creatorUid],
    created_at: serverTimestamp(),
  });

  await setDoc(memberDoc(groupRef.id, creatorUid), {
    uid: creatorUid,
    displayName: creatorProfile.displayName,
    username: creatorProfile.username,
    player_class: creatorProfile.player_class,
    level: creatorProfile.level,
    status: "active",
    weekly_completions: [],
    session_current_count: 0,
    streak: 0,
    joined_at: serverTimestamp(),
  });

  return groupRef.id;
}

/** Invite a friend to a group habit */
export async function inviteToGroup(
  groupId: string,
  groupTitle: string,
  inviterUid: string,
  inviterName: string,
  friendUid: string,
  friendProfile: { displayName: string; username: string; player_class: string; level: number }
): Promise<void> {
  const batch = writeBatch(db);

  batch.set(memberDoc(groupId, friendUid), {
    uid: friendUid,
    displayName: friendProfile.displayName,
    username: friendProfile.username,
    player_class: friendProfile.player_class,
    level: friendProfile.level,
    status: "invited",
    weekly_completions: [],
    session_current_count: 0,
    streak: 0,
    joined_at: serverTimestamp(),
  });

  batch.set(inviteDoc(friendUid, groupId), {
    groupId,
    title: groupTitle,
    invited_by: inviterUid,
    invited_by_name: inviterName,
    created_at: serverTimestamp(),
  });

  batch.update(groupDoc(groupId), {
    member_uids: arrayUnion(friendUid),
  });

  await batch.commit();
}

/** Accept a group invite */
export async function acceptGroupInvite(uid: string, groupId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(memberDoc(groupId, uid), { status: "active" });
  batch.delete(inviteDoc(uid, groupId));
  await batch.commit();
}

/** Decline a group invite */
export async function declineGroupInvite(uid: string, groupId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(memberDoc(groupId, uid));
  batch.delete(inviteDoc(uid, groupId));
  batch.update(groupDoc(groupId), { member_uids: arrayRemove(uid) });
  await batch.commit();
}

/** Leave a group */
export async function leaveGroup(uid: string, groupId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(memberDoc(groupId, uid));
  batch.update(groupDoc(groupId), { member_uids: arrayRemove(uid) });
  await batch.commit();
}

/** Log a completion for a group member today */
export async function logGroupCompletion(
  groupId: string,
  uid: string,
  currentCompletions: string[]
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  if (currentCompletions.includes(today)) return;
  await updateDoc(memberDoc(groupId, uid), {
    weekly_completions: [...currentCompletions, today],
  });
}

/** Undo today's group completion */
export async function undoGroupCompletion(
  groupId: string,
  uid: string,
  currentCompletions: string[]
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await updateDoc(memberDoc(groupId, uid), {
    weekly_completions: currentCompletions.filter((d) => d !== today),
  });
}

/** Increment session progress for a group member */
export async function incrementGroupSession(
  groupId: string,
  uid: string,
  newCount: number,
  targetCount: number,
  currentCompletions: string[]
): Promise<{ autoLogged: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  if (newCount >= targetCount) {
    const newCompletions = currentCompletions.includes(today)
      ? currentCompletions
      : [...currentCompletions, today];
    await updateDoc(memberDoc(groupId, uid), {
      session_current_count: 0,
      weekly_completions: newCompletions,
    });
    return { autoLogged: !currentCompletions.includes(today) };
  } else {
    await updateDoc(memberDoc(groupId, uid), { session_current_count: newCount });
    return { autoLogged: false };
  }
}

/** Subscribe to all groups the user is active in */
export function subscribeToMyGroups(
  uid: string,
  callback: (groups: GroupHabit[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "groupHabits"),
    where("member_uids", "array-contains", uid)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToGroup));
  });
}

/** Subscribe to members of a specific group */
export function subscribeToGroupMembers(
  groupId: string,
  callback: (members: GroupMember[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, "groupHabits", groupId, "members"), (snap) => {
    callback(snap.docs.map(docToMember).filter((m) => m.status !== "left"));
  });
}

/** Subscribe to group invites for a user */
export function subscribeToGroupInvites(
  uid: string,
  callback: (invites: GroupInvite[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, "users", uid, "groupInvites"), (snap) => {
    callback(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          groupId: d.id,
          title: data.title ?? "",
          invited_by: data.invited_by ?? "",
          invited_by_name: data.invited_by_name ?? "",
          created_at: data.created_at?.toDate?.() ?? new Date(),
        };
      })
    );
  });
}
