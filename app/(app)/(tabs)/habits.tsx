import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";

export default function HabitsScreen() {
  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            ⚡ Habits
          </Text>
          <CartoonButton title="+ New" variant="pink" size="sm" />
        </View>

        {/* Example Positive Habit */}
        <CartoonCard variant="default">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-green-500 border-2 border-gray-900 rounded-full items-center justify-center">
              <Text className="text-lg">+</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-base text-gray-900"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                Drink Water
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                Positive Habit
              </Text>
            </View>
          </View>
        </CartoonCard>

        {/* Example Negative Habit */}
        <CartoonCard variant="default">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-red-danger border-2 border-gray-900 rounded-full items-center justify-center">
              <Text className="text-lg text-white">−</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-base text-gray-900"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                Junk Food
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                Negative Habit
              </Text>
            </View>
          </View>
        </CartoonCard>

        {/* Empty State */}
        <CartoonCard variant="cyan">
          <Text
            className="text-sm text-gray-900 text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            Tap &quot;+ New&quot; to create your first habit!{"\n"}
            Positive habits earn XP, negative ones cost HP.
          </Text>
        </CartoonCard>
      </View>
    </ScreenContainer>
  );
}
