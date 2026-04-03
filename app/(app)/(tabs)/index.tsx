import { View, Text } from "react-native";
import { Home, Flame, Shield, Star, Coins } from "lucide-react-native";
import { ScreenContainer, CartoonCard } from "@/core_ui/components";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { CLASS_INFO, getClassTitle } from "@/features/gamification/types";

function StatBar({
  label,
  current,
  max,
  color,
  icon,
}: {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {icon}
          <Text className="text-xs text-white opacity-90" style={{ fontFamily: "Nunito_700Bold" }}>
            {label}
          </Text>
        </View>
        <Text className="text-xs text-white opacity-80" style={{ fontFamily: "Nunito_600SemiBold" }}>
          {current}{max !== current ? `/${max}` : ""}
        </Text>
      </View>
      <View className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/20">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { hp, max_hp, xp, xp_to_next_level, level, gold, player_class, gold_earned_today } = usePlayerStore();
  const classInfo = CLASS_INFO[player_class];
  const classTitle = getClassTitle(player_class, level);
  const todaysDailies = useTaskStore((s) => s.todaysDailies);
  const habits = useTaskStore((s) => s.habits);
  const tasks = useTaskStore((s) => s.tasks);
  const timers = useTaskStore((s) => s.timers);

  const incompleteDailies = todaysDailies.filter((d) => !d.completed);
  const completedDailies = todaysDailies.filter((d) => d.completed).length;
  const today = new Date().toISOString().split("T")[0];

  // Find an active timer
  const activeTimerTaskId = Object.entries(timers).find(([, t]) => t.isRunning)?.[0];
  const activeTimerTask = activeTimerTaskId
    ? tasks.find((t) => t.id === activeTimerTaskId)
    : null;

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 bg-violet-electric border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Home size={20} color="white" strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              ThriBing
            </Text>
            <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
              {classInfo.emoji} Lv.{level} {classTitle}
            </Text>
          </View>
        </View>

        {/* Player Stats Card */}
        <CartoonCard variant="violet">
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Player Stats
              </Text>
              <View className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5">
                <Text className="text-sm text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  Lv.{level}
                </Text>
              </View>
            </View>

            <StatBar
              label="HP"
              current={hp}
              max={max_hp}
              color="bg-red-400"
              icon={<Shield size={12} color="white" strokeWidth={2.5} />}
            />
            <StatBar
              label="XP"
              current={xp}
              max={xp_to_next_level}
              color="bg-cyan-neon"
              icon={<Star size={12} color="white" strokeWidth={2.5} />}
            />

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
                  {gold_earned_today}/50 today
                </Text>
              </View>
              {gold_earned_today >= 50 && (
                <Text className="text-xs text-yellow-400 text-right" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  Daily gold cap reached — XP still earned!
                </Text>
              )}
            </View>
          </View>
        </CartoonCard>

        {/* Active timer card */}
        {activeTimerTask && activeTimerTaskId && (
          <CartoonCard variant="pink">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-white/20 rounded-xl border-2 border-white/30 items-center justify-center">
                <Text className="text-base">⏱️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  {activeTimerTask.title}
                </Text>
                <Text className="text-lg text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  {formatElapsed(timers[activeTimerTaskId].elapsed)}
                  <Text className="text-xs text-white/70" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    {" "}/ {(activeTimerTask.target_count ?? 0) * 60 > 0 ? formatElapsed(activeTimerTask.target_count! * 60) : ""}
                  </Text>
                </Text>
              </View>
              <View className="bg-white/20 rounded-full px-2 py-0.5 border border-white/30">
                <Text className="text-xs text-white" style={{ fontFamily: "Nunito_700Bold" }}>LIVE</Text>
              </View>
            </View>
          </CartoonCard>
        )}

        {/* Today's Dailies progress */}
        <CartoonCard variant="default">
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Today's Progress
              </Text>
              <Text className="text-sm text-violet-electric" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {completedDailies}/{todaysDailies.length}
              </Text>
            </View>

            {todaysDailies.length > 0 ? (
              <>
                <View className="h-3 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden">
                  <View
                    className="h-full rounded-full bg-cyan-neon"
                    style={{ width: `${todaysDailies.length > 0 ? (completedDailies / todaysDailies.length) * 100 : 0}%` }}
                  />
                </View>
                {incompleteDailies.length === 0 ? (
                  <Text className="text-sm text-green-600 text-center" style={{ fontFamily: "Nunito_700Bold" }}>
                    ✨ All dailies complete! Amazing work!
                  </Text>
                ) : (
                  <Text className="text-sm text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    {incompleteDailies.length} remaining • Keep going!
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-sm text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                No dailies scheduled for today. Add some to start earning XP!
              </Text>
            )}
          </View>
        </CartoonCard>

        {/* This week's habits */}
        {habits.length > 0 && (
          <CartoonCard variant="default">
            <View className="gap-2">
              <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                This Week's Habits
              </Text>
              {habits.slice(0, 3).map((habit) => {
                const completions = habit.weekly_completions ?? [];
                const target = habit.weekly_target ?? 1;
                const count = completions.length;
                const pct = Math.min(100, (count / target) * 100);
                const streak = habit.streak ?? 0;
                return (
                  <View key={habit.id} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-gray-800 flex-1" style={{ fontFamily: "Nunito_700Bold" }} numberOfLines={1}>
                        {habit.title}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        {streak > 0 && (
                          <View className="flex-row items-center gap-0.5 bg-yellow-100 rounded-full px-1.5">
                            <Flame size={10} color="#EAB308" strokeWidth={2.5} />
                            <Text className="text-[10px] text-yellow-700" style={{ fontFamily: "Nunito_700Bold" }}>
                              {streak}wk
                            </Text>
                          </View>
                        )}
                        <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                          {count}/{target}
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                      <View className="h-full rounded-full bg-violet-electric" style={{ width: `${pct}%` }} />
                    </View>
                  </View>
                );
              })}
              {habits.length > 3 && (
                <Text className="text-xs text-gray-400 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  +{habits.length - 3} more habits
                </Text>
              )}
            </View>
          </CartoonCard>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <CartoonCard variant="yellow">
            <View className="items-center gap-2 py-1">
              <Text className="text-3xl">🗺️</Text>
              <Text className="text-base text-gray-900 text-center" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Start Your Adventure!
              </Text>
              <Text className="text-xs text-gray-700 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                Add dailies, habits, or to-dos to begin earning XP and building your character.
              </Text>
            </View>
          </CartoonCard>
        )}
      </View>
    </ScreenContainer>
  );
}
