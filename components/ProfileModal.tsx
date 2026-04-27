import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileModal() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>

      {profile?.avatar_url ? (
        <Image
          source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}

      <Text style={styles.name}>
        {profile?.full_name ?? profile?.email ?? "Your profile"}
      </Text>

      {/* 👥 Friends Button */}
      <TouchableOpacity
        style={styles.friendsButton}
        onPress={() => router.push("/home/friends")}
      >
        <View style={styles.friendsContent}>
          <Ionicons name="people-outline" size={20} color="#000" />
          <Text style={styles.friendsText}>Friends</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#666" />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await logout();
          router.replace("/auth"); // Navigate to login page
        }}
      >
        <View style={styles.logoutContent}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.description}>
        This screen is presented with stack modal presentation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.beige,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: theme.colors.grey,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: theme.colors.grey,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },

  // 👇 NEW
  friendsButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  friendsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  friendsText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Logout button styles
  logoutButton: {
    width: "100%",
    backgroundColor: theme.colors.darkRed,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },

  description: {
    textAlign: "center",
    color: theme.colors.darkRed,
  },
});
