import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, TaskType, Difficulty } from "./types";

function tasksRef(userId: string) {
  return collection(db, "users", userId, "tasks");
}

function docToTask(docSnap: any): Task {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    user_id: data.user_id ?? "",
    type: data.type ?? "todo",
    title: data.title ?? "",
    notes: data.notes ?? "",
    difficulty: data.difficulty ?? 1,
    completed: data.completed ?? false,
    due_date: data.due_date?.toDate?.() ?? null,
    reminder_time: data.reminder_time ?? null,
    created_at: data.created_at?.toDate?.() ?? new Date(),
    // Daily fields
    scheduled_days: data.scheduled_days,
    target_count: data.target_count,
    current_count: data.current_count ?? 0,
    unit: data.unit,
    has_timer: data.has_timer ?? false,
    scheduled_time: data.scheduled_time ?? null,
    locked: data.locked ?? false,
    damage_dealt: data.damage_dealt ?? false,
    notification_ids: data.notification_ids ?? [],
    // Habit fields
    weekly_target: data.weekly_target,
    weekly_completions: data.weekly_completions ?? [],
    streak: data.streak ?? 0,
  };
}

export function subscribeToTasks(
  userId: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(tasksRef(userId), orderBy("created_at", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(docToTask);
    callback(tasks);
  });
}

export interface CreateTaskInput {
  type: TaskType;
  title: string;
  notes?: string;
  difficulty?: Difficulty;
  // Daily
  scheduled_days?: number[];
  target_count?: number;
  unit?: string;
  has_timer?: boolean;
  scheduled_time?: string;
  // Habit
  weekly_target?: number;
  due_date?: Date | null;
  reminder_time?: string | null;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const base = {
    user_id: userId,
    type: input.type,
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    difficulty: input.difficulty ?? 1,
    completed: false,
    due_date: input.due_date ?? null,
    reminder_time: input.reminder_time ?? null,
    created_at: serverTimestamp(),
  };

  let extra: Record<string, any> = {};
  if (input.type === "daily") {
    extra = {
      scheduled_days: input.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6],
      target_count: input.target_count ?? null,
      current_count: 0,
      unit: input.unit ?? null,
      has_timer: input.has_timer ?? false,
      scheduled_time: input.scheduled_time ?? null,
    };
  } else if (input.type === "habit") {
    extra = {
      weekly_target: input.weekly_target ?? 1,
      weekly_completions: [],
      streak: 0,
    };
  }

  const docRef = await addDoc(tasksRef(userId), { ...base, ...extra });
  return docRef.id;
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Omit<Task, "id" | "user_id" | "created_at">>
) {
  const taskDoc = doc(db, "users", userId, "tasks", taskId);
  await updateDoc(taskDoc, updates as any);
}

export async function deleteTask(userId: string, taskId: string) {
  const taskDoc = doc(db, "users", userId, "tasks", taskId);
  await deleteDoc(taskDoc);
}

export async function toggleTaskComplete(
  userId: string,
  taskId: string,
  completed: boolean
) {
  await updateTask(userId, taskId, { completed });
}

/**
 * Increment a daily's current_count. Auto-completes when target is reached.
 */
export async function incrementDailyCount(
  userId: string,
  taskId: string,
  newCount: number,
  targetCount: number
) {
  const completed = newCount >= targetCount;
  await updateTask(userId, taskId, {
    current_count: newCount,
    ...(completed ? { completed: true } : {}),
  });
}

/**
 * Log a habit completion for today.
 * Adds today's ISO date to weekly_completions (deduped).
 */
export async function logHabitCompletion(
  userId: string,
  taskId: string,
  currentCompletions: string[]
) {
  const today = new Date().toISOString().split("T")[0];
  if (currentCompletions.includes(today)) return;
  await updateTask(userId, taskId, {
    weekly_completions: [...currentCompletions, today],
  });
}

/**
 * Remove today's habit completion (undo log).
 */
export async function undoHabitCompletion(
  userId: string,
  taskId: string,
  currentCompletions: string[]
) {
  const today = new Date().toISOString().split("T")[0];
  await updateTask(userId, taskId, {
    weekly_completions: currentCompletions.filter((d) => d !== today),
  });
}

/**
 * Reset all daily tasks for a user: set current_count=0, completed=false,
 * locked=false, damage_dealt=false.
 * Call this when the date changes (midnight rollover).
 */
export async function resetDailyCounts(userId: string, dailyTaskIds: string[]) {
  if (dailyTaskIds.length === 0) return;
  const batch = writeBatch(db);
  for (const taskId of dailyTaskIds) {
    const taskDoc = doc(db, "users", userId, "tasks", taskId);
    batch.update(taskDoc, { current_count: 0, completed: false, locked: false, damage_dealt: false });
  }
  await batch.commit();
}

/** Gold cost to unlock a locked daily by difficulty */
export const DAILY_UNLOCK_COSTS: Record<import("./types").Difficulty, number> = {
  1: 5,
  2: 10,
  3: 20,
};

/**
 * Unlock a locked daily (gold is deducted by the caller before calling this).
 */
export async function unlockDaily(userId: string, taskId: string) {
  await updateTask(userId, taskId, { locked: false });
}
