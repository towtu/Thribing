import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ListTodo } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { useTaskStore } from "@/lib/stores/useTaskStore";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";

export default function TodosScreen() {
  const todos = useTaskStore((s) => s.todos);
  const loading = useTaskStore((s) => s.loading);
  const [showCreate, setShowCreate] = useState(false);

  const incomplete = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-yellow-sunburst border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ListTodo size={20} color="#111827" strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                To-Dos
              </Text>
              <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                {completed.length}/{todos.length} complete
              </Text>
            </View>
          </View>
          <CartoonButton title="+ New" variant="yellow" size="sm" onPress={() => setShowCreate(true)} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FACC15" className="py-8" />
        ) : todos.length === 0 ? (
          <CartoonCard variant="yellow">
            <View className="items-center gap-2 py-2">
              <Text className="text-2xl">📋</Text>
              <Text className="text-sm text-gray-900 text-center" style={{ fontFamily: "Nunito_700Bold" }}>
                No to-dos yet!
              </Text>
              <Text className="text-xs text-gray-700 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                To-Dos are one-time quests. Complete them to earn XP and Gold!
              </Text>
            </View>
          </CartoonCard>
        ) : (
          <>
            {incomplete.map((todo) => (
              <TaskCard key={todo.id} task={todo} />
            ))}
            {completed.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 h-0.5 bg-gray-700 rounded" />
                  <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_700Bold" }}>
                    Completed ({completed.length})
                  </Text>
                  <View className="flex-1 h-0.5 bg-gray-700 rounded" />
                </View>
                {completed.map((todo) => (
                  <TaskCard key={todo.id} task={todo} />
                ))}
              </View>
            )}
          </>
        )}
      </View>

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        defaultType="todo"
      />
    </ScreenContainer>
  );
}
