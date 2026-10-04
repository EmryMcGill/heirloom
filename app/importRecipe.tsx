import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { saveRecipe } from "@/services/recipes";
import { CreateRecipeInput } from "@/types/recipe";
import { useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Stack, useRouter } from "expo-router";
import { ChevronLeft, Download, Link2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ImportRecipe() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to deep-search for an object of type "Recipe" inside Schema structures
  const findRecipeObject = (obj: any): any => {
    if (!obj) return null;
    if (
      obj["@type"] === "Recipe" ||
      (Array.isArray(obj["@type"]) && obj["@type"].includes("Recipe"))
    ) {
      return obj;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findRecipeObject(item);
        if (found) return found;
      }
    } else if (typeof obj === "object") {
      if (obj["@graph"]) {
        return findRecipeObject(obj["@graph"]);
      }
      for (const key in obj) {
        const found = findRecipeObject(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  const handleUrlExtraction = async () => {
    const targetUrl = url.trim();
    if (!targetUrl) {
      Alert.alert("Missing URL", "Please enter a valid recipe link.");
      return;
    }

    if (!userId) {
      Alert.alert(
        "Authentication Required",
        "You must be logged in to import recipes.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to reach the website.");
      }

      const htmlText = await response.text();

      // 1. Regex search for application/ld+json blocks
      const ldJsonRegex =
        /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let recipeJson: any = null;

      while ((match = ldJsonRegex.exec(htmlText)) !== null) {
        try {
          const rawJsonText = match[1].trim();
          const parsed = JSON.parse(rawJsonText);
          const found = findRecipeObject(parsed);
          if (found) {
            recipeJson = found;
            break;
          }
        } catch {
          // Skip non-parseable JSON script tags
        }
      }

      if (!recipeJson) {
        throw new Error(
          "Could not find structured recipe metadata on this webpage.",
        );
      }

      // 2. Normalize JSON-LD fields
      const title = recipeJson.name || "Imported Recipe";
      const description = recipeJson.description || "";

      const parseDuration = (durationStr: string): string | null => {
        if (!durationStr) return null;
        const durationMatch = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!durationMatch) return null;
        const hours = parseInt(durationMatch[1] || "0", 10);
        const minutes = parseInt(durationMatch[2] || "0", 10);
        const total = hours * 60 + minutes;
        return total > 0 ? `${total} mins` : null;
      };

      const prepTime = parseDuration(recipeJson.prepTime);
      const cookTime = parseDuration(recipeJson.cookTime);

      let servings: number | null = null;
      if (recipeJson.recipeYield) {
        const yieldStr = Array.isArray(recipeJson.recipeYield)
          ? recipeJson.recipeYield[0]
          : recipeJson.recipeYield;
        const numericMatch = String(yieldStr).match(/\d+/);
        if (numericMatch) servings = parseInt(numericMatch[0], 10);
      }

      let imageUrl: string | null = null;
      if (recipeJson.image) {
        if (typeof recipeJson.image === "string") imageUrl = recipeJson.image;
        else if (Array.isArray(recipeJson.image))
          imageUrl = recipeJson.image[0];
        else if (recipeJson.image.url) imageUrl = recipeJson.image.url;
      }

      const rawIngredients: string[] = Array.isArray(
        recipeJson.recipeIngredient,
      )
        ? recipeJson.recipeIngredient
        : [];

      const ingredients = rawIngredients
        .map((str) => str.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          amount: "",
          unit: "",
        }));

      const rawSteps: any[] = Array.isArray(recipeJson.recipeInstructions)
        ? recipeJson.recipeInstructions
        : [];

      const stepsList: string[] = rawSteps
        .map((stepObj) => {
          if (typeof stepObj === "string") return stepObj;
          if (stepObj?.text) return stepObj.text;
          if (stepObj?.itemListElement) {
            return stepObj.itemListElement
              .map((s: any) => s.text || "")
              .filter(Boolean);
          }
          return "";
        })
        .flat()
        .filter(Boolean);

      const instructions = stepsList.map((text, idx) => ({
        stepNumber: idx + 1,
        text: text.trim(),
      }));

      const payload: CreateRecipeInput = {
        title: title.trim(),
        description: description.trim() || null,
        prep_time: prepTime,
        cook_time: cookTime,
        servings,
        image_url: imageUrl,
        source_url: targetUrl,
        ingredients,
        instructions,
      };

      // 3. Save directly to database
      const savedRecipe = await saveRecipe(payload, userId);

      // 4. Invalidate recipes list cache
      queryClient.invalidateQueries({ queryKey: ["recipes"] });

      // 5. Replace route straight to the detail page of the saved recipe
      router.replace(`/recipe/${savedRecipe.id}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Import Failed",
        error.message || "Something went wrong while parsing the link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Import Recipe",
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
        showsVerticalScrollIndicator={false}
        bottomOffset={120}
      >
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <Text style={styles.fieldLabel}>RECIPE WEB URL</Text>
          <View style={styles.inputWrapper}>
            <Link2 size={18} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.seriouseats.com/..."
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />
          </View>

          <Text style={styles.helperText}>
            Paste a link from your favorite cooking site or blog to
            automatically parse and save the ingredients and instructions.
          </Text>
        </View>
      </KeyboardAwareScrollView>

      {/* Floating Action Bar Drawer */}
      <BlurView
        intensity={20}
        style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabledBtn]}
          onPress={handleUrlExtraction}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Import Recipe</Text>
            </>
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
  backButton: {
    marginLeft: 0,
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 92,
    paddingBottom: 140,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  helperText: {
    fontSize: 13,
    color: "#8E8E93",
    lineHeight: 18,
    marginTop: 12,
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
    flexDirection: "row",
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
