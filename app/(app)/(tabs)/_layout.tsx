import { Tabs } from "expo-router";
import { Text, View } from "react-native";

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-2">
      <Text className="text-xl">{emoji}</Text>
      <Text
        className={`text-xs mt-0.5 ${focused ? "text-violet-electric" : "text-gray-400"}`}
        style={{ fontFamily: "Nunito_700Bold" }}
      >
        {label}
      </Text>
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
          height: 70,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Habits" emoji="⚡" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dailies"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Dailies" emoji="📅" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="To-Dos" emoji="✅" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
