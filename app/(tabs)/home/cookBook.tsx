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
import React, { useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";

export default function CookBook() {
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book as string) : null;
  const router = useRouter();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes", book?.id],
    queryFn: () => getRecipesByBookId(book.id),
    enabled: !!book,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
            pathname: "/(tabs)/home/newRecipe",
            params: {
              bookId: book.id,
            },
          })
        }
      />

      {/* search input */}
      <TextInput
        placeholder="Search all recipes in this cookbook"
        style={{
          backgroundColor: theme.colors.grey,
          marginHorizontal: theme.spacing.md,
          fontSize: theme.typography.sizes.sm,
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.lg,
          marginTop: theme.spacing.sm,
        }}
      />

      {/* recipes */}
      {recipes.length > 0 &&
        recipes.map((recipe, index) => {
          return (
            <View style={{ paddingHorizontal: 12 }} key={index}>
              {index === 0 ? <Divider /> : <View style={{ height: 12 }} />}
              <RecipeCard recipe={recipe} />
            </View>
          );
        })}
    </ScrollPage>
  );
}

const styles = StyleSheet.create({});
