import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBooks } from "@/services/books";
import { getRecipesByUserId } from "@/services/recipes";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Utensils,
} from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes", userId],
    queryFn: () => getRecipesByUserId(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: books = [] } = useQuery({
    queryKey: ["books", userId],
    queryFn: () => getUserBooks(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const booksCount = books.length;
  const recipesCount = recipes.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* 2. Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={32} color="#8E8E93" />
            </View>
          )}

          <View style={styles.profileDetails}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.full_name ?? "Your Profile"}
            </Text>
            {session?.user?.email && (
              <Text style={styles.emailText} numberOfLines={1}>
                {session.user.email}
              </Text>
            )}
          </View>
        </View>

        {/* 3. Overview Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/library",
                params: { tab: "books" },
              })
            }
          >
            <Text style={styles.statLabel}>
              {booksCount === 1 ? "Cookbook" : "Cookbooks"}
            </Text>
            <View style={styles.statCardSub}>
              <View style={styles.statIconBadge}>
                <BookOpen size={18} color="#111" />
              </View>
              <Text style={styles.statCount}>{booksCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/library",
                params: { tab: "recipes" },
              })
            }
          >
            <Text style={styles.statLabel}>
              {recipesCount === 1 ? "Recipe" : "Recipes"}
            </Text>
            <View style={styles.statCardSub}>
              <View style={styles.statIconBadge}>
                <Utensils size={18} color="#111" />
              </View>
              <Text style={styles.statCount}>{recipesCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push("/profile/settings")}
          >
            <View style={styles.menuContent}>
              <Settings size={20} color="#111" />
              <Text style={styles.menuText}>Settings</Text>
            </View>
            <ChevronRight size={18} color="#8E8E93" />
          </TouchableOpacity>

          {signOut && (
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowBorder]}
              activeOpacity={0.7}
              onPress={() => signOut()}
            >
              <View style={styles.menuContent}>
                <LogOut size={20} color="#FF3B30" />
                <Text style={[styles.menuText, styles.destructiveText]}>
                  Log out
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    position: "relative",
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerRow: {
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Pacifico_400Regular",
    fontSize: 28,
    color: theme.colors.text.primary,
  },
  profileHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E1E1E1",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  emailText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  statCardSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  statCount: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  menuGroup: {
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.4)",
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  destructiveText: {
    color: "#FF3B30",
  },
});
