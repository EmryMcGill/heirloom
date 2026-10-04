import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { deleteRecipe, getRecipeById, viewRecipe } from "@/services/recipes";
import { Recipe } from "@/types/recipe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Flame,
  MoreHorizontal,
  Users,
  Utensils,
} from "lucide-react-native";
import { useEffect } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    data: recipe,
    isLoading,
    isError,
  } = useQuery<Recipe | null>({
    queryKey: ["recipe", id],
    queryFn: () => getRecipeById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    viewRecipe(id);
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
  }, []);

  const handleEdit = () => {
    if (!recipe) return;
    router.push({
      pathname: "/recipe/new",
      params: { recipeId: recipe.id },
    });
  };

  const handleAddToBook = () => {
    if (!recipe) return;
    router.push({
      pathname: "/add-to-book-modal",
      params: { recipeId: recipe.id },
    } as any);
  };

  const { session } = useAuth();
  const userId = session?.user?.id;

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      // Invalidate queries so lists update automatically
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book-detail"] });

      // Navigate back after successful deletion
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to delete recipe.");
    },
  });

  const handleDelete = () => {
    if (!recipe) return;

    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRecipeMutation.mutate(recipe.id),
        },
      ],
    );
  };

  const handleOpenMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Edit Recipe",
            "Add Recipe to Book",
            "Delete Recipe",
          ],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEdit();
          } else if (buttonIndex === 2) {
            handleAddToBook();
          } else if (buttonIndex === 3) {
            handleDelete();
          }
        },
      );
    } else {
      // Android fallback options menu
      Alert.alert("Recipe Options", "Select an option", [
        { text: "Edit Recipe", onPress: handleEdit },
        { text: "Add Recipe to Book", onPress: handleAddToBook },
        { text: "Delete Recipe", style: "destructive", onPress: handleDelete },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  if (isError || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load recipe.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImage = !!recipe.image_url && recipe.image_url.trim() !== "";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        style={{ flex: 1 }}
      >
        {/* Cover image (scrolls with the page) */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <>
              <Image
                source={{ uri: recipe.image_url! }}
                style={styles.heroImage}
                contentFit="cover"
                onError={(e) =>
                  console.log("Recipe Image Load Error:", e.error)
                }
              />
              <View style={styles.imageOverlay} />
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Utensils size={48} color="#8E8E93" />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{recipe.title}</Text>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          {/* Subtle Meta Info Bar */}
          <View style={styles.metaRow}>
            {recipe.prep_time ? (
              <View style={styles.metaChip}>
                <Clock size={14} color="#666666" />
                <Text style={styles.metaText}>{recipe.prep_time} prep</Text>
              </View>
            ) : null}

            {recipe.cook_time ? (
              <View style={styles.metaChip}>
                <Flame size={14} color="#666666" />
                <Text style={styles.metaText}>{recipe.cook_time} cook</Text>
              </View>
            ) : null}

            {recipe.servings ? (
              <View style={styles.metaChip}>
                <Users size={14} color="#666666" />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            ) : null}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>

            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((item, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.ingredientText}>
                    {typeof item === "string"
                      ? item
                      : `${item.amount ?? ""} ${item.unit ?? ""} ${item.name}`.trim()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No ingredients listed.</Text>
            )}
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>

            {recipe.instructions && recipe.instructions.length > 0 ? (
              recipe.instructions.map((step, index) => {
                const stepText = typeof step === "string" ? step : step.text;
                const stepNumber =
                  typeof step === "object" && step.stepNumber
                    ? step.stepNumber
                    : index + 1;

                return (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{stepNumber}</Text>
                    </View>
                    <Text style={styles.stepText}>{stepText}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No instructions listed.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <TouchableOpacity
        style={[styles.iconButton, { top: insets.top + 10, left: 16 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ChevronLeft size={24} color="#111111" />
      </TouchableOpacity>

      {/* 3-Dot Options Button */}
      <TouchableOpacity
        style={[styles.iconButton, { top: insets.top + 10, right: 16 }]}
        onPress={handleOpenMenu}
        activeOpacity={0.8}
      >
        <MoreHorizontal size={22} color="#111111" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: theme.colors.bg,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  imageContainer: {
    height: 300,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  iconButton: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  contentContainer: {
    padding: 20,
    marginTop: -28,
    backgroundColor: theme.colors.bg,
    // borderTopLeftRadius: 28,
    // borderTopRightRadius: 28,
    minHeight: 600,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#8E8E93",
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 14,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondary,
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 15,
    color: "#111",
    flex: 1,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    fontStyle: "italic",
  },
});
