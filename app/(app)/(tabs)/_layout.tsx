import { Tabs } from "expo-router";
import { View } from "react-native";
import {
  Home,
  Zap,
  CalendarCheck,
  ListTodo,
  User,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react-native";

const VIOLET = "#8B5CF6";
const GRAY = "#6B7280";

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View className="items-center justify-center gap-0.5" style={{ paddingTop: 6 }}>
      {focused && (
        <View className="absolute -top-2 w-8 h-1 rounded-full bg-violet-electric" />
      )}
      <Icon size={22} color={focused ? VIOLET : GRAY} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#2A2A4A",
          borderTopWidth: 3,
          borderTopColor: "#111827",
          height: 72,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: VIOLET,
        tabBarInactiveTintColor: GRAY,
        tabBarLabelStyle: {
          fontFamily: "Nunito_700Bold",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Zap} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dailies"
        options={{
          title: "Dailies",
          tabBarIcon: ({ focused }) => <TabIcon Icon={CalendarCheck} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: "To-Dos",
          tabBarIcon: ({ focused }) => <TabIcon Icon={ListTodo} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused }) => <TabIcon Icon={ShoppingBag} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
