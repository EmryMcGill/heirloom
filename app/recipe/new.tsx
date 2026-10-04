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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewRecipeScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Route Params
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

  // Scroll & layout position tracking
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});

  // Native header height (status bar inset + 44) plus gap
  const scrollTargetOffset = insets.top + 44 + 12;

  // Track keyboard height smoothly during interactive gestures/drags
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
    onEnd: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
  });

  // Dynamically pad the scroll content frame-by-frame as the keyboard moves
  const animatedPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: 320 + keyboardHeight.value,
  }));

  const scrollFieldToTop = (key: string) => {
    setTimeout(() => {
      const y = fieldY.current[key];
      if (y === undefined) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - scrollTargetOffset),
        animated: true,
      });
    }, 50);
  };

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

  const addIngredient = () => {
    setIngredients((prev) => [...prev, ""]);
    setTimeout(() => {
      const lastIndex = ingredients.length;
      ingredientRefs.current[lastIndex]?.focus();
    }, 50);
  };

  const removeIngredient = (index: number) => {
    ingredientRefs.current.splice(index, 1);
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, ""]);
    setTimeout(() => {
      const lastIndex = steps.length;
      stepRefs.current[lastIndex]?.focus();
    }, 50);
  };

  const removeStep = (index: number) => {
    stepRefs.current.splice(index, 1);
    setSteps((prev) => prev.filter((_, i) => i !== index));
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
        ref={scrollRef}
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
      >
        <Animated.View style={animatedPaddingStyle}>
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
                <Text style={styles.placeholderText}>
                  Tap to add cover photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Recipe Title */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => (fieldY.current.title = e.nativeEvent.layout.y)}
          >
            <Text style={styles.fieldLabel}>RECIPE TITLE *</Text>
            <TextInput
              ref={titleRef}
              style={styles.boxInput}
              value={title}
              onChangeText={setTitle}
              onFocus={() => scrollFieldToTop("title")}
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Description */}
          <View
            style={styles.inputGroup}
            onLayout={(e) =>
              (fieldY.current.description = e.nativeEvent.layout.y)
            }
          >
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              ref={descriptionRef}
              multiline={true}
              style={[styles.boxInput, styles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              onFocus={() => scrollFieldToTop("description")}
              placeholder="A brief overview or summary of the dish"
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Metrics Row */}
          <View
            style={[styles.inputGroup, styles.metricsRow]}
            onLayout={(e) => (fieldY.current.metrics = e.nativeEvent.layout.y)}
          >
            <View style={styles.metricItem}>
              <Text style={styles.fieldLabel}>PREP TIME</Text>
              <TextInput
                ref={prepTimeRef}
                style={styles.boxInput}
                value={prepTime}
                onChangeText={setPrepTime}
                onFocus={() => scrollFieldToTop("metrics")}
                placeholder="15 mins"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.fieldLabel}>COOK TIME</Text>
              <TextInput
                ref={cookTimeRef}
                style={styles.boxInput}
                value={cookTime}
                onChangeText={setCookTime}
                onFocus={() => scrollFieldToTop("metrics")}
                placeholder="30 mins"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.fieldLabel}>SERVINGS</Text>
              <TextInput
                ref={servingsRef}
                style={styles.boxInput}
                value={servings}
                onChangeText={setServings}
                onFocus={() => scrollFieldToTop("metrics")}
                placeholder="4"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Dynamic Ingredients */}
          <View
            style={styles.inputGroup}
            onLayout={(e) =>
              (fieldY.current.ingredients = e.nativeEvent.layout.y)
            }
          >
            <Text style={styles.fieldLabel}>INGREDIENTS *</Text>
            <View style={styles.dynamicListContainer}>
              {ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={styles.dynamicRow}
                  onLayout={(e) =>
                    (fieldY.current[`ingredient_${index}`] =
                      fieldY.current.ingredients + e.nativeEvent.layout.y)
                  }
                >
                  <TextInput
                    ref={(el) => (ingredientRefs.current[index] = el)}
                    style={[styles.boxInput, styles.dynamicInput]}
                    value={ingredient}
                    onChangeText={(val) => updateIngredient(index, val)}
                    onFocus={() => scrollFieldToTop(`ingredient_${index}`)}
                    placeholder={`Ingredient ${index + 1}`}
                    placeholderTextColor="#8E8E93"
                  />
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeIngredient(index)}
                      hitSlop={8}
                    >
                      <X size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addBtn}
                onPress={addIngredient}
                activeOpacity={0.7}
              >
                <Plus size={16} color={theme.colors.black || "#111111"} />
                <Text style={styles.addBtnText}>Add Ingredient</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic Steps */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => (fieldY.current.steps = e.nativeEvent.layout.y)}
          >
            <Text style={styles.fieldLabel}>INSTRUCTIONS *</Text>
            <View style={styles.dynamicListContainer}>
              {steps.map((step, index) => (
                <View
                  key={index}
                  style={styles.dynamicRow}
                  onLayout={(e) =>
                    (fieldY.current[`step_${index}`] =
                      fieldY.current.steps + e.nativeEvent.layout.y)
                  }
                >
                  <TextInput
                    ref={(el) => (stepRefs.current[index] = el)}
                    multiline={true}
                    style={[
                      styles.boxInput,
                      styles.dynamicInput,
                      // styles.textAreaInput,
                    ]}
                    value={step}
                    onChangeText={(val) => updateStep(index, val)}
                    onFocus={() => scrollFieldToTop(`step_${index}`)}
                    placeholder={`Step ${index + 1}`}
                    placeholderTextColor="#8E8E93"
                  />
                  {steps.length > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.removeBtn,
                        { alignSelf: "flex-start", marginTop: 12 },
                      ]}
                      onPress={() => removeStep(index)}
                      hitSlop={8}
                    >
                      <X size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addBtn}
                onPress={addStep}
                activeOpacity={0.7}
              >
                <Plus size={16} color={theme.colors.black || "#111111"} />
                <Text style={styles.addBtnText}>Add Step</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>

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
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricItem: {
    flex: 1,
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
  dynamicListContainer: {
    gap: 10,
  },
  dynamicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dynamicInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 6,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.black || "#111111",
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
