import { theme } from "@/constants/theme";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const screenWidth = Dimensions.get("window").width;

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 5 }]}>
      <Image
        source={require("../assets/images/logo.svg")}
        style={styles.logo}
        contentFit="contain"
      />
      <Image
        source={require("../assets/images/headerBanner.svg")}
        style={styles.banner}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.darkRed,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  logo: {
    width: 143,
    height: 29,
    marginLeft: 12,
  },
  banner: {
    width: screenWidth,
    height: (screenWidth / 428) * 15,
  },
});
