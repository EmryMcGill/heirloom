import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function Divider() {
  return (
    <Image
      source={require("../assets/images/divider.svg")}
      style={styles.divider}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: screenWidth - 24,
    height: 5,
    marginVertical: 12,
  },
});
