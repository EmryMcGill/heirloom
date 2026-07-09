import { router } from "expo-router";
import { Book as BookIcon } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BookData = {
  title: string;
  subTitle?: string;
  image_url?: string;
};

type BookCardProps = {
  book: BookData;
};

export default function BookCard({ book }: BookCardProps) {
  return (
    <TouchableOpacity
      style={styles.shadowWrapper}
      activeOpacity={0.85}
      onPress={() =>
        router.push(
          `/(tabs)/home/cookBook?book=${encodeURIComponent(JSON.stringify(book))}`,
        )
      }
    >
      <View style={styles.cardInner}>
        <View style={styles.imageContainer}>
          {book.image_url ? (
            <Image
              source={{ uri: book.image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noBookCircle}>
              <BookIcon size={24} color="#A3A3A3" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text adjustsFontSizeToFit style={styles.cardTitle} numberOfLines={2}>
            {book?.title}
          </Text>
          {book.subTitle && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {book?.subTitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderColor: "#f0f0f0",
    borderWidth: 1,
  },
  cardInner: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    width: "100%",
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  info: {
    padding: 12,
    gap: 2,
    borderTopColor: "#E5E5EA",
    borderTopWidth: 1,
  },
  cardTitle: {
    fontSize: 15, // Slightly scaled down text sizes for 2-column balance
    fontWeight: "600",
    color: "#1C1C1E",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
  noBookCircle: {
    backgroundColor: "#E5E5EA",
    padding: 12, // Scaled down padding for icon fallback
    borderRadius: 999,
  },
});
