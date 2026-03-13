import { Text, View } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";
/* ================= TYPES ================= */

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  role?: string;
  image?: string;
  status?: string;
};

/* ================= SCREEN ================= */

export default function ProfileScreen() {
  const { token, clearAuthToken } = useAuth();
  const router = useRouter();

  /* ---------- FETCH PROFILE ---------- */
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: () => apiRequest("/users/me"),
    enabled: !!token,
  });

  /* ---------- LOGOUT ---------- */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearAuthToken();
          router.replace("/signup");
        },
      },
    ]);
  };
  /*refresh */
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  /* ================= UI ================= */

  return (
    <LinearGradient
      colors={["#f8fffe", "#ffffff", "#f0fdf9"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
      >
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <LinearGradient
            colors={["#7ed957", "#4CAF50", "#2e7d32"]}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.avatarInner, { overflow: "hidden" }]}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <FontAwesome name="user" size={46} color="#FFFFFF" />
              )}
            </View>
          </LinearGradient>
          <Text style={styles.title}>{user?.name || "User"}</Text>
          <Text style={styles.subtitle}>{user?.email || "Loading..."}</Text>
        </View>
        {/* ---------- PROFILE CARD ---------- */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : isError || !user ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load profile</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <InfoRow
              icon="user"
              label="Full Name"
              value={user.name || "User"}
            />
            <Divider />

            <InfoRow
              icon="envelope"
              label="Email Address"
              value={user.email || "N/A"}
            />
            <Divider />

            <InfoRow
              icon="phone"
              label="Mobile Number"
              value={user.mobileNumber || "N/A"}
            />
            <Divider />

            {/* <InfoRow
              icon="id-badge"
              label="User ID"
              value={
                user._id ? String(user._id).substring(0, 16) + "..." : "N/A"
              }
            />
            <Divider /> */}

            <InfoRow
              icon="shield"
              label="Account Role"
              value={user.role || "N/A"}
            />
          </View>
        )}
        {/* ---------- ACTIONS ---------- */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <ActionButton
            icon="edit"
            text="Edit Profile"
            onPress={() => router.push("/edit-profile")}
          />
          <ActionButton
            icon="cog"
            text="Settings"
            onPress={() => router.push("/settings")}
          />
          <ActionButton
            icon="question-circle"
            text="Help & Support"
            onPress={() => router.push("/help-support")}
          />
          <ActionButton
            icon="star"
            text="Rate the App"
            onPress={() => router.push("/rate-app")}
          />
        </View>
        {/* ---------- LOGOUT ---------- */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <FontAwesome name="sign-out" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* ================= COMPONENTS ================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={18} color="#4CAF50" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ActionButton({
  icon,
  text,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.actionIconContainer}>
        <FontAwesome name={icon} size={18} color="#4CAF50" />
      </View>
      <Text style={styles.actionText}>{text}</Text>
      <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },

  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  avatarInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a472a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 15,
    color: "#4CAF50",
    fontWeight: "500",
  },

  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  errorText: {
    fontSize: 15,
    color: "#dc2626",
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e8f5e9",
    marginBottom: 28,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f8f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#66bb6a",
    marginBottom: 3,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a472a",
  },

  divider: {
    height: 1,
    backgroundColor: "#e8f5e9",
    marginVertical: 16,
  },

  actionsSection: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingLeft: 4,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },

  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f8f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a472a",
  },

  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#dc2626",
    borderRadius: 16,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  logoutText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  footer: {
    marginTop: 24,
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
