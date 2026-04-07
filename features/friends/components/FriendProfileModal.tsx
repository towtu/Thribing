import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { CartoonCard, CartoonButton } from "@/core_ui/components";
import { removeFriend } from "../services";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import type { Friend } from "../types";

const CLASS_EMOJIS: Record<string, string> = {
  adventurer: "⚔️", swordsman: "🗡️", wizard: "🧙", marksman: "🏹", healer: "💚", rogue: "🗝️",
};
const CLASS_LABELS: Record<string, string> = {
  adventurer: "Adventurer", swordsman: "Swordsman", wizard: "Wizard", marksman: "Marksman", healer: "Healer", rogue: "Rogue",
};

interface FriendProfileModalProps {
  friend: Friend | null;
  onDismiss: () => void;
}

export function FriendProfileModal({ friend, onDismiss }: FriendProfileModalProps) {
  const uid = useAuthStore((s) => s.user?.uid);

  if (!friend) return null;

  const handleRemove = async () => {
    if (!uid) return;
    await removeFriend(uid, friend.uid).catch(console.error);
    onDismiss();
  };

  return (
    <Modal visible={!!friend} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/70 justify-end" onPress={onDismiss}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-dark border-t-4 border-x-4 border-gray-900 rounded-t-3xl">
          <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="gap-4">
              {/* Handle bar */}
              <View className="w-12 h-1 bg-gray-700 rounded-full self-center mb-2" />

              {/* Avatar + identity */}
              <CartoonCard variant="violet">
                <View className="items-center gap-3">
                  <View className="w-20 h-20 bg-yellow-sunburst border-4 border-gray-900 rounded-full items-center justify-center">
                    <Text style={{ fontSize: 36 }}>{CLASS_EMOJIS[friend.player_class] ?? "⚔️"}</Text>
                  </View>
                  <View className="items-center gap-1">
                    <Text className="text-xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                      {friend.displayName}
                    </Text>
                    <Text className="text-sm text-violet-200" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      @{friend.username}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5">
                        <Text className="text-xs text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                          Lv.{friend.level}
                        </Text>
                      </View>
                      <View className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5">
                        <Text className="text-xs text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                          {CLASS_LABELS[friend.player_class] ?? friend.player_class}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </CartoonCard>

              <CartoonButton title="Remove Friend" variant="pink" size="md" onPress={handleRemove} />
              <CartoonButton title="Close" variant="violet" size="md" onPress={onDismiss} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
