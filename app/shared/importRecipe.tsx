import { theme } from "@/constants/theme";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ChevronLeft, Download } from "lucide-react-native";
import React, { useState } from "react";
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
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ImportRecipe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to deep-search for a object type inside Schema structures
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

      // 1. Pure Regex to grab all LD+JSON blocks without any DOM dependencies
      const ldJsonRegex =
        /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let recipeJson: any = null;

      // Scan through all JSON-LD scripts on the page
      while ((match = ldJsonRegex.exec(htmlText)) !== null) {
        try {
          const rawJsonText = match[1].trim();
          const parsed = JSON.parse(rawJsonText);
          const found = findRecipeObject(parsed);
          if (found) {
            recipeJson = found;
            break; // Found our recipe object! Stop scanning.
          }
        } catch (e) {
          // Skip corrupt or invalid text blocks safely
        }
      }

      if (!recipeJson) {
        throw new Error(
          "Could not find structured recipe metadata on this webpage.",
        );
      }

      // 2. Clean up and normalize the extracted payload fields
      const title = recipeJson.name || "";
      const description = recipeJson.description || "";

      const parseDuration = (durationStr: string): number => {
        if (!durationStr) return 0;
        const durationMatch = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!durationMatch) return 0;
        const hours = parseInt(durationMatch[1] || "0", 10);
        const minutes = parseInt(durationMatch[2] || "0", 10);
        return hours * 60 + minutes;
      };

      const prepTime = parseDuration(recipeJson.prepTime);
      const cookTime = parseDuration(recipeJson.cookTime);

      let servings = 4;
      if (recipeJson.recipeYield) {
        const yieldStr = Array.isArray(recipeJson.recipeYield)
          ? recipeJson.recipeYield[0]
          : recipeJson.recipeYield;
        const numericMatch = String(yieldStr).match(/\d+/);
        if (numericMatch) servings = parseInt(numericMatch[0], 10);
      }

      let imageUrl = "";
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

      const ingredients = rawIngredients.map((str) => {
        const trimmed = str.trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace === -1) return { amount: "", what: trimmed };
        return {
          amount: trimmed.substring(0, firstSpace).trim(),
          what: trimmed.substring(firstSpace + 1).trim(),
        };
      });

      const rawSteps: any[] = Array.isArray(recipeJson.recipeInstructions)
        ? recipeJson.recipeInstructions
        : [];

      const steps = rawSteps
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

      const prepopulatedRecipe = {
        title,
        description,
        story: `Imported from: ${targetUrl}`,
        prep_time: prepTime,
        cook_time: cookTime,
        servings,
        image_url: imageUrl,
        tags: JSON.stringify(["Imported"]),
        ingredients,
        steps,
        notes: "",
      };

      router.replace({
        pathname: "/shared/newRecipe",
        params: {
          recipe: encodeURIComponent(JSON.stringify(prepopulatedRecipe)),
        },
      });
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
      <SafeAreaView edges={["top"]} />

      <Stack.Screen
        options={{
          headerShown: true,
          title: "Create recipe",
          headerTitleStyle: {
            fontFamily: theme.typography.fonts.regular,
            fontSize: 24, // Clean native sizing
            fontWeight: "600",
            color: theme.colors.black,
          },
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerShadowVisible: true, // Adds standard platform separator line
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 4, padding: 4 }}
            >
              <ChevronLeft size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Recipe Web URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.seriouseats.com/..."
          placeholderTextColor={theme.colors.text.secondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.buttonDisabled]}
          onPress={handleUrlExtraction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Download size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Import Recipe</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollBody: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: theme.colors.grey || "#f5f5f5",
    padding: 16,
    borderRadius: theme.borderRadius.lg || 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: theme.borderRadius.md || 8,
    fontSize: 16,
    color: "#111",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#c1c1c1",
    backgroundColor: "#fff",
  },
  actionButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg || 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
