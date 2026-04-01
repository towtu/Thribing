import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";

export default function TodosScreen() {
  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            ✅ To-Dos
          </Text>
          <CartoonButton title="+ New" variant="yellow" size="sm" />
        </View>

        {/* Example To-Do */}
        <CartoonCard variant="default">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 border-4 border-gray-900 rounded-full items-center justify-center bg-white">
              <Text className="text-xs text-gray-400">○</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-base text-gray-900"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                Buy groceries
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: "Nunito_400Regular" }}
              >
                One-time task • Hard difficulty
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
            To-Dos are one-time quests.{"\n"}
            Complete them to earn XP and Gold!
          </Text>
        </CartoonCard>
      </View>
    </ScreenContainer>
  );
}
