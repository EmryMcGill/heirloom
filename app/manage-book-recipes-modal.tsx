import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBookWithRecipes, updateBookRecipes } from "@/services/books";
import { getAccessibleRecipes } from "@/services/recipes";
import { Book } from "@/types/book";
import { Recipe } from "@/types/recipe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Clock, Utensils, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatPrepTime = (prepTime: string | number) => {
  const timeStr = String(prepTime).trim();
  if (timeStr.toLowerCase().includes("min")) {
    return `${timeStr} prep`;
  }
  return `${timeStr} min prep`;
};

const viewedTime = (recipe: Recipe) =>
  recipe.last_viewed_at ? new Date(recipe.last_viewed_at).getTime() : 0;

export default function ManageBookRecipesModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { bookId } = useLocalSearchParams<{ bookId: string }>();

  // IDs of recipes currently checked
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  // IDs that were in the book when the modal opened (drives ordering + change detection)
  const [initialRecipeIds, setInitialRecipeIds] = useState<string[] | null>(
    null,
  );

  const {
    data: book,
    isLoading: isLoadingBook,
    isError: isBookError,
  } = useQuery<Book>({
    queryKey: ["book-detail", bookId],
    queryFn: () => getBookWithRecipes(bookId as string),
    enabled: !!bookId,
  });

  // Every recipe the user created or can see through a shared book
  const {
    data: accessibleRecipes = [],
    isLoading: isLoadingRecipes,
    isError: isRecipesError,
  } = useQuery<Recipe[]>({
    queryKey: ["accessible-recipes", userId],
    queryFn: () => getAccessibleRecipes(userId as string),
    enabled: !!userId,
  });

  // Initialise once, so a background refetch never wipes the user's edits
  useEffect(() => {
    if (book && initialRecipeIds === null) {
      const ids = (book.recipes ?? []).map((r) => r.id);
      setInitialRecipeIds(ids);
      setSelectedRecipeIds(ids);
    }
  }, [book, initialRecipeIds]);

  // Recipes in the book first, then everything else (most recently viewed first)
  const sections = useMemo(() => {
    if (initialRecipeIds === null) return [];

    const byId = new Map<string, Recipe>();
    accessibleRecipes.forEach((r) => byId.set(r.id, r));
    // Make sure the book's own recipes are always listed
    (book?.recipes ?? []).forEach((r) => {
      if (!byId.has(r.id)) byId.set(r.id, r);
    });

    const initial = new Set(initialRecipeIds);
    const all = Array.from(byId.values());

    const inBook = all
      .filter((r) => initial.has(r.id))
      .sort((a, b) => a.title.localeCompare(b.title));
    const others = all
      .filter((r) => !initial.has(r.id))
      .sort((a, b) => viewedTime(b) - viewedTime(a));

    return [
      { title: "IN THIS BOOK", data: inBook },
      { title: "OTHER RECIPES", data: others },
    ].filter((section) => section.data.length > 0);
  }, [accessibleRecipes, book, initialRecipeIds]);

  const hasChanges = useMemo(() => {
    if (initialRecipeIds === null) return false;
    if (initialRecipeIds.length !== selectedRecipeIds.length) return true;
    const initial = new Set(initialRecipeIds);
    return selectedRecipeIds.some((id) => !initial.has(id));
  }, [initialRecipeIds, selectedRecipeIds]);

  const updateMutation = useMutation({
    mutationFn: (recipeIds: string[]) =>
      updateBookRecipes(bookId as string, recipeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-detail", bookId] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to update book recipes.");
    },
  });

  const toggleRecipe = (recipeId: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId],
    );
  };

  const handleSave = () => {
    if (!bookId) return;
    updateMutation.mutate(selectedRecipeIds);
  };

  const isLoading = isLoadingBook || isLoadingRecipes;
  const isError = isBookError || isRecipesError || !book;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading || (!isError && initialRecipeIds === null) ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator
            size="large"
            color={theme.colors.black || "#111111"}
          />
        </View>
      ) : isError ? (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>Failed to load recipes.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.listContent, { paddingTop: 56 + 16 }]}
          ListHeaderComponent={
            <Text style={styles.helperText}>
              Check the recipes you want in {book?.title ?? "this cookbook"} and
              uncheck any you want to remove.
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.fieldLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const isSelected = selectedRecipeIds.includes(item.id);

            return (
              <TouchableOpacity
                style={styles.recipeCard}
                activeOpacity={0.8}
                onPress={() => toggleRecipe(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.recipeImageContainer}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.recipeImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.recipePlaceholder}>
                      <Utensils size={22} color="#8E8E93" />
                    </View>
                  )}
                </View>

                <View style={styles.recipeInfo}>
                  <Text
                    style={styles.recipeTitle}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  <View style={styles.recipeMetaRow}>
                    {item.prep_time ? (
                      <View style={styles.timeBadge}>
                        <Clock size={12} color="#666666" />
                        <Text style={styles.timeText}>
                          {formatPrepTime(item.prep_time)}
                        </Text>
                      </View>
                    ) : item.servings ? (
                      <Text style={styles.recipeCookbook} numberOfLines={1}>
                        {item.servings} servings
                      </Text>
                    ) : (
                      <Text style={styles.recipeCookbook} numberOfLines={1}>
                        Recipe
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptySubtext}>
                Create or import a recipe and it will show up here.
              </Text>
            </View>
          }
        />
      )}

      {/* Custom blurred header */}
      <BlurView intensity={20} style={[styles.header]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={theme.colors.black || "#111111"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Recipes</Text>
          <View style={styles.closeButton} />
        </View>
      </BlurView>

      {/* Floating Action Bar Drawer */}
      <BlurView
        intensity={20}
        style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (updateMutation.isPending || !hasChanges) && styles.disabledBtn,
          ]}
          onPress={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 8,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.black || "#111111",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
    color: "#8E8E93",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  helperText: {
    fontSize: 13,
    color: "#8E8E93",
    lineHeight: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  recipeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    overflow: "hidden",
    height: 88,
    marginBottom: 10,
    paddingRight: 14,
  },
  recipeImageContainer: {
    width: 88,
    height: 88,
  },
  recipeImage: {
    width: 88,
    height: 88,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  recipePlaceholder: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  recipeInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  recipeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 18,
  },
  recipeCookbook: {
    fontSize: 12,
    color: "#8E8E93",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#666666",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#8E8E93",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },
  saveDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
