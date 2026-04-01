import { View, Text } from "react-native";
import { Link } from "expo-router";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";

export default function NotFoundScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 justify-center items-center gap-6">
        <CartoonCard variant="pink">
          <View className="items-center gap-3 py-4">
            <Text className="text-5xl">🗺️</Text>
            <Text
              className="text-2xl text-white text-center"
              style={{ fontFamily: "Nunito_800ExtraBold" }}
            >
              Lost in the Dungeon!
            </Text>
            <Text
              className="text-sm text-white text-center"
              style={{ fontFamily: "Nunito_600SemiBold" }}
            >
              This page doesn&apos;t exist. Let&apos;s get you back to safety.
            </Text>
          </View>
        </CartoonCard>
        <Link href="/" asChild>
          <CartoonButton title="Return to Base" variant="violet" size="lg" />
        </Link>
      </View>
    </ScreenContainer>
  );
}
