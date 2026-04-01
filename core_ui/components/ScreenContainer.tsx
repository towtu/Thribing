import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
}

/**
 * Responsive screen container.
 * On mobile: full-width with padding.
 * On web/desktop: centered with max-width for comfortable reading.
 */
export function ScreenContainer({
  children,
  scrollable = true,
  className = "",
}: ScreenContainerProps) {
  const content = (
    <View className={`flex-1 w-full max-w-lg self-center px-4 ${className}`}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-dark" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={["top"]}>
      {content}
    </SafeAreaView>
  );
}
