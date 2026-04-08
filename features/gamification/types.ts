export type PlayerClass =
  | "adventurer"
  | "swordsman"
  | "wizard"
  | "marksman"
  | "healer"
  | "rogue";

export interface PlayerStats {
  hp: number;
  max_hp: number;
  xp: number;
  xp_to_next_level: number;
  level: number;
  gold: number;
  player_class: PlayerClass;
  /** Gold earned from tasks today (resets at midnight, capped at 50) */
  gold_earned_today: number;
  /** ISO date string (e.g. "2026-04-03") — used to detect day change and reset gold_earned_today */
  gold_reset_date: string;
  /** ISO date string — used to detect day change and reset daily task counts */
  daily_reset_date: string;
}

export interface XpGain {
  amount: number;
  source: string;
}

export interface DamageEvent {
  amount: number;
  reason: string;
}

/** Cost in gold to change class */
export const CLASS_CHANGE_COST = 50;

/** Class title progressions by level thresholds */
export const CLASS_TITLES: Record<PlayerClass, { min: number; title: string }[]> = {
  adventurer: [
    { min: 1, title: "Adventurer" },
  ],
  swordsman: [
    { min: 5, title: "Squire" },
    { min: 10, title: "Knight" },
    { min: 20, title: "Crusader" },
    { min: 35, title: "Paladin" },
    { min: 50, title: "Warlord" },
  ],
  wizard: [
    { min: 5, title: "Apprentice" },
    { min: 10, title: "Sorcerer" },
    { min: 20, title: "Warlock" },
    { min: 35, title: "Archmage" },
    { min: 50, title: "Grand Wizard" },
  ],
  marksman: [
    { min: 5, title: "Scout" },
    { min: 10, title: "Sharpshooter" },
    { min: 20, title: "Sniper" },
    { min: 35, title: "Deadeye" },
    { min: 50, title: "Gunslinger" },
  ],
  healer: [
    { min: 5, title: "Acolyte" },
    { min: 10, title: "Cleric" },
    { min: 20, title: "Priest" },
    { min: 35, title: "Bishop" },
    { min: 50, title: "Saint" },
  ],
  rogue: [
    { min: 5, title: "Pickpocket" },
    { min: 10, title: "Thief" },
    { min: 20, title: "Assassin" },
    { min: 35, title: "Phantom" },
    { min: 50, title: "Shadow Lord" },
  ],
};

/** Class display info (emoji + color) */
export const CLASS_INFO: Record<PlayerClass, { emoji: string; color: string; label: string }> = {
  adventurer: { emoji: "🗺️", color: "bg-yellow-sunburst", label: "Adventurer" },
  swordsman:  { emoji: "⚔️", color: "bg-red-400",         label: "Swordsman" },
  wizard:     { emoji: "🧙", color: "bg-violet-electric",  label: "Wizard" },
  marksman:   { emoji: "🎯", color: "bg-cyan-neon",        label: "Marksman" },
  healer:     { emoji: "💚", color: "bg-green-400",        label: "Healer" },
  rogue:      { emoji: "🗡️", color: "bg-gray-600",         label: "Rogue" },
};

/** Get the title for a class at a given level */
export function getClassTitle(playerClass: PlayerClass, level: number): string {
  if (playerClass === "adventurer" || level < 5) return "Adventurer";
  const titles = CLASS_TITLES[playerClass];
  let title = titles[0].title;
  for (const t of titles) {
    if (level >= t.min) title = t.title;
  }
  return title;
}
