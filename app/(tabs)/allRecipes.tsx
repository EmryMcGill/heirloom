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
import { Book, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllRecipes() {
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

  const handleAddRecipeOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Import from Link", "Enter Manually"],
          cancelButtonIndex: 0,
          title: "Add a Recipe",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push("/shared/importRecipe");
          } else if (buttonIndex === 2) {
            router.push("/shared/newRecipe");
          }
        },
      );
    } else {
      // Clean cross-platform fallback for Android testing
      Alert.alert("Add New Recipe", "How would you like to add this recipe?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import from Link",
          onPress: () => router.push("/shared/importRecipe"),
        },
        {
          text: "Enter Manually",
          onPress: () => router.push("/shared/newRecipe"),
        },
      ]);
    }
  };

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
            All Recipes
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.black,
              padding: 8,
              borderRadius: 999,
            }}
            onPress={handleAddRecipeOptions}
          >
            <Plus color="white" />
          </TouchableOpacity>
        </View>

        {/* search input */}
        <TextInput
          placeholder="Search your recipes"
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
              onPress={handleAddRecipeOptions}
            >
              <Text style={{ fontWeight: "bold" }}>Add your first recipe</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* recipes */}
        <View style={{ gap: 2 }}>
          {filteredRecipes.length > 0 &&
            filteredRecipes.map((recipe, index) => {
              return (
                <View style={{}} key={index}>
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
