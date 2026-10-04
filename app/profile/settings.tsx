import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { decode } from "base64-arraybuffer";
import { BlurView } from "expo-blur";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import {
  Camera,
  ChevronLeft,
  KeyRound,
  LogOut,
  Save,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, logout, updateProfile, updatePassword } = useAuth();

  // 📝 Form States
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const email = session?.user?.email ?? "";

  // 📸 Image Picker Handler
  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required to update your profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // 📤 Upload Avatar to Supabase Storage
  const uploadAvatar = async (
    userId: string,
    uri: string,
  ): Promise<string | null> => {
    try {
      const file = new File(uri);
      const base64 = await file.base64();
      const arrayBuffer = decode(base64);

      const rawExt = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileExt = rawExt === "jpg" ? "jpeg" : rawExt;
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert("Avatar upload failed", uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Avatar upload error:", err);
      return null;
    }
  };

  // 🔹 Update Profile Mutation
  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("User session not found.");
      if (!updateProfile)
        throw new Error("updateProfile function missing in context");

      let updatedAvatarUrl = profile?.avatar_url;

      if (avatarUri) {
        const uploadedUrl = await uploadAvatar(session.user.id, avatarUri);
        if (uploadedUrl) {
          updatedAvatarUrl = uploadedUrl;
        }
      }

      return await updateProfile({
        full_name: fullName.trim(),
        avatar_url: updatedAvatarUrl ?? undefined,
      });
    },
    onSuccess: () => {
      setAvatarUri(null); // Reset local preview picker state
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
    profileMutation.mutate();
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

  const currentDisplayAvatar =
    avatarUri ||
    (profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : null);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.black || "#111111",
          },
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerBackground: () => (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          ),
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.colors.black || "#111111"} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* 👤 Section: Personal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={16} color={theme.colors.text.primary} />
            <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          </View>

          {/* 📸 Avatar Picker */}
          <View style={styles.avatarPickerContainer}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={pickAvatar}
              activeOpacity={0.85}
            >
              {currentDisplayAvatar ? (
                <Image
                  source={{ uri: currentDisplayAvatar }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={36} color="#8E8E93" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* 📧 Email Input (Read-Only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <Text style={styles.readOnlyInput}>{email}</Text>
          </View>

          {/* 👤 Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.boxInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              profileMutation.isPending && styles.disabledButton,
            ]}
            onPress={handleSaveProfile}
            disabled={profileMutation.isPending}
            activeOpacity={0.85}
          >
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {profileMutation.isPending ? "Saving..." : "Save Details"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔑 Section: Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KeyRound size={16} color={theme.colors.text.primary} />
            <Text style={styles.sectionTitle}>SECURITY</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.boxInput}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#8E8E93"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.boxInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor="#8E8E93"
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
            activeOpacity={0.85}
          >
            <KeyRound size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🚪 Section: Session Control */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={async () => {
              await logout();
              router.replace("/auth");
            }}
          >
            <LogOut size={18} color={theme.colors.darkRed || "#FF3B30"} />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 92,
  },
  backButton: {
    marginLeft: 0,
    padding: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  avatarPickerContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatarWrapper: {
    position: "relative",
    width: 84,
    height: 84,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E1E1E1",
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.secondary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
  changePhotoText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  boxInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  readOnlyInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: "#666666",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.darkRed || "#FF3B30",
  },
});
