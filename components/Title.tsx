import { theme } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";

export default function Title({ title, buttonTitle, buttonPress }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: theme.typography.fonts.regular,
          fontSize: theme.typography.sizes.xxl,
          marginBottom: 0,
          flexShrink: 1,
        }}
      >
        {title}
      </Text>
      <Button title={buttonTitle} onPress={buttonPress} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({});
