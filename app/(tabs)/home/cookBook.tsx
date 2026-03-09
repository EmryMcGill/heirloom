import { theme } from "@/constants/theme";
import { Recipe } from "@/models/recipe";
import { getRecipesByBookId } from "@/services/recipes";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function CookBook() {
  const params = useLocalSearchParams();
  const book = JSON.parse(params.book);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load assets first
    // await Asset.loadAsync([image]);

    // Load books from API
    const { data, error } = await getRecipesByBookId(book.id);
    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setRecipes([data[0], data[0], data[0]]);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.darkRed} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>{book.title}</Text>
          <TouchableOpacity style={styles.addRecipeBtn}>
            <Text style={{ fontWeight: theme.typography.fontWeights.semibold }}>
              Add Recipe
            </Text>
          </TouchableOpacity>
        </View>

        {/* search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search all recipes in this cookbook"
        />

        {/* books */}
        {recipes.map((cookbook, index) => {
          if (index % 2 !== 0) return null;
          const firstBook = recipes[index];
          const secondBook = recipes[index + 1];

          return (
            <View key={index}>
              {index === 0 ? (
                <Image
                  source={require("../../../assets/images/divider.svg")}
                  style={styles.divider}
                  contentFit="contain"
                />
              ) : (
                <View style={{ height: 12 }} />
              )}

              <View style={styles.bookList}>
                <Pressable
                  style={styles.cookbookCard}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/home/cookBook",
                      params: { book: JSON.stringify(firstBook) },
                    })
                  }
                >
                  <View style={styles.recipeCardBackground}>
                    <View style={styles.recipeCardTitleContainer}>
                      <Text style={styles.cookbookTitle}>
                        {firstBook.title}
                      </Text>
                      <View style={styles.recipeCardBottom}>
                        <FontAwesome5 name="utensils" size={18} color="grey" />
                        <Text style={{ color: "grey" }}>
                          {firstBook.prep_time}
                        </Text>
                        <FontAwesome5 name="clock" size={18} color="grey" />
                        <Text style={{ color: "grey" }}>
                          {firstBook.cook_time}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                {secondBook && (
                  <Pressable
                    style={styles.cookbookCard}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/home/cookBook",
                        params: { book: JSON.stringify(secondBook) },
                      })
                    }
                  >
                    <View style={styles.recipeCardBackground}>
                      <View style={styles.recipeCardTitleContainer}>
                        <Text style={styles.cookbookTitle}>
                          {secondBook.title}
                        </Text>
                        <View style={styles.recipeCardBottom}>
                          <FontAwesome5
                            name="utensils"
                            size={18}
                            color="grey"
                          />
                          <Text style={{ color: "grey" }}>
                            {secondBook.prep_time}
                          </Text>
                          <FontAwesome5 name="clock" size={18} color="grey" />
                          <Text style={{ color: "grey" }}>
                            {secondBook.cook_time}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.beige,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  addRecipeBtn: {
    backgroundColor: theme.colors.yellow,
    padding: theme.spacing.sm,
    marginRight: 12,
    borderRadius: theme.borderRadius.md,
  },
  content: {
    paddingBottom: 12,
  },
  title: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xxl,
    flex: 1,
    flexShrink: 1,
    lineHeight: 36,
  },
  searchInput: {
    backgroundColor: "white",
    fontSize: theme.typography.sizes.sm,
    padding: 8,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.beige,
  },
  divider: {
    width: screenWidth - 24,
    height: 5,
    margin: 12,
  },
  bookList: { flexDirection: "row" },
  recipeCardBackground: {
    display: "flex",
    justifyContent: "flex-end",
    aspectRatio: 1 / 1,
    width: (screenWidth - 36) / 2,
    marginLeft: 12,
    backgroundColor: "grey",

    borderRadius: theme.borderRadius.md,
  },
  recipeCardTitleContainer: {
    borderColor: "grey",
    borderWidth: 1,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    backgroundColor: "white",
    padding: theme.spacing.xs,
  },
  cookbookTitle: {
    lineHeight: 20,
    fontSize: theme.typography.sizes.md,
  },
  recipeCardBottom: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
});
