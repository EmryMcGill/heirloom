import { theme } from "@/constants/theme";
import { searchUsers } from "@/services/users";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Check, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
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

type User = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

const HEADER_HEIGHT = 56;

export default function AddBookMemberModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  const addMember = () => {
    router.dismissTo({
      pathname: "/book/new",
      params: { newMember: JSON.stringify(selectedUser), role },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return users;
  }, [users, searchQuery]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleAdd = () => {
    if (!selectedUser) return;

    addMember();
  };

  const topOffset = HEADER_HEIGHT + 16;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Search */}
      {!selectedUser && (
        <View style={[styles.body, { paddingTop: topOffset }]}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#8E8E93" style={styles.searchIcon} />

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
              autoCapitalize="none"
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
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 20,
              }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => handleSelectUser(item)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  {item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {item.full_name?.charAt(0).toUpperCase() ?? "?"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.full_name || "Unnamed user"}
                    </Text>

                    {item.username && (
                      <Text style={styles.username}>@{item.username}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim().length < 2
                      ? "Search for someone to add."
                      : "No users found."}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Selected User / Role */}
      {selectedUser && (
        <View style={[styles.selectedContainer, { paddingTop: topOffset }]}>
          <Text style={styles.sectionLabel}>ADDING</Text>

          <View style={styles.selectedUser}>
            {selectedUser.avatar_url ? (
              <Image
                source={{ uri: selectedUser.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {selectedUser.full_name?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
            )}

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {selectedUser.full_name || "Unnamed user"}
              </Text>

              {selectedUser.username && (
                <Text style={styles.username}>@{selectedUser.username}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={styles.changeButton}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>ACCESS</Text>

          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "viewer" && styles.roleOptionSelected,
              ]}
              onPress={() => setRole("viewer")}
              activeOpacity={0.7}
            >
              <View style={styles.roleContent}>
                <Text
                  style={[
                    styles.roleTitle,
                    role === "viewer" && styles.roleTitleSelected,
                  ]}
                >
                  Viewer
                </Text>

                <Text style={styles.roleDescription}>
                  Can view the book and recipes
                </Text>
              </View>

              {role === "viewer" && (
                <View style={styles.checkCircle}>
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "editor" && styles.roleOptionSelected,
              ]}
              onPress={() => setRole("editor")}
              activeOpacity={0.7}
            >
              <View style={styles.roleContent}>
                <Text
                  style={[
                    styles.roleTitle,
                    role === "editor" && styles.roleTitleSelected,
                  ]}
                >
                  Editor
                </Text>

                <Text style={styles.roleDescription}>
                  Can add and edit recipes
                </Text>
              </View>

              {role === "editor" && (
                <View style={styles.checkCircle}>
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

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

          <Text style={styles.headerTitle}>Add People</Text>

          <View style={styles.closeBtn} />
        </View>
      </BlurView>

      {/* Floating Action Bar Drawer */}
      {selectedUser && (
        <BlurView
          intensity={20}
          style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.addButtonText}>
              Add {selectedUser.full_name || "Person"}
            </Text>
          </TouchableOpacity>
        </BlurView>
      )}
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

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  userInfo: {
    flex: 1,
    marginLeft: 11,
  },

  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  username: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },

  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },

  selectedContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  selectedUser: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },

  changeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  changeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  roleSelector: {
    gap: 10,
  },

  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  roleOptionSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#111111",
  },

  roleContent: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#777",
    marginBottom: 3,
  },

  roleTitleSelected: {
    color: "#111",
    fontWeight: "600",
  },

  roleDescription: {
    fontSize: 13,
    color: "#8E8E93",
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
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

  addButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
