import { Pressable, Text } from "react-native";
import type { PressableProps } from "react-native";

interface CartoonButtonProps extends PressableProps {
  title: string;
  variant?: "violet" | "pink" | "cyan" | "yellow" | "white";
  size?: "sm" | "md" | "lg";
}

const BG_VARIANTS = {
  violet: "bg-violet-electric",
  pink: "bg-pink-bubblegum",
  cyan: "bg-cyan-neon",
  yellow: "bg-yellow-sunburst",
  white: "bg-white",
} as const;

const TEXT_VARIANTS = {
  violet: "text-white",
  pink: "text-white",
  cyan: "text-gray-900",
  yellow: "text-gray-900",
  white: "text-gray-900",
} as const;

const SIZE_CLASSES = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
  lg: "px-8 py-4",
} as const;

const TEXT_SIZE = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

export function CartoonButton({
  title,
  variant = "violet",
  size = "md",
  className = "",
  ...props
}: CartoonButtonProps) {
  return (
    <Pressable
      className={`border-4 border-gray-900 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] ${BG_VARIANTS[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      <Text
        className={`font-bold text-center ${TEXT_VARIANTS[variant]} ${TEXT_SIZE[size]}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
