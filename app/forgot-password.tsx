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
import { forgotPasswordApi, resetPasswordApi } from "./services/api";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailVal: string) => {
      return forgotPasswordApi(emailVal);
    },
    onSuccess: () => {
      showAlert("Success", "OTP has been sent to your email successfully.");
      setStep(2);
    },
    onError: (error: any) => {
      showAlert("Error", error?.message || "Failed to send OTP. Please try again.");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { emailVal: string; otpVal: string; newPass: string }) => {
      return resetPasswordApi(payload.emailVal, payload.otpVal, payload.newPass);
    },
    onSuccess: () => {
      showAlert("Success", "Your password has been changed successfully. Please log in with your new password.");
      router.replace("/login");
    },
    onError: (error: any) => {
      showAlert("Error", error?.message || "Failed to reset password. Please check your OTP and try again.");
    },
  });

  const handleSendOtp = () => {
    if (!email.trim()) {
      showAlert("Error", "Please enter your email address");
      return;
    }
    forgotPasswordMutation.mutate(email.trim());
  };

  const handleResetPassword = () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({
      emailVal: email.trim(),
      otpVal: otp.trim(),
      newPass: newPassword,
    });
  };

  const isPending = forgotPasswordMutation.isPending || resetPasswordMutation.isPending;

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
            {/* Back Arrow Button when in Step 2 */}
            {step === 2 && (
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backButton}
                disabled={isPending}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}

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
              <Text style={styles.title}>
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 
                  ? "Enter your email to receive a password reset OTP" 
                  : `Enter the 6-digit OTP code sent to ${email}`}
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardInner}>
                {step === 1 ? (
                  /* Step 1: Email collection */
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
                        editable={!isPending}
                      />
                    </View>
                  </View>
                ) : (
                  /* Step 2: OTP and New Password */
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Verification OTP Code</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor="#9ca3af"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                          editable={!isPending}
                        />
                      </View>
                    </View>

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
                          editable={!isPending}
                        />
                      </View>
                    </View>

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
                          editable={!isPending}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={step === 1 ? handleSendOtp : handleResetPassword}
                  disabled={isPending}
                  activeOpacity={0.85}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={
                      isPending
                        ? ["#a5d6a7", "#81c784"]
                        : ["#7ed957", "#4CAF50", "#2e7d32"]
                    }
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {step === 1 ? "Send OTP" : "Reset Password"}
                      </Text>
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
                    disabled={isPending}
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
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  backButtonText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f0f4f8",
  },
  formCardInner: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
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
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
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
    marginHorizontal: 16,
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "500",
  },
  linkText: {
    color: "#16a34a",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
