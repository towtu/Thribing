export type TaskType = "habit" | "daily" | "todo";
export type Difficulty = 1 | 2 | 3;

export interface Task {
  id: string;
  user_id: string;
  type: TaskType;
  title: string;
  notes: string;
  difficulty: Difficulty;
  completed: boolean;
  due_date: Date | null;
  reminder_time: string | null;
  created_at: Date;

  // ── Daily-specific ──────────────────────────────────────────
  /** Days of week this daily repeats on (0=Sun … 6=Sat) */
  scheduled_days?: number[];
  /** Target count to complete the daily (e.g. 8 cups, 10 km) */
  target_count?: number;
  /** Progress so far today */
  current_count?: number;
  /** Unit label shown on the progress bar (cups, km, times, minutes, pages…) */
  unit?: string;
  /** If true, shows a start/stop timer for minute-based dailies */
  has_timer?: boolean;
  /** Display badge — "07:00" means "due at 7 AM" */
  scheduled_time?: string;

  // ── Habit-specific ───────────────────────────────────────────
  /** How many times per week the habit should be completed */
  weekly_target?: number;
  /** ISO date strings of completions this week (e.g. ["2026-04-01"]) */
  weekly_completions?: string[];
  /** Consecutive weeks where weekly_target was met */
  streak?: number;
}
