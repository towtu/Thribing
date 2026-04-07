import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, onSnapshot,
  writeBatch, serverTimestamp, runTransaction,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Friend, UserProfile } from "./types";

// ─── Username ────────────────────────────────────────────────────────────────

/** Check if a username is available */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  return !snap.exists();
}

/** Set a unique username for a user (atomic transaction) */
export async function setUsername(
  uid: string,
  username: string,
  profile: { displayName: string; photoURL: string | null; level: number; player_class: string }
): Promise<void> {
  const lower = username.toLowerCase();
  await runTransaction(db, async (tx) => {
    const usernameDoc = doc(db, "usernames", lower);
    const snap = await tx.get(usernameDoc);
    if (snap.exists() && snap.data().uid !== uid) {
      throw new Error("Username already taken");
    }
    tx.set(usernameDoc, { uid });
    tx.set(doc(db, "userProfiles", uid), {
      uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL ?? null,
      username: lower,
      level: profile.level,
      player_class: profile.player_class,
      created_at: serverTimestamp(),
    }, { merge: true });
  });
}

/** Search for a user by exact username */
export async function searchByUsername(username: string): Promise<UserProfile | null> {
  const lower = username.toLowerCase().trim();
  if (!lower) return null;
  const q = query(collection(db, "userProfiles"), where("username", "==", lower));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    uid: data.uid,
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? null,
    username: data.username ?? "",
    level: data.level ?? 1,
    player_class: data.player_class ?? "adventurer",
    created_at: data.created_at?.toDate?.() ?? new Date(),
  };
}

/** Get the current user's username */
export async function getMyUsername(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "userProfiles", uid));
  if (!snap.exists()) return null;
  return snap.data().username ?? null;
}

// ─── Friend Requests ─────────────────────────────────────────────────────────

function friendDoc(myUid: string, friendUid: string) {
  return doc(db, "users", myUid, "friends", friendUid);
}

/** Send a friend request (dual-write) */
export async function sendFriendRequest(
  myUid: string,
  myProfile: { displayName: string; username: string; level: number; player_class: string },
  friendUid: string,
  friendProfile: { displayName: string; username: string; level: number; player_class: string }
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(friendDoc(myUid, friendUid), {
    uid: friendUid,
    status: "pending_sent",
    displayName: friendProfile.displayName,
    username: friendProfile.username,
    level: friendProfile.level,
    player_class: friendProfile.player_class,
    created_at: serverTimestamp(),
  });
  batch.set(friendDoc(friendUid, myUid), {
    uid: myUid,
    status: "pending_received",
    displayName: myProfile.displayName,
    username: myProfile.username,
    level: myProfile.level,
    player_class: myProfile.player_class,
    created_at: serverTimestamp(),
  });
  await batch.commit();
}

/** Accept a friend request (update both sides to "accepted") */
export async function acceptFriendRequest(myUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(friendDoc(myUid, friendUid), { status: "accepted" });
  batch.update(friendDoc(friendUid, myUid), { status: "accepted" });
  await batch.commit();
}

/** Decline or remove a friend (delete both sides) */
export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(friendDoc(myUid, friendUid));
  batch.delete(friendDoc(friendUid, myUid));
  await batch.commit();
}

/** Subscribe to all friend documents for a user */
export function subscribeToFriends(
  uid: string,
  callback: (friends: Friend[]) => void
): Unsubscribe {
  const q = collection(db, "users", uid, "friends");
  return onSnapshot(q, (snap) => {
    const friends: Friend[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        status: data.status,
        displayName: data.displayName ?? "",
        username: data.username ?? "",
        level: data.level ?? 1,
        player_class: data.player_class ?? "adventurer",
        created_at: data.created_at?.toDate?.() ?? new Date(),
      };
    });
    callback(friends);
  });
}

/** Sync updated level/class to userProfiles (call when player stats change) */
export async function syncUserProfile(
  uid: string,
  updates: { level?: number; player_class?: string; displayName?: string }
): Promise<void> {
  const ref = doc(db, "userProfiles", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, updates);
  }
}

/** Create userProfile if it doesn't exist (call on first auth) */
export async function ensureUserProfile(
  uid: string,
  data: { displayName: string | null; photoURL: string | null; level: number; player_class: string }
): Promise<void> {
  const ref = doc(db, "userProfiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName: data.displayName ?? "",
      photoURL: data.photoURL ?? null,
      username: null,
      level: data.level,
      player_class: data.player_class,
      created_at: serverTimestamp(),
    });
  }
}
