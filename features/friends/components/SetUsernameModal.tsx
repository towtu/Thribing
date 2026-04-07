import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { CartoonInput, CartoonButton } from "@/core_ui/components";
import { setUsername, isUsernameAvailable } from "../services";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useFriendsStore } from "@/lib/stores/useFriendsStore";

interface SetUsernameModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function SetUsernameModal({ visible, onDismiss }: SetUsernameModalProps) {
  const user = useAuthStore((s) => s.user);
  const { level, player_class } = usePlayerStore();
  const setUsernameStore = useFriendsStore((s) => s.setUsername);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!user?.uid) return;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!/^[a-z0-9_]+$/.test(trimmed)) { setError("Only letters, numbers, and underscores"); return; }
    setSaving(true);
    setError("");
    try {
      const available = await isUsernameAvailable(trimmed);
      if (!available) { setError("Username already taken"); setSaving(false); return; }
      await setUsername(user.uid, trimmed, {
        displayName: user.displayName ?? "",
        photoURL: user.photoURL,
        level,
        player_class,
      });
      setUsernameStore(trimmed);
      setValue("");
      onDismiss();
    } catch (e: any) {
      setError(e?.message ?? "Failed to set username");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center px-6" onPress={onDismiss}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-dark border-4 border-gray-900 rounded-3xl w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <View className="h-2 w-full bg-violet-electric" />
          <View className="p-6 gap-4">
            <View className="items-center gap-2">
              <Text style={{ fontSize: 48 }}>🏷️</Text>
              <Text className="text-xl text-white text-center" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                Choose a Username
              </Text>
              <Text className="text-sm text-gray-400 text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>
                Friends can find you with this. Letters, numbers, underscores only.
              </Text>
            </View>
            <CartoonInput
              variant="dark"
              placeholder="e.g. hero_adventurer"
              value={value}
              onChangeText={(v) => { setValue(v); setError(""); }}
              autoFocus
            />
            {error ? (
              <Text className="text-red-400 text-sm text-center" style={{ fontFamily: "Nunito_600SemiBold" }}>{error}</Text>
            ) : null}
            <CartoonButton
              title={saving ? "Saving..." : "Save Username"}
              variant="violet"
              size="md"
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
