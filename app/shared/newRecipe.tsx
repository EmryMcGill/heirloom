import { theme } from "@/constants/theme";
import { RecipeRequest } from "@/models/recipe";
import { saveRecipe, uploadImage } from "@/services/recipes";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Image, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function NewRecipe() {
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [story, setStory] = React.useState("");
  const [prepTime, setPrepTime] = React.useState("");
  const [cookTime, setCookTime] = React.useState("");
  const [servings, setServings] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [coverImageUri, setCoverImageUri] =
    React.useState<ImagePicker.ImagePickerResult | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Single string per ingredient/step row
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

  const { bookId, recipe: encodedRecipe, isClone } = useLocalSearchParams();
  const recipe = React.useMemo(() => {
    if (!encodedRecipe) return null;
    try {
      return JSON.parse(decodeURIComponent(encodedRecipe as string));
    } catch {
      return null;
    }
  }, [encodedRecipe]);

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!recipe) return;

    setTitle(recipe.title ?? "");
    setDescription(recipe.description ?? "");
    setStory(recipe.story ?? "");
    setPrepTime(recipe.prep_time?.toString() ?? "");
    setCookTime(recipe.cook_time?.toString() ?? "");
    setServings(recipe.servings?.toString() ?? "");
    setNotes(recipe.notes ?? "");
    setExistingImageUrl(recipe.image_url ?? null);
    setCoverImageUri(null);

    // Cleaned up Ingredient Import
    const parsedIngredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((ing: unknown) => {
          if (typeof ing === "string") {
            try {
              const obj = JSON.parse(ing);
              if (obj && typeof obj === "object") {
                return `${obj.amount ?? ""} ${obj.what ?? ""}`.trim();
              }
              return ing;
            } catch {
              return ing;
            }
          } else if (ing && typeof ing === "object") {
            const obj = ing as Record<string, unknown>;
            return `${obj.amount ?? ""} ${obj.what ?? ""}`.trim();
          }
          return "";
        })
      : typeof recipe.ingredients === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(recipe.ingredients);
              if (Array.isArray(parsed)) {
                return parsed.map((ing) =>
                  typeof ing === "object" ? `${ing.amount} ${ing.what}` : ing,
                );
              }
              return [recipe.ingredients];
            } catch {
              return [recipe.ingredients];
            }
          })()
        : [""];

    setIngredients(
      parsedIngredients.filter(Boolean).length ? parsedIngredients : [""],
    );

    // Steps Parsing
    const parsedSteps = Array.isArray(recipe.steps)
      ? recipe.steps
      : typeof recipe.steps === "string"
        ? (() => {
            try {
              return JSON.parse(recipe.steps) as string[];
            } catch {
              return [recipe.steps];
            }
          })()
        : [""];
    setSteps(parsedSteps.length ? parsedSteps : [""]);
  }, [recipe]);

  const openPhotoSelector = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access your photo library.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setCoverImageUri(result);
    }
  };

  const updateIngredient = (index: number, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? value : ing)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const createRecipe = async () => {
    if (!title.trim()) {
      alert("Please enter a recipe title");
      return;
    }

    const validSteps = steps.map((step) => step.trim()).filter(Boolean);
    if (validSteps.length === 0) {
      alert("Please add at least one step.");
      return;
    }

    const validIngredients = ingredients
      .map((ing) => ing.trim())
      .filter(Boolean);
    if (validIngredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }

    setLoading(true);
    const imageUrl = coverImageUri
      ? await uploadImage(coverImageUri)
      : (existingImageUrl ?? "");

    // Resolve book mapping arrays safely
    let bookIds: number[] = [];

    if (isClone) {
      bookIds = bookId ? [parseInt(bookId as string)] : [];
    } else if (recipe) {
      // For existing recipes, read current mapped books array
      bookIds = Array.isArray(recipe.books)
        ? recipe.books.map((b: any) => b.id).filter(Boolean)
        : [];
    } else {
      // For brand new recipes, read entry context parameter
      bookIds = bookId ? [parseInt(bookId as string)] : [];
    }

    const recipeRequest = {
      id: isClone ? undefined : recipe?.id,
      title: title.trim(),
      description: description.trim(),
      story: story.trim(),
      prep_time: prepTime ? parseInt(prepTime) : 0,
      cook_time: cookTime ? parseInt(cookTime) : 0,
      servings: servings ? parseInt(servings) : 1,
      image_url: imageUrl,
      tags: JSON.stringify([]),
      notes: notes.trim(),
      ingredients: validIngredients,
      steps: validSteps,
      book_ids: bookIds,
    } as RecipeRequest & { id?: number; story: string };

    const res = await saveRecipe(recipeRequest);
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "recipes",
    });
    setLoading(false);

    if (res) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isClone
            ? "Make your version"
            : recipe
              ? "Edit Recipe"
              : "Create Recipe"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Cover photo block */}
        <Text style={styles.fieldLabel}>Cover Photo</Text>
        <TouchableOpacity style={styles.coverBox} onPress={openPhotoSelector}>
          {coverImageUri?.assets?.[0]?.uri ? (
            <Image
              source={{ uri: coverImageUri.assets[0].uri }}
              style={styles.coverImage}
            />
          ) : existingImageUrl ? (
            <Image
              source={{ uri: existingImageUrl }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Image size={28} color={theme.colors.text.secondary} />
              <Text style={styles.placeholderText}>Tap to upload photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title input box */}
        <Text style={styles.fieldLabel}>Recipe Title *</Text>
        <TextInput
          style={styles.boxInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Grandma's Chocolate Chip Cookies"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Description box */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          multiline
          style={[styles.boxInput, styles.textAreaInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="A brief overview or summary of the dish"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Story box */}
        <Text style={styles.fieldLabel}>Story</Text>
        <TextInput
          multiline
          style={[styles.boxInput, styles.textAreaInput]}
          value={story}
          onChangeText={setStory}
          placeholder="Share the history or family context of this recipe"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Balanced Grid for Numbers */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>Prep (min)</Text>
            <TextInput
              style={styles.boxInput}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="15"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>Cook (min)</Text>
            <TextInput
              style={styles.boxInput}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="30"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>Servings</Text>
            <TextInput
              style={styles.boxInput}
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Dynamic Ingredients lines */}
        <Text style={styles.fieldLabel}>Ingredients *</Text>
        <View style={styles.dynamicListContainer}>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.dynamicRow}>
              <TextInput
                style={[styles.boxInput, styles.dynamicInput]}
                placeholder="e.g., 2 cups flour"
                value={ingredient}
                onChangeText={(value) => updateIngredient(index, value)}
                placeholderTextColor={theme.colors.text.secondary}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity
                  style={styles.rowDeleteButton}
                  onPress={() => removeIngredient(index)}
                >
                  <X size={18} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setIngredients((prev) => [...prev, ""])}
            style={styles.appendListButton}
          >
            <Text style={styles.appendListButtonText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Step entries */}
        <Text style={styles.fieldLabel}>Steps *</Text>
        <View style={styles.dynamicListContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.dynamicRow}>
              <View style={styles.stepIndexMarker}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <TextInput
                multiline
                style={[
                  styles.boxInput,
                  styles.dynamicInput,
                  styles.stepInputFix,
                ]}
                placeholder="Describe this instruction phase"
                value={step}
                onChangeText={(value) => updateStep(index, value)}
                placeholderTextColor={theme.colors.text.secondary}
              />
              {steps.length > 1 && (
                <TouchableOpacity
                  style={styles.rowDeleteButton}
                  onPress={() => removeStep(index)}
                >
                  <X size={18} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setSteps((prev) => [...prev, ""])}
            style={styles.appendListButton}
          >
            <Text style={styles.appendListButtonText}>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* Notes block text box */}
        <Text style={styles.fieldLabel}>Notes / Tips</Text>
        <TextInput
          multiline
          style={[styles.boxInput, styles.textAreaInput, { marginBottom: 60 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add secondary tricks or serving temp ideas"
          placeholderTextColor={theme.colors.text.secondary}
        />
      </ScrollView>

      {/* Primary Sticky Action Drawer */}
      <View style={[styles.saveDrawer, { paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={createRecipe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>
              {recipe ? "Save Changes" : "Create Recipe"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.regular,
    fontWeight: "600",
    color: theme.colors.black,
  },
  scrollBody: { padding: 16, paddingBottom: 140 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.black,
    marginBottom: 8,
    marginTop: 12,
  },
  coverBox: {
    height: 180,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#c1c1c1",
  },
  coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholderContainer: { alignItems: "center", gap: 6 },
  placeholderText: { fontSize: 13, color: theme.colors.text.secondary },
  boxInput: {
    padding: 12,
    borderRadius: theme.borderRadius.md || 8,
    fontSize: 16,
    color: "#111",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#c1c1c1",
  },
  textAreaInput: { height: 80, textAlignVertical: "top" },

  metricsRow: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 8 },
  metricItem: { flex: 1 },
  dynamicListContainer: { gap: 8, marginBottom: 16 },
  dynamicRow: { flexDirection: "row", gap: 8, alignItems: "top" },
  dynamicInput: { flex: 1, marginBottom: 0 },
  stepInputFix: {}, // Left declared to prevent legacy style crashes if tied elsewhere
  rowDeleteButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: theme.colors.grey,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexMarker: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: theme.colors.black,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  stepIndexText: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  appendListButton: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
  },
  appendListButtonText: {
    fontWeight: "600",
    color: theme.colors.black,
    fontSize: 14,
  },
  saveDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey,
  },
  saveBtn: {
    backgroundColor: theme.colors.black,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
});
