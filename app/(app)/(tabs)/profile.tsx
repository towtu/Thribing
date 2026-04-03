import { useState } from "react";
import { View, Text, Alert, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Star, Coins, BookOpen, ChevronRight, Flame, Swords } from "lucide-react-native";
import { CLASS_INFO, CLASS_CHANGE_COST, getClassTitle } from "@/features/gamification/types";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { signOutUser } from "@/features/auth/services";

const LEVEL_TITLES = [
  { min: 1, label: "Novice" },
  { min: 5, label: "Apprentice" },
  { min: 10, label: "Warrior" },
  { min: 20, label: "Champion" },
  { min: 50, label: "Legend" },
];

function getLevelTitle(level: number) {
  let title = "Novice";
  for (const t of LEVEL_TITLES) {
    if (level >= t.min) title = t.label;
  }
  return title;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { hp, max_hp, xp, xp_to_next_level, level, gold } = usePlayerStore();
  const tasks = useTaskStore((s) => s.tasks);
  const habits = useTaskStore((s) => s.habits);
  const [signingOut, setSigningOut] = useState(false);

  const playerClass = usePlayerStore((s) => s.player_class);
  const levelTitle = getClassTitle(playerClass, level);
  const classInfo = CLASS_INFO[playerClass];
  const xpPercent = xp_to_next_level > 0 ? Math.min(100, Math.round((xp / xp_to_next_level) * 100)) : 0;
  const hpPercent = max_hp > 0 ? Math.min(100, Math.round((hp / max_hp) * 100)) : 100;

  const totalHabits = habits.length;
  const totalStreaks = habits.reduce((sum, h) => sum + (h.streak ?? 0), 0);

  const handleSignOut = () => {
    const doSignOut = async () => {
      setSigningOut(true);
      try {
        await signOutUser();
      } catch {
        setSigningOut(false);
      }
    };

    if (Platform.OS === "web") {
      // Alert.alert is native-only; use browser confirm on web
      if (window.confirm("Are you sure you want to sign out?")) {
        doSignOut();
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: doSignOut },
        ]
      );
    }
  };

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 bg-pink-bubblegum border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <User size={20} color="#111827" strokeWidth={2.5} />
          </View>
          <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
            Profile
          </Text>
        </View>

        {/* Avatar + Identity */}
        <CartoonCard variant="violet">
          <View className="items-center gap-3">
            <View className="w-20 h-20 bg-yellow-sunburst border-4 border-gray-900 rounded-full items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Text style={{ fontSize: 36 }}>{classInfo.emoji}</Text>
            </View>
            <View className="items-center gap-2">
              <Text className="text-xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {user?.displayName || "Adventurer"}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5">
                  <Text className="text-xs text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    Lv.{level} {levelTitle}
                  </Text>
                </View>
                {playerClass !== "adventurer" && (
                  <View className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5">
                    <Text className="text-xs text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                      {classInfo.label}
                    </Text>
                  </View>
                )}
              </View>
              {user?.email && (
                <Text className="text-xs text-violet-200" style={{ fontFamily: "Nunito_400Regular" }}>
                  {user.email}
                </Text>
              )}
            </View>
          </View>
        </CartoonCard>

        {/* XP progress toward next level */}
        <CartoonCard variant="default">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Star size={14} color="#8B5CF6" strokeWidth={2.5} />
                <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_700Bold" }}>
                  Level Progress
                </Text>
              </View>
              <Text className="text-sm text-violet-electric" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {xp}/{xp_to_next_level} XP
              </Text>
            </View>
            <View className="h-4 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden">
              <View
                className="h-full rounded-full bg-violet-electric"
                style={{ width: `${xpPercent}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
              {xp_to_next_level - xp} XP to Level {level + 1}
            </Text>
          </View>
        </CartoonCard>

        {/* Stats row */}
        <View className="flex-row gap-3">
          <CartoonCard variant="pink" className="flex-1">
            <View className="items-center gap-1">
              <Shield size={18} color="#111827" strokeWidth={2.5} />
              <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {hp}
              </Text>
              <Text className="text-[10px] text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                HP
              </Text>
              <View className="w-full h-2 bg-black/20 rounded-full overflow-hidden mt-1">
                <View className="h-full rounded-full bg-white/60" style={{ width: `${hpPercent}%` }} />
              </View>
            </View>
          </CartoonCard>

          <CartoonCard variant="cyan" className="flex-1">
            <View className="items-center gap-1">
              <Star size={18} color="#111827" strokeWidth={2.5} />
              <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {xp}
              </Text>
              <Text className="text-[10px] text-gray-800" style={{ fontFamily: "Nunito_700Bold" }}>
                XP
              </Text>
            </View>
          </CartoonCard>

          <CartoonCard variant="yellow" className="flex-1">
            <View className="items-center gap-1">
              <Coins size={18} color="#111827" strokeWidth={2.5} />
              <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                {gold}
              </Text>
              <Text className="text-[10px] text-gray-800" style={{ fontFamily: "Nunito_700Bold" }}>
                Gold
              </Text>
            </View>
          </CartoonCard>
        </View>

        {/* Summary card */}
        <CartoonCard variant="default">
          <View className="gap-2">
            <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Adventure Summary
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600" style={{ fontFamily: "Nunito_600SemiBold" }}>Total tasks</Text>
              <Text className="text-xs text-violet-electric" style={{ fontFamily: "Nunito_800ExtraBold" }}>{tasks.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600" style={{ fontFamily: "Nunito_600SemiBold" }}>Active habits</Text>
              <Text className="text-xs text-violet-electric" style={{ fontFamily: "Nunito_800ExtraBold" }}>{totalHabits}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600" style={{ fontFamily: "Nunito_600SemiBold" }}>Total streak weeks</Text>
              <View className="flex-row items-center gap-1">
                <Flame size={10} color="#EAB308" strokeWidth={2.5} />
                <Text className="text-xs text-yellow-600" style={{ fontFamily: "Nunito_800ExtraBold" }}>{totalStreaks}</Text>
              </View>
            </View>
          </View>
        </CartoonCard>

        {/* Change Class (only available if class is picked, i.e. level >= 5) */}
        {playerClass !== "adventurer" && (
          <Pressable onPress={() => router.push({ pathname: "/choose-class" as any, params: { respec: "1" } })} className="active:scale-98">
            <CartoonCard variant="default">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-red-400 border-2 border-gray-900 rounded-xl items-center justify-center">
                  <Swords size={18} color="white" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    Change Class
                  </Text>
                  <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    Costs {CLASS_CHANGE_COST} gold • You have {gold} gold
                  </Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" strokeWidth={2} />
              </View>
            </CartoonCard>
          </Pressable>
        )}

        {/* How it works */}
        <Pressable onPress={() => router.push("/tutorial" as any)} className="active:scale-98">
          <CartoonCard variant="default">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-cyan-neon border-2 border-gray-900 rounded-xl items-center justify-center">
                <BookOpen size={18} color="#111827" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  How ThriBing Works
                </Text>
                <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  Game guide, rewards &amp; tips
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" strokeWidth={2} />
            </View>
          </CartoonCard>
        </Pressable>

        {/* Sign out */}
        <View className="mt-2">
          <CartoonButton
            title={signingOut ? "Signing out..." : "Sign Out"}
            variant="pink"
            size="md"
            onPress={handleSignOut}
            disabled={signingOut}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
