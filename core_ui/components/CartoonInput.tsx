import { TextInput } from "react-native";
import type { TextInputProps } from "react-native";

interface CartoonInputProps extends TextInputProps {
  variant?: "default" | "dark";
}

export function CartoonInput({
  variant = "default",
  className = "",
  ...props
}: CartoonInputProps) {
  const bg = variant === "dark" ? "bg-dark-card text-white" : "bg-white text-gray-900";

  return (
    <TextInput
      className={`border-4 border-gray-900 rounded-2xl px-4 py-3 text-base ${bg} ${className}`}
      placeholderTextColor={variant === "dark" ? "#9CA3AF" : "#6B7280"}
      {...props}
    />
  );
}
