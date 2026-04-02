import {
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PlayerStats, PlayerClass } from "./types";
import { DEFAULT_PLAYER_STATS } from "@/core_ui/theme";

export function subscribeToPlayerStats(
  userId: string,
  callback: (stats: PlayerStats) => void
): Unsubscribe {
  const userRef = doc(db, "users", userId);

  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        hp: data.hp ?? DEFAULT_PLAYER_STATS.hp,
        max_hp: data.max_hp ?? DEFAULT_PLAYER_STATS.max_hp,
        xp: data.xp ?? DEFAULT_PLAYER_STATS.xp,
        xp_to_next_level: data.xp_to_next_level ?? DEFAULT_PLAYER_STATS.xp_to_next_level,
        level: data.level ?? DEFAULT_PLAYER_STATS.level,
        gold: data.gold ?? DEFAULT_PLAYER_STATS.gold,
        player_class: data.player_class ?? "adventurer",
      });
    } else {
      callback({ ...DEFAULT_PLAYER_STATS });
    }
  });
}

export async function updatePlayerStats(
  userId: string,
  stats: Partial<PlayerStats>
) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, stats as any);
}

/**
 * Change the player's class. Deducts gold if not free.
 */
export async function changePlayerClass(
  userId: string,
  newClass: PlayerClass,
  currentGold: number,
  cost: number
) {
  if (currentGold < cost) {
    throw new Error(`Not enough gold. You need ${cost} gold to change class.`);
  }
  await updatePlayerStats(userId, {
    player_class: newClass,
    gold: currentGold - cost,
  });
}
