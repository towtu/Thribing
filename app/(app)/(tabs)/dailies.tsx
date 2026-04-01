import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";

export default function DailiesScreen() {
  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            📅 Dailies
          </Text>
          <CartoonButton title="+ New" variant="violet" size="sm" />
        </View>

        {/* Example Daily */}
        <CartoonCard variant="default">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 border-4 border-gray-900 rounded-xl items-center justify-center bg-white">
              <Text className="text-xs text-gray-400">☐</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-base text-gray-900"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                Morning Workout
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                Every weekday • Medium difficulty
              </Text>
            </View>
          </View>
        </CartoonCard>

        {/* Completed Daily Example */}
        <CartoonCard variant="default" className="opacity-60">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 border-4 border-gray-900 rounded-xl items-center justify-center bg-green-500">
              <Text className="text-lg text-white">✓</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-base text-gray-900 line-through"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                Read 30 Minutes
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                Daily • Easy difficulty
              </Text>
            </View>
          </View>
        </CartoonCard>

        {/* Info Card */}
        <CartoonCard variant="pink">
          <Text
            className="text-sm text-white text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            ⚠️ Incomplete dailies deal damage at midnight!{"\n"}
            Stay on top of your quests, adventurer!
          </Text>
        </CartoonCard>
      </View>
    </ScreenContainer>
  );
}
