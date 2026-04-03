import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Trash2, Check, Flame, Lock } from "lucide-react-native";
import { CartoonCard } from "@/core_ui/components";
import { ProgressBar } from "@/core_ui/components/ProgressBar";
import { CounterControl } from "@/core_ui/components/CounterControl";
import { TimerDisplay } from "@/core_ui/components/TimerDisplay";
import { WeekDots } from "@/core_ui/components/WeekDots";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import {
  deleteTask,
  incrementDailyCount,
  logHabitCompletion,
  undoHabitCompletion,
  toggleTaskComplete,
  updateTask,
  unlockDaily,
  DAILY_UNLOCK_COSTS,
} from "../services";
import { updatePlayerStats } from "@/features/gamification/services";
import {
  processTaskCompletion,
  undoTaskCompletion,
  DAILY_GOLD_CAP,
} from "@/features/gamification/engine";
import { useTimer } from "../hooks/useTimer";
import type { Task } from "../types";

const DIFFICULTY_LABELS = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

interface TaskCardProps {
  task: Task;
}

// ─── Daily Card ──────────────────────────────────────────────────────────────

function DailyCard({ task }: { task: Task }) {
  const user = useAuthStore((s) => s.user);
  const storeUpdateTask = useTaskStore((s) => s.updateTask);
  const [busy, setBusy] = useState(false);
  const [showReward, setShowReward] = useState<string | null>(null);

  const hasQuantity = (task.target_count ?? 0) > 0;
  const currentCount = task.current_count ?? 0;
  const targetCount = task.target_count ?? 1;
  const unit = task.unit ?? "times";
  const targetSeconds = hasQuantity && task.unit === "minutes" ? targetCount * 60 : 0;

  const timer = useTimer(task.id, targetSeconds);

  const awardCompletion = async () => {
    if (!user?.uid) return;
    const currentStats = usePlayerStore.getState();
    const newStats = processTaskCompletion(task.difficulty, currentStats);
    const xpGain =
      newStats.xp -
      currentStats.xp +
      (newStats.level > currentStats.level
        ? currentStats.xp_to_next_level - currentStats.xp
        : 0);
    const goldGain = newStats.gold - currentStats.gold;
    const capReached = newStats.gold_earned_today >= DAILY_GOLD_CAP;
    setShowReward(
      `+${xpGain} XP${goldGain > 0 ? `  +${goldGain} 🪙` : ""}${capReached && goldGain === 0 ? " (cap)" : ""}`
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

  const handleIncrement = async () => {
    if (!user?.uid || busy || task.completed || task.locked) return;
    setBusy(true);
    try {
      const newCount = Math.min(currentCount + 1, targetCount);
      storeUpdateTask(task.id, { current_count: newCount, completed: newCount >= targetCount });
      await incrementDailyCount(user.uid, task.id, newCount, targetCount);
      if (newCount >= targetCount) {
        await awardCompletion();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrement = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      const newCount = Math.max(0, currentCount - 1);
      const wasCompleted = task.completed;
      storeUpdateTask(task.id, { current_count: newCount, completed: false });
      await updateTask(user.uid, task.id, { current_count: newCount, completed: false });
      if (wasCompleted) {
        const currentStats = usePlayerStore.getState();
        const newStats = undoTaskCompletion(task.difficulty, currentStats);
        await updatePlayerStats(user.uid, {
          xp: newStats.xp,
          gold: newStats.gold,
          hp: newStats.hp,
          max_hp: newStats.max_hp,
          xp_to_next_level: newStats.xp_to_next_level,
          level: newStats.level,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleTimerTick = async () => {
    if (!user?.uid || task.completed) return;
    const elapsedMins = timer.elapsedMinutes;
    if (elapsedMins > currentCount) {
      const newCount = Math.min(elapsedMins, targetCount);
      storeUpdateTask(task.id, { current_count: newCount, completed: newCount >= targetCount });
      await incrementDailyCount(user.uid, task.id, newCount, targetCount);
      if (newCount >= targetCount && !task.completed) {
        await awardCompletion();
        timer.pause();
      }
    }
  };

  const handleSimpleToggle = async () => {
    if (!user?.uid || busy || task.locked) return;
    setBusy(true);
    try {
      const newCompleted = !task.completed;
      storeUpdateTask(task.id, { completed: newCompleted });
      await toggleTaskComplete(user.uid, task.id, newCompleted);
      if (newCompleted) {
        await awardCompletion();
      } else {
        const currentStats = usePlayerStore.getState();
        const newStats = undoTaskCompletion(task.difficulty, currentStats);
        await updatePlayerStats(user.uid, {
          xp: newStats.xp,
          gold: newStats.gold,
          hp: newStats.hp,
          max_hp: newStats.max_hp,
          xp_to_next_level: newStats.xp_to_next_level,
          level: newStats.level,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

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
      usePlayerStore.getState().setStats({ ...currentStats, gold: newGold });
      storeUpdateTask(task.id, { locked: false });
      await updatePlayerStats(user.uid, { gold: newGold });
      await unlockDaily(user.uid, task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      await deleteTask(user.uid, task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CartoonCard
      variant="default"
      className={`${task.completed ? "opacity-60" : ""} ${task.locked ? "border-red-500" : ""}`}
    >
      <View className="gap-3">
        {/* Header row */}
        <View className="flex-row items-start">
          {/* Checkbox or locked unlock button (no-quantity mode) */}
          {!hasQuantity && (
            task.locked ? (
              <Pressable
                onPress={handleUnlock}
                disabled={busy}
                className="h-9 bg-yellow-sunburst border-4 border-gray-900 rounded-xl items-center justify-center active:scale-95 mr-3 flex-shrink-0 mt-0.5 flex-row gap-1 px-2"
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

          <View className="flex-1 gap-0.5">
            <Text
              className={`text-base text-gray-900 leading-tight ${task.completed ? "line-through text-gray-400" : ""}`}
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {task.title}
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                Daily • {DIFFICULTY_LABELS[task.difficulty]}
              </Text>
              {task.scheduled_time && (
                <View className={`border rounded-full px-2 ${task.locked ? "bg-red-100 border-red-400" : "bg-violet-100 border-violet-300"}`}>
                  <Text
                    className={`text-xs ${task.locked ? "text-red-700" : "text-violet-700"}`}
                    style={{ fontFamily: "Nunito_700Bold" }}
                  >
                    {task.locked ? "🔒 " : ""}{task.scheduled_time}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reward flash */}
          {showReward && (
            <Text
              className="text-xs text-green-600 font-bold ml-2"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {showReward}
            </Text>
          )}

          {/* Delete */}
          <Pressable onPress={handleDelete} disabled={busy} className="ml-2 p-1">
            <Trash2 size={16} color="#9CA3AF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Quantity section */}
        {hasQuantity && !task.has_timer && (
          <View className="gap-2">
            <ProgressBar
              current={currentCount}
              total={targetCount}
              unit={unit}
              color="cyan"
            />
            {!task.completed && !task.locked && (
              <CounterControl
                count={currentCount}
                total={targetCount}
                unit={unit}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                disabled={busy}
              />
            )}
            {task.locked && (
              <Pressable
                onPress={handleUnlock}
                disabled={busy}
                className="flex-row items-center justify-center gap-1 h-9 bg-yellow-sunburst border-4 border-gray-900 rounded-xl active:scale-95"
              >
                <Lock size={12} color="#111827" strokeWidth={3} />
                <Text className="text-xs text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  Unlock for {DAILY_UNLOCK_COSTS[task.difficulty]}🪙
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Timer section */}
        {hasQuantity && task.has_timer && !task.locked && (
          <TimerDisplay
            elapsed={timer.elapsed}
            targetSeconds={targetSeconds}
            isRunning={timer.isRunning}
            onStart={() => { timer.start(); }}
            onPause={() => { timer.pause(); handleTimerTick(); }}
            onReset={() => {
              timer.reset();
              storeUpdateTask(task.id, { current_count: 0, completed: false });
              if (user?.uid) {
                updateTask(user.uid, task.id, { current_count: 0, completed: false });
              }
            }}
            disabled={task.completed}
          />
        )}
        {hasQuantity && task.has_timer && task.locked && (
          <Pressable
            onPress={handleUnlock}
            disabled={busy}
            className="flex-row items-center justify-center gap-1 h-9 bg-yellow-sunburst border-4 border-gray-900 rounded-xl active:scale-95"
          >
            <Lock size={12} color="#111827" strokeWidth={3} />
            <Text className="text-xs text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Unlock for {DAILY_UNLOCK_COSTS[task.difficulty]}🪙
            </Text>
          </Pressable>
        )}
      </View>
    </CartoonCard>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({ task }: { task: Task }) {
  const user = useAuthStore((s) => s.user);
  const storeUpdateTask = useTaskStore((s) => s.updateTask);
  const [busy, setBusy] = useState(false);
  const [showReward, setShowReward] = useState<string | null>(null);

  const weeklyTarget = task.weekly_target ?? 1;
  const weeklyCompletions = task.weekly_completions ?? [];
  const streak = task.streak ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = weeklyCompletions.includes(today);
  const weekCount = weeklyCompletions.length;

  const handleLog = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      if (loggedToday) {
        const newCompletions = weeklyCompletions.filter((d) => d !== today);
        storeUpdateTask(task.id, { weekly_completions: newCompletions });
        await undoHabitCompletion(user.uid, task.id, weeklyCompletions);
        const currentStats = usePlayerStore.getState();
        const newStats = undoTaskCompletion(task.difficulty, currentStats);
        await updatePlayerStats(user.uid, {
          xp: newStats.xp,
          gold: newStats.gold,
          hp: newStats.hp,
          max_hp: newStats.max_hp,
          xp_to_next_level: newStats.xp_to_next_level,
          level: newStats.level,
        });
      } else {
        const newCompletions = [...weeklyCompletions, today];
        storeUpdateTask(task.id, { weekly_completions: newCompletions });
        await logHabitCompletion(user.uid, task.id, weeklyCompletions);
        const currentStats = usePlayerStore.getState();
        const newStats = processTaskCompletion(task.difficulty, currentStats);
        const xpGain =
          newStats.xp -
          currentStats.xp +
          (newStats.level > currentStats.level
            ? currentStats.xp_to_next_level - currentStats.xp
            : 0);
        const goldGain = newStats.gold - currentStats.gold;
        setShowReward(`+${xpGain} XP${goldGain > 0 ? `  +${goldGain} 🪙` : ""}`);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      await deleteTask(user.uid, task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CartoonCard variant="default">
      <View className="gap-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleLog}
            disabled={busy}
            className={`w-9 h-9 border-4 border-gray-900 rounded-xl items-center justify-center active:scale-95 mr-3 flex-shrink-0 ${
              loggedToday ? "bg-violet-electric" : "bg-white"
            }`}
          >
            {loggedToday && <Check size={16} color="white" strokeWidth={3} />}
          </Pressable>

          <View className="flex-1 gap-0.5">
            <Text
              className="text-base text-gray-900 leading-tight"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {task.title}
            </Text>
            <Text
              className="text-xs text-gray-500"
              style={{ fontFamily: "Nunito_400Regular" }}
            >
              {weekCount}/{weeklyTarget}×/week • {DIFFICULTY_LABELS[task.difficulty]}
            </Text>
          </View>

          {streak > 0 && (
            <View className="flex-row items-center gap-1 bg-yellow-sunburst border-2 border-gray-900 rounded-full px-2 py-0.5 mr-2">
              <Flame size={12} color="#111827" strokeWidth={2.5} />
              <Text
                className="text-xs text-gray-900"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                {streak}wk
              </Text>
            </View>
          )}

          {showReward && (
            <Text
              className="text-xs text-green-600 font-bold mr-1"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {showReward}
            </Text>
          )}

          <Pressable onPress={handleDelete} disabled={busy} className="p-1">
            <Trash2 size={16} color="#9CA3AF" strokeWidth={2} />
          </Pressable>
        </View>

        <View className="gap-1">
          <View className="h-2 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden">
            <View
              className="h-full rounded-full bg-violet-electric"
              style={{
                width: `${weeklyTarget > 0 ? Math.min(100, (weekCount / weeklyTarget) * 100) : 0}%`,
              }}
            />
          </View>
          <WeekDots completions={weeklyCompletions} />
        </View>

        {loggedToday && (
          <Text
            className="text-xs text-violet-600 text-center"
            style={{ fontFamily: "Nunito_700Bold" }}
          >
            ✓ Logged today — tap to undo
          </Text>
        )}
      </View>
    </CartoonCard>
  );
}

// ─── Todo Card ────────────────────────────────────────────────────────────────

function TodoCard({ task }: { task: Task }) {
  const user = useAuthStore((s) => s.user);
  const storeUpdateTask = useTaskStore((s) => s.updateTask);
  const [busy, setBusy] = useState(false);
  const [showReward, setShowReward] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      const newCompleted = !task.completed;
      storeUpdateTask(task.id, { completed: newCompleted });
      await toggleTaskComplete(user.uid, task.id, newCompleted);
      if (newCompleted) {
        const currentStats = usePlayerStore.getState();
        const newStats = processTaskCompletion(task.difficulty, currentStats);
        const xpGain =
          newStats.xp -
          currentStats.xp +
          (newStats.level > currentStats.level
            ? currentStats.xp_to_next_level - currentStats.xp
            : 0);
        const goldGain = newStats.gold - currentStats.gold;
        setShowReward(`+${xpGain} XP${goldGain > 0 ? `  +${goldGain} 🪙` : ""}`);
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
      } else {
        const currentStats = usePlayerStore.getState();
        const newStats = undoTaskCompletion(task.difficulty, currentStats);
        await updatePlayerStats(user.uid, {
          xp: newStats.xp,
          gold: newStats.gold,
          hp: newStats.hp,
          max_hp: newStats.max_hp,
          xp_to_next_level: newStats.xp_to_next_level,
          level: newStats.level,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      await deleteTask(user.uid, task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CartoonCard variant="default" className={task.completed ? "opacity-60" : ""}>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={handleToggle}
          disabled={busy}
          className={`w-9 h-9 border-4 border-gray-900 rounded-full items-center justify-center active:scale-95 flex-shrink-0 ${
            task.completed ? "bg-green-500" : "bg-white"
          }`}
        >
          {task.completed && <Check size={16} color="white" strokeWidth={3} />}
        </Pressable>

        <View className="flex-1">
          <Text
            className={`text-base text-gray-900 ${task.completed ? "line-through text-gray-400" : ""}`}
            style={{ fontFamily: "Nunito_700Bold" }}
          >
            {task.title}
          </Text>
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: "Nunito_400Regular" }}
          >
            One-time • {DIFFICULTY_LABELS[task.difficulty]}
          </Text>
          {showReward && (
            <Text
              className="text-xs mt-1 text-green-600 font-bold"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {showReward}
            </Text>
          )}
        </View>

        <Pressable onPress={handleDelete} disabled={busy} className="p-1">
          <Trash2 size={16} color="#9CA3AF" strokeWidth={2} />
        </Pressable>
      </View>
    </CartoonCard>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function TaskCard({ task }: TaskCardProps) {
  if (task.type === "habit") return <HabitCard task={task} />;
  if (task.type === "daily") return <DailyCard task={task} />;
  return <TodoCard task={task} />;
}
