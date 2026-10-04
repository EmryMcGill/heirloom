import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRecipeById,
  saveRecipe,
  uploadRecipeImage,
} from "@/services/recipes";
import { CreateRecipeInput, Recipe } from "@/types/recipe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Image as ImageIcon, Plus, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DESCRIPTION_ACCESSORY_ID = "descriptionNextToolbar";

export default function NewRecipeScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Route Params (pass recipeId instead of full JSON string)
  const { recipeId, isClone } = useLocalSearchParams<{
    recipeId?: string;
    isClone?: string;
  }>();

  // Input Focus Refs
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const prepTimeRef = useRef<TextInput>(null);
  const cookTimeRef = useRef<TextInput>(null);
  const servingsRef = useRef<TextInput>(null);
  const ingredientRefs = useRef<(TextInput | null)[]>([]);
  const stepRefs = useRef<(TextInput | null)[]>([]);

  // Fetch or retrieve cached recipe data if editing/cloning
  const { data: recipe, isLoading: isLoadingRecipe } = useQuery<Recipe>({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId!),
    enabled: !!recipeId,
  });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [coverImageUri, setCoverImageUri] =
    useState<ImagePicker.ImagePickerResult | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

  // Hydrate form state when recipe loads or changes
  useEffect(() => {
    if (!recipe) return;

    setTitle(recipe.title ?? "");
    setDescription(recipe.description ?? "");
    setPrepTime(recipe.prep_time?.toString() ?? "");
    setCookTime(recipe.cook_time?.toString() ?? "");
    setServings(recipe.servings?.toString() ?? "");
    setExistingImageUrl(recipe.image_url ?? null);

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      setIngredients(
        recipe.ingredients.map((ing: any) =>
          typeof ing === "string" ? ing : ing.name || "",
        ),
      );
    }

    if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
      setSteps(
        recipe.instructions.map((step: any) =>
          typeof step === "string" ? step : step.text || "",
        ),
      );
    }
  }, [recipe]);

  // Image Picker Handler
  const openPhotoSelector = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Permission required to access your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCoverImageUri(result);
    }
  };

  // Dynamic Array Operations
  const updateIngredient = (index: number, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? value : ing)));
  };

  const removeIngredient = (index: number) => {
    ingredientRefs.current.splice(index, 1);
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const removeStep = (index: number) => {
    stepRefs.current.splice(index, 1);
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  // Focus Navigation
  const handleDescriptionNext = () => {
    prepTimeRef.current?.focus();
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be logged in to save a recipe.");

      let finalImageUrl = existingImageUrl || "";
      if (coverImageUri) {
        finalImageUrl = await uploadRecipeImage(coverImageUri);
      }

      const validIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
      const validSteps = steps.map((s) => s.trim()).filter(Boolean);

      const payload: CreateRecipeInput & { id?: string } = {
        ...(recipeId && isClone !== "true" ? { id: recipeId } : {}),
        title: title.trim(),
        description: description.trim() || null,
        prep_time: prepTime.trim() || null,
        cook_time: cookTime.trim() || null,
        servings: servings ? parseInt(servings, 10) : null,
        image_url: finalImageUrl || null,
        source_url: recipe?.source_url || null,
        ingredients: validIngredients.map((name) => ({
          name,
          amount: "",
          unit: "",
        })),
        instructions: validSteps.map((text, idx) => ({
          stepNumber: idx + 1,
          text,
        })),
      };

      return saveRecipe(payload, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      if (recipeId) {
        queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      }
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert("Error Saving Recipe", error.message);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a recipe title.");
      return;
    }
    if (!ingredients.some((ing) => ing.trim())) {
      Alert.alert("Validation Error", "Please add at least one ingredient.");
      return;
    }
    if (!steps.some((step) => step.trim())) {
      Alert.alert("Validation Error", "Please add at least one step.");
      return;
    }

    saveMutation.mutate();
  };

  const isEditing = !!recipeId && isClone !== "true";

  if (recipeId && isLoadingRecipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={theme.colors.black || "#111111"}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? "Edit Recipe" : "Create Recipe",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.black || "#111111",
          },
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerBackground: () => (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          ),
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.colors.black || "#111111"} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
      >
        {/* Cover Photo */}
        <Text style={styles.fieldLabel}>COVER PHOTO</Text>
        <TouchableOpacity
          style={styles.coverBox}
          onPress={openPhotoSelector}
          activeOpacity={0.85}
        >
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
              <ImageIcon size={30} color="#8E8E93" />
              <Text style={styles.placeholderText}>Tap to add cover photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Recipe Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>RECIPE TITLE *</Text>
          <TextInput
            ref={titleRef}
            style={styles.boxInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Grandma's Chocolate Chip Cookies"
            placeholderTextColor="#8E8E93"
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            ref={descriptionRef}
            multiline={true}
            style={[styles.boxInput, styles.textAreaInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="A brief overview or summary of the dish"
            placeholderTextColor="#8E8E93"
            inputAccessoryViewID={DESCRIPTION_ACCESSORY_ID}
          />
        </View>

        {/* Metrics Row */}
        <View style={[styles.inputGroup, styles.metricsRow]}>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>PREP TIME</Text>
            <TextInput
              ref={prepTimeRef}
              style={styles.boxInput}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="15 mins"
              placeholderTextColor="#8E8E93"
              returnKeyType="next"
              onSubmitEditing={() => cookTimeRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>COOK TIME</Text>
            <TextInput
              ref={cookTimeRef}
              style={styles.boxInput}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="30 mins"
              placeholderTextColor="#8E8E93"
              returnKeyType="next"
              onSubmitEditing={() => servingsRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.fieldLabel}>SERVINGS</Text>
            <TextInput
              ref={servingsRef}
              style={styles.boxInput}
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => ingredientRefs.current[0]?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Dynamic Ingredients */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>INGREDIENTS *</Text>
          <View style={styles.dynamicListContainer}>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.dynamicRow}>
                <TextInput
                  ref={(el) => (ingredientRefs.current[index] = el)}
                  style={[styles.boxInput, styles.dynamicInput]}
                  placeholder="e.g., 2 cups flour"
                  value={ingredient}
                  onChangeText={(value) => updateIngredient(index, value)}
                  placeholderTextColor="#8E8E93"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (index < ingredients.length - 1) {
                      ingredientRefs.current[index + 1]?.focus();
                    } else {
                      stepRefs.current[0]?.focus();
                    }
                  }}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    style={styles.rowDeleteButton}
                    onPress={() => removeIngredient(index)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#666666" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={() => {
                setIngredients((prev) => [...prev, ""]);
                setTimeout(() => {
                  ingredientRefs.current[ingredients.length]?.focus();
                }, 50);
              }}
              style={styles.appendListButton}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#111" />
              <Text style={styles.appendListButtonText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Steps */}
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <Text style={styles.fieldLabel}>STEPS *</Text>
          <View style={styles.dynamicListContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.dynamicRow}>
                <View style={styles.stepIndexMarker}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <TextInput
                  ref={(el) => (stepRefs.current[index] = el)}
                  multiline={false}
                  style={[styles.boxInput, styles.dynamicInput]}
                  placeholder="Describe this step..."
                  value={step}
                  onChangeText={(value) => updateStep(index, value)}
                  placeholderTextColor="#8E8E93"
                  returnKeyType={index === steps.length - 1 ? "done" : "next"}
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (index < steps.length - 1) {
                      stepRefs.current[index + 1]?.focus();
                    } else {
                      stepRefs.current[index]?.blur();
                    }
                  }}
                />
                {steps.length > 1 && (
                  <TouchableOpacity
                    style={styles.rowDeleteButton}
                    onPress={() => removeStep(index)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#666666" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={() => {
                setSteps((prev) => [...prev, ""]);
                setTimeout(() => {
                  stepRefs.current[steps.length]?.focus();
                }, 50);
              }}
              style={styles.appendListButton}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#111" />
              <Text style={styles.appendListButtonText}>Add Step</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Keyboard Accessory Bar for iOS */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={DESCRIPTION_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <TouchableOpacity
              onPress={handleDescriptionNext}
              style={styles.accessoryButton}
            >
              <Text style={styles.accessoryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* Floating Action Bar Drawer */}
      <BlurView
        intensity={20}
        style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? "Save Changes" : "Create Recipe"}
            </Text>
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
  backButton: {
    marginLeft: 0,
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 92,
    paddingBottom: 140,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coverBox: {
    height: 180,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    alignItems: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E8E93",
  },
  inputGroup: {
    marginBottom: 16,
  },
  boxInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  textAreaInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  metricItem: {
    flex: 1,
  },
  dynamicListContainer: {
    gap: 10,
  },
  dynamicRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dynamicInput: {
    flex: 1,
  },
  rowDeleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIndexText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  appendListButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  appendListButtonText: {
    fontWeight: "600",
    color: "#111",
    fontSize: 14,
  },
  accessoryBar: {
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "flex-end",
  },
  accessoryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  accessoryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
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
