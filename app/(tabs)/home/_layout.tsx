import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeLayout() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#6200ee" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Spurdle",
            headerShown: true,
            headerRight: () => (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push("/home/profile")}
              >
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.placeholder} />
                )}
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="cookBook" options={{ headerShown: false }} />
        <Stack.Screen name="recipePage" options={{ headerShown: false }} />
        <Stack.Screen name="profile" />
        <Stack.Screen
          name="friends"
          options={{
            // presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="newRecipe"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="newBook"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </View>
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
