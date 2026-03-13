import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";
import { deliveryTheme } from "../constants/DeliveryTheme";

const { colors, spacing, radius } = deliveryTheme;

type LabeledTextInputProps = TextInputProps & {
  label: string;
};

export default function LabeledTextInput({
  label,
  ...inputProps
}: LabeledTextInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.label,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
