import { useState } from "react";
import { View, Text } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { ScreenContainer, CartoonCard, CartoonButton } from "@/core_ui/components";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { POTIONS, buyPotion, type PotionId } from "@/features/gamification/services";

export default function ShopScreen() {
  const user = useAuthStore((s) => s.user);
  const stats = usePlayerStore();
  const [buying, setBuying] = useState<PotionId | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const handleBuy = async (potionId: PotionId) => {
    if (!user?.uid || buying) return;
    setBuying(potionId);
    try {
      const potion = POTIONS.find((p) => p.id === potionId)!;
      const { newHp, newGold } = await buyPotion(user.uid, potionId, stats);
      const restored = newHp - stats.hp;
      usePlayerStore.getState().setStats({ ...stats, hp: newHp, gold: newGold });
      setFlash(`${potion.emoji} +${restored} HP restored!`);
      setTimeout(() => setFlash(null), 2500);
    } catch (e: any) {
      setFlash(e?.message ?? "Purchase failed");
      setTimeout(() => setFlash(null), 2500);
    } finally {
      setBuying(null);
    }
  };

  const hpPct = stats.max_hp > 0 ? Math.min(100, (stats.hp / stats.max_hp) * 100) : 0;

  return (
    <ScreenContainer>
      <View className="gap-4 py-4">
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 bg-yellow-sunburst border-4 border-gray-900 rounded-2xl items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <ShoppingBag size={20} color="#111827" strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-2xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
              Shop
            </Text>
            <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
              Spend your gold wisely
            </Text>
          </View>
        </View>

        {/* Current HP + Gold */}
        <CartoonCard variant="violet">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                ❤️ HP
              </Text>
              <Text className="text-sm text-white" style={{ fontFamily: "Nunito_700Bold" }}>
                {stats.hp} / {stats.max_hp}
              </Text>
            </View>
            <View className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/20">
              <View className="h-full rounded-full bg-red-400" style={{ width: `${hpPct}%` }} />
            </View>
            <Text className="text-sm text-yellow-sunburst" style={{ fontFamily: "Nunito_700Bold" }}>
              🪙 {stats.gold} Gold available
            </Text>
          </View>
        </CartoonCard>

        {/* Flash message */}
        {flash && (
          <CartoonCard variant="cyan">
            <Text className="text-sm text-gray-900 text-center" style={{ fontFamily: "Nunito_700Bold" }}>
              {flash}
            </Text>
          </CartoonCard>
        )}

        {/* Potion cards */}
        <Text className="text-base text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
          Heal Potions
        </Text>

        {POTIONS.map((potion) => {
          const canAfford = stats.gold >= potion.cost;
          const alreadyFull = stats.hp >= stats.max_hp;
          const disabled = !canAfford || alreadyFull || buying !== null;

          return (
            <CartoonCard key={potion.id} variant="default">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-violet-100 border-4 border-gray-900 rounded-2xl items-center justify-center">
                  <Text className="text-2xl">{potion.emoji}</Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base text-gray-900" style={{ fontFamily: "Nunito_800ExtraBold" }}>
                    {potion.name}
                  </Text>
                  <Text className="text-xs text-gray-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                    Restores {potion.hp} HP • {potion.cost} 🪙
                  </Text>
                  {!canAfford && (
                    <Text className="text-xs text-red-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      Not enough gold
                    </Text>
                  )}
                  {alreadyFull && canAfford && (
                    <Text className="text-xs text-green-500" style={{ fontFamily: "Nunito_600SemiBold" }}>
                      HP already full
                    </Text>
                  )}
                </View>
                <CartoonButton
                  title={buying === potion.id ? "..." : `${potion.cost} 🪙`}
                  variant={canAfford && !alreadyFull ? "yellow" : "cyan"}
                  size="sm"
                  onPress={() => handleBuy(potion.id as PotionId)}
                  disabled={disabled}
                />
              </View>
            </CartoonCard>
          );
        })}
      </View>
    </ScreenContainer>
  );
}
