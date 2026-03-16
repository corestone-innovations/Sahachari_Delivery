import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
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
import { deliveryTheme } from "../constants/DeliveryTheme";
import { useAuth } from "./contexts/AuthContext";
import { getCurrentUser, loginApi } from "./services/api";

const { colors } = deliveryTheme;

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

      router.replace("/myorders");
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
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={[colors.textPrimary, colors.accentDark, colors.accent]}
          style={styles.bg}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.textContainer}>
              <Text style={styles.headerTitle}>Welcome Back!</Text>
              <Text style={styles.headerSubtitle}>Sign in to continue</Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loginMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loginMutation.isPending}
                />
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/forgot-password")}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                style={styles.loginButton}
                activeOpacity={0.85}
              >
                <Text style={styles.loginButtonText}>
                  {loginMutation.isPending ? "Please wait..." : "LOGIN"}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/signup")}
                >
                  Register
                </Text>
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 100,
    paddingBottom: 100,
  },
  logo: {
    width: 90,
    height: 90,
  },
  textContainer: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.whiteStrong,
    fontWeight: "500",
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    fontSize: 15,
    color: colors.textPrimary,
    paddingBottom: 10,
    paddingTop: 6,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: "500",
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: colors.accentDark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: colors.slateText,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: "700",
  },
});
