import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Users, UserPlus } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { useFriendsStore } from "@/lib/stores/useFriendsStore";
import { useGroupStore } from "@/lib/stores/useGroupStore";
import { FriendCard } from "@/features/friends/components/FriendCard";
import { FriendProfileModal } from "@/features/friends/components/FriendProfileModal";
import { AddFriendModal } from "@/features/friends/components/AddFriendModal";
import { SetUsernameModal } from "@/features/friends/components/SetUsernameModal";
import { GroupHabitCard } from "@/features/groups/components/GroupHabitCard";
import { GroupInviteCard } from "@/features/groups/components/GroupInviteCard";
import { CreateGroupModal } from "@/features/groups/components/CreateGroupModal";
import type { Friend } from "@/features/friends/types";

export default function SocialScreen() {
  const { friends, pendingReceived, pendingSent, username, loading } = useFriendsStore();
  const { groups, invites } = useGroupStore();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showSetUsername, setShowSetUsername] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);

  const pendingCount = pendingReceived.length;

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-cyan-neon border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Users size={20} color="#111827" strokeWidth={2.5} />
            </View>
            <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Social
            </Text>
          </View>
          <Pressable
            onPress={() => username ? setShowAddFriend(true) : setShowSetUsername(true)}
            className="bg-cyan-neon border-4 border-gray-900 rounded-2xl px-4 py-2 flex-row items-center gap-2 active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <UserPlus size={16} color="#111827" strokeWidth={2.5} />
            <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>Add</Text>
          </Pressable>
        </View>

        {/* Username setup prompt */}
        {!username && (
          <CartoonCard variant="violet">
            <View className="gap-2">
              <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                🏷️ Set Your Username
              </Text>
              <Text className="text-sm text-violet-200" style={{ fontFamily: "Nunito_600SemiBold" }}>
                Choose a unique username so friends can find you.
              </Text>
              <CartoonButton
                title="Choose Username"
                variant="cyan"
                size="sm"
                onPress={() => setShowSetUsername(true)}
              />
            </View>
          </CartoonCard>
        )}

        {/* Username display */}
        {username && (
          <CartoonCard variant="default">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>Your username</Text>
              <Text className="text-sm text-violet-electric" style={{ fontFamily: "Nunito_800ExtraBold" }}>@{username}</Text>
            </View>
          </CartoonCard>
        )}

        {/* Pending requests */}
        {pendingCount > 0 && (
          <View className="gap-2">
            <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              ⏳ Friend Requests ({pendingCount})
            </Text>
            {pendingReceived.map((f) => (
              <FriendCard key={f.uid} friend={f} />
            ))}
          </View>
        )}

        {/* Sent requests */}
        {pendingSent.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm text-gray-400" style={{ fontFamily: "Nunito_700Bold" }}>
              Sent Requests
            </Text>
            {pendingSent.map((f) => (
              <FriendCard key={f.uid} friend={f} />
            ))}
          </View>
        )}

        {/* Friends list */}
        <View className="gap-2">
          <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
            👥 Friends ({friends.length})
          </Text>
          {loading ? (
            <CartoonCard variant="default">
              <Text className="text-sm text-gray-400 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>Loading...</Text>
            </CartoonCard>
          ) : friends.length === 0 ? (
            <CartoonCard variant="default">
              <View className="gap-1">
                <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                  No friends yet. Add someone to get started!
                </Text>
              </View>
            </CartoonCard>
          ) : (
            friends.map((f) => (
              <FriendCard key={f.uid} friend={f} onViewProfile={setViewingFriend} />
            ))
          )}
        </View>
        {/* Group invites */}
        {invites.length > 0 && (
          <View className="gap-2">
            <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              📬 Group Invites ({invites.length})
            </Text>
            {invites.map((inv) => (
              <GroupInviteCard key={inv.groupId} invite={inv} />
            ))}
          </View>
        )}

        {/* Group habits */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              👥 Group Habits
            </Text>
            <Pressable
              onPress={() => setShowCreateGroup(true)}
              className="bg-pink-bubblegum border-2 border-gray-900 rounded-xl px-3 py-1.5 active:scale-95"
            >
              <Text className="text-xs text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>+ New</Text>
            </Pressable>
          </View>
          {groups.length === 0 ? (
            <CartoonCard variant="default">
              <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                No group habits yet. Create one to challenge friends!
              </Text>
            </CartoonCard>
          ) : (
            groups.map((g) => <GroupHabitCard key={g.id} group={g} />)
          )}
        </View>
      </View>

      <AddFriendModal visible={showAddFriend} onDismiss={() => setShowAddFriend(false)} />
      <SetUsernameModal visible={showSetUsername} onDismiss={() => { setShowSetUsername(false); }} />
      <FriendProfileModal friend={viewingFriend} onDismiss={() => setViewingFriend(null)} />
      <CreateGroupModal visible={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </ScreenContainer>
  );
}
