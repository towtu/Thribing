import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  // Redirect authenticated users to the app
  if (status === "authenticated") {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1A1A2E" },
      }}
    />
  );
}
