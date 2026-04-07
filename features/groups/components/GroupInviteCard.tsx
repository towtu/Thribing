import { View, Text } from "react-native";
import { CartoonCard, CartoonButton } from "@/core_ui/components";
import { acceptGroupInvite, declineGroupInvite } from "../services";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import type { GroupInvite } from "../types";

interface GroupInviteCardProps {
  invite: GroupInvite;
}

export function GroupInviteCard({ invite }: GroupInviteCardProps) {
  const uid = useAuthStore((s) => s.user?.uid);

  const handleAccept = async () => {
    if (!uid) return;
    await acceptGroupInvite(uid, invite.groupId).catch(console.error);
  };

  const handleDecline = async () => {
    if (!uid) return;
    await declineGroupInvite(uid, invite.groupId).catch(console.error);
  };

  return (
    <CartoonCard variant="default">
      <View className="gap-3">
        <View className="flex-row items-start gap-3">
          <View className="w-10 h-10 bg-pink-bubblegum border-4 border-gray-900 rounded-xl items-center justify-center flex-shrink-0">
            <Text style={{ fontSize: 18 }}>👥</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              {invite.title}
            </Text>
            <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
              Invited by {invite.invited_by_name}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <CartoonButton title="Join Group" variant="cyan" size="sm" onPress={handleAccept} />
          </View>
          <View className="flex-1">
            <CartoonButton title="Decline" variant="pink" size="sm" onPress={handleDecline} />
          </View>
        </View>
      </View>
    </CartoonCard>
  );
}
