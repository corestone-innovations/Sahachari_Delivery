import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deliveryTheme } from "../constants/DeliveryTheme";

const { colors } = deliveryTheme;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.textPrimary, colors.accentDark, colors.accent]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>To Sahachari Delivery Partner App</Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.primaryBtnText}>Register</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/login")}
            >
              LOGIN
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.whiteTint,
    borderWidth: 1.5,
    borderColor: colors.whiteBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 39,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.whiteSoft,
    fontWeight: "500",
  },
  actionsSection: {
    paddingBottom: 20,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: colors.brandOverlay,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  footerText: {
    textAlign: "center",
    fontSize: 18,
    color: colors.whiteStrong,
    fontWeight: "600",
  },
  footerLink: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
