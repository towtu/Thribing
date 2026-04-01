export type TaskType = "habit" | "daily" | "todo";
export type HabitDirection = "positive" | "negative" | "both";
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
  // Habit-specific
  direction?: HabitDirection;
  // Daily-specific
  scheduled_days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}
