import { View, Text, Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";

interface CounterControlProps {
  count: number;
  total: number;
  unit: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

export function CounterControl({
  count,
  total,
  unit,
  onIncrement,
  onDecrement,
  disabled = false,
}: CounterControlProps) {
  return (
    <View className="flex-row items-center gap-2">
      {/* Decrement */}
      <Pressable
        onPress={onDecrement}
        disabled={disabled || count <= 0}
        className={`w-9 h-9 border-3 border-gray-900 rounded-xl items-center justify-center active:scale-95 ${
          count <= 0 || disabled ? "bg-gray-200 opacity-40" : "bg-white"
        }`}
      >
        <Minus size={16} color="#111827" strokeWidth={3} />
      </Pressable>

      {/* Count display */}
      <View className="flex-1 items-center">
        <Text
          className="text-sm text-gray-700"
          style={{ fontFamily: "Nunito_800ExtraBold" }}
        >
          {count}/{total}
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            {" "}{unit}
          </Text>
        </Text>
      </View>

      {/* Increment */}
      <Pressable
        onPress={onIncrement}
        disabled={disabled || count >= total}
        className={`w-9 h-9 border-3 border-gray-900 rounded-xl items-center justify-center active:scale-95 ${
          count >= total || disabled ? "bg-gray-200 opacity-40" : "bg-cyan-neon"
        }`}
      >
        <Plus size={16} color="#111827" strokeWidth={3} />
      </Pressable>
    </View>
  );
}
