import { useMutation } from "@tanstack/react-query";
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
import { apiRequest } from "./services/api";

interface SignupData {
  name: string;
  email: string;
  password: string;
  address: string;
  serviceablePincodes: string[];
  role: string;
}

interface SignupResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  message: string;
}

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [serviceablePincodes, setServiceablePincodes] = useState("");

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return apiRequest<SignupResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        requiresAuth: false,
      });
    },
    onSuccess: () => {
      Alert.alert(
        "Account Created",
        "Registration successful! Please log in.",
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
      Alert.alert("Signup Failed", error?.message || "Please try again");
    },
  });

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Error", "Please enter your address");
      return;
    }

    const parsedPincodes = serviceablePincodes
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length === 6);

    signupMutation.mutate({
      name,
      email,
      password,
      address,
      serviceablePincodes: parsedPincodes,
      role: "DELIVERY",
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join our delivery network today
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardInner}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9ca3af"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

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
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

                {/* Address Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your address"
                      placeholderTextColor="#9ca3af"
                      value={address}
                      onChangeText={setAddress}
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

                {/* Pincodes Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Serviceable Pincodes</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 688524, 688539"
                      placeholderTextColor="#9ca3af"
                      value={serviceablePincodes}
                      onChangeText={setServiceablePincodes}
                      keyboardType="numeric"
                      editable={!signupMutation.isPending}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Enter comma-separated pincodes
                  </Text>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  onPress={handleSignup}
                  disabled={signupMutation.isPending}
                  activeOpacity={0.85}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={
                      signupMutation.isPending
                        ? ["#a5d6a7", "#81c784"]
                        : ["#7ed957", "#4CAF50", "#2e7d32"]
                    }
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {signupMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Login Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/login")}
                    disabled={signupMutation.isPending}
                  >
                    <Text style={styles.linkText}>Log In</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  logoInner: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 34,
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
    padding: 28,
  },
  inputGroup: {
    marginBottom: 20,
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
  helperText: {
    fontSize: 12,
    color: "#66bb6a",
    marginTop: 8,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  buttonContainer: {
    marginTop: 8,
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
    marginVertical: 28,
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
    height: 30,
  },
});
