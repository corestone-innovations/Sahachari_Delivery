import { useMutation } from "@tanstack/react-query";
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
import { apiRequest } from "./services/api";

const { colors } = deliveryTheme;

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
              <Text style={styles.headerTitle}>Reset Password</Text>
              <Text style={styles.headerSubtitle}>
                Enter your email and new password
              </Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
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
                  editable={!changePasswordMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!changePasswordMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!changePasswordMutation.isPending}
                />
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                style={styles.actionButton}
                activeOpacity={0.85}
              >
                <Text style={styles.actionButtonText}>
                  {changePasswordMutation.isPending
                    ? "Please wait..."
                    : "CHANGE PASSWORD"}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/login")}
                >
                  Log In
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 80,
  },
  logo: {
    width: 90,
    height: 90,
    marginRight: 16,
  },
  textContainer: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 32,
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  fieldBlock: {
    marginBottom: 18,
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
  actionButton: {
    marginTop: 8,
    backgroundColor: colors.accentDark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
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
