import { Modal, View, Text } from "react-native";
import { CartoonButton } from "@/core_ui/components";

interface DeathModalProps {
  visible: boolean;
  levelsLost: number;
  goldLost: number;
  onDismiss: () => void;
}

export function DeathModal({ visible, levelsLost, goldLost, onDismiss }: DeathModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-dark border-4 border-gray-900 rounded-3xl p-6 w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] gap-4">
          {/* Skull */}
          <Text className="text-6xl text-center">💀</Text>

          <Text
            className="text-2xl text-white text-center"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            You Fell in Battle!
          </Text>
          <Text
            className="text-sm text-gray-400 text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            Your HP hit zero. The darkness claimed you… but your adventure isn't over.
          </Text>

          {/* Penalty summary */}
          <View className="bg-red-900/40 border-2 border-red-500 rounded-2xl p-4 gap-2">
            <Text
              className="text-sm text-red-400 text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              Penalties
            </Text>
            {levelsLost > 0 && (
              <Text
                className="text-base text-white text-center"
                style={{ fontFamily: "Nunito_700Bold" }}
              >
                📉 -{levelsLost} Level{levelsLost !== 1 ? "s" : ""}
              </Text>
            )}
            <Text
              className="text-base text-white text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              🪙 -{goldLost} Gold lost
            </Text>
            <Text
              className="text-sm text-green-400 text-center"
              style={{ fontFamily: "Nunito_600SemiBold" }}
            >
              ❤️ Revived with 20 HP
            </Text>
          </View>

          <CartoonButton
            title="Rise Again"
            variant="violet"
            size="lg"
            onPress={onDismiss}
          />
        </View>
      </View>
    </Modal>
  );
}
