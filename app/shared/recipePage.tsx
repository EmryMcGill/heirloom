import Divider from "@/components/Divider";
import ScrollPage from "@/components/ScrollPage";
import { theme } from "@/constants/theme";
import { Comment } from "@/models/comments";
import { saveComment } from "@/services/comments";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import {
  Book,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function recipePage() {
  const params = useLocalSearchParams();
  const recipe = params.recipe ? JSON.parse(params.recipe as string) : null;
  const ingredients = React.useMemo(() => {
    if (!recipe?.ingredients) return [];

    let rawIngredients: unknown = recipe.ingredients;

    if (typeof rawIngredients === "string") {
      const trimmed = rawIngredients.trim();
      if (trimmed.startsWith("[")) {
        try {
          rawIngredients = JSON.parse(trimmed);
        } catch {
          rawIngredients = [trimmed];
        }
      } else {
        rawIngredients = [trimmed];
      }
    }

    if (!Array.isArray(rawIngredients)) {
      rawIngredients = [rawIngredients];
    }

    return rawIngredients
      .map((item) => {
        if (!item) return null;

        if (typeof item === "string") {
          const trimmed = item.trim();

          if (trimmed.startsWith("{")) {
            try {
              return JSON.parse(trimmed) as { amount?: string; what?: string };
            } catch {
              // ignore parse error and fallback to splitting
            }
          }

          const [amount, ...rest] = trimmed.split(" ");
          return {
            amount: amount || "",
            what: rest.join(" ").trim(),
          };
        }

        if (typeof item === "object") {
          return item as { amount?: string; what?: string };
        }

        return null;
      })
      .filter(
        (item): item is { amount: string; what: string } =>
          !!item && (item.amount?.trim() || item.what?.trim()),
      );
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

  const [showStory, setShowStory] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    const commentRequest = {
      body: newComment,
      recipe_id: recipe.id,
    };

    const res = await saveComment(commentRequest);

    setNewComment("");
    queryClient.invalidateQueries(["recipes", recipe.book.id]);

    if (res) {
      recipe.comments.push(res);
    }
  };

  return (
    <ScrollPage>
      {/* banner image */}
      <Image style={styles.bannerImage} source={{ uri: recipe.image_url }} />

      <View
        style={{
          marginHorizontal: 12,
          marginTop: 24,
        }}
      >
        {/* title */}
        <Text>By {recipe.owner.full_name}</Text>
        <Text style={theme.title}>{recipe.title}</Text>
        <Text>{recipe.description}</Text>

        <View
          style={{
            marginTop: theme.spacing.md,
            gap: 8,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {/* time */}
          <View style={styles.tag}>
            <Clock size={theme.typography.sizes.sm} color="black" />
            <Text style={{ fontSize: theme.typography.sizes.sm }}>
              {recipe.prep_time + recipe.cook_time + " min"}
            </Text>
          </View>
          {/* servings */}
          <View style={styles.tag}>
            <Users size={theme.typography.sizes.sm} color="black" />
            <Text style={{ fontSize: theme.typography.sizes.sm }}>
              {recipe.servings + " servings"}
            </Text>
          </View>
          {/* book */}
          <View style={styles.tag}>
            <Book size={theme.typography.sizes.sm} color="black" />
            <Text style={{ fontSize: theme.typography.sizes.sm }}>
              {recipe.book.title}
            </Text>
          </View>
        </View>

        <Divider />

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.grey,
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              flexShrink: 1, // 👈 important
            }}
          >
            <Edit2 size={16} />
            <Text
              numberOfLines={1} // 👈 important
              adjustsFontSizeToFit
              style={{
                fontWeight: theme.typography.fontWeights.semibold,
                flexShrink: 1, // 👈 important
              }}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              borderWidth: 1,
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              flexShrink: 1,
            }}
          >
            <Edit2 size={16} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontWeight: theme.typography.fontWeights.semibold,
                flexShrink: 1,
              }}
            >
              Make your version
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              borderColor: theme.colors.red,
              borderWidth: 1,
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              flexShrink: 1,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontWeight: theme.typography.fontWeights.semibold,
                flexShrink: 1,
                color: theme.colors.red,
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>

        {/* story dropdown */}
        <View>
          <Pressable
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
            }}
            onPress={() => setShowStory(!showStory)}
          >
            <Text style={{ fontWeight: theme.typography.fontWeights.bold }}>
              The story behind this recipe
            </Text>
            {showStory ? <ChevronUp /> : <ChevronDown />}
          </Pressable>
          {showStory && (
            <View
              style={{
                borderWidth: 1,
                borderRadius: theme.borderRadius.lg,
                borderColor: theme.colors.grey,
                padding: 8,
                marginTop: 8,
              }}
            >
              <Text>{recipe.story}</Text>
            </View>
          )}
        </View>

        <Divider />

        {/* ingredients */}
        <Text
          style={{
            fontWeight: theme.typography.fontWeights.semibold,
            fontSize: theme.typography.sizes.md,
          }}
        >
          Ingredients
        </Text>

        <View
          style={{
            marginTop: 12,
            gap: 12,
          }}
        >
          {ingredients.map((ingredient, index) => (
            <View
              key={index}
              style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: theme.colors.grey,
                  borderRadius: 50,
                }}
              />
              <Text
                style={{ fontSize: theme.typography.sizes.md, flexShrink: 1 }}
              >
                <Text style={{ fontWeight: theme.typography.fontWeights.bold }}>
                  {ingredient.amount}
                </Text>
                {ingredient.what ? ` ${ingredient.what}` : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* steps */}
        <Text
          style={{
            fontWeight: theme.typography.fontWeights.semibold,
            fontSize: theme.typography.sizes.md,
            marginTop: 24,
          }}
        >
          Steps
        </Text>

        <View
          style={{
            marginTop: 12,
            gap: 12,
          }}
        >
          {steps.map((step, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                gap: 12,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.grey,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: theme.typography.sizes.md }}>
                  {index + 1}
                </Text>
              </View>
              <Text
                style={{
                  flexShrink: 1,
                  fontSize: theme.typography.sizes.md,
                  paddingTop: 10,
                }}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* comment section */}
        <View>
          <Text
            style={{
              fontWeight: theme.typography.fontWeights.semibold,
              fontSize: theme.typography.sizes.sm,
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            Comments
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <TextInput
              placeholder="Write a comment"
              style={{
                backgroundColor: theme.colors.grey,
                fontSize: theme.typography.sizes.sm,
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.lg,
                flex: 1,
              }}
              value={newComment}
              onChangeText={setNewComment}
            />

            <TouchableOpacity
              style={{
                height: "100%",
                backgroundColor: theme.colors.grey,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
                flexShrink: 1,
              }}
              onPress={handlePostComment}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontWeight: theme.typography.fontWeights.semibold,
                  flexShrink: 1,
                }}
              >
                Post
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8 }}>
            {recipe.comments?.length === 0 && <Text>No comments</Text>}
            {recipe.comments?.map((comment: Comment, index) => (
              <View
                key={index}
                style={{
                  borderWidth: 1,
                  borderRadius: theme.borderRadius.xl,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: theme.typography.fontWeights.semibold,
                    }}
                  >
                    {comment.user_name.full_name}
                  </Text>
                </View>
                <Text style={{ fontSize: theme.typography.sizes.sm }}>
                  {comment.body}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    color: "grey",
                    marginTop: 8,
                  }}
                >
                  {new Date(recipe.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  bannerImage: {
    width: "100%",
    height: 200,
    backgroundColor: theme.colors.grey,
  },
  tag: {
    gap: 8,
    borderRadius: theme.borderRadius.round,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
    flexDirection: "row",
    padding: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: "flex-start",
  },
});
