import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks } from "@/services/books";
import { getFriendRequests } from "@/services/friends"; // 🔹 Imported your friends service
import { getRecipesByUserId } from "@/services/recipes";
import { useQuery } from "@tanstack/react-query"; // 🔹 Swapped useQueryClient for an active useQuery hook
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronRight, Settings, User, Users } from "lucide-react-native"; // Matching lucide icons
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileModal() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes", userId],
    queryFn: () => getRecipesByUserId(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: () => getBooks(userId),
    staleTime: 1000 * 60 * 10,
  });

  // TODO: Replace these with your actual fetched counts or context properties
  const booksCount = books.length;
  const recipesCount = recipes.length;

  // 🔹 Actively listens to the same friendRequests cache key used on the friends screen
  const { data: requests = [] } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => getFriendRequests(userId!),
    enabled: !!userId,
  });

  const pendingRequestsCount = requests.length;

  return (
    <View style={[styles.container]}>
      {/* Header Row with Close Button */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: theme.typography.fonts.regular,
          fontSize: theme.typography.sizes.xxl,
          marginBottom: 0,
          flexShrink: 1,
          marginTop: theme.spacing.md,
        }}
      >
        Profile
      </Text>

      {/* Profile Info Section */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileDetails}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.full_name ?? "Your Profile"}
          </Text>

          {/* 📊 Books and Recipes Count Row */}
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              <Text style={styles.statNumber}>{booksCount} </Text>
              {booksCount === 1 ? "cookbook" : "cookbooks"}
            </Text>
            <View style={styles.statDivider} />
            <Text style={styles.statText}>
              <Text style={styles.statNumber}>{recipesCount} </Text>
              {recipesCount === 1 ? "recipe" : "recipes"}
            </Text>
          </View>
        </View>

        {profile?.avatar_url ? (
          <Image
            source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={32} color="#A3A3A3" />
          </View>
        )}
      </View>

      {/* Menu Options Group */}
      <View style={styles.menuGroup}>
        {/* 👥 Friends Button */}
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => router.push("/shared/friends")}
        >
          <View style={styles.menuContent}>
            <Users size={20} color={theme.colors.black} />
            <Text style={styles.menuText}>Friends</Text>
          </View>

          {/* 🔹 Added pending requests indicator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {pendingRequestsCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {pendingRequestsCount} pending
                </Text>
              </View>
            )}
            <ChevronRight size={18} color="#8E8E93" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => router.push("/shared/profileSettings")}
        >
          <View style={styles.menuContent}>
            <Settings size={20} color={theme.colors.black} />
            <Text style={styles.menuText}>Profile settings</Text>
          </View>
          <ChevronRight size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heading: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xl || 22,
    fontWeight: "700",
    color: theme.colors.black,
    marginTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  profileHeaderCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginBottom: 12,
    marginTop: 12,
  },
  profileDetails: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "space-around",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.black,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statText: {
    fontSize: 14,
    color: "#666666",
  },
  statNumber: {
    fontWeight: "600",
    color: theme.colors.black,
  },
  statDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C7C7CC",
    marginHorizontal: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.grey,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.black,
  },
  badgeContainer: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.darkRed || "#FF3B30",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.darkRed || "#FF3B30",
  },
});
