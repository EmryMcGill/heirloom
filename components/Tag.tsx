import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Tag({ icon, title }) {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
