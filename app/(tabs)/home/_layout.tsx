import Header from "@/components/Header";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function HomeLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header onProfilePress={() => router.push("/home/profile")} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="cookBook" />
        <Stack.Screen name="recipePage" />
        <Stack.Screen
          name="profile"
          options={
            {
              // presentation: "modal",
            }
          }
        />
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
});
