/**
 * ThriBing Cartoonish Theme Constants
 *
 * Art Direction: Thick borders, hard shadows, bubbly shapes, vibrant colors.
 * These constants are used alongside Tailwind classes for consistency.
 */

export const COLORS = {
  violet: {
    electric: "#8B5CF6",
    light: "#A78BFA",
    dark: "#7C3AED",
  },
  pink: {
    bubblegum: "#F472B6",
    light: "#F9A8D4",
    dark: "#EC4899",
  },
  cyan: {
    neon: "#22D3EE",
    light: "#67E8F9",
    dark: "#06B6D4",
  },
  yellow: {
    sunburst: "#FACC15",
    light: "#FDE68A",
    dark: "#EAB308",
  },
  green: {
    success: "#4ADE80",
    dark: "#22C55E",
  },
  red: {
    danger: "#F87171",
    dark: "#EF4444",
  },
  dark: "#1A1A2E",
  darkCard: "#2A2A4A",
  white: "#FFFFFF",
  border: "#111827", // gray-900
} as const;

export const CARTOON_STYLES = {
  card: "border-4 border-gray-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  cardSm: "border-2 border-gray-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  button: "border-4 border-gray-900 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
  buttonSm: "border-2 border-gray-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  input: "border-4 border-gray-900 rounded-2xl",
} as const;

export const XP_PER_LEVEL = 100;

export const DEFAULT_PLAYER_STATS = {
  hp: 50,
  max_hp: 50,
  xp: 0,
  xp_to_next_level: XP_PER_LEVEL,
  level: 1,
  gold: 0,
  player_class: "adventurer" as const,
  gold_earned_today: 0,
  gold_reset_date: "",
  daily_reset_date: "",
} as const;
