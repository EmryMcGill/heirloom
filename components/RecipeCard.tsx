import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Recipe } from "@/models/recipe";
import {
  deleteSavedRecipeForUser,
  saveRecipeForUser,
} from "@/services/recipes";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Clock, NotebookText } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type RecipeCardProps = {
  recipe: Recipe;
};

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(Boolean(recipe?.saved));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(Boolean(recipe?.saved));
  }, [recipe?.saved, recipe?.id]);

  const handleSaveRecipe = async (event: GestureResponderEvent) => {
    event.stopPropagation();

    const userId = session?.user?.id;
    if (!userId || !recipe?.id || isSaving) return;

    setIsSaving(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        await saveRecipeForUser(recipe.id, userId);
      } else {
        await deleteSavedRecipeForUser(recipe.id, userId);
      }
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "recipes",
      });
    } catch (error) {
      console.error("Error toggling saved recipe:", error);
      setIsSaved(Boolean(recipe?.saved));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(
          `/shared/recipePage?recipe=${encodeURIComponent(JSON.stringify(recipe))}`,
        )
      }
    >
      <View
        style={[
          styles.image,
          !recipe.image_url && { backgroundColor: "white", borderWidth: 2 },
        ]}
      >
        {!recipe.image_url && (
          <View style={styles.noBookCircle}>
            <NotebookText size={24} color="grey" />
          </View>
        )}
        {recipe.image_url && (
          <Image
            source={{ uri: recipe.image_url }}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
            // transition={200}
          />
        )}
      </View>
      <View style={styles.info}>
        <View
          style={{
            gap: theme.spacing.xs,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "500" }}>
            {recipe?.title}
          </Text>
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
                  {(recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)}
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
            <Pressable
              onPress={handleSaveRecipe}
              disabled={isSaving}
              hitSlop={10}
              style={{ padding: 8, borderRadius: 999 }}
            >
              <Bookmark
                size={theme.typography.sizes.lg}
                color={isSaved ? theme.colors.red : "black"}
                fill={isSaved ? theme.colors.red : "transparent"}
              />
            </Pressable>
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
    overflow: "hidden",
    flexDirection: "row",
    padding: 12,
    gap: 12,
    backgroundColor: "white",
    borderColor: "#f0f0f0",
    borderWidth: 1,
  },
  image: {
    borderColor: theme.colors.grey,
    height: "100%",
    aspectRatio: 1 / 1,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    backgroundColor: "white",
    justifyContent: "space-between",
    flex: 1,
  },
  noBookCircle: {
    backgroundColor: theme.colors.grey,
    padding: 10,
    borderRadius: 999,
  },
});
