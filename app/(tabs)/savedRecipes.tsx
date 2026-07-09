import Divider from "@/components/Divider";
import LoadingOverlay from "@/components/LoadingOverlay";
import RecipeCard from "@/components/RecipeCard";
import ScrollPage from "@/components/ScrollPage";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getRecipesByUserId } from "@/services/recipes";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Book } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function SavedRecipes() {
  const router = useRouter();
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const userId = session?.user?.id;

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes", userId],
    queryFn: () => getRecipesByUserId(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const savedRecipes = recipes.filter((recipe) => recipe.saved);

  const filteredRecipes = savedRecipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (recipes.length > 0) {
      const urls = recipes
        .map((r) => r.image_url)
        .filter((url): url is string => !!url);

      if (urls.length > 0) {
        Image.prefetch(urls);
      }
    }
  }, [recipes]);

  if (isLoading) {
    return <LoadingOverlay visible={true} mode="full" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollPage>
        {/* title */}
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
            Saved Recipes
          </Text>
        </View>

        {/* search input */}
        <TextInput
          placeholder="Search your saved recipes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            marginHorizontal: theme.spacing.md,
            marginTop: theme.spacing.sm,
            padding: 8,
            borderRadius: theme.borderRadius.md || 8,
            fontSize: 16,
            color: "#111",
            marginBottom: 0,
            borderWidth: 1,
            borderColor: "#c1c1c1",
            backgroundColor: "white",
          }}
        />

        <View style={{ paddingHorizontal: 12 }}>
          <Divider />
        </View>

        {savedRecipes.length === 0 && (
          <View style={styles.noBookContainer}>
            <View style={styles.noBookCircle}>
              <Book size={32} />
            </View>
            <Text
              style={{
                fontFamily: theme.typography.fonts.regular,
                fontSize: theme.typography.sizes.xl,
              }}
            >
              No saved recipes
            </Text>
          </View>
        )}

        {/* recipes */}
        <View style={{ gap: 2 }}>
          {filteredRecipes.length > 0 &&
            filteredRecipes.map((recipe, index) => {
              return (
                <View style={{ paddingHorizontal: 12 }} key={index}>
                  <RecipeCard recipe={recipe} />
                </View>
              );
            })}
        </View>
      </ScrollPage>
    </View>
  );
}

const styles = StyleSheet.create({
  noBookContainer: {
    gap: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },
  noBookCircle: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 999,
    marginBottom: 8,
  },
  addBookBtn: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
});
