import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
} from "react-native";
import { theme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function WelcomeScreen() {
  const router = useRouter();
  const { session } = useAuth();

  // If user is already logged in, redirect to app
  useEffect(() => {
    if (session) {
      router.replace("/(tabs)/home");
    }
  }, [session]);

  return (
    <ImageBackground
      source={require("../assets/images/mobile-img.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar style="light" />
      <Text style={styles.title}>
        The <Text style={styles.italic}>shared</Text> kitchen for the people you
        <Text style={styles.italic}> love</Text>.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/(auth)/auth")}
      >
        <Text style={styles.buttonText}>Start your heirloom</Text>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
    gap: 20,
  },
  title: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.yellow,
    textAlign: "center",
    lineHeight: 35,
  },
  italic: {
    fontFamily: theme.typography.fonts.italic,
  },
  button: {
    backgroundColor: theme.colors.yellow,
    padding: 12,
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: theme.colors.blue,
  },
  buttonText: {
    color: theme.colors.darkRed,
    fontWeight: 600,
    fontSize: theme.typography.sizes.md,
  },
});
