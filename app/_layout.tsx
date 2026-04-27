import {
  GentiumPlus_400Regular,
  GentiumPlus_400Regular_Italic,
  GentiumPlus_700Bold,
  GentiumPlus_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/gentium-plus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    GentiumPlus_400Regular,
    GentiumPlus_400Regular_Italic,
    GentiumPlus_700Bold,
    GentiumPlus_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isRootIndex = segments.length === 0;

    if (!session && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to welcome/auth
      router.replace("/");
    } else if (session && isRootIndex) {
      // Signed-in users landing on the root index should go to the main app.
      router.replace("/(tabs)");
    }
  }, [session, segments, isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const queryClient = new QueryClient();
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
