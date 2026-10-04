import {
  GentiumPlus_400Regular,
  GentiumPlus_400Regular_Italic,
  GentiumPlus_700Bold,
  GentiumPlus_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/gentium-plus";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Href, Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [fontsLoaded] = useFonts({
    GentiumPlus_400Regular,
    GentiumPlus_400Regular_Italic,
    GentiumPlus_700Bold,
    GentiumPlus_700Bold_Italic,
    Pacifico_400Regular,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isReady = isMounted && !isLoading && fontsLoaded;

  // Auth Routing Guard & Splash Screen Dismissal
  useEffect(() => {
    if (!isReady) return;

    const inAuthRoute = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    const timer = setTimeout(async () => {
      if (!session && inTabsGroup) {
        router.replace("/" as Href);
      } else if (session && (inAuthRoute || segments[0] === undefined)) {
        router.replace("/(tabs)" as Href);
      }

      // Hide splash screen AFTER redirect is executed to prevent screen flashing
      await SplashScreen.hideAsync();
    }, 10);

    return () => clearTimeout(timer);
  }, [session, segments, isReady]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Root & Auth Routes */}
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />

      {/* Main Tabs Group */}
      <Stack.Screen name="(tabs)" />

      {/* Recipe Stack Routes */}
      <Stack.Screen name="recipe/new" />
      <Stack.Screen name="recipe/[id]" />

      {/* Book Stack Routes */}
      <Stack.Screen name="book/new" />
      <Stack.Screen name="book/[id]" />

      <Stack.Screen
        name="add-to-book-modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="manage-book-recipes-modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="add-book-member-modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="importRecipe"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
