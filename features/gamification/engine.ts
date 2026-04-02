import type { Difficulty } from "@/features/tasks/types";
import type { PlayerStats } from "./types";
import { XP_PER_LEVEL } from "@/core_ui/theme";

/**
 * XP and Gold rewards by difficulty level.
 */
const REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  1: { xp: 5, gold: 2 },   // Easy
  2: { xp: 10, gold: 5 },  // Medium
  3: { xp: 15, gold: 10 }, // Hard
};

/**
 * HP damage for missed dailies by difficulty.
 */
const DAMAGE: Record<Difficulty, number> = {
  1: 2,   // Easy
  2: 5,   // Medium
  3: 10,  // Hard
};

/**
 * Calculate XP and Gold reward for completing a task.
 */
export function calculateReward(difficulty: Difficulty) {
  return REWARDS[difficulty] ?? REWARDS[1];
}

/**
 * Calculate HP damage for a missed daily.
 */
export function calculateDamage(difficulty: Difficulty) {
  return DAMAGE[difficulty] ?? DAMAGE[1];
}

/**
 * Process a task completion: add XP + Gold, handle level-ups.
 * Returns the new player stats.
 */
export function processTaskCompletion(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const reward = calculateReward(difficulty);

  let newXp = currentStats.xp + reward.xp;
  let newLevel = currentStats.level;
  let newXpToNext = currentStats.xp_to_next_level;

  // Handle level-ups (could be multiple if huge XP gain)
  while (newXp >= newXpToNext) {
    newXp -= newXpToNext;
    newLevel += 1;
    newXpToNext = newLevel * XP_PER_LEVEL; // Scale XP requirement per level
  }

  return {
    ...currentStats,
    xp: newXp,
    level: newLevel,
    xp_to_next_level: newXpToNext,
    gold: currentStats.gold + reward.gold,
  };
}

/**
 * Process a negative habit trigger: deal HP damage.
 * Returns the new player stats.
 */
export function processNegativeHabit(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const damage = calculateDamage(difficulty);
  const newHp = Math.max(0, currentStats.hp - damage);

  return {
    ...currentStats,
    hp: newHp,
  };
}

/**
 * Process missed dailies at end of day: deal damage for each incomplete daily.
 * Returns the new player stats.
 */
export function processMissedDailies(
  missedDifficulties: Difficulty[],
  currentStats: PlayerStats
): PlayerStats {
  let totalDamage = 0;
  for (const diff of missedDifficulties) {
    totalDamage += calculateDamage(diff);
  }

  return {
    ...currentStats,
    hp: Math.max(0, currentStats.hp - totalDamage),
  };
}

/**
 * Undo a task completion: remove XP + Gold.
 * (For when user unchecks a task)
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
