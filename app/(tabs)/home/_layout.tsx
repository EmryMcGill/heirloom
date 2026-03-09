import Header from "@/components/Header";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function HomeLayout() {
  return (
    <View style={styles.container}>
      <Header />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="cookBook" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
