import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "./services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { email: string; newPassword: string }) => {
      return apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
        requiresAuth: false,
      });
    },
    onSuccess: () => {
      Alert.alert(
        "Password Changed",
        "Your password has been changed successfully. Please log in with your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ],
        { cancelable: false },
      );
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.message || "Failed to change password. Please try again.",
      );
    },
  });

  const handleChangePassword = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    changePasswordMutation.mutate({
      email,
      newPassword,
    });
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
          <View style={styles.content}>
            {/* Compact header */}
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
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>
                Enter your details to reset password
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
                      editable={!changePasswordMutation.isPending}
                    />
                  </View>
                </View>

                {/* New Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      editable={!changePasswordMutation.isPending}
                    />
                  </View>
                </View>

                {/* Confirm New Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!changePasswordMutation.isPending}
                    />
                  </View>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  activeOpacity={0.85}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={
                      changePasswordMutation.isPending
                        ? ["#a5d6a7", "#81c784"]
                        : ["#7ed957", "#4CAF50", "#2e7d32"]
                    }
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {changePasswordMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Change Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Back to Login Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Remember your password?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/login")}
                    disabled={changePasswordMutation.isPending}
                  >
                    <Text style={styles.linkText}>Log In</Text>
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
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 14,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a472a",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  formCardInner: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: "#f1f8f4",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#c8e6c9",
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1a472a",
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: "400",
  },
  linkText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
