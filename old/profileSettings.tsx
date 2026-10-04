import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ChevronLeft, KeyRound, LogOut, Save, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, logout, updateProfile, updatePassword } = useAuth();

  // 📝 Form States
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔹 Update Profile Mutation
  const profileMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (updateProfile) {
        return await updateProfile({ full_name: newName });
      }
      throw new Error("updateProfile function missing in context");
    },
    onSuccess: () => {
      Alert.alert("Success", "Profile details updated successfully.");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.message || "Failed to update profile details.",
      );
    },
  });

  // 🔹 Update Password Mutation
  const passwordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      if (updatePassword) {
        return await updatePassword(newPassword);
      }
      throw new Error("updatePassword function missing in context");
    },
    onSuccess: () => {
      setPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Your password has been changed.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to change password.");
    },
  });

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Name field cannot be left empty.");
      return;
    }
    profileMutation.mutate(fullName.trim());
  };

  const handleUpdatePassword = () => {
    if (password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 6 characters long.",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }
    passwordMutation.mutate(password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* 🛠️ NATIVE HEADER CONFIGURATION */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerTitleStyle: {
            fontFamily: theme.typography.fonts.regular,
            fontSize: 20,
            fontWeight: "600",
            color: theme.colors.black,
          },
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerShadowVisible: true,
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* 👤 Section: Personal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={16} color="#666" />
            <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                profileMutation.isPending && styles.disabledButton,
              ]}
              onPress={handleSaveProfile}
              disabled={profileMutation.isPending}
            >
              <Save size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>
                {profileMutation.isPending ? "Saving..." : "Save Details"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔑 Section: Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KeyRound size={16} color="#666" />
            <Text style={styles.sectionTitle}>SECURITY</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: 16 }]}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                passwordMutation.isPending && styles.disabledButton,
              ]}
              onPress={handleUpdatePassword}
              disabled={passwordMutation.isPending}
            >
              <KeyRound size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚪 Section: Session Control */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              await logout();
              router.replace("/auth"); // Redirects securely to authentication stack roots
            }}
          >
            <LogOut size={18} color={theme.colors.darkRed || "#FF3B30"} />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Keeps background subtle and distinct from standard grouped surface elements
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444444",
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: theme.borderRadius?.md || 8,
    fontSize: 16,
    color: "#111",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FAFAFA",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.black || "#000000",
    paddingVertical: 12,
    borderRadius: theme.borderRadius?.md || 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
