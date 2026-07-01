import BookCard from "@/components/BookCard";
import Divider from "@/components/Divider";
import LoadingOverlay from "@/components/LoadingOverlay";
import ScrollPage from "@/components/ScrollPage";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks } from "@/services/books";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
// FIX 1: Added Book to the lucide imports
import { Book, Plus } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CookbookShelf() {
  const router = useRouter();

  const image = require("../../../assets/images/pattern1.png");
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => getBooks(userId),
    staleTime: 1000 * 60 * 10,
  });

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return <LoadingOverlay visible={true} mode="full" />;
  }

  return (
    <ScrollPage>
      {/* title */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          gap: theme.spacing.md,
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: theme.typography.fonts.regular,
            fontSize: theme.typography.sizes.xxl,
            marginBottom: 0,
            flexShrink: 1,
          }}
        >
          Cookbooks
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.black,
            padding: 8,
            borderRadius: 999,
          }}
          onPress={() => router.push("/shared/newBook")}
        >
          <Plus color="white" />
        </TouchableOpacity>
      </View>

      {/* search input */}
      <TextInput
        placeholder="Search your cookbooks"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          marginHorizontal: theme.spacing.md,
          marginTop: theme.spacing.sm,
          padding: 8,
          borderRadius: theme.borderRadius.md || 8,
          fontSize: 16,
          color: "#111",
          marginBottom: 0,
          borderWidth: 1,
          borderColor: "#c1c1c1",
        }}
      />

      <View style={{ width: "100%", alignItems: "center" }}>
        <Divider />
      </View>

      {books.length === 0 && (
        <View style={styles.noBookContainer}>
          <View style={styles.noBookCircle}>
            <Book size={32} color={theme.colors.black} />
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
                pathname: "/shared/newBook",
              })
            }
          >
            <Text style={{ fontWeight: "bold" }}>Add your first cookbook</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* books */}
      {filteredBooks.map((_, index) => {
        if (index % 2 !== 0) return null;
        const firstBook = filteredBooks[index];
        const secondBook = filteredBooks[index + 1];

        return (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: index !== 0 ? 12 : 0,
              flexDirection: "row",
              gap: 12,
            }}
            key={index}
          >
            <BookCard book={firstBook} />
            {secondBook ? (
              <BookCard book={secondBook} />
            ) : (
              /* Empty invisible item with the same flex/layout characteristics to preserve symmetry */
              <View style={{ flex: 1, backgroundColor: "transparent" }} />
            )}
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
