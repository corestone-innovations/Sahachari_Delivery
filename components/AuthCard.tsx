import React, { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { deliveryTheme } from "../constants/DeliveryTheme";

const { colors, spacing, radius } = deliveryTheme;

export default function AuthCard({ children }: PropsWithChildren) {
  return (
    <View style={styles.card}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inner: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
});
