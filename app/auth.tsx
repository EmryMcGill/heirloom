import { theme } from "@/constants/theme";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useKeyboardHandler,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [signupStep, setSignupStep] = useState(1); // 1: Email, 2: Password, 3: Confirm Password, 4: Username, 5: Avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Input focus refs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // Scroll & layout position tracking
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const insets = useSafeAreaInsets();

  // Track keyboard height smoothly
  const keyboardHeight = useSharedValue(0);

  // Animation values for steps
  const stepAnim = useSharedValue(1);

  useEffect(() => {
    stepAnim.value = withTiming(signupStep, { duration: 300 });
  }, [signupStep]);

  // Imperatively focus inputs when the step changes
  useEffect(() => {
    if (isLogin) return;

    const timer = setTimeout(() => {
      if (signupStep === 1) {
        emailRef.current?.focus();
      } else if (signupStep === 2) {
        passwordRef.current?.focus();
      } else if (signupStep === 3) {
        confirmPasswordRef.current?.focus();
      } else if (signupStep === 4) {
        nameRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [signupStep, isLogin]);

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

  const getStepAnimatedStyle = (stepIndex: number) => {
    return useAnimatedStyle(() => {
      const distance = stepAnim.value - stepIndex;
      return {
        transform: [{ translateX: distance * -350 }],
        opacity: Math.abs(distance) > 0.5 ? 0 : 1,
        position: Math.abs(distance) > 0.5 ? "absolute" : "relative",
        width: "100%",
        display: Math.abs(distance) > 1.5 ? "none" : "flex",
      };
    });
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

  const advanceSignup = async () => {
    setLoading(true);

    if (signupStep === 1) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setErrors([{ field: "email", msg: "Please enter an email" }]);
        setLoading(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setErrors([{ field: "email", msg: "Email is invalid" }]);
        setLoading(false);
        return;
      }

      const { data: emailExists, error: emailCheckError } = await supabase.rpc(
        "check_email_exists",
        { email_to_check: trimmedEmail },
      );

      if (emailCheckError) {
        console.error("Error checking email uniqueness:", emailCheckError);
      }

      if (emailExists) {
        setErrors([{ field: "email", msg: "This email is already in use" }]);
        setLoading(false);
        return;
      }
    } else if (signupStep === 2) {
      if (!password) {
        setErrors([{ field: "password", msg: "Please enter a password" }]);
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrors([
          { field: "password", msg: "Password must be at least 6 characters" },
        ]);
        setLoading(false);
        return;
      }
    } else if (signupStep === 3) {
      if (!confirmPassword) {
        setErrors([
          { field: "confirmPassword", msg: "Please confirm your password" },
        ]);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrors([
          { field: "confirmPassword", msg: "Passwords do not match" },
        ]);
        setLoading(false);
        return;
      }
    } else if (signupStep === 4) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrors([{ field: "name", msg: "Please enter a username" }]);
        setLoading(false);
        return;
      }

      const { data: existingName } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", trimmedName)
        .maybeSingle();

      if (existingName) {
        setErrors([{ field: "name", msg: "This username is already taken" }]);
        setLoading(false);
        return;
      }
    }

    setErrors([]);
    setSignupStep((step) => step + 1);
    setLoading(false);
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
    } else if (signupStep === 5) {
      signUpWithEmail();
    } else {
      advanceSignup();
    }
  };

  const emailError = errors.find((e) => e.field === "email");
  const passwordError = errors.find((e) => e.field === "password");
  const confirmPasswordError = errors.find(
    (e) => e.field === "confirmPassword",
  );
  const nameError = errors.find((e) => e.field === "name");

  return (
    <Pressable
      style={[styles.root, { paddingTop: insets.top }]}
      onPress={Keyboard.dismiss}
    >
      {/* Header */}
      <Text style={styles.title}>Spurtle</Text>
      <Text style={styles.subTitle}>
        {isLogin ? "Welcome back" : "Create an account"}
      </Text>

      <View style={styles.formContainer}>
        {/* Step 1: Email */}
        <Animated.View style={[styles.stepWrapper, getStepAnimatedStyle(1)]}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            ref={emailRef}
            style={[
              styles.boxInput,
              focusedInput === "email" && styles.inputFocus,
              emailError && styles.inputError,
            ]}
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => prev.filter((e) => e.field !== "email"));
            }}
            value={email}
            placeholder="name@example.com"
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={handleSubmit}
          />
          {emailError && <Text style={styles.errorText}>{emailError.msg}</Text>}

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
              {loading ? "Checking..." : "Continue"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Step 2: Password */}
        <Animated.View style={[styles.stepWrapper, getStepAnimatedStyle(2)]}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            ref={passwordRef}
            style={[
              styles.boxInput,
              focusedInput === "password" && styles.inputFocus,
              passwordError && styles.inputError,
            ]}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => prev.filter((e) => e.field !== "password"));
            }}
            secureTextEntry
            value={password}
            placeholder="At least 6 characters"
            placeholderTextColor="#8E8E93"
            returnKeyType="next"
            onSubmitEditing={handleSubmit}
          />
          {passwordError && (
            <Text style={styles.errorText}>{passwordError.msg}</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 },
              loading && styles.disabledButton,
            ]}
            disabled={loading}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>

          <Pressable
            style={styles.backButtonContainer}
            onPress={() => setSignupStep((step) => step - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>

        {/* Step 3: Confirm Password */}
        <Animated.View style={[styles.stepWrapper, getStepAnimatedStyle(3)]}>
          <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
          <TextInput
            ref={confirmPasswordRef}
            style={[
              styles.boxInput,
              focusedInput === "confirmPassword" && styles.inputFocus,
              confirmPasswordError && styles.inputError,
            ]}
            onFocus={() => setFocusedInput("confirmPassword")}
            onBlur={() => setFocusedInput(null)}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) =>
                prev.filter((e) => e.field !== "confirmPassword"),
              );
            }}
            secureTextEntry
            value={confirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor="#8E8E93"
            returnKeyType="next"
            onSubmitEditing={handleSubmit}
          />
          {confirmPasswordError && (
            <Text style={styles.errorText}>{confirmPasswordError.msg}</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 },
              loading && styles.disabledButton,
            ]}
            disabled={loading}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>

          <Pressable
            style={styles.backButtonContainer}
            onPress={() => setSignupStep((step) => step - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>

        {/* Step 4: Username */}
        <Animated.View style={[styles.stepWrapper, getStepAnimatedStyle(4)]}>
          <Text style={styles.fieldLabel}>USERNAME</Text>
          <TextInput
            ref={nameRef}
            style={[
              styles.boxInput,
              focusedInput === "name" && styles.inputFocus,
              nameError && styles.inputError,
            ]}
            onFocus={() => setFocusedInput("name")}
            onBlur={() => setFocusedInput(null)}
            onChangeText={(text) => {
              setName(text);
              setErrors((prev) => prev.filter((e) => e.field !== "name"));
            }}
            value={name}
            placeholder="Your username"
            placeholderTextColor="#8E8E93"
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={handleSubmit}
          />
          {nameError && <Text style={styles.errorText}>{nameError.msg}</Text>}
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
              {loading ? "Checking..." : "Continue"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.backButtonContainer}
            onPress={() => setSignupStep((step) => step - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>

        {/* Step 5: Avatar Import */}
        <Animated.View style={[styles.stepWrapper, getStepAnimatedStyle(5)]}>
          <Text style={styles.fieldLabel}>AVATAR (OPTIONAL)</Text>
          <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
            {avatarUri ? (
              <Text style={styles.avatarPickedText}>Avatar Selected ✓</Text>
            ) : (
              <Text style={styles.avatarPlaceholderText}>
                Tap to choose a photo
              </Text>
            )}
          </Pressable>
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
              {loading ? "Completing..." : "Complete Sign Up"}
            </Text>
          </Pressable>
          <Pressable onPress={() => setSignupStep((step) => step - 1)}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
  },
  title: {
    fontFamily: "Pacifico_400Regular",
    fontSize: 36,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8E8E93",
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
    height: 220,
    position: "relative",
    overflow: "hidden",
  },
  stepWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%" - 32,
    marginTop: 24,
    marginHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    width: "100%",
    marginTop: 10,
    marginLeft: 16,
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
    width: "100%" - 32,
    marginHorizontal: 16,
  },
  inputFocus: {
    outlineColor: "black",
    outlineWidth: 2,
    outlineOffset: 2,
  },
  inputError: {
    borderColor: theme.colors.red,
  },
  errorText: {
    color: theme.colors.red,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 16,
  },
  avatarPicker: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.15)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  avatarPlaceholderText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  avatarPickedText: {
    color: theme.colors.text.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  backButtonContainer: {
    alignSelf: "flex-start",
  },
  backText: {
    textDecorationLine: "underline",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 12,
    marginLeft: 16,
  },
});
