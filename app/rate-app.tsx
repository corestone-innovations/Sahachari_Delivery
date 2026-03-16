import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_RATING_KEY = "delivery_app_rating";

export default function RateAppScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadSavedFeedback = async () => {
      try {
        const savedRating = await AsyncStorage.getItem(APP_RATING_KEY);
        if (!savedRating) {
          return;
        }

        const parsedRating = JSON.parse(savedRating) as {
          rating?: number;
          feedback?: string;
        };

        setRating(parsedRating.rating || 0);
        setFeedback(parsedRating.feedback || "");
      } catch {
        setRating(0);
        setFeedback("");
      }
    };

    loadSavedFeedback();
  }, []);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert("Rate the App", "Please choose a rating before submitting.");
      return;
    }

    try {
      await AsyncStorage.setItem(
        APP_RATING_KEY,
        JSON.stringify({ rating, feedback: feedback.trim() }),
      );
      Alert.alert("Thank You", "Your rating has been saved successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch {
      Alert.alert("Rate the App", "Unable to save your rating right now.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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
            <Text style={styles.title}>Rate the App</Text>
            <Text style={styles.subtitle}>
              Tell us how your experience has been
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              How would you rate Sahachari Delivery?
            </Text>
            <Text style={styles.sectionBody}>
              Your feedback helps improve delivery operations, app reliability,
              and the profile experience.
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setRating(value)}
                  activeOpacity={0.85}
                  style={styles.starButton}
                >
                  <FontAwesome
                    name={value <= rating ? "star" : "star-o"}
                    size={34}
                    color={value <= rating ? "#f59e0b" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingText}>
              {rating
                ? `You selected ${rating} out of 5 stars`
                : "Choose a rating"}
            </Text>

            <Text style={styles.inputLabel}>Additional Feedback</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Share what you liked or what should improve"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={feedback}
                onChangeText={setFeedback}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <FontAwesome name="thumbs-up" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
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
    flex: 1,
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
  card: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a472a",
  },
  sectionBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#f8fffe",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7f0db",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    minHeight: 110,
    fontSize: 16,
    color: "#1a472a",
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 20,
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
