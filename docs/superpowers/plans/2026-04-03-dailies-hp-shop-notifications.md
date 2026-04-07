# Dailies HP Damage, Shop & Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-daily HP damage at scheduled time (with locking), gold-spend unlock, HP death mechanic (level/gold penalty), a Shop tab with heal potions, daily 50-gold cap, and local push notifications 30/15/5 min before each daily's time.

**Architecture:** All logic runs on-device (offline-first). A `useDamageCheck` hook fires on app open and foreground via `AppState`, scans today's dailies, applies damage + locks any whose `scheduled_time` has passed. Firebase queues writes offline automatically. `expo-notifications` schedules local repeating notifications per daily per scheduled day.

**Tech Stack:** React Native 0.81, Expo SDK 54, expo-notifications, Firebase JS SDK v12, Zustand, NativeWind/Tailwind, TypeScript, expo-router

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `features/tasks/types.ts` | Add `locked`, `damage_dealt`, `notification_ids` to Task |
| Modify | `features/gamification/types.ts` | Add `gold_earned_today`, `gold_reset_date` to PlayerStats |
| Modify | `core_ui/theme.ts` | Add new fields to DEFAULT_PLAYER_STATS |
| Modify | `features/gamification/engine.ts` | Add `processHpDeath`, `DAILY_GOLD_CAP`, update `processTaskCompletion` for gold cap |
| Modify | `features/gamification/services.ts` | Add `POTIONS`, `buyPotion`; update `subscribeToPlayerStats` for new fields |
| Modify | `features/tasks/services.ts` | Add `locked`/`damage_dealt` to `docToTask`; add `unlockDaily`, `DAILY_UNLOCK_COSTS`; update `resetDailyCounts` |
| Create | `features/notifications/service.ts` | Schedule/cancel/reschedule local notifications |
| Create | `features/gamification/components/DeathModal.tsx` | Full-screen death penalty modal |
| Modify | `features/tasks/hooks.ts` | Add `useDamageCheck`, `useGoldResetCheck` |
| Modify | `lib/stores/usePlayerStore.ts` | Add `gold_earned_today`, `gold_reset_date`; update equality check |
| Modify | `app/(app)/_layout.tsx` | Wire `useDamageCheck`, `useGoldResetCheck`, show DeathModal |
| Modify | `features/tasks/components/TaskCard.tsx` | Locked UI + gold unlock button; gold cap in `awardCompletion` |
| Modify | `features/tasks/components/CreateTaskModal.tsx` | Schedule notifications after daily create |
| Create | `app/(app)/(tabs)/shop.tsx` | Shop screen with 3 potion tiers |
| Modify | `app/(app)/(tabs)/_layout.tsx` | Add Shop tab (ShoppingBag icon) |
| Modify | `app/(app)/(tabs)/index.tsx` | Add gold-today indicator to dashboard |

---

### Task 1: Install expo-notifications

**Files:**
- Modify: `package.json` (via install command)

- [ ] **Step 1: Install the package**

```bash
cd /c/Users/atila/Desktop/Projects/Published/Thribing && npx expo install expo-notifications
```

Expected output: package added, no errors.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-notifications"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `features/tasks/types.ts`
- Modify: `features/gamification/types.ts`
- Modify: `core_ui/theme.ts`

- [ ] **Step 1: Add locked fields to Task**

In `features/tasks/types.ts`, add three fields inside the `// ── Daily-specific` section after `scheduled_time`:

```ts
  /** True when scheduled_time passed and daily wasn't completed — requires gold to unlock */
  locked?: boolean;
  /** True after HP damage has been dealt for this daily today — prevents double damage */
  damage_dealt?: boolean;
  /** IDs of the 3 scheduled local notifications (T-30, T-15, T-5) */
  notification_ids?: string[];
```

- [ ] **Step 2: Add gold tracking fields to PlayerStats**

In `features/gamification/types.ts`, add to the `PlayerStats` interface after `gold`:

```ts
  /** Gold earned from tasks today (resets at midnight, capped at 50) */
  gold_earned_today: number;
  /** ISO date string (e.g. "2026-04-03") — used to detect day change and reset gold_earned_today */
  gold_reset_date: string;
```

- [ ] **Step 3: Update DEFAULT_PLAYER_STATS**

In `core_ui/theme.ts`, update `DEFAULT_PLAYER_STATS` to include the new fields:

```ts
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
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add features/tasks/types.ts features/gamification/types.ts core_ui/theme.ts
git commit -m "feat: add locked/damage_dealt/notification_ids to Task; add gold_earned_today/gold_reset_date to PlayerStats"
```

---

### Task 3: Update gamification engine

**Files:**
- Modify: `features/gamification/engine.ts`

- [ ] **Step 1: Replace the entire engine.ts**

```ts
import type { Difficulty } from "@/features/tasks/types";
import type { PlayerStats } from "./types";
import { XP_PER_LEVEL } from "@/core_ui/theme";

/** XP and Gold rewards by difficulty level. */
const REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  1: { xp: 5, gold: 2 },
  2: { xp: 10, gold: 5 },
  3: { xp: 15, gold: 10 },
};

/** HP damage for missed/overdue dailies by difficulty. */
const DAMAGE: Record<Difficulty, number> = {
  1: 2,
  2: 5,
  3: 10,
};

/** Maximum gold earnable per day from tasks. */
export const DAILY_GOLD_CAP = 50;

export function calculateReward(difficulty: Difficulty) {
  return REWARDS[difficulty] ?? REWARDS[1];
}

export function calculateDamage(difficulty: Difficulty) {
  return DAMAGE[difficulty] ?? DAMAGE[1];
}

/**
 * Process a task completion: add XP + Gold (respecting daily gold cap), handle level-ups.
 */
export function processTaskCompletion(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const reward = calculateReward(difficulty);

  // Gold cap: only award up to remaining daily allowance
  const remainingGold = Math.max(0, DAILY_GOLD_CAP - currentStats.gold_earned_today);
  const actualGold = Math.min(reward.gold, remainingGold);

  let newXp = currentStats.xp + reward.xp;
  let newLevel = currentStats.level;
  let newXpToNext = currentStats.xp_to_next_level;

  while (newXp >= newXpToNext) {
    newXp -= newXpToNext;
    newLevel += 1;
    newXpToNext = newLevel * XP_PER_LEVEL;
  }

  return {
    ...currentStats,
    xp: newXp,
    level: newLevel,
    xp_to_next_level: newXpToNext,
    gold: currentStats.gold + actualGold,
    gold_earned_today: currentStats.gold_earned_today + actualGold,
  };
}

/**
 * Process a negative habit trigger: deal HP damage.
 */
export function processNegativeHabit(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const damage = calculateDamage(difficulty);
  return { ...currentStats, hp: Math.max(0, currentStats.hp - damage) };
}

/**
 * Process missed dailies at end of day: deal damage for each incomplete daily.
 */
export function processMissedDailies(
  missedDifficulties: Difficulty[],
  currentStats: PlayerStats
): PlayerStats {
  let totalDamage = 0;
  for (const diff of missedDifficulties) {
    totalDamage += calculateDamage(diff);
  }
  return { ...currentStats, hp: Math.max(0, currentStats.hp - totalDamage) };
}

/**
 * Undo a task completion: remove XP + Gold.
 * Does NOT restore gold_earned_today (prevent abuse of undo to reset cap).
 */
export function undoTaskCompletion(
  difficulty: Difficulty,
  currentStats: PlayerStats
): PlayerStats {
  const reward = calculateReward(difficulty);
  return {
    ...currentStats,
    xp: Math.max(0, currentStats.xp - reward.xp),
    gold: Math.max(0, currentStats.gold - reward.gold),
  };
}

/**
 * Process HP death: lose 5 levels (min 1), lose 50% gold, revive to 20 HP.
 */
export function processHpDeath(currentStats: PlayerStats): {
  stats: PlayerStats;
  deathInfo: { levelsLost: number; goldLost: number };
} {
  const newLevel = Math.max(1, currentStats.level - 5);
  const levelsLost = currentStats.level - newLevel;
  const goldLost = Math.floor(currentStats.gold * 0.5);
  const newXpToNext = newLevel * XP_PER_LEVEL;

  return {
    stats: {
      ...currentStats,
      hp: 20,
      level: newLevel,
      xp: 0,
      xp_to_next_level: newXpToNext,
      gold: currentStats.gold - goldLost,
    },
    deathInfo: { levelsLost, goldLost },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/gamification/engine.ts
git commit -m "feat: add processHpDeath, DAILY_GOLD_CAP, update processTaskCompletion for gold cap"
```

---

### Task 4: Update gamification services

**Files:**
- Modify: `features/gamification/services.ts`

- [ ] **Step 1: Replace the entire services.ts**

```ts
import {
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PlayerStats, PlayerClass } from "./types";
import { DEFAULT_PLAYER_STATS } from "@/core_ui/theme";

export function subscribeToPlayerStats(
  userId: string,
  callback: (stats: PlayerStats) => void
): Unsubscribe {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        hp: data.hp ?? DEFAULT_PLAYER_STATS.hp,
        max_hp: data.max_hp ?? DEFAULT_PLAYER_STATS.max_hp,
        xp: data.xp ?? DEFAULT_PLAYER_STATS.xp,
        xp_to_next_level: data.xp_to_next_level ?? DEFAULT_PLAYER_STATS.xp_to_next_level,
        level: data.level ?? DEFAULT_PLAYER_STATS.level,
        gold: data.gold ?? DEFAULT_PLAYER_STATS.gold,
        player_class: data.player_class ?? "adventurer",
        gold_earned_today: data.gold_earned_today ?? 0,
        gold_reset_date: data.gold_reset_date ?? "",
      });
    } else {
      callback({ ...DEFAULT_PLAYER_STATS });
    }
  });
}

export async function updatePlayerStats(
  userId: string,
  stats: Partial<PlayerStats>
) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, stats as any);
}

export async function changePlayerClass(
  userId: string,
  newClass: PlayerClass,
  currentGold: number,
  cost: number
) {
  if (currentGold < cost) {
    throw new Error(`Not enough gold. You need ${cost} gold to change class.`);
  }
  await updatePlayerStats(userId, {
    player_class: newClass,
    gold: currentGold - cost,
  });
}

// ─── Shop / Potions ───────────────────────────────────────────────────────────

export const POTIONS = [
  { id: "small" as const,  name: "Small Potion",  hp: 20,  cost: 10, emoji: "🧪" },
  { id: "medium" as const, name: "Medium Potion", hp: 50,  cost: 25, emoji: "⚗️" },
  { id: "large" as const,  name: "Large Potion",  hp: 100, cost: 50, emoji: "🔮" },
];

export type PotionId = "small" | "medium" | "large";

/**
 * Buy a potion: deduct gold, restore HP (capped at max_hp).
 * Returns updated { hp, gold } values.
 */
export async function buyPotion(
  userId: string,
  potionId: PotionId,
  currentStats: PlayerStats
): Promise<{ newHp: number; newGold: number }> {
  const potion = POTIONS.find((p) => p.id === potionId);
  if (!potion) throw new Error("Invalid potion");
  if (currentStats.gold < potion.cost) throw new Error("Not enough gold");

  const newHp = Math.min(currentStats.max_hp, currentStats.hp + potion.hp);
  const newGold = currentStats.gold - potion.cost;

  await updatePlayerStats(userId, { hp: newHp, gold: newGold });
  return { newHp, newGold };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/gamification/services.ts
git commit -m "feat: add POTIONS, buyPotion; map gold_earned_today/gold_reset_date from Firestore"
```

---

### Task 5: Update task services

**Files:**
- Modify: `features/tasks/services.ts`

- [ ] **Step 1: Update `docToTask` to read new fields**

In `features/tasks/services.ts`, update the `docToTask` function to include the new fields after `scheduled_time`:

```ts
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
```

- [ ] **Step 2: Add `DAILY_UNLOCK_COSTS`, `unlockDaily`, and update `resetDailyCounts`**

Add these exports after the existing `undoHabitCompletion` function:

```ts
/** Gold cost to unlock a locked daily by difficulty */
export const DAILY_UNLOCK_COSTS: Record<import("./types").Difficulty, number> = {
  1: 5,
  2: 10,
  3: 20,
};

/**
 * Unlock a locked daily (after gold has been deducted by the caller).
 */
export async function unlockDaily(userId: string, taskId: string) {
  await updateTask(userId, taskId, { locked: false });
}
```

- [ ] **Step 3: Update `resetDailyCounts` to also reset locked and damage_dealt**

Replace the existing `resetDailyCounts` function:

```ts
export async function resetDailyCounts(userId: string, dailyTaskIds: string[]) {
  if (dailyTaskIds.length === 0) return;
  const batch = writeBatch(db);
  for (const taskId of dailyTaskIds) {
    const taskDoc = doc(db, "users", userId, "tasks", taskId);
    batch.update(taskDoc, { current_count: 0, completed: false, locked: false, damage_dealt: false });
  }
  await batch.commit();
}
```

- [ ] **Step 4: Commit**

```bash
git add features/tasks/services.ts
git commit -m "feat: add locked/damage_dealt to docToTask; add DAILY_UNLOCK_COSTS, unlockDaily; reset locked on midnight reset"
```

---

### Task 6: Update Zustand player store

**Files:**
- Modify: `lib/stores/usePlayerStore.ts`

- [ ] **Step 1: Replace the entire usePlayerStore.ts**

```ts
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
      !current.loading
    ) {
      return;
    }
    set({ ...stats, loading: false });
  },
  setLoading: (loading) => set({ loading }),
  reset: () => set({ ...DEFAULT_PLAYER_STATS, loading: false }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/usePlayerStore.ts
git commit -m "feat: add gold_earned_today/gold_reset_date to player store equality check"
```

---

### Task 7: Create notification service

**Files:**
- Create: `features/notifications/service.ts`

- [ ] **Step 1: Create the notification service**

```ts
import * as Notifications from "expo-notifications";
import type { Task } from "@/features/tasks/types";

// Show alerts when notifications arrive while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Parse "HH:MM" into { hour, minute } */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h, minute: m };
}

/** Subtract `mins` minutes from a time; returns new { hour, minute } */
function subtractMinutes(
  hour: number,
  minute: number,
  mins: number
): { hour: number; minute: number } {
  const total = hour * 60 + minute - mins;
  const h = Math.floor(((total / 60) % 24 + 24) % 24);
  const m = ((total % 60) + 60) % 60;
  return { hour: h, minute: m };
}

/** scheduled_days: 0=Sun…6=Sat → expo weekday: 1=Sun…7=Sat */
function toExpoWeekday(day: number): number {
  return day + 1;
}

const REMINDERS = [
  { mins: 30, template: (title: string) => `${title} in 30 minutes — don't lose HP!` },
  { mins: 15, template: (title: string) => `15 minutes left for ${title}!` },
  { mins: 5,  template: (title: string) => `⚠️ ${title} in 5 minutes or take damage!` },
];

/**
 * Schedule up to 3 notifications per scheduled_day for a daily.
 * Skips times already past today.
 * Returns all scheduled notification IDs.
 */
export async function scheduleNotificationsForDaily(
  title: string,
  scheduledTime: string,
  scheduledDays: number[]
): Promise<string[]> {
  const granted = await requestNotificationPermissions();
  if (!granted) return [];

  const { hour, minute } = parseTime(scheduledTime);
  const ids: string[] = [];

  for (const day of scheduledDays) {
    for (const reminder of REMINDERS) {
      const { hour: rh, minute: rm } = subtractMinutes(hour, minute, reminder.mins);

      // Skip if this reminder time is already past today
      const now = new Date();
      if (now.getDay() === day) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (rh * 60 + rm <= nowMins) continue;
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "🗡️ ThriBing",
            body: reminder.template(title),
          },
          trigger: {
            weekday: toExpoWeekday(day),
            hour: rh,
            minute: rm,
            repeats: true,
          } as any,
        });
        ids.push(id);
      } catch (e) {
        console.warn("Failed to schedule notification:", e);
      }
    }
  }

  return ids;
}

/** Cancel a list of notification IDs. */
export async function cancelNotifications(ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn("Failed to cancel notification:", e);
    }
  }
}

/**
 * On app open: cancel all old notification IDs stored on dailies,
 * then reschedule from scratch. Handles reinstalls/permission changes.
 * Returns map of taskId → new notification_ids.
 */
export async function rescheduleAllDailies(
  dailies: Task[]
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};

  for (const daily of dailies) {
    if (!daily.scheduled_time) continue;

    if (daily.notification_ids?.length) {
      await cancelNotifications(daily.notification_ids);
    }

    const ids = await scheduleNotificationsForDaily(
      daily.title,
      daily.scheduled_time,
      daily.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6]
    );

    result[daily.id] = ids;
  }

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add features/notifications/service.ts
git commit -m "feat: create notification service with schedule/cancel/reschedule"
```

---

### Task 8: Create Death Modal

**Files:**
- Create: `features/gamification/components/DeathModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Modal, View, Text, Pressable } from "react-native";
import { CartoonButton } from "@/core_ui/components";

interface DeathModalProps {
  visible: boolean;
  levelsLost: number;
  goldLost: number;
  onDismiss: () => void;
}

export function DeathModal({ visible, levelsLost, goldLost, onDismiss }: DeathModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-dark border-4 border-gray-900 rounded-3xl p-6 w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] gap-4">
          {/* Skull */}
          <Text className="text-6xl text-center">💀</Text>

          <Text
            className="text-2xl text-white text-center"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            You Fell in Battle!
          </Text>
          <Text
            className="text-sm text-gray-400 text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            Your HP hit zero. The darkness claimed you… but your adventure isn't over.
          </Text>

          {/* Penalty summary */}
          <View className="bg-red-900/40 border-2 border-red-500 rounded-2xl p-4 gap-2">
            <Text
              className="text-sm text-red-400 text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              Penalties
            </Text>
            {levelsLost > 0 && (
              <Text
                className="text-base text-white text-center"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                📉 -{levelsLost} Level{levelsLost !== 1 ? "s" : ""}
              </Text>
            )}
            <Text
              className="text-base text-white text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              🪙 -{goldLost} Gold lost
            </Text>
            <Text
              className="text-sm text-green-400 text-center"
              style={{ fontFamily: "Nunito_600SemiBold" }}
            >
              ❤️ Revived with 20 HP
            </Text>
          </View>

          <CartoonButton
            title="Rise Again"
            variant="violet"
            size="lg"
            onPress={onDismiss}
          />
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/gamification/components/DeathModal.tsx
git commit -m "feat: create DeathModal component"
```

---

### Task 9: Add damage check and gold reset hooks

**Files:**
- Modify: `features/tasks/hooks.ts`

- [ ] **Step 1: Replace the entire hooks.ts**

```ts
import { useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { subscribeToTasks } from "./services";
import { subscribeToPlayerStats } from "@/features/gamification/services";
import { updatePlayerStats } from "@/features/gamification/services";
import { updateTask } from "./services";
import { calculateDamage } from "@/features/gamification/engine";
import { processHpDeath } from "@/features/gamification/engine";

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
 * If HP hits 0, applies death penalty.
 * Returns a callback you can also call manually.
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

    let newStats = { ...stats, hp: newHp };
    let deathInfo: { levelsLost: number; goldLost: number } | null = null;

    if (newHp <= 0) {
      const result = processHpDeath(newStats);
      newStats = result.stats;
      deathInfo = result.deathInfo;
    }

    // Update local store
    usePlayerStore.getState().setStats({ ...newStats, loading: false });

    // Write to Firestore (queued offline automatically)
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
    usePlayerStore.getState().setStats({ ...stats, ...updates, loading: false });
    updatePlayerStats(uid, updates).catch(console.error);
  }, [uid]);
}
```

- [ ] **Step 2: Commit**

```bash
git add features/tasks/hooks.ts
git commit -m "feat: add useDamageCheck (AppState) and useGoldResetCheck hooks"
```

---

### Task 10: Wire hooks and DeathModal into app layout

**Files:**
- Modify: `app/(app)/_layout.tsx`

- [ ] **Step 1: Replace the entire _layout.tsx**

```tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, Redirect, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import {
  useTaskSubscription,
  usePlayerSubscription,
  useDamageCheck,
  useGoldResetCheck,
} from "@/features/tasks/hooks";
import { DeathModal } from "@/features/gamification/components/DeathModal";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useTaskSubscription();
  usePlayerSubscription();
  useGoldResetCheck();

  const [deathInfo, setDeathInfo] = useState<{
    levelsLost: number;
    goldLost: number;
  } | null>(null);

  const handleDeath = useCallback(
    (info: { levelsLost: number; goldLost: number }) => {
      setDeathInfo(info);
    },
    []
  );

  useDamageCheck(handleDeath);

  // Watch for level 5 unlock
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.player_class);
  const loading = usePlayerStore((s) => s.loading);
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (loading || hasPromptedRef.current) return;
    if (level >= 5 && playerClass === "adventurer") {
      hasPromptedRef.current = true;
      setTimeout(() => {
        router.push("/choose-class" as any);
      }, 500);
    }
  }, [level, playerClass, loading]);

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1A1A2E" },
        }}
      />
      <DeathModal
        visible={deathInfo !== null}
        levelsLost={deathInfo?.levelsLost ?? 0}
        goldLost={deathInfo?.goldLost ?? 0}
        onDismiss={() => setDeathInfo(null)}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/_layout.tsx
git commit -m "feat: wire useDamageCheck, useGoldResetCheck, DeathModal into app layout"
```

---

### Task 11: Update TaskCard — locked UI and gold cap in awardCompletion

**Files:**
- Modify: `features/tasks/components/TaskCard.tsx`

- [ ] **Step 1: Update the imports at the top of TaskCard.tsx**

Add these imports after the existing imports:

```ts
import { Lock } from "lucide-react-native";
import { unlockDaily, DAILY_UNLOCK_COSTS } from "../services";
import { DAILY_GOLD_CAP } from "@/features/gamification/engine";
```

- [ ] **Step 2: Update `awardCompletion` inside `DailyCard` to write gold_earned_today**

Replace the existing `awardCompletion` function inside `DailyCard`:

```ts
  const awardCompletion = async () => {
    if (!user?.uid) return;
    const currentStats = usePlayerStore.getState();
    const newStats = processTaskCompletion(task.difficulty, currentStats);
    const xpGain =
      newStats.xp -
      currentStats.xp +
      (newStats.level > currentStats.level ? currentStats.xp_to_next_level - currentStats.xp : 0);
    const goldGain = newStats.gold - currentStats.gold;
    const capReached = newStats.gold_earned_today >= DAILY_GOLD_CAP;
    setShowReward(
      `+${xpGain} XP${goldGain > 0 ? `  +${goldGain} 🪙` : ""}${capReached ? " (gold cap)" : ""}`
    );
    setTimeout(() => setShowReward(null), 2000);
    await updatePlayerStats(user.uid, {
      hp: newStats.hp,
      max_hp: newStats.max_hp,
      xp: newStats.xp,
      xp_to_next_level: newStats.xp_to_next_level,
      level: newStats.level,
      gold: newStats.gold,
      gold_earned_today: newStats.gold_earned_today,
    });
  };
```

- [ ] **Step 3: Add `handleUnlock` handler inside `DailyCard` (after `handleDelete`)**

```ts
  const handleUnlock = async () => {
    if (!user?.uid || busy) return;
    const cost = DAILY_UNLOCK_COSTS[task.difficulty];
    const currentStats = usePlayerStore.getState();
    if (currentStats.gold < cost) {
      setShowReward("Not enough gold!");
      setTimeout(() => setShowReward(null), 2000);
      return;
    }
    setBusy(true);
    try {
      const newGold = currentStats.gold - cost;
      usePlayerStore.getState().setStats({ ...currentStats, gold: newGold, loading: false });
      useTaskStore.getState().updateTask(task.id, { locked: false });
      await updatePlayerStats(user.uid, { gold: newGold });
      await unlockDaily(user.uid, task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
```

- [ ] **Step 4: Update the `DailyCard` return JSX — add locked state**

In the `DailyCard` return, replace the checkbox `Pressable` (no-quantity mode) with a version that handles the locked state:

```tsx
          {/* Checkbox — locked state shows gold unlock button instead */}
          {!hasQuantity && (
            task.locked ? (
              <Pressable
                onPress={handleUnlock}
                disabled={busy}
                className="w-auto h-9 bg-yellow-sunburst border-4 border-gray-900 rounded-xl items-center justify-center active:scale-95 mr-3 flex-shrink-0 mt-0.5 flex-row gap-1 px-2"
              >
                <Lock size={12} color="#111827" strokeWidth={3} />
                <Text className="text-xs text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  {DAILY_UNLOCK_COSTS[task.difficulty]}🪙
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSimpleToggle}
                disabled={busy}
                className={`w-9 h-9 border-4 border-gray-900 rounded-xl items-center justify-center active:scale-95 mr-3 flex-shrink-0 mt-0.5 ${
                  task.completed ? "bg-green-500" : "bg-white"
                }`}
              >
                {task.completed && <Check size={16} color="white" strokeWidth={3} />}
              </Pressable>
            )
          )}
```

Also update the `CartoonCard` to show a reddish tint when locked:

```tsx
    <CartoonCard
      variant="default"
      className={`${task.completed ? "opacity-60" : ""} ${task.locked ? "border-red-500" : ""}`}
    >
```

- [ ] **Step 5: Commit**

```bash
git add features/tasks/components/TaskCard.tsx
git commit -m "feat: add locked UI with gold unlock button to DailyCard; enforce gold cap in awardCompletion"
```

---

### Task 12: Schedule notifications when creating a daily

**Files:**
- Modify: `features/tasks/components/CreateTaskModal.tsx`

- [ ] **Step 1: Add notification import**

Add after the existing imports in `CreateTaskModal.tsx`:

```ts
import { scheduleNotificationsForDaily } from "@/features/notifications/service";
import { updateTask } from "../services";
```

- [ ] **Step 2: Update `handleSave` to schedule notifications after creating a daily**

Replace the `try` block inside `handleSave`:

```ts
    try {
      const finalUnit = unit === "custom" ? customUnit.trim() || "times" : unit;

      const taskId = await createTask(user.uid, {
        type: defaultType,
        title,
        notes,
        difficulty,
        ...(defaultType === "daily" && {
          scheduled_days: scheduledDays,
          target_count: targetCount ? parsedTarget : undefined,
          unit: targetCount ? finalUnit : undefined,
          has_timer: targetCount && finalUnit === "minutes" ? hasTimer : false,
          scheduled_time: scheduledTime.trim() || undefined,
        }),
        ...(defaultType === "habit" && {
          weekly_target: parsedWeekly,
        }),
      });

      // Schedule notifications for the new daily if it has a scheduled time
      if (defaultType === "daily" && scheduledTime.trim()) {
        const ids = await scheduleNotificationsForDaily(
          title,
          scheduledTime.trim(),
          scheduledDays
        );
        if (ids.length > 0) {
          await updateTask(user.uid, taskId, { notification_ids: ids });
        }
      }

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    }
```

- [ ] **Step 3: Commit**

```bash
git add features/tasks/components/CreateTaskModal.tsx
git commit -m "feat: schedule local notifications after creating a daily with scheduled_time"
```

---

### Task 13: Create Shop screen

**Files:**
- Create: `app/(app)/(tabs)/shop.tsx`

- [ ] **Step 1: Create the shop screen**

```tsx
import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { POTIONS, buyPotion, type PotionId } from "@/features/gamification/services";

export default function ShopScreen() {
  const user = useAuthStore((s) => s.user);
  const stats = usePlayerStore();
  const [buying, setBuying] = useState<PotionId | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const handleBuy = async (potionId: PotionId) => {
    if (!user?.uid || buying) return;
    setBuying(potionId);
    try {
      const { newHp, newGold } = await buyPotion(user.uid, potionId, stats);
      usePlayerStore.getState().setStats({ ...stats, hp: newHp, gold: newGold, loading: false });
      const potion = POTIONS.find((p) => p.id === potionId)!;
      setFlash(`${potion.emoji} +${Math.min(potion.hp, stats.max_hp - stats.hp)} HP restored!`);
      setTimeout(() => setFlash(null), 2500);
    } catch (e: any) {
      setFlash(e?.message ?? "Purchase failed");
      setTimeout(() => setFlash(null), 2500);
    } finally {
      setBuying(null);
    }
  };

  const hpPct = stats.max_hp > 0 ? Math.min(100, (stats.hp / stats.max_hp) * 100) : 0;

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 bg-yellow-sunburst border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <ShoppingBag size={20} color="#111827" strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Shop
            </Text>
            <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
              Spend your gold wisely
            </Text>
          </View>
        </View>

        {/* Current HP + Gold */}
        <CartoonCard variant="violet">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                ❤️ HP
              </Text>
              <Text className="text-sm text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                {stats.hp} / {stats.max_hp}
              </Text>
            </View>
            <View className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/20">
              <View className="h-full rounded-full bg-red-400" style={{ width: `${hpPct}%` }} />
            </View>
            <Text className="text-sm text-yellow-sunburst" style={{ fontFamily: "Nunito_700Bold" }}>
              🪙 {stats.gold} Gold available
            </Text>
          </View>
        </CartoonCard>

        {/* Flash message */}
        {flash && (
          <CartoonCard variant="cyan">
            <Text className="text-sm text-gray-900 text-center" style={{ fontFamily: "Nunito_700Bold" }}>
              {flash}
            </Text>
          </CartoonCard>
        )}

        {/* Potion cards */}
        <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
          Heal Potions
        </Text>

        {POTIONS.map((potion) => {
          const canAfford = stats.gold >= potion.cost;
          const alreadyFull = stats.hp >= stats.max_hp;
          const disabled = !canAfford || alreadyFull || buying !== null;

          return (
            <CartoonCard key={potion.id} variant="default">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-violet-100 border-4 border-gray-900 rounded-2xl items-center justify-center">
                  <Text className="text-2xl">{potion.emoji}</Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    {potion.name}
                  </Text>
                  <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    Restores {potion.hp} HP • {potion.cost} 🪙
                  </Text>
                  {!canAfford && (
                    <Text className="text-xs text-red-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      Not enough gold
                    </Text>
                  )}
                  {alreadyFull && canAfford && (
                    <Text className="text-xs text-green-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      HP already full
                    </Text>
                  )}
                </View>
                <CartoonButton
                  title={buying === potion.id ? "..." : `${potion.cost} 🪙`}
                  variant={canAfford && !alreadyFull ? "yellow" : "cyan"}
                  size="sm"
                  onPress={() => handleBuy(potion.id as PotionId)}
                  disabled={disabled}
                />
              </View>
            </CartoonCard>
          );
        })}
      </View>
    </ScreenContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/(tabs)/shop.tsx"
git commit -m "feat: create Shop screen with Small/Medium/Large heal potions"
```

---

### Task 14: Add Shop tab to navigation

**Files:**
- Modify: `app/(app)/(tabs)/_layout.tsx`

- [ ] **Step 1: Add ShoppingBag to imports and add Shop tab**

Replace the entire `_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { View } from "react-native";
import {
  Home,
  Zap,
  CalendarCheck,
  ListTodo,
  User,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react-native";

const VIOLET = "#8B5CF6";
const GRAY = "#6B7280";

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View className="items-center justify-center gap-0.5" style={{ paddingTop: 6 }}>
      {focused && (
        <View className="absolute -top-2 w-8 h-1 rounded-full bg-violet-electric" />
      )}
      <Icon size={22} color={focused ? VIOLET : GRAY} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#2A2A4A",
          borderTopWidth: 3,
          borderTopColor: "#111827",
          height: 72,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: VIOLET,
        tabBarInactiveTintColor: GRAY,
        tabBarLabelStyle: {
          fontFamily: "Nunito_700Bold",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Zap} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dailies"
        options={{
          title: "Dailies",
          tabBarIcon: ({ focused }) => <TabIcon Icon={CalendarCheck} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: "To-Dos",
          tabBarIcon: ({ focused }) => <TabIcon Icon={ListTodo} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused }) => <TabIcon Icon={ShoppingBag} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/(tabs)/_layout.tsx"
git commit -m "feat: add Shop tab to bottom navigation"
```

---

### Task 15: Add gold-today indicator to dashboard

**Files:**
- Modify: `app/(app)/(tabs)/index.tsx`

- [ ] **Step 1: Add gold_earned_today to the destructured stats**

In `DashboardScreen`, update the `usePlayerStore()` destructuring line:

```ts
  const { hp, max_hp, xp, xp_to_next_level, level, gold, player_class, gold_earned_today } = usePlayerStore();
```

- [ ] **Step 2: Add gold cap row below the existing Gold display in the Player Stats card**

Replace the existing `{/* Gold */}` view block:

```tsx
            {/* Gold */}
            <View className="gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Coins size={14} color="#FACC15" strokeWidth={2.5} />
                  <Text className="text-sm text-yellow-sunburst" style={{ fontFamily: "Nunito_700Bold" }}>
                    {gold} Gold
                  </Text>
                </View>
                <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  {gold_earned_today}/50 earned today
                </Text>
              </View>
              {gold_earned_today >= 50 && (
                <Text className="text-xs text-yellow-400 text-right" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  Daily gold cap reached — XP still earned!
                </Text>
              )}
            </View>
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/(tabs)/index.tsx"
git commit -m "feat: add gold earned today / 50 indicator to dashboard"
```

---

### Task 16: Reschedule notifications on app open

**Files:**
- Modify: `app/(app)/_layout.tsx`

- [ ] **Step 1: Add notification reschedule on mount**

Update `app/(app)/_layout.tsx` — add these imports:

```ts
import { rescheduleAllDailies } from "@/features/notifications/service";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { updateTask } from "@/features/tasks/services";
```

Add this hook call inside `AppLayout` after `useGoldResetCheck()`:

```ts
  // Reschedule all notifications on app open (handles reinstalls/permission changes)
  const uid = useAuthStore((s) => s.user?.uid);
  useEffect(() => {
    if (!uid) return;
    const dailies = useTaskStore.getState().dailies;
    if (dailies.length === 0) return;
    rescheduleAllDailies(dailies).then(async (result) => {
      for (const [taskId, ids] of Object.entries(result)) {
        try {
          await updateTask(uid, taskId, { notification_ids: ids });
        } catch (e) {
          console.error("Failed to save notification_ids:", e);
        }
      }
    });
  }, [uid]);
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/_layout.tsx"
git commit -m "feat: reschedule all daily notifications on app open"
```

---

### Task 17: Rebuild and verify

- [ ] **Step 1: Build a new APK**

```bash
cd /c/Users/atila/Desktop/Projects/Published/Thribing && eas build --platform android --profile production
```

- [ ] **Step 2: Install and verify the following manually**

Checklist:
- Create a daily with `scheduled_time` set to 2 minutes from now → wait → app should show it locked (padlock + gold cost), HP should decrease
- With enough gold, tap the gold button on a locked daily → it should unlock and become checkable
- Drain HP to 0 via missed dailies → death modal appears with correct levels/gold lost
- Buy a Small Potion in the Shop → HP increases by 20, gold decreases by 10
- Complete tasks after earning 50 gold today → reward flash shows "gold cap" message, XP still awarded
- Notification arrives 5 minutes before a daily's scheduled time (requires `scheduled_time` set far enough in advance on a fresh install)

- [ ] **Step 3: Final commit if any adjustments were made**

```bash
git add -A
git commit -m "fix: post-build adjustments"
```
