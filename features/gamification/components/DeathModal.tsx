import { Modal, View, Text, Pressable } from "react-native";

interface DeathModalProps {
  visible: boolean;
  levelsLost: number;
  goldLost: number;
  onDismiss: () => void;
}

export function DeathModal({ visible, levelsLost, goldLost, onDismiss }: DeathModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-dark border-4 border-gray-900 rounded-3xl w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Red top stripe */}
          <View className="h-2 w-full bg-red-500" />

          <View className="p-6 gap-4">
            {/* Skull */}
            <View className="items-center gap-2">
              <Text style={{ fontSize: 56 }}>💀</Text>
              <Text
                className="text-2xl text-white text-center"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                You Fell in Battle!
              </Text>
              <Text
                className="text-sm text-gray-400 text-center leading-relaxed"
                style={{ fontFamily: "Nunito_600SemiBold" }}
              >
                Your HP hit zero. The darkness claimed you… but your adventure isn't over.
              </Text>
            </View>

            {/* Penalty rows */}
            <View className="bg-red-950/60 border-2 border-red-500 rounded-2xl p-4 gap-3">
              <Text
                className="text-xs text-red-400 text-center uppercase tracking-widest"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                Penalties
              </Text>

              <View className="h-px bg-red-500/40" />

              {levelsLost > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-300" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    Levels lost
                  </Text>
                  <View className="bg-red-500 border-2 border-gray-900 rounded-full px-3 py-0.5">
                    <Text className="text-sm text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                      -{levelsLost} 📉
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-300" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  Gold stolen
                </Text>
                <View className="bg-yellow-sunburst border-2 border-gray-900 rounded-full px-3 py-0.5">
                  <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    -{goldLost} 🪙
                  </Text>
                </View>
              </View>

              <View className="h-px bg-red-500/40" />

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-green-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  Revived with
                </Text>
                <View className="bg-green-500 border-2 border-gray-900 rounded-full px-3 py-0.5">
                  <Text className="text-sm text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    20 HP ❤️
                  </Text>
                </View>
              </View>
            </View>

            {/* Rise again button */}
            <Pressable
              onPress={onDismiss}
              className="bg-violet-electric border-4 border-gray-900 rounded-2xl py-4 items-center active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Text
                className="text-base text-white"
                style={{ fontFamily: "Nunito_800ExtraBold" }}
              >
                ⚔️ Rise Again
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
