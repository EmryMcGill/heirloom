import LoadingOverlay from "@/components/LoadingOverlay";
import { theme } from "@/constants/theme";
import * as Google from "expo-auth-session/providers/google";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

interface Error {
  field: string;
  msg: string;
}

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Error[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "981357607208-b57c9juu2l1scmutuk8qv29vvep123at.apps.googleusercontent.com",
    webClientId:
      "981357607208-m7d3c6ndb44pctl5tqre1lncc0f9t2jn.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@emry/heirloom",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // Send token to backend / Firebase / Supabase
    }
  }, [response]);

  const passwordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const validateField = (field: string, value: string) => {
    if (value.trim().length > 0) {
      setErrors(errors.filter((e) => e.field !== field));
    }
    switch (field) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(value.trim())) {
          setErrors(errors.filter((e) => e.field !== field));
        }
        break;
      case "password":
        if (value.length >= 6) {
          setErrors(errors.filter((e) => e.field !== field));
        }
        break;
    }
  };

  const signUpWithGoogle = async () => {
    await promptAsync();
  };

  // log in
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  // sign up
  async function signUpWithEmail() {
    // Trim whitespace
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Validate name
    const errors: Error[] = [];

    if (trimmedName.length === 0) {
      errors.push({ field: "name", msg: "Please enter a name" });
    }

    // Validate email
    if (trimmedEmail.length === 0) {
      errors.push({ field: "email", msg: "Please enter an email" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      errors.push({
        field: "email",
        msg: "Email is invalid",
      });
    }

    // Validate password
    if (password.length === 0) {
      errors.push({ field: "password", msg: "Please enter a password" });
    }

    if (password.length < 6) {
      errors.push({
        field: "password",
        msg: "Password must be at least 6 characters",
      });
    }

    // check for any errors
    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    // create the new account
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: {
          name: trimmedName,
        },
      },
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          {/* title */}
          {!isLogin ? (
            <Text style={styles.title}>Create an Account</Text>
          ) : (
            <Text style={styles.title}>Login</Text>
          )}

          {/* inputs */}
          <View style={styles.inputContainer}>
            {!isLogin && (
              <View>
                <TextInput
                  style={[
                    styles.textInput,
                    errors?.find((e) => e.field === "name")?.msg &&
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
                  {errors?.find((e) => e.field === "name")?.msg && (
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
                errors?.find((e) => e.field === "email")?.msg &&
                  styles.inputError,
              ]}
              onChangeText={(text) => {
                setEmail(text);
                validateField("email", text);
              }}
              value={email}
              placeholder="Email"
              autoCapitalize={"none"}
              ref={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <View style={styles.errorContainer}>
              {errors?.find((e) => e.field === "email")?.msg && (
                <Text style={styles.errorText}>
                  * {errors.find((e) => e.field === "email")?.msg}
                </Text>
              )}
            </View>

            <TextInput
              style={[
                styles.textInput,
                errors?.find((e) => e.field === "password")?.msg &&
                  styles.inputError,
              ]}
              onChangeText={(text) => {
                setPassword(text);
                validateField("password", text);
              }}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={"none"}
              ref={passwordRef}
            />
            <View style={styles.errorContainer}>
              {errors?.find((e) => e.field === "password")?.msg && (
                <Text style={styles.errorText}>
                  * {errors.find((e) => e.field === "password")?.msg}
                </Text>
              )}
            </View>
          </View>

          {/* buttons */}
          {!isLogin ? (
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.createAccountButton}
                onPress={() => signUpWithEmail()}
              >
                <Text style={styles.createAccountButtonText}>
                  Create Account
                </Text>
              </Pressable>
              <Pressable
                style={styles.googleButton}
                onPress={() => signUpWithGoogle()}
              >
                <Image
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  source={require("../../assets/images/google-logo.svg")}
                />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.createAccountButton}
                onPress={() => signInWithEmail()}
              >
                <Text style={styles.createAccountButtonText}>Login</Text>
              </Pressable>
              <Pressable
                style={styles.googleButton}
                onPress={() => signInWithEmail()}
              >
                <Image
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  source={require("../../assets/images/google-logo.svg")}
                />
                <Text style={styles.googleButtonText}>Login with Google</Text>
              </Pressable>
            </View>
          )}

          {/* footer */}
          {!isLogin ? (
            <View style={styles.footerContainer}>
              <Text>Already have an account?</Text>
              <Pressable onPress={() => setIsLogin(true)}>
                <Text style={styles.loginButtonText}>Login</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.footerContainer}>
              <Text>Don't have an account?</Text>
              <Pressable onPress={() => setIsLogin(false)}>
                <Text style={styles.loginButtonText}>Create account</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: theme.colors.beige,
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
    gap: 10,
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
  googleButton: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#747775",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#1F1F1F",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.25,
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
    marginBottom: 20,
    marginTop: 5,
  },
  errorText: {
    color: theme.colors.red,
    lineHeight: 20,
  },
});
