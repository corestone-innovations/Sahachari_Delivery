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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthCard from "../components/AuthCard";
import LabeledTextInput from "../components/LabeledTextInput";
import PrimaryButton from "../components/PrimaryButton";
import { deliveryTheme } from "../constants/DeliveryTheme";
import { apiRequest } from "./services/api";

const { colors, spacing } = deliveryTheme;

interface SignupData {
  name: string;
  email: string;
  mobileNumber?: string;
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
  const [mobileNumber, setMobileNumber] = useState("");
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

    const sanitizedMobileNumber = mobileNumber.replace(/\D/g, "");
    if (
      sanitizedMobileNumber &&
      (sanitizedMobileNumber.length < 10 || sanitizedMobileNumber.length > 15)
    ) {
      Alert.alert("Error", "Please enter a valid mobile number");
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
      mobileNumber: mobileNumber.trim() || undefined,
      password,
      address,
      serviceablePincodes: parsedPincodes,
      role: "DELIVERY",
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 , backgroundColor:colors.bgBottom}} edges={["left", "right","bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Compact header */}
            <View style={styles.header}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Register</Text>
              <Text style={styles.subtitle}>
                Join our delivery network today
              </Text>
            </View>

            {/* Form Card */}
            <AuthCard>
              {/* Name Input */}
              <LabeledTextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!signupMutation.isPending}
              />

              {/* Email Input */}
              <LabeledTextInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!signupMutation.isPending}
              />

              {/* Mobile Number Input */}
              <LabeledTextInput
                label="Mobile Number"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                editable={!signupMutation.isPending}
              />

              {/* Password Input */}
              <LabeledTextInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!signupMutation.isPending}
              />

              {/* Confirm Password Input */}
              <LabeledTextInput
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!signupMutation.isPending}
              />

              {/* Address Input */}
              <LabeledTextInput
                label="Address"
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                editable={!signupMutation.isPending}
              />

              {/* Pincodes Input */}
              <View>
                <LabeledTextInput
                  label="Serviceable Pincodes"
                  placeholder="e.g., 688524, 688539"
                  value={serviceablePincodes}
                  onChangeText={setServiceablePincodes}
                  keyboardType="numeric"
                  editable={!signupMutation.isPending}
                />
                <Text style={styles.helperText}>
                  Enter comma-separated pincodes
                </Text>
              </View>

              {/* Sign Up Button */}
              <PrimaryButton
                title="Create Account"
                onPress={handleSignup}
                loading={signupMutation.isPending}
                style={styles.buttonContainer}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  disabled={signupMutation.isPending}
                >
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </AuthCard>
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: 12,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },

  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 10,
    color: colors.accent,
    marginTop: 4,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  buttonContainer: {
    marginTop: 6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "400",
  },
  linkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
