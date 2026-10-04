import { theme } from "@/constants/theme";
import { useBooks } from "@/hooks/useBooks";
import { getBookIdsForRecipe, updateRecipeBooks } from "@/services/books";
import { Book } from "@/types/book";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 56;

export default function AddToBookModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const { data: books = [], isLoading: isLoadingBooks } = useBooks();

  // 1. Query for existing book IDs containing this recipe
  const { data: existingBookIds, isLoading: isLoadingCurrentBooks } = useQuery<
    string[]
  >({
    queryKey: ["recipe-books", recipeId],
    queryFn: () => getBookIdsForRecipe(recipeId as string),
    enabled: !!recipeId,
  });

  // 2. Pre-select checkboxes once existing associations load
  useEffect(() => {
    if (existingBookIds) {
      setSelectedBookIds(existingBookIds);
    }
  }, [existingBookIds]);

  // 3. Save mutation using the sync helper
  const saveMutation = useMutation({
    mutationFn: (updatedIds: string[]) =>
      updateRecipeBooks(recipeId as string, updatedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-books", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      router.back();
    },
  });

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    return books.filter((book: Book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );
  }, [books, searchQuery]);

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId],
    );
  };

  const handleDone = () => {
    saveMutation.mutate(selectedBookIds);
  };

  const isLoading = isLoadingBooks || isLoadingCurrentBooks;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.body, { paddingTop: HEADER_HEIGHT + 8 }]}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cookbooks..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.black || "#111111"}
            />
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedBookIds.includes(item.id);

              return (
                <TouchableOpacity
                  style={styles.bookRow}
                  onPress={() => toggleBook(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{item.title}</Text>
                    <Text style={styles.bookCount}>
                      {item.recipe_count ?? 0}{" "}
                      {(item.recipe_count ?? 0) === 1 ? "recipe" : "recipes"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected ? <Check size={14} color="#FFFFFF" /> : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No matching cookbooks found."
                    : "No cookbooks created yet."}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Custom blurred header */}
      <BlurView intensity={20} style={[styles.header, { paddingTop: 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={theme.colors.black || "#111111"} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add to Book</Text>

          <View style={styles.closeBtn} />
        </View>
      </BlurView>

      {/* Floating Action Bar Drawer */}
      <BlurView
        intensity={20}
        style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && styles.disabledBtn]}
          onPress={handleDone}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
  body: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.black || "#111111",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  bookCount: {
    fontSize: 12,
    color: "#8E8E93",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#8E8E93",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
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
