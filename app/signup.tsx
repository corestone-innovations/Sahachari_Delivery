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
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
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
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>
                Join us to start your delivery journey
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
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!signupMutation.isPending}
                />
              </View>

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
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor={colors.placeholder}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your address"
                  placeholderTextColor={colors.placeholder}
                  value={address}
                  onChangeText={setAddress}
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Serviceable Pincodes</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 688524, 688539"
                  placeholderTextColor={colors.placeholder}
                  value={serviceablePincodes}
                  onChangeText={setServiceablePincodes}
                  keyboardType="numeric"
                  editable={!signupMutation.isPending}
                />
                <Text style={styles.helperText}>
                  Enter comma-separated pincodes
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSignup}
                disabled={signupMutation.isPending}
                style={styles.registerButton}
                activeOpacity={0.85}
              >
                <Text style={styles.registerButtonText}>
                  {signupMutation.isPending ? "Please wait..." : "REGISTER"}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/login")}
                >
                  Login
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
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 50,
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
    paddingTop: 16,
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
  helperText: {
    fontSize: 11,
    color: colors.helperText,
    marginTop: 8,
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: colors.accentDark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerButtonText: {
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
