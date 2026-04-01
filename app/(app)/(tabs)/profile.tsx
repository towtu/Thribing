import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        <Text
          className="text-3xl text-white"
          style={{ fontFamily: "Nunito_800ExtraBold" }}
        >
          👤 Profile
        </Text>

        {/* Avatar Card */}
        <CartoonCard variant="violet">
          <View className="items-center gap-3">
            <View className="w-24 h-24 bg-yellow-sunburst border-4 border-gray-900 rounded-full items-center justify-center">
              <Text className="text-4xl">🧙</Text>
            </View>
            <Text
              className="text-xl text-white"
              style={{ fontFamily: "Nunito_800ExtraBold" }}
            >
              Adventurer
            </Text>
            <Text
              className="text-sm text-violet-200"
              style={{ fontFamily: "Nunito_600SemiBold" }}
            >
              Level 1 • Novice
            </Text>
          </View>
        </CartoonCard>

        {/* Stats Summary */}
        <View className="flex-row gap-3">
          <CartoonCard variant="pink" className="flex-1">
            <View className="items-center">
              <Text className="text-2xl">❤️</Text>
              <Text
                className="text-lg text-white"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                50
              </Text>
              <Text
                className="text-xs text-white"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                HP
              </Text>
            </View>
          </CartoonCard>
          <CartoonCard variant="cyan" className="flex-1">
            <View className="items-center">
              <Text className="text-2xl">⭐</Text>
              <Text
                className="text-lg text-gray-900"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                0
              </Text>
              <Text
                className="text-xs text-gray-900"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                XP
              </Text>
            </View>
          </CartoonCard>
          <CartoonCard variant="yellow" className="flex-1">
            <View className="items-center">
              <Text className="text-2xl">💰</Text>
              <Text
                className="text-lg text-gray-900"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                0
              </Text>
              <Text
                className="text-xs text-gray-900"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                Gold
              </Text>
            </View>
          </CartoonCard>
        </View>

        {/* Actions */}
        <CartoonButton
          title="Sign Out"
          variant="white"
          size="md"
          onPress={() => {}}
        />
      </View>
    </ScreenContainer>
  );
}
