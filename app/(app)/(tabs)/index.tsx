import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard } from "@/core_ui/components";

export default function DashboardScreen() {
  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <Text
          className="text-3xl text-white"
          style={{ fontFamily: "Nunito_800ExtraBold" }}
        >
          🎮 ThriBing
        </Text>

        {/* Player Stats Card */}
        <CartoonCard variant="violet">
          <View className="gap-3">
            <Text
              className="text-xl text-white"
              style={{ fontFamily: "Nunito_800ExtraBold" }}
            >
              Player Stats
            </Text>

            {/* HP Bar */}
            <View className="gap-1">
              <Text
                className="text-sm text-white"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                ❤️ HP: 50 / 50
              </Text>
              <View className="h-4 bg-gray-900 rounded-full border-2 border-gray-900 overflow-hidden">
                <View className="h-full w-full bg-red-danger rounded-full" />
              </View>
            </View>

            {/* XP Bar */}
            <View className="gap-1">
              <Text
                className="text-sm text-white"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                ⭐ XP: 0 / 100
              </Text>
              <View className="h-4 bg-gray-900 rounded-full border-2 border-gray-900 overflow-hidden">
                <View className="h-full w-[0%] bg-cyan-neon rounded-full" />
              </View>
            </View>

            {/* Level & Gold */}
            <View className="flex-row justify-between">
              <Text
                className="text-base text-white"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                🏆 Level 1
              </Text>
              <Text
                className="text-base text-yellow-sunburst"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                💰 0 Gold
              </Text>
            </View>
          </View>
        </CartoonCard>

        {/* Quick Actions */}
        <CartoonCard variant="default">
          <Text
            className="text-lg text-gray-900 mb-2"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            Today&apos;s Quests
          </Text>
          <Text
            className="text-sm text-gray-500"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            No tasks yet! Add habits, dailies, or to-dos to start your
            adventure.
          </Text>
        </CartoonCard>

        {/* Streak Card */}
        <CartoonCard variant="yellow">
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">🔥</Text>
            <View>
              <Text
                className="text-lg text-gray-900"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                0 Day Streak
              </Text>
              <Text
                className="text-sm text-gray-700"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                Complete dailies to build your streak!
              </Text>
            </View>
          </View>
        </CartoonCard>
      </View>
    </ScreenContainer>
  );
}
