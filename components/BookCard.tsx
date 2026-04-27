import { theme } from "@/constants/theme";
import { Book } from "@/models/book";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
  return (
    <TouchableOpacity
      style={theme.card}
      onPress={() =>
        router.push(
          `/(tabs)/home/cookBook?book=${encodeURIComponent(JSON.stringify(book))}`,
        )
      }
    >
      <View style={styles.image}></View>
      <View style={styles.info}>
        <Text style={theme.cardTitle}>{book?.title}</Text>
        <Text style={theme.cardSubtitle}>{book?.subTitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.grey,
    flex: 1,
  },
  info: {
    backgroundColor: "white",
    padding: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
});
