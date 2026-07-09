import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function Divider() {
  return (
    // <Image
    //   source={require("../assets/images/divider.svg")}
    //   style={styles.divider}
    //   contentFit="contain"
    // />
    <View style={styles.div}></View>
  );
}

const styles = StyleSheet.create({
  divider: {
    width: screenWidth - 24,
    height: 5,
    marginVertical: 12,
  },
  div: {
    width: screenWidth - 24,
    height: 2,
    marginVertical: 12,
    backgroundColor: "#d6d6d6",
    borderRadius: 99,
  },
});
