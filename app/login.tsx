import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "./contexts/AuthContext";
import { getCurrentUser, loginApi } from "./services/api";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(
      title,
      message,
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthToken, clearAuthToken } = useAuth();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // SHOW / HIDE PASSWORD
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const loginResponse = await loginApi(credentials);
      
      // Save token first so getCurrentUser can authenticate
      await setAuthToken(loginResponse.accessToken);

      try {
        const userData = await getCurrentUser();
        const role = (userData?.role || "").toUpperCase();

        if (role !== "DELIVERY") {
          await clearAuthToken();
          throw new Error("Access denied. Only delivery partners with role DELIVERY can log in.");
        }

        return { loginResponse, userData };
      } catch (err: any) {
        await clearAuthToken();
        throw err;
      }
    },

    onSuccess: async (data) => {
      console.log("Login response:", data);
      queryClient.setQueryData(["currentUser"], data.userData);
      router.replace("/(tabs)");
    },

    onError: (error: any) => {
      console.error("Login error:", error);

      showAlert("Login Failed", error?.message || "Invalid email or password");
    },
  });

  const validateForm = () => {
    let isValid = true;
    let errEmail = "";
    let errPassword = "";

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errEmail = "Email address is required";
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      errEmail = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errPassword = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errPassword = "Password must be at least 6 characters";
      isValid = false;
    }

    setEmailError(errEmail);
    setPasswordError(errPassword);

    if (!isValid) {
      const alertMsg = errEmail || errPassword;
      showAlert("Validation Error", alertMsg);
    }

    return isValid;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleLogin = () => {
    if (!validateForm()) {
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 40}
        style={styles.container}
      >
        <LinearGradient
          colors={["#d1fae5", "#f0fff4", "#ecfdf5"]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Login</Text>

              <Text style={styles.subtitle}>
                Sign in to continue your journey
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardInner}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>

                  <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      editable={!loginMutation.isPending}
                    />
                  </View>
                  {!!emailError && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>

                  <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!loginMutation.isPending}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {!!passwordError && (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  )}
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loginMutation.isPending}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      loginMutation.isPending
                        ? ["#86efac", "#4ade80"]
                        : ["#22c55e", "#16a34a", "#15803d"]
                    }
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loginMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#d1fae5",
  },

  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  gradient: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: "flex-start",
    paddingTop: 30,
    paddingBottom: 24,
  },

  /* HEADER */

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  logoContainer: {
    marginBottom: 16,
    width: 120,
    height: 120,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },

  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 70,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.6,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  /* FORM CARD */

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e2f0ea",

    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,

    overflow: "hidden",
  },

  formCardInner: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
  },

  /* INPUTS */

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  inputWrapper: {
    backgroundColor: "#f8faf6",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9e7d8",

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 2,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },

  eyeButton: {
    paddingHorizontal: 16,
  },

  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: 2,
  },

  forgotPasswordText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "800",
  },

  /* BUTTON */

  button: {
    width: 170,
    height: 40,
    borderRadius: 12,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
