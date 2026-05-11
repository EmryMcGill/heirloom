import { theme } from "@/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Clock } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function RecipeCard({ recipe }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(
          `/shared/recipePage?recipe=${encodeURIComponent(JSON.stringify(recipe))}`,
        )
      }
    >
      <View style={styles.image}>
        <Image
          source={{ uri: recipe.image_url }}
          style={{
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
          // transition={200}
        />
      </View>
      <View style={styles.info}>
        <View
          style={{
            gap: theme.spacing.xs,
          }}
        >
          <Text style={theme.cardTitle}>{recipe?.title}</Text>
          <Text style={theme.cardSubtitle}>{recipe?.owner.full_name}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexShrink: 1,
            alignItems: "center",
          }}
        >
          {recipe.prep_time !== 0 ||
            (recipe.cook_time !== 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock
                  size={theme.typography.sizes.xs}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.sizes.xs,
                  }}
                >
                  {recipe.prep_time + recipe.cook_time}
                </Text>
              </View>
            ))}
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <Bookmark size={theme.typography.sizes.md} color="black" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 100,
    flexShrink: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey,
    overflow: "hidden",
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  image: {
    backgroundColor: theme.colors.grey,
    height: "100%",
    aspectRatio: 1 / 1,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  info: {
    backgroundColor: "white",
    justifyContent: "space-between",
    flex: 1,
  },
});
