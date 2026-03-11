import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { apiRequest, updateCurrentUserProfile } from "./services/api";

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  phoneNumber?: string;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: () => apiRequest("/users/me"),
    enabled: !!token,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setName((currentName) => currentName || user.name || "");
    setEmail((currentEmail) => currentEmail || user.email || "");
    setMobileNumber(
      (currentMobileNumber) =>
        currentMobileNumber || user.mobileNumber || user.phoneNumber || "",
    );
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
      };

      return updateCurrentUserProfile(payload, user?._id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["myProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
      ]);

      Alert.alert("Profile Updated", "Your profile details have been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert(
        "Update Failed",
        error.message || "Unable to update profile.",
      );
    },
  });

  const hasChanges =
    name.trim() !== (user?.name || "") ||
    email.trim().toLowerCase() !== (user?.email || "").toLowerCase() ||
    mobileNumber.trim() !== (user?.mobileNumber || user?.phoneNumber || "");

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing Details", "Name and email are required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const sanitizedMobileNumber = mobileNumber.replace(/\D/g, "");
    if (
      sanitizedMobileNumber &&
      (sanitizedMobileNumber.length < 10 || sanitizedMobileNumber.length > 15)
    ) {
      Alert.alert("Invalid Mobile Number", "Enter a valid mobile number.");
      return;
    }

    updateProfileMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient
          colors={["#f8fffe", "#ffffff", "#f0fdf9"]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <FontAwesome name="chevron-left" size={18} color="#1a472a" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Edit Profile</Text>
              <Text style={styles.subtitle}>Update your account details</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.stateText}>Loading profile details...</Text>
            </View>
          ) : isError || !user ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>Failed to load your profile.</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formCard}>
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
                      editable={!updateProfileMutation.isPending}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!updateProfileMutation.isPending}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your mobile number"
                      placeholderTextColor="#9ca3af"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                      editable={!updateProfileMutation.isPending}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (!hasChanges || updateProfileMutation.isPending) &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={!hasChanges || updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <FontAwesome name="save" size={16} color="#ffffff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  headerContent: {
    marginLeft: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a472a",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e8f5e9",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: "#f8fffe",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7f0db",
    paddingHorizontal: 14,
  },
  input: {
    height: 54,
    fontSize: 16,
    color: "#1a472a",
    fontWeight: "500",
  },
  saveButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ccc9c",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
