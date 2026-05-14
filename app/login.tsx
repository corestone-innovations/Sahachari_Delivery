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

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthToken } = useAuth();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // SHOW / HIDE PASSWORD
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const loginResponse = await loginApi(credentials);
      return loginResponse;
    },

    onSuccess: async (data) => {
      console.log("Login response:", data);

      await setAuthToken(data.accessToken);

      try {
        const userData = await getCurrentUser();
        queryClient.setQueryData(["currentUser"], userData);
      } catch (error) {
        console.log("Could not fetch user data:", error);
      }

      router.replace("/(tabs)");
    },

    onError: (error: any) => {
      console.error("Login error:", error);

      Alert.alert("Login Failed", error.message || "Invalid email or password");
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={["#f0fff4", "#ffffff", "#ecfdf5"]}
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

                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loginMutation.isPending}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
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
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  gradient: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  /* HEADER */

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  logoContainer: {
    marginBottom: 24,
  },

  logoImage: {
    width: 130,
    height: 130,

    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },

  /* FORM CARD */

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f0f4f8",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,

    overflow: "hidden",
  },

  formCardInner: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
  },

  /* INPUTS */

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  inputWrapper: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
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
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
