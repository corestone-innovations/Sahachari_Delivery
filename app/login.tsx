import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
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
          colors={["#f8fffe", "#ffffff", "#f0fdf9"]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Decorative header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#7ed957", "#4CAF50", "#2e7d32"]}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.logoInner}>
                    <Text style={styles.logoIcon}>S</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardInner}>
                {/* Email Input */}
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

                {/* Password Input */}
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
                <TouchableOpacity style={styles.forgotPassword}>
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
                        ? ["#a5d6a7", "#81c784"]
                        : ["#7ed957", "#4CAF50", "#2e7d32"]
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

                {/* Sign Up Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/signup")}
                    disabled={loginMutation.isPending}
                  >
                    <Text style={styles.linkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  logoInner: {
    width: 102,
    height: 102,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 62,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1a472a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#4CAF50",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  formCardInner: {
    padding: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: "#f1f8f4",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#c8e6c9",
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#1a472a",
    fontWeight: "500",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 28,
    marginTop: -12,
  },
  forgotPasswordText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: "#9e9e9e",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#757575",
    fontSize: 15,
    fontWeight: "400",
  },
  linkText: {
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottomSpacing: {
    height: 40,
  },
});
