import { theme } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { router, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BookOpen, Plus, User } from "lucide-react-native";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const bottomInset =
    Platform.OS === "ios" ? (insets.bottom > 0 ? insets.bottom : 20) : 12;
  const tabTabBarHeight = 50 + bottomInset;

  const handlePress = () => {
    const options = [
      "Cancel",
      "Create Recipe",
      "Import from URL",
      "Create Cookbook",
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          title: "Create New",
        },
        (buttonIndex) => {
          if (buttonIndex === 3) router.push("/book/new");
          if (buttonIndex === 1) router.push("/recipe/new");
          if (buttonIndex === 2) router.push("/importRecipe");
        },
      );
    } else {
      Alert.alert("Create New", "Choose an option to get started", [
        { text: "Create Recipe", onPress: () => router.push("/recipe/new") },
        {
          text: "Import from URL",
          onPress: () => router.push("/importRecipe"),
        },
        { text: "Create Cookbook", onPress: () => router.push("/book/new") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.black || "#000000",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.OS === "ios" ? "transparent" : "#FFFFFF",
            elevation: 0,
            height: tabTabBarHeight,
            paddingBottom: bottomInset,
            paddingTop: 8,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                tint="systemChromeMaterial"
                intensity={100}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        {/* 1. Library Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size ?? 22} color={color} />
            ),
          }}
        />

        {/* 2. Middle Add Action Button */}
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handlePress();
            },
          }}
          options={{
            title: "",
            tabBarIcon: ({ color, size }) => (
              <View
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderRadius: 99,
                  padding: 8,
                }}
              >
                <Plus size={size ?? 22} color="white" />
              </View>
            ),
          }}
        />

        {/* 3. Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <User size={size ?? 22} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
