import { theme } from "@/constants/theme";
import { useBooks } from "@/hooks/useBooks";
import { useRecipes } from "@/hooks/useRecipes";
import { Book } from "@/types/book";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Clock, Search, Utensils } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

export default function LibraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"cookbooks" | "recipes">(
    "cookbooks",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real database records
  const { data: recipes = [], isLoading: isLoadingRecipes } = useRecipes();
  const { data: books = [], isLoading: isLoadingBooks } = useBooks();

  // Sync tab switcher from route query params
  useEffect(() => {
    if (params.tab === "recipes") {
      setActiveTab("recipes");
    } else if (params.tab === "books") {
      setActiveTab("cookbooks");
    }
  }, [params.tab]);

  // Filter recipes and books by search term
  const filteredRecipes = recipes
    .filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort(
      (a, b) =>
        new Date(b.last_viewed_at).getTime() -
        new Date(a.last_viewed_at).getTime(),
    );

  const filteredBooks = books
    .filter((book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort(
      (a, b) =>
        new Date(b.last_viewed_at).getTime() -
        new Date(a.last_viewed_at).getTime(),
    );

  // Helper to chunk books into 2-column rows for grid rendering
  const bookRows = filteredBooks.reduce<Book[][]>((acc, curr, index) => {
    if (index % 2 === 0) {
      acc.push([curr]);
    } else {
      acc[acc.length - 1].push(curr);
    }
    return acc;
  }, []);

  // Helper to format prep time cleanly without duplicate units
  const formatPrepTime = (prepTime: string | number) => {
    const timeStr = String(prepTime).trim();
    if (timeStr.toLowerCase().includes("min")) {
      return `${timeStr} prep`;
    }
    return `${timeStr} min prep`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Spurtle</Text>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === "cookbooks"
                  ? "Search cookbooks..."
                  : "Search recipes..."
              }
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 3. Segmented Switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "cookbooks" && styles.activeSegmentTab,
            ]}
            onPress={() => setActiveTab("cookbooks")}
            activeOpacity={0.7}
          >
            <BookOpen
              size={16}
              color={activeTab === "cookbooks" ? "#111111" : "#8E8E93"}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "cookbooks" && styles.activeSegmentText,
              ]}
            >
              Cookbooks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "recipes" && styles.activeSegmentTab,
            ]}
            onPress={() => setActiveTab("recipes")}
            activeOpacity={0.7}
          >
            <Utensils
              size={16}
              color={activeTab === "recipes" ? "#111111" : "#8E8E93"}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "recipes" && styles.activeSegmentText,
              ]}
            >
              All Recipes
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Content Area */}
        {activeTab === "cookbooks" ? (
          <View style={styles.gridContent}>
            {isLoadingBooks ? (
              <ActivityIndicator
                size="large"
                color="#111111"
                style={{ marginTop: 20 }}
              />
            ) : filteredBooks.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#8E8E93", marginTop: 20 }}
              >
                {searchQuery
                  ? "No matching cookbooks found."
                  : "No cookbooks created yet."}
              </Text>
            ) : (
              bookRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((item) => {
                    const coverUrl =
                      item.cover_image_url ||
                      item.cover_image ||
                      item.image_url;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.cookbookCard}
                        activeOpacity={0.85}
                        onPress={() => {
                          router.push(`/book/${item.id}` as any);
                        }}
                      >
                        {coverUrl ? (
                          <Image
                            source={{ uri: coverUrl }}
                            style={styles.cookbookCover}
                            contentFit="fill"
                            transition={200}
                          />
                        ) : (
                          <View style={styles.cookbookPlaceholder}>
                            <BookOpen size={36} color="#8E8E93" />
                          </View>
                        )}

                        <View style={styles.cookbookDetails}>
                          <Text style={styles.cookbookTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.cookbookSubtext}>
                            {item.recipe_count ?? 0}{" "}
                            {(item.recipe_count ?? 0) === 1
                              ? "recipe"
                              : "recipes"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {row.length === 1 && (
                    <View style={{ width: CARD_WIDTH, height: 0 }} />
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.listContent}>
            {isLoadingRecipes ? (
              <ActivityIndicator
                size="large"
                color="#111111"
                style={{ marginTop: 20 }}
              />
            ) : filteredRecipes.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#8E8E93", marginTop: 20 }}
              >
                {searchQuery
                  ? "No matching recipes found."
                  : "No recipes created yet."}
              </Text>
            ) : (
              filteredRecipes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recipeCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    router.push(`/recipe/${item.id}` as any);
                  }}
                >
                  <View style={styles.imageContainer}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.recipeImage}
                        contentFit="cover"
                        transition={200}
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
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    position: "relative",
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerRow: {
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Pacifico_400Regular",
    fontSize: 28,
    paddingLeft: 2,
    color: theme.colors.text.primary,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 0.6,
    borderColor: "#dcdbdb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#EFEFF4",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeSegmentTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  activeSegmentText: {
    color: "#111111",
  },
  gridContent: {
    paddingHorizontal: 16,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cookbookCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 0.6,
    borderColor: "#dcdbdb",
  },
  cookbookCover: {
    flex: 1,
    width: "100%",
  },
  cookbookPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cookbookDetails: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cookbookTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 2,
  },
  cookbookSubtext: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    height: 88,
    alignItems: "stretch",
    borderWidth: 0.6,
    borderColor: "#dcdbdb",
  },
  imageContainer: {
    width: 88,
    height: 88,
  },
  recipeImage: {
    width: 88,
    height: 88,
  },
  recipePlaceholder: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
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
    color: theme.colors.black || "#111111",
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
});
