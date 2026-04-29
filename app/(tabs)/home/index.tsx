import BookCard from "@/components/BookCard";
import Divider from "@/components/Divider";
import LoadingOverlay from "@/components/LoadingOverlay";
import ScrollPage from "@/components/ScrollPage";
import Title from "@/components/Title";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks } from "@/services/books";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Book } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CookbookShelf() {
  const router = useRouter();

  const image = require("../../../assets/images/pattern1.png");
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => getBooks(userId),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return <LoadingOverlay visible={true} mode="full" />;
  }

  return (
    <ScrollPage>
      {/* title */}
      <Title
        title="Bookshelf"
        buttonTitle="Add book"
        buttonPress={() =>
          router.push({
            pathname: "/(tabs)/home/newBook",
          })
        }
      />

      {/* sub-title */}
      <Text style={theme.edgeMargin}>
        Curated collections of family recipes
      </Text>

      <View style={{ width: "100%", alignItems: "center" }}>
        <Divider />
      </View>

      {books.length === 0 && (
        <View style={styles.noBookContainer}>
          <View style={styles.noBookCircle}>
            <Book size={32} />
          </View>
          <Text
            style={{
              fontFamily: theme.typography.fonts.regular,
              fontSize: theme.typography.sizes.xl,
            }}
          >
            No cookbooks yet
          </Text>
          <Text style={{ color: "grey", marginHorizontal: 12 }}>
            Start building your collection of family recipes
          </Text>
          <TouchableOpacity
            style={styles.addBookBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/home/newBook",
              })
            }
          >
            <Text style={{ fontWeight: "bold" }}>Add your first cookbook</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* books */}
      {books.map((_, index) => {
        if (index % 2 !== 0) return null;
        const firstBook = books[index];
        const secondBook = books[index + 1];

        return (
          <View
            style={{ marginHorizontal: 12, marginTop: index !== 0 ? 12 : 0 }}
            key={index}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              <BookCard book={firstBook} />
              {secondBook && <BookCard book={secondBook} />}
            </View>
          </View>
        );
      })}
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { paddingBottom: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.beige,
  },
  noBookContainer: {
    gap: 8,
    width: "100%",
    alignItems: "center",
  },
  noBookCircle: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 999,
    marginBottom: 8,
  },
  addBookBtn: {
    backgroundColor: theme.colors.grey,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
});
