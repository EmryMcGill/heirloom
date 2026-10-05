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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface ValidationError {
  field: string;
  msg: string;
}

const CONTENT_PADDING_TOP = 24; // must match styles.container.paddingTop
const SCROLL_TOP_GAP = 12;

export default function Auth() {
  const { refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Input focus refs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Scroll & layout position tracking
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const formY = useRef(0);

  // Track keyboard height smoothly during interactive gestures/drags
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
    onEnd: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
  });

  // Dynamically pad the scroll content frame-by-frame as the keyboard moves
  const animatedPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: 220 + keyboardHeight.value,
  }));

  const scrollFieldToTop = (key: string) => {
    setTimeout(() => {
      const y = fieldY.current[key];
      if (y === undefined) return;
      scrollRef.current?.scrollTo({
        y: Math.max(
          0,
          formY.current + y + CONTENT_PADDING_TOP - SCROLL_TOP_GAP,
        ),
        animated: true,
      });
    }, 50);
  };

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
  }

  const validateField = (field: string, value: string) => {
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

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

  async function signUpWithEmail() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const validationErrors: ValidationError[] = [];

    if (trimmedName.length === 0) {
      validationErrors.push({
        field: "name",
        msg: "Please enter a username",
      });
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

  const handleSubmit = () => {
    if (loading) return;
    if (isLogin) {
      signInWithEmail();
    } else {
      signUpWithEmail();
    }
  };

  const nameError = errors.find((e) => e.field === "name");
  const emailError = errors.find((e) => e.field === "email");
  const passwordError = errors.find((e) => e.field === "password");

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          keyboardDismissMode="on-drag"
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={120}
        >
          <Animated.View style={animatedPaddingStyle}>
            {/* Header */}
            <View style={styles.headerBlock}>
              <Text style={styles.brand}>Spurtle</Text>
              <Text style={styles.title}>
                {isLogin ? "Welcome back" : "Create an account"}
              </Text>
            </View>

            {/* Avatar picker */}
            {!isLogin && (
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={pickAvatar}
                    activeOpacity={0.85}
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <User size={48} color="#8E8E93" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={pickAvatar}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.helperText}>
                  Tap to add a profile photo
                </Text>
              </View>
            )}

            {/* Inputs */}
            <View
              style={styles.form}
              onLayout={(e) => (formY.current = e.nativeEvent.layout.y)}
            >
              {!isLogin && (
                <View
                  style={styles.inputGroup}
                  onLayout={(e) =>
                    (fieldY.current.name = e.nativeEvent.layout.y)
                  }
                >
                  <Text style={styles.fieldLabel}>USERNAME</Text>
                  <TextInput
                    style={[styles.boxInput, nameError && styles.inputError]}
                    onChangeText={(text) => {
                      setName(text);
                      validateField("name", text);
                    }}
                    onFocus={() => scrollFieldToTop("name")}
                    value={name}
                    placeholder="Your username"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="words"
                    textContentType="name"
                    autoComplete="name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {nameError && (
                    <Text style={styles.errorText}>{nameError.msg}</Text>
                  )}
                </View>
              )}

              <View
                style={styles.inputGroup}
                onLayout={(e) =>
                  (fieldY.current.email = e.nativeEvent.layout.y)
                }
              >
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  ref={emailRef}
                  style={[styles.boxInput, emailError && styles.inputError]}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateField("email", text);
                  }}
                  onFocus={() => scrollFieldToTop("email")}
                  value={email}
                  placeholder="you@example.com"
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {emailError && (
                  <Text style={styles.errorText}>{emailError.msg}</Text>
                )}
              </View>

              <View
                style={styles.inputGroup}
                onLayout={(e) =>
                  (fieldY.current.password = e.nativeEvent.layout.y)
                }
              >
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  ref={passwordRef}
                  style={[styles.boxInput, passwordError && styles.inputError]}
                  onChangeText={(text) => {
                    setPassword(text);
                    validateField("password", text);
                  }}
                  onFocus={() => scrollFieldToTop("password")}
                  value={password}
                  secureTextEntry={true}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#8E8E93"
                  autoCapitalize="none"
                  textContentType={isLogin ? "password" : "newPassword"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                {passwordError && (
                  <Text style={styles.errorText}>{passwordError.msg}</Text>
                )}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.85 },
                  loading && styles.disabledButton,
                ]}
                disabled={loading}
                onPress={handleSubmit}
              >
                <Text style={styles.primaryButtonText}>
                  {isLogin ? "Login" : "Create Account"}
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
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
          </Animated.View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      <LoadingOverlay visible={loading} mode="modal" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: CONTENT_PADDING_TOP,
    paddingBottom: 40,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  brand: {
    fontFamily: "Pacifico_400Regular",
    fontSize: 36,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8E8E93",
  },
  avatarSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  avatarWrapper: {
    alignSelf: "center",
    position: "relative",
  },
  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  addButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
  helperText: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
  },
  form: {
    width: "100%",
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
  },
  boxInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: theme.colors.red,
  },
  errorText: {
    color: theme.colors.red,
    fontSize: 12,
    marginTop: 6,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text.primary,
    textDecorationLine: "underline",
  },
});
