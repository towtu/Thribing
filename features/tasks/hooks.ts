import { useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { subscribeToTasks, updateTask, resetDailyCounts } from "./services";
import { subscribeToPlayerStats, updatePlayerStats } from "@/features/gamification/services";
import { calculateDamage, processHpDeath } from "@/features/gamification/engine";
import type { PlayerStats } from "@/features/gamification/types";

export function useTaskSubscription() {
  const uid = useAuthStore((s) => s.user?.uid);
  useEffect(() => {
    if (!uid) {
      useTaskStore.getState().setTasks([]);
      return;
    }
    useTaskStore.getState().setLoading(true);
    const unsubscribe = subscribeToTasks(uid, (tasks) => {
      useTaskStore.getState().setTasks(tasks);
    });
    return unsubscribe;
  }, [uid]);
}

export function usePlayerSubscription() {
  const uid = useAuthStore((s) => s.user?.uid);
  useEffect(() => {
    if (!uid) {
      usePlayerStore.getState().reset();
      return;
    }
    usePlayerStore.getState().setLoading(true);
    const unsubscribe = subscribeToPlayerStats(uid, (stats) => {
      usePlayerStore.getState().setStats(stats);
    });
    return unsubscribe;
  }, [uid]);
}

/**
 * Checks today's dailies on mount and whenever app comes to foreground.
 * For each daily whose scheduled_time has passed and wasn't completed/already-damaged:
 *   - Marks it locked + damage_dealt in store and Firestore
 *   - Deducts HP
 * If HP hits 0, applies death penalty and calls onDeath.
 */
export function useDamageCheck(
  onDeath: (info: { levelsLost: number; goldLost: number }) => void
) {
  const uid = useAuthStore((s) => s.user?.uid);

  const checkDamage = useCallback(async () => {
    if (!uid) return;

    const todaysDailies = useTaskStore.getState().todaysDailies;
    const stats = usePlayerStore.getState();

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const overdue = todaysDailies.filter((t) => {
      if (!t.scheduled_time || t.completed || t.damage_dealt) return false;
      const [h, m] = t.scheduled_time.split(":").map(Number);
      return h * 60 + m <= nowMins;
    });

    if (overdue.length === 0) return;

    // Apply damage locally first (optimistic update)
    let newHp = stats.hp;
    for (const daily of overdue) {
      useTaskStore.getState().updateTask(daily.id, { locked: true, damage_dealt: true });
      newHp = Math.max(0, newHp - calculateDamage(daily.difficulty));
    }

    let newStats: PlayerStats = { ...stats, hp: newHp };
    let deathInfo: { levelsLost: number; goldLost: number } | null = null;

    if (newHp <= 0) {
      const result = processHpDeath(newStats);
      newStats = result.stats;
      deathInfo = result.deathInfo;
    }

    // Update local store
    usePlayerStore.getState().setStats(newStats);

    // Write to Firestore (queued offline automatically by Firebase SDK)
    try {
      await updatePlayerStats(uid, {
        hp: newStats.hp,
        gold: newStats.gold,
        level: newStats.level,
        xp: newStats.xp,
        xp_to_next_level: newStats.xp_to_next_level,
      });
    } catch (e) {
      console.error("updatePlayerStats failed:", e);
    }

    for (const daily of overdue) {
      try {
        await updateTask(uid, daily.id, { locked: true, damage_dealt: true });
      } catch (e) {
        console.error("updateTask lock failed:", e);
      }
    }

    if (deathInfo) {
      onDeath(deathInfo);
    }
  }, [uid, onDeath]);

  // Run on mount
  useEffect(() => {
    checkDamage();
  }, [checkDamage]);

  // Run when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkDamage();
      }
    });
    return () => sub.remove();
  }, [checkDamage]);

  return { checkDamage };
}

/**
 * On app open (and when tasks finish loading), if the date has changed since
 * last session, reset all daily task counts (current_count, completed, locked,
 * damage_dealt) back to 0/false.
 */
export function useDailyResetCheck() {
  const uid = useAuthStore((s) => s.user?.uid);
  const tasksLoading = useTaskStore((s) => s.loading);

  useEffect(() => {
    if (!uid || tasksLoading) return;
    const stats = usePlayerStore.getState();
    const today = new Date().toISOString().split("T")[0];
    if (stats.daily_reset_date === today) return;

    const dailyIds = useTaskStore.getState().dailies.map((t) => t.id);

    // Mark as reset for today before the async work to avoid re-triggering
    const updates = { daily_reset_date: today };
    usePlayerStore.getState().setStats({ ...stats, ...updates });
    updatePlayerStats(uid, updates).catch(console.error);

    if (dailyIds.length > 0) {
      resetDailyCounts(uid, dailyIds).catch(console.error);
    }
  }, [uid, tasksLoading]);
}

/**
 * On app open, if the date has changed since last session,
 * reset gold_earned_today to 0.
 */
export function useGoldResetCheck() {
  const uid = useAuthStore((s) => s.user?.uid);

  useEffect(() => {
    if (!uid) return;
    const stats = usePlayerStore.getState();
    const today = new Date().toISOString().split("T")[0];
    if (stats.gold_reset_date === today) return;

    const updates = { gold_earned_today: 0, gold_reset_date: today };
    const resetStats: PlayerStats = { ...stats, ...updates };
    usePlayerStore.getState().setStats(resetStats);
    updatePlayerStats(uid, updates).catch(console.error);
  }, [uid]);
}
