import Divider from "@/components/Divider";
import { theme } from "@/constants/theme";
import { Comment } from "@/models/comments";
import { saveComment } from "@/services/comments";
import { deleteRecipe } from "@/services/recipes";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Book,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  MoreHorizontal,
  Users,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_HEIGHT = 220;
const STICKY_BAR_HEIGHT = 56;

export default function RecipePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const parsedRecipe = params.recipe
    ? JSON.parse(params.recipe as string)
    : null;
  const [recipe, setRecipe] = useState(parsedRecipe);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [newComment, setNewComment] = useState("");

  const scrollViewRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [commentSectionY, setCommentSectionY] = useState(0);

  const getDisplayName = (value: unknown) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "full_name" in value) {
      const fullName = (value as { full_name?: unknown }).full_name;
      if (typeof fullName === "string") return fullName;
    }
    return "Unknown";
  };

  const handleDeleteRecipe = () => {
    if (!recipe?.id) return;
    Alert.alert(
      "Delete recipe",
      "Are you sure you want to permanently delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteRecipe(recipe.id);
              await queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === "recipes",
              });
              router.back();
            } catch (error) {
              console.error("Failed to delete recipe:", error);
              Alert.alert("Delete failed", "Could not delete this recipe.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const showRecipeMenu = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Cancel",
          "Edit Recipe",
          "Make your version",
          "Delete Recipe",
        ],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 0,
        title: "Recipe Options",
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          router.push({
            pathname: "/shared/newRecipe",
            params: { recipe: encodeURIComponent(JSON.stringify(recipe)) },
          });
        } else if (buttonIndex === 2) {
          router.push({
            pathname: "/shared/newRecipe",
            params: {
              recipe: encodeURIComponent(JSON.stringify(recipe)),
              isClone: "true",
            },
          });
        } else if (buttonIndex === 3) {
          handleDeleteRecipe();
        }
      },
    );
  };

  // Evaluates ingredients to raw text line-breaks safely
  const ingredientsText = React.useMemo(() => {
    if (!recipe?.ingredients) return "";
    const raw = recipe.ingredients;

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.join("\n");
        } catch {}
      }
      return raw;
    }

    if (Array.isArray(raw)) {
      return raw.join("\n");
    }

    return String(raw);
  }, [recipe?.ingredients]);

  const steps = React.useMemo(() => {
    if (!recipe?.steps) return [];
    if (Array.isArray(recipe.steps)) return recipe.steps;
    if (typeof recipe.steps === "string") {
      try {
        return JSON.parse(recipe.steps) as string[];
      } catch {
        return [recipe.steps];
      }
    }
    return [];
  }, [recipe?.steps]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !recipe?.id) return;
    const commentRequest = { body: newComment, recipe_id: recipe.id };
    const res = await saveComment(commentRequest);
    setNewComment("");
    setRecipe((currentRecipe: any) =>
      currentRecipe
        ? {
            ...currentRecipe,
            comments: [res, ...(currentRecipe.comments ?? [])],
          }
        : currentRecipe,
    );
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "recipes",
    });
    Keyboard.dismiss();
  };

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

  return (
    <View style={styles.container}>
      {/* Sticky bar — fades in smoothly on scroll */}
      <Animated.View
        style={[
          styles.stickyBar,
          { paddingTop: insets.top, opacity: stickyOpacity },
        ]}
        pointerEvents="none"
      >
        <View style={styles.stickyInner}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.navCircleBtn}
            pointerEvents="auto"
          >
            <ChevronLeft size={22} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {recipe?.title}
          </Text>
          <TouchableOpacity
            onPress={showRecipeMenu}
            style={styles.navCircleBtn}
            pointerEvents="auto"
          >
            <MoreHorizontal size={20} color={theme.colors.black} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Layer — fades out cleanly on scroll */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          {recipe?.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroFallbackWrap}>
              <Book size={44} color="#a0a0a0" />
            </View>
          )}
          <View style={[styles.heroControls, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={theme.colors.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={showRecipeMenu}
            >
              <MoreHorizontal size={22} color={theme.colors.black} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content Body Container */}
        <View style={styles.mainContentBlock}>
          <Text style={styles.authorTag}>
            By {getDisplayName(recipe?.owner?.full_name)}
          </Text>
          <Text style={styles.recipeTitle}>{recipe?.title}</Text>
          {recipe.description ?? (
            <Text style={styles.recipeDescription}>{recipe?.description}</Text>
          )}

          {/* Clean Pill Metadata Tags */}
          <View style={styles.tagWrapper}>
            <View style={styles.tag}>
              <Clock size={14} color="#555" />
              <Text style={styles.tagText}>
                {(recipe?.prep_time ?? 0) + (recipe?.cook_time ?? 0) + " min"}
              </Text>
            </View>
            <View style={styles.tag}>
              <Users size={14} color="#555" />
              <Text style={styles.tagText}>
                {recipe?.servings + " servings"}
              </Text>
            </View>
            {recipe?.book?.title && (
              <View style={styles.tag}>
                <Book size={14} color="#555" />
                <Text style={styles.tagText}>{recipe?.book?.title}</Text>
              </View>
            )}
          </View>

          {/* Collapsible Recipe Narrative */}
          {recipe?.story && (
            <>
              <View style={styles.storySection}>
                <Pressable
                  style={styles.dropdownHeader}
                  onPress={() => setShowStory(!showStory)}
                >
                  <Text style={styles.dropdownHeaderText}>
                    The story behind this recipe
                  </Text>
                  {showStory ? (
                    <ChevronUp size={20} color="#333" />
                  ) : (
                    <ChevronDown size={20} color="#333" />
                  )}
                </Pressable>
                {showStory && (
                  <View style={styles.storyBox}>
                    <Text style={styles.storyText}>{recipe?.story}</Text>
                  </View>
                )}
              </View>
              <Divider />
            </>
          )}

          {/* Ingredients Displayed Line-by-Line with Bullets */}
          <Text style={styles.sectionHeader}>Ingredients</Text>
          <View style={styles.ingredientsContainer}>
            {ingredientsText ? (
              ingredientsText.split("\n").map((line: string, index: number) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                return (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.ingredientsText}>{trimmedLine}</Text>
                  </View>
                );
              })
            ) : (
              <Text
                style={[
                  styles.ingredientsText,
                  { fontStyle: "italic", color: "#888" },
                ]}
              >
                No ingredients specified.
              </Text>
            )}
          </View>

          {/* Structured Preparation Steps */}
          <Text style={styles.sectionHeader}>Steps</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step: string, index: number) => (
              <View key={index} style={styles.stepBlock}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepInstructionText}>{step}</Text>
              </View>
            ))}
          </View>

          <Divider />

          {/* Feed & Community Interactions */}
          <View
            style={styles.commentsSection}
            onLayout={(e) => setCommentSectionY(e.nativeEvent.layout.y)}
          >
            <Text style={[styles.sectionHeader, { marginBottom: 12 }]}>
              Comments
            </Text>
            <View style={styles.commentInputRow}>
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor="#888"
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                      y: commentSectionY - 12,
                      animated: true,
                    });
                  }, 150);
                }}
              />
              <TouchableOpacity
                style={styles.commentSubmitBtn}
                onPress={handlePostComment}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.commentsContainer}>
              {recipe?.comments?.length === 0 && (
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first!
                </Text>
              )}
              {recipe?.comments?.map((comment: Comment, index: number) => (
                <View key={index} style={styles.commentCard}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.commentAuthor}>
                      {getDisplayName(comment.user_name)}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(recipe.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.commentBodyText}>{comment.body}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingTop: 0,
  },
  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: theme.colors.beige || "#fbfbf9",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e0",
  },
  stickyInner: {
    height: STICKY_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  stickyTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    color: theme.colors.black,
    paddingHorizontal: 8,
  },
  navCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: "#f4f4f2",
    overflow: "hidden",
  },
  heroFallbackWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heroControls: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  mainContentBlock: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  authorTag: {
    fontSize: 13,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    lineHeight: 34,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 16,
  },
  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f4f4f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
  },
  storySection: {
    marginVertical: 4,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  storyBox: {
    backgroundColor: "#fafaf9",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#f0f0ed",
  },
  storyText: {
    fontSize: 14,
    color: "#4a4a46",
    lineHeight: 21,
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginTop: 12,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingRight: 16,
    borderBottomWidth: 1,
    paddingBottom: 4,
    borderBottomColor: "#dedede",
  },
  bulletPoint: {
    fontSize: 24,
    color: "#111",
    marginRight: 4,
    lineHeight: 24,
  },
  ingredientsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 4,
    marginBottom: 8,
  },
  ingredientsText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
    flex: 1,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 8,
  },
  stepBlock: {
    flexDirection: "row",
    gap: 14,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  stepInstructionText: {
    paddingTop: 5,
    flex: 1,
    fontSize: 15,
    color: "#333",
    lineHeight: 23,
  },
  commentsSection: {
    marginTop: 8,
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: "#f5f5f5",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 10,
    flex: 1,
    maxHeight: 100,
  },
  commentSubmitBtn: {
    backgroundColor: "#111",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  commentsContainer: {
    gap: 12,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  commentCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  commentBodyText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
});
