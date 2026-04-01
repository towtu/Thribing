import { Redirect } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text
          className="text-white mt-4 text-base"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (status === "authenticated") {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
