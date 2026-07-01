import LoadingOverlay from "@/components/LoadingOverlay";
import RecipeCard from "@/components/RecipeCard";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getRecipesByBookId } from "@/services/recipes";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Book, ChevronLeft, Pencil, Plus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_HEIGHT = 200;
const STICKY_BAR_HEIGHT = 52;

export default function CookBook() {
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book as string) : null;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { session } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes", "book", book?.id, userId],
    // 2. Use the dedicated book service function we built
    queryFn: () => getRecipesByBookId(book?.id as string),
    // 3. Keep it disabled if we don't have the required parameters
    enabled: !!userId && !!book?.id,
    staleTime: 1000 * 60 * 5,
    // Note: We removed the select filter entirely since the backend now returns
    // exactly the recipes belonging to this book.
  });

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (recipes.length > 0) {
      const urls = recipes
        .map((r) => r.image_url)
        .filter((url): url is string => !!url);
      if (urls.length > 0) Image.prefetch(urls);
    }
  }, [recipes]);

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.4, HERO_HEIGHT * 0.75],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (isLoading) return <LoadingOverlay visible={true} mode="full" />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Sticky bar — fades in on scroll */}
      <Animated.View
        style={[
          styles.stickyBar,
          { paddingTop: insets.top, opacity: stickyOpacity },
        ]}
        pointerEvents="none"
      >
        <View style={styles.stickyInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.stickyIconBtn}
            pointerEvents="auto"
          >
            <ChevronLeft size={20} color={theme.colors.black} />
          </Pressable>
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {book?.title}
          </Text>
          <Pressable style={styles.stickyIconBtn} pointerEvents="auto">
            <Pencil size={16} color={theme.colors.black} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image — no overlay, no text inside */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          {book?.image_url ? (
            <Image
              source={{ uri: book.image_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={styles.heroIconWrap}>
              <Book size={48} color="white" opacity={0.3} />
            </View>
          )}

          {/* Solid pill buttons float over the image */}
          <View style={[styles.heroControls, { top: insets.top + 10 }]}>
            <Pressable style={styles.heroPill} onPress={() => router.back()}>
              <ChevronLeft size={32} color={theme.colors.black} />
            </Pressable>
            <Pressable style={styles.heroPill}>
              <Pencil size={24} color={theme.colors.black} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Title + recipe count + add button */}
        <View style={styles.heroText}>
          <View style={styles.heroTextRow}>
            <View>
              <Text style={styles.heroTitle}>{book?.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.addRecipeBtn}
              onPress={() =>
                router.push({
                  pathname: "/shared/newRecipe",
                  params: { bookId: book.id },
                })
              }
            >
              <Plus size={16} color={theme.colors.black} />
              <Text style={styles.addRecipeBtnText}>Add recipe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search recipes in this cookbook"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Empty state */}
        {recipes.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Book size={32} color={theme.colors.black} />
            </View>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Start building your collection of family recipes
            </Text>
          </View>
        )}

        {/* Recipe list */}
        {filteredRecipes.length > 0 && (
          <View style={styles.listWrap}>
            {filteredRecipes.map((recipe, index) => (
              <View key={index} style={styles.recipeRow}>
                <RecipeCard recipe={recipe} />
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sticky bar
  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: theme.colors.beige,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  stickyInner: {
    height: STICKY_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  stickyTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.black,
  },
  stickyIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: "#2c2c2c",
    overflow: "hidden",
  },
  heroControls: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  heroPill: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  // Title below hero
  heroText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.black,
  },
  heroSub: {
    fontSize: theme.typography.sizes.sm,
    color: "grey",
    marginTop: 2,
  },
  addRecipeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.grey,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addRecipeBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.black,
    fontWeight: "500",
  },

  // Search
  searchWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.grey,
    fontSize: theme.typography.sizes.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },

  // Empty state
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 999,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.black,
  },
  emptySubtitle: {
    color: "grey",
    textAlign: "center",
  },

  // Recipe list
  listWrap: {
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  recipeRow: {},
});
