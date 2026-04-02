import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { CalendarCheck, AlertTriangle } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";

export default function DailiesScreen() {
  const dailies = useTaskStore((s) => s.dailies);
  const loading = useTaskStore((s) => s.loading);
  const [showCreate, setShowCreate] = useState(false);

  const incomplete = dailies.filter((d) => !d.completed);
  const completed = dailies.filter((d) => d.completed);

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-cyan-neon border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <CalendarCheck size={20} color="#111827" strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Dailies
              </Text>
              <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                {completed.length}/{dailies.length} done today
              </Text>
            </View>
          </View>
          <CartoonButton
            title="+ New"
            variant="cyan"
            size="sm"
            onPress={() => setShowCreate(true)}
          />
        </View>

        {/* Today's progress bar */}
        {dailies.length > 0 && (
          <View className="gap-1">
            <View className="h-3 bg-gray-800 rounded-full border-2 border-gray-900 overflow-hidden">
              <View
                className="h-full rounded-full bg-cyan-neon"
                style={{ width: `${dailies.length > 0 ? (completed.length / dailies.length) * 100 : 0}%` }}
              />
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#22D3EE" className="py-8" />
        ) : dailies.length === 0 ? (
          <CartoonCard variant="cyan">
            <View className="items-center gap-2 py-2">
              <Text className="text-2xl">📅</Text>
              <Text
                className="text-sm text-gray-900 text-center"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                No dailies yet!
              </Text>
              <Text
                className="text-xs text-gray-700 text-center"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                Add recurring tasks like "Drink 8 cups of water" or "Study 20 minutes" to build streaks and earn XP every day.
              </Text>
            </View>
          </CartoonCard>
        ) : (
          <>
            {/* Incomplete dailies */}
            {incomplete.map((daily) => (
              <TaskCard key={daily.id} task={daily} />
            ))}

            {/* Completed section */}
            {completed.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 h-0.5 bg-gray-700 rounded" />
                  <Text
                    className="text-xs text-gray-500"
                    style={{ fontFamily: "Nunito_700Bold" }}
                  >
                    Completed ({completed.length})
                  </Text>
                  <View className="flex-1 h-0.5 bg-gray-700 rounded" />
                </View>
                {completed.map((daily) => (
                  <TaskCard key={daily.id} task={daily} />
                ))}
              </View>
            )}
          </>
        )}

        {/* Warning for incomplete dailies */}
        {dailies.length > 0 && incomplete.length > 0 && (
          <CartoonCard variant="pink">
            <View className="flex-row items-center gap-3">
              <AlertTriangle size={20} color="#111827" strokeWidth={2.5} />
              <Text
                className="flex-1 text-sm text-white"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                {incomplete.length} incomplete {incomplete.length === 1 ? "daily" : "dailies"} — missing them deals HP damage at midnight!
              </Text>
            </View>
          </CartoonCard>
        )}
      </View>

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        defaultType="daily"
      />
    </ScreenContainer>
  );
}
