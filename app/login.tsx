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

  const loginMutation = useMutation({
    mutationFn: async (credentials: {
      email: string;
      password: string;
    }) => {
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

      Alert.alert(
        "Login Failed",
        error.message || "Invalid email or password"
      );
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
                      secureTextEntry
                      editable={!loginMutation.isPending}
                    />
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

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />

                  <Text style={styles.dividerText}>or</Text>

                  <View style={styles.dividerLine} />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Don't have an account?{" "}
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push("/signup")}
                    disabled={loginMutation.isPending}
                  >
                    <Text style={styles.linkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: "#f4fff7",
  },

  gradient: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  /* HEADER */

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoContainer: {
    marginBottom: 18,
  },

  logoImage: {
    width: 120,
    height: 120,

    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },

  /* FORM CARD */

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,

    overflow: "hidden",
  },

  formCardInner: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 26,
  },

  /* INPUTS */

  inputGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.4,
  },

  inputWrapper: {
    backgroundColor: "#f9fafb",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },

  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 22,
    marginTop: -2,
  },

  forgotPasswordText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "700",
  },

  /* BUTTON */

  button: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* DIVIDER */

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  dividerText: {
    marginHorizontal: 14,
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  /* FOOTER */

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  footerText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },

  linkText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "800",
  },
});