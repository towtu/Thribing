import { create } from "zustand";
import type { Task } from "@/features/tasks/types";

/** Per-task timer state (local only, not persisted to Firestore) */
export interface TimerState {
  elapsed: number;   // seconds elapsed
  isRunning: boolean;
}

interface TaskState {
  tasks: Task[];
  habits: Task[];
  dailies: Task[];
  todos: Task[];
  todaysDailies: Task[];
  loading: boolean;
  /** Active timer per task ID */
  timers: Record<string, TimerState>;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  // Timer actions
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  tickTimer: (taskId: string) => void;
  resetTimer: (taskId: string) => void;
}

function deriveLists(tasks: Task[]) {
  const today = new Date().getDay(); // 0=Sun … 6=Sat
  return {
    habits: tasks.filter((t) => t.type === "habit"),
    dailies: tasks.filter((t) => t.type === "daily"),
    todos: tasks.filter((t) => t.type === "todo"),
    todaysDailies: tasks.filter(
      (t) =>
        t.type === "daily" &&
        (t.scheduled_days?.includes(today) ?? true)
    ),
  };
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  habits: [],
  dailies: [],
  todos: [],
  todaysDailies: [],
  loading: true,
  timers: {},

  setTasks: (tasks) => {
    const current = get();
    if (
      !current.loading &&
      current.tasks.length === tasks.length &&
      current.tasks.every((t, i) => {
        const n = tasks[i];
        return (
          t.id === n.id &&
          t.completed === n.completed &&
          t.title === n.title &&
          t.current_count === n.current_count &&
          t.session_current_count === n.session_current_count &&
          t.weekly_completions?.length === n.weekly_completions?.length
        );
      })
    ) {
      return;
    }
    set({ tasks, loading: false, ...deriveLists(tasks) });
  },

  setLoading: (loading) => set({ loading }),

  addTask: (task) =>
    set((state) => {
      const tasks = [task, ...state.tasks];
      return { tasks, ...deriveLists(tasks) };
    }),

  removeTask: (taskId) =>
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== taskId);
      return { tasks, ...deriveLists(tasks) };
    }),

  updateTask: (taskId, updates) =>
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      return { tasks, ...deriveLists(tasks) };
    }),

  startTimer: (taskId) =>
    set((state) => ({
      timers: {
        ...state.timers,
        [taskId]: { elapsed: state.timers[taskId]?.elapsed ?? 0, isRunning: true },
      },
    })),

  pauseTimer: (taskId) =>
    set((state) => ({
      timers: {
        ...state.timers,
        [taskId]: { elapsed: state.timers[taskId]?.elapsed ?? 0, isRunning: false },
      },
    })),

  tickTimer: (taskId) =>
    set((state) => {
      const prev = state.timers[taskId];
      if (!prev?.isRunning) return state;
      return {
        timers: {
          ...state.timers,
          [taskId]: { ...prev, elapsed: prev.elapsed + 1 },
        },
      };
    }),

  resetTimer: (taskId) =>
    set((state) => ({
      timers: {
        ...state.timers,
        [taskId]: { elapsed: 0, isRunning: false },
      },
    })),
}));
