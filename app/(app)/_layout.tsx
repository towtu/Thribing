import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, Redirect, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import {
  useTaskSubscription,
  usePlayerSubscription,
  useDamageCheck,
  useGoldResetCheck,
} from "@/features/tasks/hooks";
import { DeathModal } from "@/features/gamification/components/DeathModal";
import { rescheduleAllDailies } from "@/features/notifications/service";
import { updateTask } from "@/features/tasks/services";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid);

  useTaskSubscription();
  usePlayerSubscription();
  useGoldResetCheck();

  const [deathInfo, setDeathInfo] = useState<{
    levelsLost: number;
    goldLost: number;
  } | null>(null);

  const handleDeath = useCallback(
    (info: { levelsLost: number; goldLost: number }) => {
      setDeathInfo(info);
    },
    []
  );

  useDamageCheck(handleDeath);

  // Reschedule all notifications on app open (handles reinstalls/permission changes)
  useEffect(() => {
    if (!uid) return;
    const dailies = useTaskStore.getState().dailies;
    if (dailies.length === 0) return;
    rescheduleAllDailies(dailies).then(async (result) => {
      for (const [taskId, ids] of Object.entries(result)) {
        try {
          await updateTask(uid, taskId, { notification_ids: ids });
        } catch (e) {
          console.error("Failed to save notification_ids:", e);
        }
      }
    });
  }, [uid]);

  // Watch for level 5 unlock: push class selection
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.player_class);
  const loading = usePlayerStore((s) => s.loading);
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (loading || hasPromptedRef.current) return;
    if (level >= 5 && playerClass === "adventurer") {
      hasPromptedRef.current = true;
      setTimeout(() => {
        router.push("/choose-class" as any);
      }, 500);
    }
  }, [level, playerClass, loading]);

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1A1A2E" },
        }}
      />
      <DeathModal
        visible={deathInfo !== null}
        levelsLost={deathInfo?.levelsLost ?? 0}
        goldLost={deathInfo?.goldLost ?? 0}
        onDismiss={() => setDeathInfo(null)}
      />
    </>
  );
}
