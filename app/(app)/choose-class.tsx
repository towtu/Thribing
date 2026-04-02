import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Swords, Wand2, Target, Heart, Scissors, Check } from "lucide-react-native";
import { CartoonCard, CartoonButton } from "@/core_ui/components";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { changePlayerClass, updatePlayerStats } from "@/features/gamification/services";
import {
  CLASS_INFO,
  CLASS_CHANGE_COST,
  getClassTitle,
  type PlayerClass,
} from "@/features/gamification/types";

const CLASSES: {
  id: PlayerClass;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
  titles: string[];
  color: string;
  cardVariant: "violet" | "pink" | "cyan" | "yellow" | "default";
}[] = [
  {
    id: "swordsman",
    label: "Swordsman",
    emoji: "⚔️",
    icon: <Swords size={28} color="white" strokeWidth={2.5} />,
    description: "A fierce melee warrior who charges into battle. Masters of strength and endurance.",
    titles: ["Squire", "Knight", "Crusader", "Paladin", "Warlord"],
    color: "bg-red-400",
    cardVariant: "pink",
  },
  {
    id: "wizard",
    label: "Wizard",
    emoji: "🧙",
    icon: <Wand2 size={28} color="white" strokeWidth={2.5} />,
    description: "A master of arcane arts who bends reality through the power of magic.",
    titles: ["Apprentice", "Sorcerer", "Warlock", "Archmage", "Grand Wizard"],
    color: "bg-violet-electric",
    cardVariant: "violet",
  },
  {
    id: "marksman",
    label: "Marksman",
    emoji: "🎯",
    icon: <Target size={28} color="#111827" strokeWidth={2.5} />,
    description: "A precision ranged fighter who strikes from afar with deadly accuracy.",
    titles: ["Scout", "Sharpshooter", "Sniper", "Deadeye", "Gunslinger"],
    color: "bg-cyan-neon",
    cardVariant: "cyan",
  },
  {
    id: "healer",
    label: "Healer",
    emoji: "💚",
    icon: <Heart size={28} color="white" strokeWidth={2.5} />,
    description: "A devoted protector who keeps allies alive and the spirit strong.",
    titles: ["Acolyte", "Cleric", "Priest", "Bishop", "Saint"],
    color: "bg-green-500",
    cardVariant: "default",
  },
  {
    id: "rogue",
    label: "Rogue",
    emoji: "🗡️",
    icon: <Scissors size={28} color="white" strokeWidth={2.5} />,
    description: "A shadow operative who moves unseen and strikes when least expected.",
    titles: ["Pickpocket", "Thief", "Assassin", "Phantom", "Shadow Lord"],
    color: "bg-gray-600",
    cardVariant: "default",
  },
];

export default function ChooseClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ respec?: string }>();
  const isRespec = params.respec === "1";
  const user = useAuthStore((s) => s.user);
  const { gold, level, player_class } = usePlayerStore();
  const [selected, setSelected] = useState<PlayerClass | null>(null);
  const [saving, setSaving] = useState(false);

  const cost = isRespec ? CLASS_CHANGE_COST : 0;
  const canAfford = gold >= cost;

  const handleConfirm = async () => {
    if (!selected || !user?.uid) return;
    if (isRespec && !canAfford) {
      Alert.alert("Not enough gold", `You need ${CLASS_CHANGE_COST} gold to change class.`);
      return;
    }

    setSaving(true);
    try {
      if (isRespec) {
        await changePlayerClass(user.uid, selected, gold, cost);
      } else {
        // First-time free pick
        await updatePlayerStats(user.uid, { player_class: selected });
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to change class.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center gap-2 mb-6">
          <Text className="text-3xl" style={{ lineHeight: 40 }}>🏆</Text>
          <Text
            className="text-2xl text-white text-center"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            {isRespec ? "Change Class" : "Choose Your Class"}
          </Text>
          <Text
            className="text-sm text-gray-400 text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            {isRespec
              ? `Costs ${CLASS_CHANGE_COST} gold • You have ${gold} gold`
              : "You've reached Level 5! Choose a class to unlock your title path."}
          </Text>
        </View>

        {/* Class cards */}
        <View className="gap-3 mb-6">
          {CLASSES.map((cls) => {
            const isSelected = selected === cls.id;
            const isCurrent = player_class === cls.id;
            const previewTitle = getClassTitle(cls.id, level);

            return (
              <Pressable
                key={cls.id}
                onPress={() => setSelected(cls.id)}
                className="active:scale-98"
              >
                <View
                  className={`border-4 rounded-3xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    isSelected
                      ? "border-violet-electric bg-white"
                      : "border-gray-900 bg-white"
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    {/* Icon */}
                    <View
                      className={`w-14 h-14 ${cls.color} border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                    >
                      {cls.icon}
                    </View>

                    {/* Info */}
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-base text-gray-900"
                          style={{ fontFamily: "Nunito_800ExtraBold" }}
                        >
                          {cls.label}
                        </Text>
                        {isCurrent && (
                          <View className="bg-violet-100 border border-violet-300 rounded-full px-2">
                            <Text
                              className="text-[10px] text-violet-700"
                              style={{ fontFamily: "Nunito_700Bold" }}
                            >
                              current
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        className="text-xs text-gray-600 leading-4"
                        style={{ fontFamily: "Nunito_600SemiBold" }}
                      >
                        {cls.description}
                      </Text>

                      {/* Title progression */}
                      <View className="flex-row gap-1 flex-wrap mt-1">
                        {cls.titles.map((t, i) => (
                          <View
                            key={t}
                            className={`border rounded-full px-2 py-0.5 ${
                              previewTitle === t
                                ? `${cls.color} border-gray-900`
                                : "bg-gray-100 border-gray-300"
                            }`}
                          >
                            <Text
                              className={`text-[9px] ${previewTitle === t ? "text-gray-900" : "text-gray-500"}`}
                              style={{ fontFamily: "Nunito_700Bold" }}
                            >
                              {t}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Selected indicator */}
                    <View
                      className={`w-7 h-7 rounded-full border-4 border-gray-900 items-center justify-center ${
                        isSelected ? "bg-violet-electric" : "bg-gray-100"
                      }`}
                    >
                      {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Confirm button */}
        <View className="gap-2">
          <CartoonButton
            title={
              saving
                ? "Saving..."
                : selected
                  ? `Become ${CLASS_INFO[selected]?.label ?? selected}${cost > 0 ? ` (-${cost} Gold)` : ""}`
                  : "Pick a class above"
            }
            variant="violet"
            size="lg"
            onPress={handleConfirm}
            disabled={!selected || saving || (isRespec && !canAfford)}
          />
          {isRespec && (
            <CartoonButton
              title="Cancel"
              variant="white"
              size="md"
              onPress={() => router.back()}
              disabled={saving}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
