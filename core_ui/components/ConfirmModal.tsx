import { Modal, View, Text, Pressable } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  emoji?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "pink" | "violet" | "cyan" | "yellow";
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_STYLES = {
  pink:   { bg: "bg-pink-bubblegum",   text: "text-white",     border: "border-pink-700" },
  violet: { bg: "bg-violet-electric",  text: "text-white",     border: "border-violet-900" },
  cyan:   { bg: "bg-cyan-neon",        text: "text-gray-900",  border: "border-cyan-700" },
  yellow: { bg: "bg-yellow-sunburst",  text: "text-gray-900",  border: "border-yellow-600" },
} as const;

export function ConfirmModal({
  visible,
  emoji = "❓",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "pink",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirm = CONFIRM_STYLES[confirmVariant];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 bg-black/70 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-dark border-4 border-gray-900 rounded-3xl w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Coloured top stripe */}
          <View className={`h-2 w-full ${confirm.bg}`} />

          <View className="p-6 gap-4">
            {/* Emoji + title */}
            <View className="items-center gap-2">
              <Text style={{ fontSize: 48 }}>{emoji}</Text>
              <Text
                className="text-xl text-white text-center"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                {title}
              </Text>
            </View>

            {/* Message */}
            <Text
              className="text-sm text-gray-400 text-center leading-relaxed"
              style={{ fontFamily: "Nunito_600SemiBold" }}
            >
              {message}
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-1">
              {/* Cancel */}
              <Pressable
                onPress={onCancel}
                className="flex-1 bg-dark-card border-4 border-gray-700 rounded-2xl py-3 items-center active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
              >
                <Text
                  className="text-sm text-gray-300"
                  style={{ fontFamily: "Nunito_700Bold" }}
                >
                  {cancelLabel}
                </Text>
              </Pressable>

              {/* Confirm */}
              <Pressable
                onPress={onConfirm}
                className={`flex-1 ${confirm.bg} border-4 border-gray-900 rounded-2xl py-3 items-center active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]`}
              >
                <Text
                  className={`text-sm ${confirm.text}`}
                  style={{ fontFamily: "Nunito_800ExtraBold" }}
                >
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
