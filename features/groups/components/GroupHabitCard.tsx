import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react-native";
import { CartoonCard } from "@/core_ui/components";
import { ProgressBar } from "@/core_ui/components/ProgressBar";
import { CounterControl } from "@/core_ui/components/CounterControl";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useGroupStore } from "@/lib/stores/useGroupStore";
import { useGroupMembers } from "../hooks";
import {
  logGroupCompletion,
  undoGroupCompletion,
  incrementGroupSession,
  leaveGroup,
} from "../services";
import { updatePlayerStats } from "@/features/gamification/services";
import { processTaskCompletion, undoTaskCompletion } from "@/features/gamification/engine";
import type { GroupHabit } from "../types";

const CLASS_EMOJIS: Record<string, string> = {
  adventurer: "⚔️", swordsman: "🗡️", wizard: "🧙", marksman: "🏹", healer: "💚", rogue: "🗝️",
};
const DIFFICULTY_LABELS = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

interface GroupHabitCardProps {
  group: GroupHabit;
}

export function GroupHabitCard({ group }: GroupHabitCardProps) {
  const user = useAuthStore((s) => s.user);
  const playerStats = usePlayerStore();
  const groupMembers = useGroupStore((s) => s.groupMembers[group.id] ?? []);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReward, setShowReward] = useState<string | null>(null);

  useGroupMembers(group.id);

  const today = new Date().toISOString().split("T")[0];
  const myMember = groupMembers.find((m) => m.uid === user?.uid);
  const myCompletions = myMember?.weekly_completions ?? [];
  const mySessionCurrent = myMember?.session_current_count ?? 0;
  const loggedToday = myCompletions.includes(today);
  const weekCount = myCompletions.length;
  const hasSession = (group.session_target_count ?? 0) > 0;
  const sessionTarget = group.session_target_count ?? 1;
  const activeMembers = groupMembers.filter((m) => m.status === "active");

  const awardCompletion = async () => {
    if (!user?.uid) return;
    const newStats = processTaskCompletion(group.difficulty, playerStats);
    const xpGain =
      newStats.xp - playerStats.xp +
      (newStats.level > playerStats.level ? playerStats.xp_to_next_level - playerStats.xp : 0);
    const goldGain = newStats.gold - playerStats.gold;
    setShowReward(`+${xpGain} XP${goldGain > 0 ? `  +${goldGain} 🪙` : ""}`);
    setTimeout(() => setShowReward(null), 2000);
    await updatePlayerStats(user.uid, {
      hp: newStats.hp, max_hp: newStats.max_hp,
      xp: newStats.xp, xp_to_next_level: newStats.xp_to_next_level,
      level: newStats.level, gold: newStats.gold,
      gold_earned_today: newStats.gold_earned_today,
    });
  };

  const handleToggle = async () => {
    if (!user?.uid || busy || hasSession) return;
    setBusy(true);
    try {
      if (loggedToday) {
        await undoGroupCompletion(group.id, user.uid, myCompletions);
        const newStats = undoTaskCompletion(group.difficulty, playerStats);
        await updatePlayerStats(user.uid, {
          xp: newStats.xp, gold: newStats.gold, hp: newStats.hp,
          max_hp: newStats.max_hp, xp_to_next_level: newStats.xp_to_next_level,
          level: newStats.level,
        });
      } else {
        await logGroupCompletion(group.id, user.uid, myCompletions);
        await awardCompletion();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleSessionIncrement = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    try {
      const { autoLogged } = await incrementGroupSession(
        group.id, user.uid, mySessionCurrent + 1, sessionTarget, myCompletions
      );
      if (autoLogged) await awardCompletion();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleSessionDecrement = async () => {
    if (!user?.uid || busy || mySessionCurrent <= 0) return;
    await incrementGroupSession(group.id, user.uid, mySessionCurrent - 1, sessionTarget, myCompletions).catch(console.error);
  };

  const handleLeave = async () => {
    if (!user?.uid) return;
    await leaveGroup(user.uid, group.id).catch(console.error);
  };

  return (
    <CartoonCard variant="default">
      <View className="gap-3">
        {/* Header */}
        <View className="flex-row items-start">
          <View className="w-9 h-9 bg-pink-bubblegum border-4 border-gray-900 rounded-xl items-center justify-center mr-3 flex-shrink-0">
            <Text style={{ fontSize: 16 }}>👥</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base text-gray-900 leading-tight" style={{ fontFamily: "Nunito_700Bold" }}>
              {group.title}
            </Text>
            <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_400Regular" }}>
              {weekCount}/{group.weekly_target}×/week • {DIFFICULTY_LABELS[group.difficulty]} • {activeMembers.length} members
            </Text>
          </View>
          {showReward && (
            <Text className="text-xs text-green-600 font-bold mr-1" style={{ fontFamily: "Nunito_700Bold" }}>
              {showReward}
            </Text>
          )}
          <Pressable onPress={() => setExpanded((v) => !v)} className="p-1 ml-1">
            {expanded
              ? <ChevronUp size={18} color="#6B7280" strokeWidth={2} />
              : <ChevronDown size={18} color="#6B7280" strokeWidth={2} />
            }
          </Pressable>
        </View>

        {/* My progress — simple toggle */}
        {!hasSession && (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handleToggle}
              disabled={busy}
              className={`w-9 h-9 border-4 border-gray-900 rounded-xl items-center justify-center active:scale-95 flex-shrink-0 ${
                loggedToday ? "bg-pink-bubblegum" : "bg-white"
              }`}
            >
              {loggedToday && <Text className="text-white text-sm">✓</Text>}
            </Pressable>
            <View className="flex-1">
              <ProgressBar current={weekCount} total={group.weekly_target} unit="times" color="pink" />
            </View>
          </View>
        )}

        {/* My progress — session counter */}
        {hasSession && (
          <View className="gap-2">
            <ProgressBar
              current={loggedToday ? weekCount : mySessionCurrent}
              total={loggedToday ? group.weekly_target : sessionTarget}
              unit={group.session_unit ?? "times"}
              color="pink"
            />
            {!loggedToday && (
              <CounterControl
                count={mySessionCurrent}
                total={sessionTarget}
                unit={group.session_unit ?? "times"}
                onIncrement={handleSessionIncrement}
                onDecrement={handleSessionDecrement}
                disabled={busy}
              />
            )}
            {loggedToday && (
              <Text className="text-xs text-pink-600 text-center" style={{ fontFamily: "Nunito_700Bold" }}>
                ✓ Logged today
              </Text>
            )}
          </View>
        )}

        {/* All members' progress bars (expanded) */}
        {expanded && activeMembers.length > 0 && (
          <View className="gap-2 pt-2 border-t-2 border-gray-200">
            <Text className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Member Progress
            </Text>
            {activeMembers.map((member) => {
              const count = member.weekly_completions.length;
              const isMe = member.uid === user?.uid;
              return (
                <View key={member.uid} className="flex-row items-center gap-2">
                  <View className="w-7 h-7 bg-yellow-sunburst border-2 border-gray-900 rounded-full items-center justify-center flex-shrink-0">
                    <Text style={{ fontSize: 12 }}>{CLASS_EMOJIS[member.player_class] ?? "⚔️"}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="text-xs text-gray-700" style={{ fontFamily: "Nunito_700Bold" }}>
                        {isMe ? "You" : member.displayName}
                        {member.streak > 0 && (
                          <Text className="text-yellow-600"> 🔥{member.streak}wk</Text>
                        )}
                      </Text>
                      <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                        {count}/{group.weekly_target}
                      </Text>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full border border-gray-300 overflow-hidden">
                      <View
                        className={`h-full rounded-full ${isMe ? "bg-pink-bubblegum" : "bg-violet-electric"}`}
                        style={{
                          width: `${group.weekly_target > 0 ? Math.min(100, (count / group.weekly_target) * 100) : 0}%`,
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Leave button (expanded) */}
        {expanded && (
          <Pressable
            onPress={handleLeave}
            className="flex-row items-center justify-center gap-1 py-1 active:opacity-70"
          >
            <LogOut size={12} color="#9CA3AF" strokeWidth={2} />
            <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
              Leave Group
            </Text>
          </Pressable>
        )}
      </View>
    </CartoonCard>
  );
}
