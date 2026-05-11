import { theme } from "@/constants/theme";
import { RecipeRequest } from "@/models/recipe";
import { saveRecipe, uploadImage } from "@/services/recipes";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

type Ingredient = {
  amount: string;
  what: string;
};

export default function NewRecipe() {
  const [allTags, setAllTags] = React.useState<string[]>([
    "Breakfast",
    "Lunch",
    "Dinner",
    "Dessert",
    "Vegan",
    "Gluten-Free",
    "Quick",
    "Healthy",
  ]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
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
  const [ingredients, setIngredients] = useState([{ amount: "", what: "" }]);
  const [steps, setSteps] = useState<string[]>([""]);

  const { bookId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const tagInputRef = useRef<Text | null>(null);
  const queryClient = useQueryClient();

  const filteredTags = React.useMemo(
    () =>
      allTags.filter(
        (tag) =>
          !selectedTags.includes(tag) &&
          tag.toLowerCase().includes(tagInput.toLowerCase()),
      ),
    [allTags, selectedTags, tagInput],
  );

  const handleOpenTags = () => {
    setDropdownOpen(true);

    tagInputRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({
          y: y - 10,
          animated: true,
        });
      },
      (error) => console.log(error),
    );
  };

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

  const addTag = (tag: string) => {
    const normalized = tag.trim();
    if (!normalized) return;

    if (!selectedTags.includes(normalized)) {
      setSelectedTags((prev) => [...prev, normalized]);
    }

    if (!allTags.includes(normalized)) {
      setAllTags((prev) => [...prev, normalized]);
    }

    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient,
      ),
    );
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
    // Basic validation
    if (!title.trim()) {
      alert("Please enter a recipe title");
      return;
    }

    const validSteps = steps.map((step) => step.trim()).filter(Boolean);
    if (validSteps.length === 0) {
      alert("Please add at least one step.");
      return;
    }

    const trimmedIngredients = ingredients.map((ingredient) => ({
      amount: ingredient.amount.trim(),
      what: ingredient.what.trim(),
    }));

    const hasInvalidIngredient = trimmedIngredients.some(
      (ingredient) =>
        (ingredient.amount && !ingredient.what) ||
        (!ingredient.amount && ingredient.what),
    );

    const validIngredients = trimmedIngredients.filter(
      (ingredient) => ingredient.amount && ingredient.what,
    );

    if (hasInvalidIngredient) {
      alert("Each ingredient must include both an amount and a name.");
      return;
    }

    if (validIngredients.length === 0) {
      alert("Please add at least one ingredient with both amount and name.");
      return;
    }

    setLoading(true);
    const imageUrl = coverImageUri ? await uploadImage(coverImageUri) : null;

    const recipe = {
      title: title.trim(),
      description: description.trim(),
      prep_time: prepTime ? parseInt(prepTime) : 0,
      cook_time: cookTime ? parseInt(cookTime) : 0,
      servings: servings ? parseInt(servings) : 1,
      image_url: imageUrl,
      tags: JSON.stringify(selectedTags),
      notes: notes.trim(),
      ingredients: validIngredients.map((ingredient) =>
        JSON.stringify(ingredient),
      ),
      steps: validSteps,
      book_id: parseInt(bookId as string),
    } as RecipeRequest;

    console.log(recipe);

    const res = await saveRecipe(recipe);

    queryClient.invalidateQueries(["recipes", bookId]);

    setLoading(false);

    if (res) {
      router.back();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <SafeAreaView edges={["top"]} />
      <ScrollView
        contentContainerStyle={styles.card}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        ref={scrollViewRef}
      >
        <Text
          style={[
            theme.title,
            { fontSize: theme.typography.sizes.xl, marginBottom: 12 },
          ]}
        >
          Create Recipe
        </Text>

        {/* cover photo */}
        <Text style={styles.label}>Cover Photo</Text>
        <TouchableOpacity style={styles.coverPhoto} onPress={openPhotoSelector}>
          {coverImageUri ? (
            <Image
              source={{ uri: coverImageUri.assets[0].uri }}
              style={styles.coverPhotoImage}
            />
          ) : (
            <Plus size={32} color={theme.colors.text.secondary} />
          )}
        </TouchableOpacity>

        {/* title */}
        <Text style={styles.label}>Recipe Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Grandmas cookies"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          multiline
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Write a short description for your dish"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Story Description */}
        <Text style={styles.label}>Story</Text>
        <TextInput
          multiline
          style={[styles.input, { height: 80 }]}
          value={story}
          onChangeText={setStory}
          placeholder="Write a story or background about the recipe"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* times */}
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="30"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Cook (min)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="30"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* servings */}
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ingredients */}
        <Text style={styles.label} ref={tagInputRef}>
          Ingredients *
        </Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                placeholder="2 cups"
                value={ingredient.amount}
                onChangeText={(value) =>
                  updateIngredient(index, "amount", value)
                }
                placeholderTextColor={theme.colors.text.secondary}
              />
              <TextInput
                style={[styles.input, styles.ingredientInput, { flex: 2 }]}
                placeholder="Ingredient"
                value={ingredient.what}
                onChangeText={(value) => updateIngredient(index, "what", value)}
                placeholderTextColor={theme.colors.text.secondary}
              />
              {index !== 0 && (
                <TouchableOpacity
                  style={styles.removeIngredientButton}
                  onPress={() => removeIngredient(index)}
                >
                  <Text style={styles.removeIngredientText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() =>
              setIngredients((prev) => [...prev, { what: "", amount: "" }])
            }
            style={styles.addIngredientButton}
          >
            <Text>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* steps */}
        <Text style={styles.label}>Steps *</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <TextInput
                style={[styles.input, styles.stepInput]}
                placeholder={`Step ${index + 1}`}
                value={step}
                onChangeText={(value) => updateStep(index, value)}
                placeholderTextColor={theme.colors.text.secondary}
              />
              {index !== 0 && (
                <TouchableOpacity
                  style={styles.removeIngredientButton}
                  onPress={() => removeStep(index)}
                >
                  <Text style={styles.removeIngredientText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setSteps((prev) => [...prev, ""])}
            style={styles.addIngredientButton}
          >
            <Text>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* tags */}
        <Text style={styles.label} ref={tagInputRef}>
          Tags / categories
        </Text>
        <View style={styles.selectedTagContainer}>
          {selectedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.selectedTag}
              onPress={() => removeTag(tag)}
            >
              <Text style={styles.selectedTagText}>{tag} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={(value) => {
              setTagInput(value);
              setDropdownOpen(true);
            }}
            placeholder="Type to filter tags..."
            placeholderTextColor={theme.colors.text.secondary}
            onFocus={() => handleOpenTags()}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 100)}
            onSubmitEditing={() => addTag(tagInput)}
          />
        </View>

        {dropdownOpen && (
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.dropdownItem}
                    onPress={() => addTag(tag)}
                  >
                    <Text style={styles.dropdownItemText}>{tag}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => addTag(tagInput.trim())}
                >
                  <Text
                    style={styles.dropdownItemText}
                  >{`Add "${tagInput}"`}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* notes */}
        <Text style={[styles.label, { marginTop: 16 }]}>Notes / Tips</Text>
        <TextInput
          multiline
          style={[styles.input, { height: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Write your notes here"
          placeholderTextColor={theme.colors.text.secondary}
        />
      </ScrollView>
      {/* create button */}
      <View style={[styles.createContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.createButton} onPress={createRecipe}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.createButtonText}>Create Recipe</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: "white",
    paddingBottom: 200,
  },
  coverPhoto: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: theme.colors.text.secondary,
    backgroundColor: theme.colors.grey,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  coverPhotoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  label: {
    fontWeight: theme.typography.fontWeights.semibold as
      | "100"
      | "200"
      | "300"
      | "400"
      | "500"
      | "600"
      | "700"
      | "800"
      | "900"
      | "normal"
      | "bold",
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: theme.colors.grey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // borderColor: theme.colors.text.secondary,
    // borderWidth: 1,
    borderRadius: theme.borderRadius.round,
  },
  selectedTagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedTag: {
    backgroundColor: theme.colors.grey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: theme.borderRadius.round,
  },
  selectedTagText: {
    fontSize: theme.typography.sizes.sm,
  },
  tagInput: {
    backgroundColor: theme.colors.grey,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.md,
    marginBottom: 8,
  },
  dropdown: {
    position: "relative",
    backgroundColor: "white",
    borderColor: theme.colors.grey,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    maxHeight: 160,
    marginBottom: 24,
    zIndex: 999,
    elevation: 10,
  },
  dropdownScroll: {
    maxHeight: 160,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey,
  },
  dropdownItemText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
  },
  input: {
    backgroundColor: theme.colors.grey,
    padding: 8,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.md,
    marginBottom: 24,
  },
  inputText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.md,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  createContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey,
  },
  createButton: {
    backgroundColor: theme.colors.grey,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  createButtonText: {
    color: theme.colors.black,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.semibold as
      | "100"
      | "200"
      | "300"
      | "400"
      | "500"
      | "600"
      | "700"
      | "800"
      | "900"
      | "normal"
      | "bold",
  },
  ingredientRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  ingredientInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeIngredientButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.grey,
    alignItems: "center",
    justifyContent: "center",
  },
  removeIngredientText: {
    color: "black",
    fontWeight: theme.typography.fontWeights.bold as
      | "100"
      | "200"
      | "300"
      | "400"
      | "500"
      | "600"
      | "700"
      | "800"
      | "900"
      | "normal"
      | "bold",
  },
  addIngredientButton: {
    backgroundColor: theme.colors.grey,
    padding: 8,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
  },
  stepRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  stepInput: {
    flex: 1,
    marginBottom: 0,
  },
});
