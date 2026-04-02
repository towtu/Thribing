import { View, Text } from "react-native";

interface WeekDotsProps {
  /** ISO date strings of completed days this week */
  completions: string[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Returns the ISO date string for a given day of the current week (Mon=0…Sun=6) */
function getWeekDates(): string[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  // Map to Mon=0..Sun=6
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    return d.toISOString().split("T")[0];
  });
}

export function WeekDots({ completions }: WeekDotsProps) {
  const weekDates = getWeekDates();
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <View className="flex-row gap-1 items-center">
      {weekDates.map((dateStr, i) => {
        const done = completions.includes(dateStr);
        const isToday = dateStr === todayStr;
        return (
          <View key={dateStr} className="items-center gap-0.5">
            <View
              className={`w-6 h-6 rounded-full border-2 ${
                done
                  ? "bg-violet-electric border-violet-electric"
                  : isToday
                    ? "bg-transparent border-violet-electric"
                    : "bg-gray-200 border-gray-300"
              } items-center justify-center`}
            >
              {done && (
                <Text className="text-white text-[8px]" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                  ✓
                </Text>
              )}
            </View>
            <Text
              className={`text-[9px] ${isToday ? "text-violet-electric" : "text-gray-400"}`}
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              {DAY_LABELS[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
