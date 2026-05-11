import { theme } from "@/constants/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { Library, NotebookText } from "lucide-react-native";
import React from "react";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.yellow,
        tabBarInactiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: theme.colors.darkRed,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Library color={color} />,
        }}
      />
      <Tabs.Screen
        name="allRecipes"
        options={{
          tabBarIcon: ({ color }) => <NotebookText color={color} />,
        }}
      />
    </Tabs>
  );
}
