import type { Difficulty } from "@/features/tasks/types";
import type { PlayerStats } from "./types";
import { XP_PER_LEVEL } from "@/core_ui/theme";

/** XP and Gold rewards by difficulty level. */
const REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  1: { xp: 5, gold: 2 },
  2: { xp: 10, gold: 5 },
  3: { xp: 15, gold: 10 },
};

/** HP damage for missed/overdue dailies by difficulty. */
const DAMAGE: Record<Difficulty, number> = {
  1: 2,
  2: 5,
  3: 10,
};

/** Maximum gold earnable per day from tasks. */
export const DAILY_GOLD_CAP = 50;

export function calculateReward(difficulty: Difficulty) {
  return REWARDS[difficulty] ?? REWARDS[1];
}

export function calculateDamage(difficulty: Difficulty) {
  return DAMAGE[difficulty] ?? DAMAGE[1];
}

/**
 * Process a task completion: add XP + Gold (respecting daily gold cap), handle level-ups.
 */
export function processTaskCompletion(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const reward = calculateReward(difficulty);

  // Gold cap: only award up to remaining daily allowance
  const remainingGold = Math.max(0, DAILY_GOLD_CAP - currentStats.gold_earned_today);
  const actualGold = Math.min(reward.gold, remainingGold);

  let newXp = currentStats.xp + reward.xp;
  let newLevel = currentStats.level;
  let newXpToNext = currentStats.xp_to_next_level;

  while (newXp >= newXpToNext) {
    newXp -= newXpToNext;
    newLevel += 1;
    newXpToNext = newLevel * XP_PER_LEVEL;
  }

  return {
    ...currentStats,
    xp: newXp,
    level: newLevel,
    xp_to_next_level: newXpToNext,
    gold: currentStats.gold + actualGold,
    gold_earned_today: currentStats.gold_earned_today + actualGold,
  };
}

/**
 * Process a negative habit trigger: deal HP damage.
 */
export function processNegativeHabit(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const damage = calculateDamage(difficulty);
  return { ...currentStats, hp: Math.max(0, currentStats.hp - damage) };
}

/**
 * Process missed dailies at end of day: deal damage for each incomplete daily.
 */
export function processMissedDailies(
  missedDifficulties: Difficulty[],
  currentStats: PlayerStats
): PlayerStats {
  let totalDamage = 0;
  for (const diff of missedDifficulties) {
    totalDamage += calculateDamage(diff);
  }
  return { ...currentStats, hp: Math.max(0, currentStats.hp - totalDamage) };
}

/**
 * Undo a task completion: remove XP + Gold.
 * Does NOT restore gold_earned_today (prevent abuse of undo to reset cap).
 */
export function undoTaskCompletion(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const reward = calculateReward(difficulty);
  return {
    ...currentStats,
    xp: Math.max(0, currentStats.xp - reward.xp),
    gold: Math.max(0, currentStats.gold - reward.gold),
  };
}

/**
 * Process HP death: lose 5 levels (min 1), lose 50% gold, revive to 20 HP.
 */
export function processHpDeath(currentStats: PlayerStats): {
  stats: PlayerStats;
  deathInfo: { levelsLost: number; goldLost: number };
} {
  const newLevel = Math.max(1, currentStats.level - 5);
  const levelsLost = currentStats.level - newLevel;
  const goldLost = Math.floor(currentStats.gold * 0.5);
  const newXpToNext = newLevel * XP_PER_LEVEL;

  return {
    stats: {
      ...currentStats,
      hp: 20,
      level: newLevel,
      xp: 0,
      xp_to_next_level: newXpToNext,
      gold: currentStats.gold - goldLost,
    },
    deathInfo: { levelsLost, goldLost },
  };
}
