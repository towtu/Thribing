import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { subscribeToTasks } from "./services";
import { subscribeToPlayerStats } from "@/features/gamification/services";

/**
 * Subscribe to the user's tasks in real-time.
 * Call once in the protected app layout.
 */
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

/**
 * Subscribe to the user's player stats in real-time.
 * Call once in the protected app layout.
 */
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
