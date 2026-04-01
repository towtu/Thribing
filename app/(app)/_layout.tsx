import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
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
