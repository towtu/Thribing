import { View, Text, Pressable } from "react-native";
import { Play, Pause, RotateCcw } from "lucide-react-native";

interface TimerDisplayProps {
  elapsed: number;    // seconds
  targetSeconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerDisplay({
  elapsed,
  targetSeconds,
  isRunning,
  onStart,
  onPause,
  onReset,
  disabled = false,
}: TimerDisplayProps) {
  const remaining = Math.max(0, targetSeconds - elapsed);
  const pct = targetSeconds > 0 ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;

  return (
    <View className="gap-2">
      {/* Time display */}
      <View className="flex-row items-center justify-between">
        <Text
          className="text-base text-gray-700"
          style={{ fontFamily: "Nunito_800ExtraBold" }}
        >
          {formatTime(elapsed)}
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            {" / "}{formatTime(targetSeconds)}
          </Text>
        </Text>

        <View className="flex-row gap-2">
          {/* Reset */}
          <Pressable
            onPress={onReset}
            disabled={disabled || elapsed === 0}
            className={`w-8 h-8 rounded-lg border-2 border-gray-900 items-center justify-center ${
              elapsed === 0 ? "opacity-30" : ""
            }`}
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <RotateCcw size={14} color="#374151" strokeWidth={2.5} />
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={isRunning ? onPause : onStart}
            disabled={disabled || pct >= 100}
            className={`w-8 h-8 rounded-lg border-2 border-gray-900 items-center justify-center ${
              pct >= 100 ? "opacity-40" : ""
            }`}
            style={{ backgroundColor: isRunning ? "#F472B6" : "#22D3EE" }}
          >
            {isRunning ? (
              <Pause size={14} color="#111827" strokeWidth={2.5} />
            ) : (
              <Play size={14} color="#111827" strokeWidth={2.5} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2.5 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden">
        <View
          className="h-full rounded-full bg-pink-bubblegum"
          style={{ width: `${pct}%` }}
        />
      </View>

      {remaining === 0 && (
        <Text
          className="text-xs text-green-600 text-center"
          style={{ fontFamily: "Nunito_700Bold" }}
        >
          Time complete!
        </Text>
      )}
    </View>
  );
}
