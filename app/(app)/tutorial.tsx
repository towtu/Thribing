import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CalendarCheck,
  Zap,
  ListTodo,
  Shield,
  Star,
  Coins,
  Flame,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react-native";
import { CartoonCard } from "@/core_ui/components";

interface TutorialSection {
  icon: React.ReactNode;
  title: string;
  color: string;
  points: string[];
}

const SECTIONS: TutorialSection[] = [
  {
    icon: <CalendarCheck size={22} color="#111827" strokeWidth={2.5} />,
    title: "Dailies — Track Quantities",
    color: "bg-cyan-neon",
    points: [
      "Dailies are recurring goals that reset every day.",
      "Set a target — like \"Drink 8 cups of water\" or \"Run 10 km\" — and tap + to log progress.",
      "For timed goals like \"Study 20 minutes\", enable the timer and press Start.",
      "Completing a daily earns you XP and Gold based on difficulty.",
      "Missing dailies at midnight damages your HP — stay consistent!",
    ],
  },
  {
    icon: <Zap size={22} color="white" strokeWidth={2.5} />,
    title: "Habits — Build Weekly Goals",
    color: "bg-violet-electric",
    points: [
      "Habits are behaviors you want to do a set number of times per week.",
      "Example: \"Gym\" with a goal of 3×/week, or \"Meditate\" 5×/week.",
      "Tap the checkbox on a habit to log it for today.",
      "Hit your weekly goal every week to grow your streak.",
      "Each log earns XP and Gold — streaks give you extra motivation!",
    ],
  },
  {
    icon: <ListTodo size={22} color="#111827" strokeWidth={2.5} />,
    title: "To-Dos — One-Time Quests",
    color: "bg-yellow-sunburst",
    points: [
      "To-Dos are single tasks you need to complete once.",
      "Great for errands, projects, or anything non-recurring.",
      "Check them off to earn XP and Gold.",
      "Set difficulty (Easy/Medium/Hard) to earn bigger rewards for harder tasks.",
    ],
  },
  {
    icon: <Shield size={22} color="white" strokeWidth={2.5} />,
    title: "HP — Your Health Points",
    color: "bg-pink-bubblegum",
    points: [
      "HP represents your health. Start with 50 HP.",
      "Missing incomplete dailies at midnight deals HP damage.",
      "The harder the daily, the more damage it deals if missed.",
      "Keep your HP high by staying on top of your daily goals.",
    ],
  },
  {
    icon: <Star size={22} color="#111827" strokeWidth={2.5} />,
    title: "XP & Leveling Up",
    color: "bg-yellow-sunburst",
    points: [
      "XP (experience points) are earned by completing any task.",
      "Fill the XP bar to level up — each level requires more XP.",
      "Your level title grows from Novice → Apprentice → Warrior → Champion → Legend.",
      "Higher difficulty tasks give more XP rewards.",
    ],
  },
  {
    icon: <Coins size={22} color="#111827" strokeWidth={2.5} />,
    title: "Gold — Your Currency",
    color: "bg-yellow-sunburst",
    points: [
      "Gold is earned alongside XP when you complete tasks.",
      "Hard tasks reward more gold than easy ones.",
      "More reward features coming soon!",
    ],
  },
  {
    icon: <Flame size={22} color="#111827" strokeWidth={2.5} />,
    title: "Streaks — Keep the Fire Alive",
    color: "bg-yellow-sunburst",
    points: [
      "Habit streaks measure how many consecutive weeks you've hit your goal.",
      "A 🔥3wk badge means you've met that habit's weekly goal 3 weeks in a row.",
      "Streaks reset to 0 if you miss a week — stay consistent!",
    ],
  },
  {
    icon: <Target size={22} color="white" strokeWidth={2.5} />,
    title: "Tips for Success",
    color: "bg-violet-electric",
    points: [
      "Start small — set easy targets at first and build up gradually.",
      "Schedule your dailies for specific times (e.g. 7:00 AM) to stay on track.",
      "Check the Home tab each morning to see what's due today.",
      "Complete all your dailies before midnight to avoid HP damage.",
      "Build habit streaks week by week — consistency beats perfection.",
    ],
  },
];

export default function TutorialScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b-2 border-gray-800">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 bg-dark-card border-2 border-gray-700 rounded-xl items-center justify-center active:scale-95"
        >
          <ArrowLeft size={18} color="#9CA3AF" strokeWidth={2.5} />
        </Pressable>
        <View>
          <Text className="text-xl text-white" style={{ fontFamily: "Nunito_800ExtraBold" }}>
            How ThriBing Works
          </Text>
          <Text className="text-xs text-gray-400" style={{ fontFamily: "Nunito_600SemiBold" }}>
            Your complete game guide
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          {SECTIONS.map((section) => (
            <CartoonCard key={section.title} variant="default">
              <View className="gap-3">
                {/* Section header */}
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-9 h-9 ${section.color} border-2 border-gray-900 rounded-xl items-center justify-center`}
                  >
                    {section.icon}
                  </View>
                  <Text
                    className="flex-1 text-base text-gray-900"
                    style={{ fontFamily: "Nunito_800ExtraBold" }}
                  >
                    {section.title}
                  </Text>
                </View>

                {/* Points */}
                <View className="gap-2">
                  {section.points.map((point, i) => (
                    <View key={i} className="flex-row gap-2">
                      <Text
                        className="text-violet-electric"
                        style={{ fontFamily: "Nunito_800ExtraBold", lineHeight: 20 }}
                      >
                        •
                      </Text>
                      <Text
                        className="flex-1 text-sm text-gray-700 leading-5"
                        style={{ fontFamily: "Nunito_600SemiBold" }}
                      >
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </CartoonCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
