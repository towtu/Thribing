import { useState } from "react";
import { Modal, View, Text, Pressable, ActivityIndicator } from "react-native";
import { CartoonInput, CartoonButton, CartoonCard } from "@/core_ui/components";
import { searchByUsername, sendFriendRequest } from "../services";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useFriendsStore } from "@/lib/stores/useFriendsStore";
import type { UserProfile } from "../types";

interface AddFriendModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AddFriendModal({ visible, onDismiss }: AddFriendModalProps) {
  const user = useAuthStore((s) => s.user);
  const { level, player_class } = usePlayerStore();
  const { username, friends, pendingSent } = useFriendsStore();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setResult(null);
    setError("");
    setSent(false);
    try {
      const found = await searchByUsername(search.trim());
      if (!found) { setError("No user found with that username"); }
      else if (found.uid === user?.uid) { setError("That's you!"); }
      else { setResult(found); }
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    if (!user?.uid || !result || !username) return;
    setSending(true);
    try {
      await sendFriendRequest(
        user.uid,
        { displayName: user.displayName ?? "", username, level, player_class },
        result.uid,
        { displayName: result.displayName, username: result.username, level: result.level, player_class: result.player_class }
      );
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const alreadyFriend = result ? friends.some((f) => f.uid === result.uid) : false;
  const alreadySent = result ? pendingSent.some((f) => f.uid === result.uid) : false;

  const CLASS_EMOJIS: Record<string, string> = {
    adventurer: "⚔️", swordsman: "🗡️", wizard: "🧙", marksman: "🏹", healer: "💚", rogue: "🗝️",
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center px-6" onPress={onDismiss}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-dark border-4 border-gray-900 rounded-3xl w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <View className="h-2 w-full bg-cyan-neon" />
          <View className="p-6 gap-4">
            <Text className="text-xl text-white text-center" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              🔍 Find a Friend
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <CartoonInput
                  variant="dark"
                  placeholder="Enter username..."
                  value={search}
                  onChangeText={(v) => { setSearch(v); setResult(null); setError(""); setSent(false); }}
                  autoFocus
                />
              </View>
              <Pressable
                onPress={handleSearch}
                disabled={searching || !search.trim()}
                className="bg-cyan-neon border-4 border-gray-900 rounded-2xl px-4 items-center justify-center active:scale-95"
              >
                {searching
                  ? <ActivityIndicator size="small" color="#111827" />
                  : <Text className="text-sm text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>Search</Text>
                }
              </Pressable>
            </View>

            {error ? (
              <Text className="text-red-400 text-sm text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>{error}</Text>
            ) : null}

            {result && (
              <CartoonCard variant="default">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-yellow-sunburst border-4 border-gray-900 rounded-full items-center justify-center">
                    <Text style={{ fontSize: 22 }}>{CLASS_EMOJIS[result.player_class] ?? "⚔️"}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                      {result.displayName}
                    </Text>
                    <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      @{result.username} • Lv.{result.level}
                    </Text>
                  </View>
                  {alreadyFriend ? (
                    <View className="bg-green-100 border-2 border-green-500 rounded-full px-3 py-1">
                      <Text className="text-xs text-green-700" style={{ fontFamily: "Nunito_700Bold" }}>Friends ✓</Text>
                    </View>
                  ) : (alreadySent || sent) ? (
                    <View className="bg-gray-200 border-2 border-gray-400 rounded-full px-3 py-1">
                      <Text className="text-xs text-gray-600" style={{ fontFamily: "Nunito_700Bold" }}>Sent ✓</Text>
                    </View>
                  ) : (
                    <CartoonButton
                      title={sending ? "..." : "Add"}
                      variant="cyan"
                      size="sm"
                      onPress={handleSend}
                      disabled={sending}
                    />
                  )}
                </View>
              </CartoonCard>
            )}

            <CartoonButton title="Close" variant="violet" size="md" onPress={onDismiss} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
