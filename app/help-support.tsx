import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const faqItems = [
  {
    question: "How do I update my profile details?",
    answer:
      "Open Profile, tap Edit Profile, update your details, and save the changes.",
  },
  {
    question: "Where can I check my delivery orders?",
    answer:
      "Use the My Orders tab to review active, completed, and pending deliveries.",
  },
  {
    question: "What should I do if I do not receive updates?",
    answer:
      "Check Settings and make sure push notifications and order alerts are enabled.",
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();

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
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.subtitle}>
              Find answers and contact guidance
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Need assistance?</Text>
            <Text style={styles.sectionBody}>
              If you run into delivery issues, account problems, or app errors,
              start with the quick answers below and then use the contact
              options.
            </Text>

            <TouchableOpacity
              style={styles.contactButton}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert("Support", "Email support at support@sahachari.app")
              }
            >
              <View style={styles.contactIcon}>
                <FontAwesome name="envelope" size={18} color="#4CAF50" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>
                  support@sahachari.app
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Support",
                  "Call the support desk at +91 98765 43210",
                )
              }
            >
              <View style={styles.contactIcon}>
                <FontAwesome name="phone" size={18} color="#4CAF50" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactTitle}>Call Support</Text>
                <Text style={styles.contactSubtitle}>
                  Mon to Sat, 9:00 AM to 6:00 PM
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqItems.map((item) => (
              <View key={item.question} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            ))}
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
    gap: 16,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#1a472a",
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
    marginBottom: 18,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f1f8f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  contactTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a472a",
  },
  contactSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  faqItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8f5e9",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a472a",
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
});
