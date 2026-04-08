import { create } from "zustand";
import type { PlayerStats } from "@/features/gamification/types";
import { DEFAULT_PLAYER_STATS } from "@/core_ui/theme";

interface PlayerState extends PlayerStats {
  loading: boolean;
  setStats: (stats: PlayerStats) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  ...DEFAULT_PLAYER_STATS,
  loading: true,

  setStats: (stats) => {
    const current = get();
    if (
      current.hp === stats.hp &&
      current.max_hp === stats.max_hp &&
      current.xp === stats.xp &&
      current.xp_to_next_level === stats.xp_to_next_level &&
      current.level === stats.level &&
      current.gold === stats.gold &&
      current.player_class === stats.player_class &&
      current.gold_earned_today === stats.gold_earned_today &&
      current.gold_reset_date === stats.gold_reset_date &&
      current.daily_reset_date === stats.daily_reset_date &&
      !current.loading
    ) {
      return;
    }
    set({ ...stats, loading: false });
  },
  setLoading: (loading) => set({ loading }),
  reset: () => set({ ...DEFAULT_PLAYER_STATS, loading: false }),
}));
