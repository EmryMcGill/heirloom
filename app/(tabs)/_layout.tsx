import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { Bookmark, Library, NotebookText, User } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.yellow,
        tabBarInactiveTintColor: "black",
        tabBarStyle: {
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Library color={color} />,
          title: "Spurdle",
        }}
      />
      <Tabs.Screen
        name="allRecipes"
        options={{
          tabBarIcon: ({ color }) => <NotebookText color={color} />,
          title: "Spurdle",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="savedRecipes"
        options={{
          tabBarIcon: ({ color }) => <Bookmark color={color} />,
          title: "Spurdle",
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User color={color} />,
          title: "Spurdle",
          headerShown: true,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileButton: {
    height: 29,
    width: 29,
    backgroundColor: "grey",
    borderRadius: 999,
    marginRight: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  placeholder: {
    flex: 1,
    backgroundColor: "#666",
    borderRadius: 999,
  },
});
