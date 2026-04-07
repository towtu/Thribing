import { View, Text, Pressable } from "react-native";
import { CartoonCard, CartoonButton } from "@/core_ui/components";
import { acceptFriendRequest, removeFriend } from "../services";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import type { Friend } from "../types";

const CLASS_EMOJIS: Record<string, string> = {
  adventurer: "⚔️", swordsman: "🗡️", wizard: "🧙", marksman: "🏹", healer: "💚", rogue: "🗝️",
};

interface FriendCardProps {
  friend: Friend;
  onViewProfile?: (friend: Friend) => void;
}

export function FriendCard({ friend, onViewProfile }: FriendCardProps) {
  const uid = useAuthStore((s) => s.user?.uid);

  const handleAccept = async () => {
    if (!uid) return;
    await acceptFriendRequest(uid, friend.uid).catch(console.error);
  };

  const handleDecline = async () => {
    if (!uid) return;
    await removeFriend(uid, friend.uid).catch(console.error);
  };

  return (
    <CartoonCard variant="default">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 bg-yellow-sunburst border-4 border-gray-900 rounded-full items-center justify-center flex-shrink-0">
          <Text style={{ fontSize: 22 }}>{CLASS_EMOJIS[friend.player_class] ?? "⚔️"}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
            {friend.displayName}
          </Text>
          <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
            @{friend.username} • Lv.{friend.level}
          </Text>
        </View>

        {friend.status === "pending_received" && (
          <View className="flex-row gap-2">
            <CartoonButton title="Accept" variant="cyan" size="sm" onPress={handleAccept} />
            <CartoonButton title="Decline" variant="pink" size="sm" onPress={handleDecline} />
          </View>
        )}

        {friend.status === "accepted" && onViewProfile && (
          <Pressable
            onPress={() => onViewProfile(friend)}
            className="bg-violet-electric border-2 border-gray-900 rounded-xl px-3 py-1.5 active:scale-95"
          >
            <Text className="text-xs text-white" style={{ fontFamily: "Nunito_700Bold" }}>View</Text>
          </Pressable>
        )}

        {friend.status === "pending_sent" && (
          <View className="bg-gray-200 border-2 border-gray-400 rounded-full px-3 py-1">
            <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>Pending</Text>
          </View>
        )}
      </View>
    </CartoonCard>
  );
}
