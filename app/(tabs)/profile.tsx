import { Text, View } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

/* ================= TYPES ================= */

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  address?: string;
  mobileNumber?: string;

  // PINCODES
  serviceablePincodes?: string[];
};

type EditableField = "address" | "mobileNumber";

/* ================= SCREEN ================= */

export default function ProfileScreen() {
  const { token, clearAuthToken } = useAuth();

  const router = useRouter();

  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const [editValue, setEditValue] = useState("");

  /* ---------- FETCH PROFILE ---------- */

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ["myProfile"],

    queryFn: () => apiRequest("/users/me"),

    enabled: !!token,
  });

  /* ---------- UPDATE MUTATION ---------- */

  const updateMutation = useMutation({
    mutationFn: (updateData: { [key: string]: string }) =>
      apiRequest("/users/update-me", {
        method: "PATCH",

        body: JSON.stringify(updateData),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myProfile"],
      });

      setEditModalVisible(false);

      Alert.alert("Success", "Profile updated!");
    },

    onError: (error: any) => {
      Alert.alert("Update Failed", error.message || "Something went wrong");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);

    await refetch();

    setRefreshing(false);
  };

  const openEdit = (field: EditableField, currentVal: string = "") => {
    setEditingField(field);

    setEditValue(currentVal);

    setEditModalVisible(true);
  };

  return (
    <LinearGradient
      colors={["#f8fffe", "#ffffff", "#f0fdf9"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
          />
        }
      >
        {/* ---------- PROFILE HEADER ---------- */}

        <View style={styles.profileHeaderCard}>
          <LinearGradient
            colors={["#7ed957", "#4CAF50"]}
            style={styles.avatarGradient}
          >
            <FontAwesome name="user" size={40} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user?.name || "User"}</Text>

            <Text style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role?.toUpperCase() || "MEMBER"}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------- CONTACT INFO ---------- */}

        <Text style={styles.sectionLabel}>Contact Information</Text>

        <View style={styles.detailsCard}>
          {/* MOBILE */}

          <EditableRow
            icon="phone"
            label="Mobile Number"
            value={user?.mobileNumber || "Not set"}
            onPress={() => openEdit("mobileNumber", user?.mobileNumber)}
          />

          <View style={styles.divider} />

          {/* ADDRESS */}

          <EditableRow
            icon="map-marker"
            label="Primary Address"
            value={user?.address || "Add your address"}
            onPress={() => openEdit("address", user?.address)}
          />

          <View style={styles.divider} />

          {/* PINCODE DISPLAY */}

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <FontAwesome name="map-pin" size={16} color="#4CAF50" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Serviceable Pincode</Text>

              <Text style={styles.infoValue}>
                {user?.serviceablePincodes?.length
                  ? user.serviceablePincodes.join(", ")
                  : "Not Available"}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------- LOGOUT ---------- */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert("Logout", "Are you sure?", [
              {
                text: "Cancel",
              },

              {
                text: "Logout",

                style: "destructive",

                onPress: async () => {
                  await clearAuthToken();

                  router.replace("/login");
                },
              },
            ])
          }
        >
          <FontAwesome name="sign-out" size={18} color="#dc2626" />

          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ---------- EDIT MODAL ---------- */}

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update {editingField === "mobileNumber" ? "Mobile" : "Address"}
            </Text>

            <TextInput
              style={[
                styles.modalInput,

                editingField === "address" && {
                  minHeight: 100,
                  textAlignVertical: "top",
                },
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Type here..."
              multiline={editingField === "address"}
              keyboardType={
                editingField === "mobileNumber" ? "phone-pad" : "default"
              }
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() =>
                  editingField &&
                  updateMutation.mutate({
                    [editingField]: editValue,
                  })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ================= ROW COMPONENT ================= */

function EditableRow({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <FontAwesome name={icon} size={16} color="#4CAF50" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>

      <FontAwesome name="angle-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  profileHeaderCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#f0f4f8",
  },

  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  headerInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  userEmail: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    fontWeight: "500",
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },

  roleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.6,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4CAF50",
    marginBottom: 14,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#f0f4f8",
    marginBottom: 24,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },

  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fecaca",
    gap: 10,
    backgroundColor: "#fef2f2",
    elevation: 1,
    shadowColor: "#dc2626",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  logoutText: {
    color: "#dc2626",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 45,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  modalInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 24,
    color: "#111827",
    fontWeight: "500",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 14,
  },

  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cancelBtnText: {
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 16,
  },

  saveBtn: {
    flex: 1.5,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
