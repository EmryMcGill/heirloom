import LoadingOverlay from "@/components/LoadingOverlay";
import { theme } from "@/constants/theme";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Plus, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface ValidationError {
  field: string;
  msg: string;
}

export default function Auth() {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // AppState Listener Lifecycle (Prevents subscription leak)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required.",
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

  async function uploadAvatar(
    userId: string,
    uri: string,
  ): Promise<string | null> {
    try {
      // 1. Instantiate File with local URI and read base64 string
      const file = new File(uri);
      const base64 = await file.base64();

      // 2. Decode base64 to ArrayBuffer (Supabase native upload format)
      const arrayBuffer = decode(base64);

      const rawExt = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileExt = rawExt === "jpg" ? "jpeg" : rawExt;
      const filePath = `${userId}/avatar.${fileExt}`;

      // 3. Upload ArrayBuffer with explicit mime type
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
  }

  const validateField = (field: string, value: string) => {
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  // Sign in
  async function signInWithEmail() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing Fields",
        "Please enter both your email and password.",
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) Alert.alert("Login Failed", error.message);
    setLoading(false);
  }

  // Sign up
  async function signUpWithEmail() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const validationErrors: ValidationError[] = [];

    if (trimmedName.length === 0) {
      validationErrors.push({ field: "name", msg: "Please enter a name" });
    }

    if (trimmedEmail.length === 0) {
      validationErrors.push({ field: "email", msg: "Please enter an email" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail)) {
      validationErrors.push({ field: "email", msg: "Email is invalid" });
    }

    if (password.length === 0) {
      validationErrors.push({
        field: "password",
        msg: "Please enter a password",
      });
    } else if (password.length < 6) {
      validationErrors.push({
        field: "password",
        msg: "Password must be at least 6 characters",
      });
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: { name: trimmedName },
      },
    });

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
      setLoading(false);
      return;
    }

    if (user) {
      let avatarUrl: string | null = null;

      if (avatarUri) {
        avatarUrl = await uploadAvatar(user.id, avatarUri);
      }

      await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq("id", user.id);

      await refreshProfile(user.id);
    }
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.beige }}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            <Text style={styles.title}>
              {isLogin ? "Login" : "Create an Account"}
            </Text>

            {/* Avatar picker hidden on login view */}
            {!isLogin && (
              <View style={{ gap: 8 }}>
                <View style={styles.avatarWrapper}>
                  <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={pickAvatar}
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <User size={64} color="grey" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={pickAvatar}
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.helperText}>
                  Tap to add a profile photo
                </Text>
              </View>
            )}

            {/* Inputs */}
            <View style={styles.inputContainer}>
              {!isLogin && (
                <View>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.find((e) => e.field === "name") &&
                        styles.inputError,
                    ]}
                    onChangeText={(text) => {
                      setName(text);
                      validateField("name", text);
                    }}
                    value={name}
                    placeholder="Name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                  <View style={styles.errorContainer}>
                    {errors.find((e) => e.field === "name") && (
                      <Text style={styles.errorText}>
                        * {errors.find((e) => e.field === "name")?.msg}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <TextInput
                style={[
                  styles.textInput,
                  errors.find((e) => e.field === "email") && styles.inputError,
                ]}
                onChangeText={(text) => {
                  setEmail(text);
                  validateField("email", text);
                }}
                value={email}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                ref={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <View style={styles.errorContainer}>
                {errors.find((e) => e.field === "email") && (
                  <Text style={styles.errorText}>
                    * {errors.find((e) => e.field === "email")?.msg}
                  </Text>
                )}
              </View>

              <TextInput
                style={[
                  styles.textInput,
                  errors.find((e) => e.field === "password") &&
                    styles.inputError,
                ]}
                onChangeText={(text) => {
                  setPassword(text);
                  validateField("password", text);
                }}
                value={password}
                secureTextEntry={true}
                placeholder="Password"
                autoCapitalize="none"
                ref={passwordRef}
              />
              <View style={styles.errorContainer}>
                {errors.find((e) => e.field === "password") && (
                  <Text style={styles.errorText}>
                    * {errors.find((e) => e.field === "password")?.msg}
                  </Text>
                )}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.createAccountButton}
                onPress={() =>
                  isLogin ? signInWithEmail() : signUpWithEmail()
                }
              >
                <Text style={styles.createAccountButtonText}>
                  {isLogin ? "Login" : "Create Account"}
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </Text>
              <Pressable
                onPress={() => {
                  setIsLogin(!isLogin);
                  setErrors([]);
                }}
              >
                <Text style={styles.loginButtonText}>
                  {isLogin ? "Create account" : "Login"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
      <LoadingOverlay visible={loading} mode="modal" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: theme.colors.beige2,
  },
  title: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.xxl,
  },
  inputContainer: {
    width: "70%",
  },
  buttonContainer: {
    width: "70%",
  },
  textInput: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    width: "100%",
    paddingBottom: 10,
    fontSize: theme.typography.sizes.lg,
    color: "black",
  },
  inputError: {
    borderBottomColor: theme.colors.red,
  },
  createAccountButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 18,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  createAccountButtonText: {
    color: theme.colors.beige,
    fontSize: theme.typography.sizes.md,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  loginButtonText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorContainer: {
    minHeight: 24,
    marginTop: 4,
  },
  errorText: {
    color: theme.colors.red,
    fontSize: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  helperText: {
    textAlign: "center",
    color: "#666",
  },
  addButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarWrapper: {
    alignSelf: "center",
    position: "relative",
  },
});
