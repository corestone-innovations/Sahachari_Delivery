import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SETTINGS_STORAGE_KEY = "delivery_app_settings";

type AppSettings = {
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalMessages: boolean;
  emailReceipts: boolean;
};

const defaultSettings: AppSettings = {
  pushNotifications: true,
  orderUpdates: true,
  promotionalMessages: false,
  emailReceipts: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
        }
      } catch {
        Alert.alert("Settings", "Unable to load saved settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    try {
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(nextSettings),
      );
    } catch {
      setSettings(settings);
      Alert.alert("Settings", "Unable to save your preference.");
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
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your delivery app preferences
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.stateText}>Loading settings...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <PreferenceRow
                icon="bell"
                title="Push Notifications"
                subtitle="Receive delivery updates on your device"
                value={settings.pushNotifications}
                onValueChange={(value) =>
                  updateSetting("pushNotifications", value)
                }
              />
              <Divider />
              <PreferenceRow
                icon="truck"
                title="Order Status Alerts"
                subtitle="Get notified when orders are assigned or updated"
                value={settings.orderUpdates}
                onValueChange={(value) => updateSetting("orderUpdates", value)}
              />
              <Divider />
              <PreferenceRow
                icon="gift"
                title="Promotional Messages"
                subtitle="Receive offers and campaigns from the app"
                value={settings.promotionalMessages}
                onValueChange={(value) =>
                  updateSetting("promotionalMessages", value)
                }
              />
              <Divider />
              <PreferenceRow
                icon="envelope"
                title="Email Receipts"
                subtitle="Get booking and payment confirmations by email"
                value={settings.emailReceipts}
                onValueChange={(value) => updateSetting("emailReceipts", value)}
              />
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

function PreferenceRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={18} color="#4CAF50" />
      </View>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d1d5db", true: "#a5d6a7" }}
        thumbColor={value ? "#2e7d32" : "#f8fafc"}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f1f8f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  preferenceContent: {
    flex: 1,
    paddingRight: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a472a",
  },
  preferenceSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8f5e9",
    marginVertical: 16,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    marginTop: 12,
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "500",
  },
});
