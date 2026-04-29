import { theme } from "@/constants/theme";
import { router } from "expo-router";
import { Book } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
  return (
    <TouchableOpacity
      style={[theme.card, { borderWidth: 2 }]}
      onPress={() =>
        router.push(
          `/(tabs)/home/cookBook?book=${encodeURIComponent(JSON.stringify(book))}`,
        )
      }
    >
      <View style={styles.image}>
        {!book.image && (
          <View style={styles.noBookCircle}>
            <Book size={32} color="grey" />
          </View>
        )}
      </View>
      <View style={{ borderWidth: 1, borderColor: theme.colors.grey }} />
      <View style={styles.info}>
        <Text style={theme.cardTitle}>{book?.title}</Text>
        {book.subTitle && (
          <Text style={theme.cardSubtitle}>{book?.subTitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    backgroundColor: "white",
    padding: theme.spacing.sm,
    paddingVertical: 12,
    gap: theme.spacing.xs,
  },
  noBookCircle: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 999,
    marginBottom: 8,
  },
});
