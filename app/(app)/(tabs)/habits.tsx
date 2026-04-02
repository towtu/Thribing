import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Zap } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";

export default function HabitsScreen() {
  const habits = useTaskStore((s) => s.habits);
  const loading = useTaskStore((s) => s.loading);
  const [showCreate, setShowCreate] = useState(false);

  // Count habits logged today
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = habits.filter((h) =>
    (h.weekly_completions ?? []).includes(today)
  ).length;

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-violet-electric border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={20} color="white" strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Habits
              </Text>
              <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                {loggedToday}/{habits.length} logged today
              </Text>
            </View>
          </View>
          <CartoonButton
            title="+ New"
            variant="violet"
            size="sm"
            onPress={() => setShowCreate(true)}
          />
        </View>

        {/* Difference explanation card */}
        {habits.length === 0 && !loading && (
          <CartoonCard variant="violet">
            <View className="gap-3">
              <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                What's a Habit?
              </Text>
              <Text className="text-sm text-violet-100" style={{ fontFamily: "Nunito_600SemiBold" }}>
                Habits are ongoing behaviors you want to build each week — like going to the gym 3×/week or meditating 5×/week.
              </Text>
              <Text className="text-sm text-violet-100" style={{ fontFamily: "Nunito_600SemiBold" }}>
                Tap "Log Today" on any habit to record that you did it. Streaks grow when you hit your weekly goal week after week.
              </Text>
              <CartoonButton
                title="+ Create First Habit"
                variant="white"
                size="sm"
                onPress={() => setShowCreate(true)}
              />
            </View>
          </CartoonCard>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#8B5CF6" className="py-8" />
        ) : (
          habits.map((habit) => <TaskCard key={habit.id} task={habit} />)
        )}
      </View>

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        defaultType="habit"
      />
    </ScreenContainer>
  );
}
