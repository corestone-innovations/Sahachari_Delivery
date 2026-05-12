import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { apiRequest } from "./services/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
        { cancelable: false }
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
          colors={["#f0fff4", "#ffffff", "#ecfdf5"]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Register</Text>

              <Text style={styles.subtitle}>
                Join our delivery network today
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardInner}>
                {/* Name */}
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
                      editable={!signupMutation.isPending}
                    />
                  </View>
                </View>

                {/* Password */}
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

                {/* Confirm Password */}
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

                {/* Address */}
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

                {/* Pincodes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Serviceable Pincodes
                  </Text>

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

                {/* Button */}
                <TouchableOpacity
                  onPress={handleSignup}
                  disabled={signupMutation.isPending}
                  activeOpacity={0.85}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={
                      signupMutation.isPending
                        ? ["#86efac", "#4ade80"]
                        : ["#22c55e", "#16a34a", "#15803d"]
                    }
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {signupMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>
                        Create Account
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

                {/* Footer */}
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
          </ScrollView>
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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 30,
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
    width: 110,
    height: 110,

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
    paddingHorizontal: 22,
    paddingVertical: 26,
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

  helperText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 7,
    marginLeft: 4,
    fontWeight: "500",
  },

  /* BUTTON */

  buttonContainer: {
    marginTop: 10,
  },

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