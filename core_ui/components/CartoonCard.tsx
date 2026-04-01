import { View } from "react-native";
import type { ViewProps } from "react-native";

interface CartoonCardProps extends ViewProps {
  variant?: "default" | "violet" | "pink" | "cyan" | "yellow";
}

const BG_VARIANTS = {
  default: "bg-white",
  violet: "bg-violet-electric",
  pink: "bg-pink-bubblegum",
  cyan: "bg-cyan-neon",
  yellow: "bg-yellow-sunburst",
} as const;

export function CartoonCard({
  variant = "default",
  className = "",
  children,
  ...props
}: CartoonCardProps) {
  return (
    <View
      className={`border-4 border-gray-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${BG_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
