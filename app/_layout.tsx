import {
  GentiumPlus_400Regular,
  GentiumPlus_400Regular_Italic,
  GentiumPlus_700Bold,
  GentiumPlus_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/gentium-plus";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { getRecipesByUserId } from "../services/recipes";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [recipesReady, setRecipesReady] = useState(false);

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
    let isActive = true;

    const bootstrapRecipes = async () => {
      const userId = session?.user?.id;

      if (!userId) {
        setRecipesReady(true);
        return;
      }

      setRecipesReady(false);

      await queryClient.prefetchQuery({
        queryKey: ["recipes", userId],
        queryFn: () => getRecipesByUserId(userId),
        staleTime: 1000 * 60 * 5,
      });

      if (isActive) {
        setRecipesReady(true);
      }
    };

    if (!isLoading && fontsLoaded) {
      void bootstrapRecipes();
    }

    return () => {
      isActive = false;
    };
  }, [session?.user?.id, isLoading, fontsLoaded, queryClient]);

  useEffect(() => {
    if (isLoading || !fontsLoaded || !recipesReady) return;

    const isAuthRoute = pathname === "/auth";
    const isWelcomeRoute = pathname === "/" || pathname === "/index";

    if (!session && !isAuthRoute && !isWelcomeRoute) {
      router.replace("/");
    } else if (session && (isAuthRoute || isWelcomeRoute)) {
      router.replace("/(tabs)/home");
    }
  }, [session, pathname, isLoading, fontsLoaded, recipesReady]);

  if (isLoading || !fontsLoaded || !recipesReady) {
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
