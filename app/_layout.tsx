import {
  GentiumPlus_400Regular,
  GentiumPlus_400Regular_Italic,
  GentiumPlus_700Bold,
  GentiumPlus_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/gentium-plus";
import { Slot, useRouter, useSegments } from "expo-router";
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
    const inTabsGroup = segments[0] === "(tabs)";

    if (!session && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to welcome/auth
      router.replace("/");
    } else if (session && !inTabsGroup) {
      // User is signed in but not in the app, redirect to main app
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

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
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
