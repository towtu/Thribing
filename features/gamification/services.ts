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
        gold_earned_today: data.gold_earned_today ?? 0,
        gold_reset_date: data.gold_reset_date ?? "",
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

// ─── Shop / Potions ───────────────────────────────────────────────────────────

export const POTIONS = [
  { id: "small" as const,  name: "Small Potion",  hp: 20,  cost: 10, emoji: "🧪" },
  { id: "medium" as const, name: "Medium Potion", hp: 50,  cost: 25, emoji: "⚗️" },
  { id: "large" as const,  name: "Large Potion",  hp: 100, cost: 50, emoji: "🔮" },
];

export type PotionId = "small" | "medium" | "large";

/**
 * Buy a potion: deduct gold, restore HP (capped at max_hp).
 * Returns updated { hp, gold } values.
 */
export async function buyPotion(
  userId: string,
  potionId: PotionId,
  currentStats: PlayerStats
): Promise<{ newHp: number; newGold: number }> {
  const potion = POTIONS.find((p) => p.id === potionId);
  if (!potion) throw new Error("Invalid potion");
  if (currentStats.gold < potion.cost) throw new Error("Not enough gold");

  const newHp = Math.min(currentStats.max_hp, currentStats.hp + potion.hp);
  const newGold = currentStats.gold - potion.cost;

  await updatePlayerStats(userId, { hp: newHp, gold: newGold });
  return { newHp, newGold };
}
