import { useEffect, useRef } from "react";
import { Stack, Redirect, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useTaskSubscription, usePlayerSubscription } from "@/features/tasks/hooks";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useTaskSubscription();
  usePlayerSubscription();

  // Watch for level 5 unlock: if player hits level 5+ and is still "adventurer", push class selection
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.player_class);
  const loading = usePlayerStore((s) => s.loading);
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (loading || hasPromptedRef.current) return;
    if (level >= 5 && playerClass === "adventurer") {
      hasPromptedRef.current = true;
      // Small delay so the router is ready
      setTimeout(() => {
        router.push("/choose-class" as any);
      }, 500);
    }
  }, [level, playerClass, loading]);

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
