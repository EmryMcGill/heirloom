import { theme } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function Button({ title, onPress, size }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: theme.colors.grey,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
      }}
    >
      <Text
        style={{
          fontWeight: theme.typography.fontWeights.semibold,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
