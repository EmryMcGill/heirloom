import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { deleteBook, getBookWithRecipes, viewBook } from "@/services/books";
import { Book } from "@/types/book";
import { Recipe } from "@/types/recipe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpen,
  ChevronLeft,
  Clock,
  MoreHorizontal,
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

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    data: book,
    isLoading,
    isError,
    refetch,
  } = useQuery<Book>({
    queryKey: ["book-detail", id],
    queryFn: () => getBookWithRecipes(id as string),
    enabled: !!id,
  });
  const { session } = useAuth();
  const userId = session?.user?.id;

  const memberRole = book?.book_members?.find(
    (member) => member.user_id === userId,
  )?.role;

  const canManageBook = memberRole === "editor" || memberRole === "owner";

  useEffect(() => {
    viewBook(id);
    queryClient.invalidateQueries({ queryKey: ["books"] });
  }, []);

  const deleteBookMutation = useMutation({
    mutationFn: (bookId: string) => deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to delete cookbook.");
    },
  });

  const handleEditBook = () => {
    if (!book) return;
    router.push({
      pathname: "/book/new",
      params: { id: book.id },
    });
  };

  const handleManageRecipes = () => {
    if (!book) return;
    router.push({
      pathname: "/manage-book-recipes-modal",
      params: { bookId: book.id },
    } as any);
  };

  const handleDeleteBook = () => {
    if (!book) return;
    Alert.alert(
      "Delete Cookbook",
      `Are you sure you want to delete "${book.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBookMutation.mutate(book.id),
        },
      ],
    );
  };

  const handleOpenMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit Book", "Manage Recipes", "Delete Book"],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEditBook();
          } else if (buttonIndex === 2) {
            handleManageRecipes();
          } else if (buttonIndex === 3) {
            handleDeleteBook();
          }
        },
      );
    } else {
      Alert.alert("Cookbook Options", "Select an option", [
        { text: "Edit Book", onPress: handleEditBook },
        { text: "Manage Recipes", onPress: handleManageRecipes },
        {
          text: "Delete Book",
          style: "destructive",
          onPress: handleDeleteBook,
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const formatPrepTime = (prepTime: string | number) => {
    const timeStr = String(prepTime).trim();
    if (timeStr.toLowerCase().includes("min")) {
      return `${timeStr} prep`;
    }
    return `${timeStr} min prep`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  if (isError || !book) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load cookbook details.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recipes: Recipe[] = book.recipes || [];
  const coverUrl = book.cover_image_url || book.cover_image || book.image_url;
  const hasImage = !!coverUrl && coverUrl.trim() !== "";

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
                source={{ uri: coverUrl! }}
                style={styles.heroImage}
                contentFit="cover"
                onError={(e) =>
                  console.log("Book Cover Image Load Error:", e.error)
                }
              />
              <View style={styles.imageOverlay} />
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <BookOpen size={48} color="#8E8E93" />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{book.title}</Text>

          {book.owner?.full_name ? (
            <Text style={styles.ownerText}>Owner: {book.owner.full_name}</Text>
          ) : null}

          {book.description ? (
            <Text style={styles.description}>{book.description}</Text>
          ) : null}

          {/* Recipes Section */}
          <View style={styles.section}>
            {recipes.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recipes</Text>
              </View>
            )}

            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                >
                  <View style={styles.recipeImageContainer}>
                    {recipe.image_url ? (
                      <Image
                        source={{ uri: recipe.image_url }}
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
                      {recipe.title}
                    </Text>
                    <View style={styles.recipeMetaRow}>
                      {recipe.prep_time ? (
                        <View style={styles.timeBadge}>
                          <Clock size={12} color="#666666" />
                          <Text style={styles.timeText}>
                            {formatPrepTime(recipe.prep_time)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.recipeCookbook} numberOfLines={1}>
                          Recipe
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No recipes in this book yet. Add recipes from any recipe detail
                screen or via Manage Recipes.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.iconButton, { top: insets.top + 10, left: 16 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ChevronLeft size={24} color="#111111" />
      </TouchableOpacity>

      {/* 3-Dot Options Button */}
      {canManageBook && (
        <TouchableOpacity
          style={[styles.iconButton, { top: insets.top + 10, right: 16 }]}
          onPress={handleOpenMenu}
          activeOpacity={0.8}
        >
          <MoreHorizontal size={22} color="#111111" />
        </TouchableOpacity>
      )}
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
    minHeight: 600,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  ownerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  description: {
    fontSize: 15,
    color: "#8E8E93",
    lineHeight: 22,
    marginTop: 8,
  },
  section: {
    marginBottom: 28,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    overflow: "hidden",
    height: 88,
    marginBottom: 10,
    alignItems: "stretch",
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
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    fontStyle: "italic",
  },
});
