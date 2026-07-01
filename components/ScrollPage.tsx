import { ScrollView, StyleSheet, View } from "react-native";

export default function ScrollPage({ children }) {
  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
