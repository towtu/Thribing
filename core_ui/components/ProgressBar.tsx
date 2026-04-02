import { View, Text } from "react-native";

interface ProgressBarProps {
  current: number;
  total: number;
  unit?: string;
  color?: "violet" | "cyan" | "pink" | "yellow" | "green";
}

const COLOR_MAP = {
  violet: "bg-violet-electric",
  cyan: "bg-cyan-neon",
  pink: "bg-pink-bubblegum",
  yellow: "bg-yellow-sunburst",
  green: "bg-green-500",
} as const;

export function ProgressBar({
  current,
  total,
  unit,
  color = "cyan",
}: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <View className="gap-1">
      {/* Label row */}
      <View className="flex-row justify-between items-center">
        <Text
          className="text-xs text-gray-500"
          style={{ fontFamily: "Nunito_700Bold" }}
        >
          {current} / {total}{unit ? ` ${unit}` : ""}
        </Text>
        <Text
          className="text-xs text-gray-400"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {pct}%
        </Text>
      </View>
      {/* Bar */}
      <View className="h-3 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden">
        <View
          className={`h-full rounded-full ${COLOR_MAP[color]}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
