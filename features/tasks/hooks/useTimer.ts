import { useEffect, useRef } from "react";
import { useTaskStore } from "@/lib/stores/useTaskStore";

/**
 * Timer hook for a specific task.
 * Ticks every second while isRunning, updating the store.
 * Auto-pauses when elapsed reaches targetSeconds.
 */
export function useTimer(taskId: string, targetSeconds: number) {
  const timerState = useTaskStore((s) => s.timers[taskId]);
  const { startTimer, pauseTimer, tickTimer, resetTimer } = useTaskStore.getState();

  const elapsed = timerState?.elapsed ?? 0;
  const isRunning = timerState?.isRunning ?? false;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tickTimer(taskId);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, taskId]);

  // Auto-pause when target is reached
  useEffect(() => {
    if (elapsed >= targetSeconds && isRunning) {
      pauseTimer(taskId);
    }
  }, [elapsed, targetSeconds, isRunning, taskId]);

  return {
    elapsed,
    isRunning,
    elapsedMinutes: Math.floor(elapsed / 60),
    start: () => startTimer(taskId),
    pause: () => pauseTimer(taskId),
    reset: () => resetTimer(taskId),
  };
}
