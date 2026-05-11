import Divider from "@/components/Divider";
import LoadingOverlay from "@/components/LoadingOverlay";
import RecipeCard from "@/components/RecipeCard";
import ScrollPage from "@/components/ScrollPage";
import Title from "@/components/Title";
import { theme } from "@/constants/theme";
import { getRecipesByBookId } from "@/services/recipes";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Book } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CookBook() {
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book as string) : null;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes", book?.id],
    queryFn: () => getRecipesByBookId(book.id),
    enabled: !!book,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredRecipes = recipes.filter((recipe) =>
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
    <ScrollPage>
      {/* title */}
      <Title
        title={book.title}
        buttonTitle="Add recipe"
        buttonPress={() =>
          router.push({
            pathname: "/shared/newRecipe",
            params: {
              bookId: book.id,
            },
          })
        }
      />

      {/* search input */}
      <TextInput
        placeholder="Search all recipes in this cookbook"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          backgroundColor: theme.colors.grey,
          marginHorizontal: theme.spacing.md,
          fontSize: theme.typography.sizes.sm,
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.lg,
          marginTop: theme.spacing.sm,
        }}
      />

      <View style={{ paddingHorizontal: 12 }}>
        <Divider />
      </View>

      {recipes.length === 0 && (
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
            No recipes yet
          </Text>
          <Text style={{ color: "grey", marginHorizontal: 12 }}>
            Start building your collection of family recipes
          </Text>
          <TouchableOpacity
            style={styles.addBookBtn}
            onPress={() =>
              router.push({
                pathname: "/shared/newRecipe",
              })
            }
          >
            <Text style={{ fontWeight: "bold" }}>Add your first recipe</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* recipes */}
      <View style={{ gap: 8 }}>
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
  );
}

const styles = StyleSheet.create({
  noBookContainer: {
    gap: 8,
    width: "100%",
    alignItems: "center",
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
