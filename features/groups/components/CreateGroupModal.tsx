import { useState } from "react";
import {
  View, Text, Modal, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { X } from "lucide-react-native";
import { CartoonButton, CartoonCard, CartoonInput } from "@/core_ui/components";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useFriendsStore } from "@/lib/stores/useFriendsStore";
import { createGroupHabit, inviteToGroup } from "../services";
import type { Difficulty } from "@/features/tasks/types";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 1, label: "Easy", color: "bg-green-400" },
  { value: 2, label: "Medium", color: "bg-yellow-sunburst" },
  { value: 3, label: "Hard", color: "bg-red-400" },
];

const LABEL_STYLE = { fontFamily: "Nunito_700Bold" };
const HEADING_STYLE = { fontFamily: "Nunito_800ExtraBold" };

export function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  const user = useAuthStore((s) => s.user);
  const { level, player_class } = usePlayerStore();
  const { friends, username } = useFriendsStore();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [weeklyTarget, setWeeklyTarget] = useState("3");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setDifficulty(2);
    setWeeklyTarget("3");
    setSelectedFriends([]);
    setError("");
  };

  const toggleFriend = (uid: string) => {
    setSelectedFriends((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!title.trim()) { setError("Title is required"); return; }
    const parsedWeekly = parseInt(weeklyTarget, 10);
    if (isNaN(parsedWeekly) || parsedWeekly < 1) { setError("Weekly target must be at least 1"); return; }

    setSaving(true);
    setError("");
    try {
      const groupId = await createGroupHabit(user.uid, {
        displayName: user.displayName ?? "",
        username: username ?? "",
        player_class,
        level,
      }, {
        title,
        notes,
        difficulty,
        weekly_target: parsedWeekly,
      });

      // Invite selected friends
      for (const friendUid of selectedFriends) {
        const friend = friends.find((f) => f.uid === friendUid);
        if (friend) {
          await inviteToGroup(
            groupId,
            title,
            user.uid,
            user.displayName ?? "",
            friendUid,
            { displayName: friend.displayName, username: friend.username, player_class: friend.player_class, level: friend.level }
          ).catch(console.error);
        }
      }

      resetForm();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create group");
    } finally {
      setSaving(false);
    }
  };

  const CLASS_EMOJIS: Record<string, string> = {
    adventurer: "⚔️", swordsman: "🗡️", wizard: "🧙", marksman: "🏹", healer: "💚", rogue: "🗝️",
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-dark rounded-t-3xl border-t-4 border-x-4 border-gray-900 max-h-[92%]"
          >
            <ScrollView
              className="p-5"
              contentContainerStyle={{ paddingBottom: 48 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-5">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-8 bg-pink-bubblegum rounded-full border-2 border-gray-900" />
                  <Text className="text-2xl text-white" style={HEADING_STYLE}>
                    New Group Habit
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 bg-dark-card border-2 border-gray-700 rounded-xl items-center justify-center"
                >
                  <X size={18} color="#9CA3AF" strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Title */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Title *</Text>
                <CartoonInput variant="dark" placeholder="e.g. Gym Squad 💪" value={title} onChangeText={setTitle} autoFocus />
              </View>

              {/* Notes */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Notes</Text>
                <CartoonInput variant="dark" placeholder="Optional details..." value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
              </View>

              {/* Difficulty */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Difficulty</Text>
                <View className="flex-row gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDifficulty(opt.value)}
                      className={`flex-1 border-4 border-gray-900 rounded-2xl py-3 items-center active:scale-95 ${difficulty === opt.value ? opt.color : "bg-dark-card"}`}
                    >
                      <Text className={`text-sm ${difficulty === opt.value ? "text-gray-900" : "text-gray-400"}`} style={LABEL_STYLE}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Weekly goal */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Weekly goal</Text>
                <View className="flex-row items-center gap-3">
                  <CartoonInput variant="dark" placeholder="3" value={weeklyTarget} onChangeText={setWeeklyTarget} keyboardType="numeric" className="flex-1" />
                  <Text className="text-gray-400 text-sm" style={LABEL_STYLE}>times / week</Text>
                </View>
                <View className="flex-row gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setWeeklyTarget(String(n))}
                      className={`flex-1 border-2 border-gray-900 rounded-xl py-2 items-center ${weeklyTarget === String(n) ? "bg-pink-bubblegum" : "bg-dark-card"}`}
                    >
                      <Text className={`text-xs ${weeklyTarget === String(n) ? "text-white" : "text-gray-400"}`} style={LABEL_STYLE}>{n}×</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Invite friends */}
              {friends.length > 0 && (
                <View className="gap-2 mb-4">
                  <Text className="text-sm text-gray-300" style={LABEL_STYLE}>
                    Invite Friends <Text className="text-gray-500 font-normal">(optional)</Text>
                  </Text>
                  <View className="gap-2">
                    {friends.map((f) => {
                      const selected = selectedFriends.includes(f.uid);
                      return (
                        <Pressable
                          key={f.uid}
                          onPress={() => toggleFriend(f.uid)}
                          className={`flex-row items-center gap-3 border-4 border-gray-900 rounded-2xl p-3 active:scale-98 ${selected ? "bg-pink-bubblegum" : "bg-dark-card"}`}
                        >
                          <View className="w-9 h-9 bg-yellow-sunburst border-2 border-gray-900 rounded-full items-center justify-center">
                            <Text style={{ fontSize: 16 }}>{CLASS_EMOJIS[f.player_class] ?? "⚔️"}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className={`text-sm ${selected ? "text-white" : "text-gray-300"}`} style={{ fontFamily: "Nunito_700Bold" }}>{f.displayName}</Text>
                            <Text className={`text-xs ${selected ? "text-pink-100" : "text-gray-500"}`} style={{ fontFamily: "Nunito_600SemiBold" }}>@{f.username} • Lv.{f.level}</Text>
                          </View>
                          {selected && <Text className="text-white text-base">✓</Text>}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {error ? (
                <Text className="text-red-400 text-sm text-center mb-3" style={{ fontFamily: "Nunito_600SemiBold" }}>{error}</Text>
              ) : null}

              <CartoonButton
                title={saving ? "Creating..." : "Create Group Habit"}
                variant="pink"
                size="lg"
                onPress={handleSave}
                disabled={saving}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
