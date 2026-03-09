import { theme } from "@/constants/theme";
import { Book } from "@/models/book";
import { getBooks } from "@/services/books";
import { Session } from "@supabase/supabase-js";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function CookbookShelf({ session }: { session: Session }) {
  const [activeFilter, setActiveFilter] = useState(0);
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const image = require("../../../assets/images/pattern1.png");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load assets first
    await Asset.loadAsync([image]);

    // Load books from API
    const { data, error } = await getBooks();
    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBooks(data);
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
        <Text style={styles.title}>Cookbook Shelf</Text>

        {/* filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 6 }}
        >
          {["All", "Created by you", "Created by others", "Imported"].map(
            (label, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      activeFilter === index
                        ? theme.colors.yellow
                        : theme.colors.grey,
                  },
                ]}
                onPress={() => setActiveFilter(index)}
              >
                <Text style={styles.filterButtonText}>{label}</Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>

        {/* books */}
        {books.map((cookbook, index) => {
          if (index % 2 !== 0) return null;
          const firstBook = books[index];
          const secondBook = books[index + 1];

          return (
            <View key={index}>
              <Image
                source={require("../../../assets/images/divider.svg")}
                style={styles.divider}
                contentFit="contain"
              />

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
                  <ImageBackground
                    source={image}
                    style={styles.cookbookCardBackground}
                    imageStyle={styles.cookbookCardImage}
                  >
                    <View style={styles.cookbookCardTitleContainerOuter}>
                      <Text style={styles.cookbookTitle}>
                        {firstBook.title}
                      </Text>
                    </View>
                  </ImageBackground>
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
                    <ImageBackground
                      source={image}
                      style={styles.cookbookCardBackground}
                      imageStyle={styles.cookbookCardImage}
                    >
                      <View style={styles.cookbookCardTitleContainerOuter}>
                        <Text style={styles.cookbookTitle}>
                          {secondBook.title}
                        </Text>
                      </View>
                    </ImageBackground>
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
  container: { flex: 1, backgroundColor: theme.colors.beige },
  content: { paddingBottom: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.beige,
  },
  title: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xxl,
    margin: 12,
    marginBottom: 6,
  },
  filterButton: {
    backgroundColor: theme.colors.grey,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.md,
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  filterButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.darkRed,
  },
  divider: {
    width: screenWidth - 24,
    height: 5,
    margin: 12,
  },
  bookList: { flexDirection: "row" },
  cookbookCardBackground: {
    display: "flex",
    height: 200,
    width: (screenWidth - 36) / 2,
    marginLeft: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cookbookCardImage: { borderRadius: theme.borderRadius.md },
  cookbookCardTitleContainerOuter: {
    display: "flex",
    backgroundColor: theme.colors.beige,
    padding: 4,
    borderRadius: theme.borderRadius.sm,
  },
  cookbookTitle: {
    fontFamily: theme.typography.fonts.bold,
    lineHeight: 20,
    fontSize: theme.typography.sizes.md,
    borderWidth: 1,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    borderColor: theme.colors.text.secondary,
    textAlign: "center",
  },
});
