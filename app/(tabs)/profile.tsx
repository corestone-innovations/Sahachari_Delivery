import { Text, View } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
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
  profilePicture?: string;

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

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user?.profilePicture) {
      setPhotoUri(user.profilePicture);
    }
  }, [user?.profilePicture]);

  const pickProfilePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos to update your profile picture.",
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if ((pickerResult as any).canceled) {
        return;
      }

      const selectedAsset = Array.isArray((pickerResult as any).assets)
        ? (pickerResult as any).assets[0]
        : (pickerResult as any);

      const uri = selectedAsset?.uri;
      if (!uri) {
        return;
      }

      setPhotoUri(uri);

      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

      const formData = new FormData();
      formData.append("photo", {
        uri,
        name: filename,
        type,
      } as any);

      setUploadingPhoto(true);
      await apiRequest("/users/update-me", {
        method: "PATCH",
        body: formData,
      });

      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      Alert.alert("Success", "Profile picture updated!");
    } catch (error: any) {
      Alert.alert("Upload Failed", error?.message || "Unable to update photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

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

  const isSaveDisabled =
    updateMutation.isPending ||
    !editValue.trim() ||
    (editingField === "mobileNumber" && !/^[0-9]{10}$/.test(editValue.trim()));

  const handleSave = () => {
    if (!editingField) return;

    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      Alert.alert("Validation", "This field is required.");
      return;
    }

    if (editingField === "mobileNumber" && !/^[0-9]{10}$/.test(trimmedValue)) {
      Alert.alert("Validation", "Please enter a valid 10-digit mobile number.");
      return;
    }

    updateMutation.mutate({
      [editingField]: trimmedValue,
    });
  };

  const openEdit = (field: EditableField, currentVal: string = "") => {
    setEditingField(field);

    setEditValue(currentVal);

    setEditModalVisible(true);
  };

  return (
    <LinearGradient
      colors={["#f8fffe", "#f8fdfb", "#effaf4"]}
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
        <View style={styles.profileHeaderCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={pickProfilePhoto}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6ccf85", "#4CAF50"]}
              style={styles.avatarGradient}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <FontAwesome name="user" size={42} color="#FFFFFF" />
              )}
            </LinearGradient>

            <View style={styles.cameraBadge}>
              <FontAwesome name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

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

        <Text style={styles.sectionLabel}>Contact Information</Text>
        <Text style={styles.sectionDescription}>
          Keep your phone number and address up to date for delivery
          notifications.
        </Text>

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
          onPress={() => {
            if (Platform.OS === "web") {
              const confirmLogout = window.confirm("Are you sure you want to logout?");
              if (confirmLogout) {
                clearAuthToken().then(() => {
                  router.replace("/login");
                });
              }
            } else {
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
              ]);
            }
          }}
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
                style={[styles.saveBtn, isSaveDisabled && { opacity: 0.65 }]}
                onPress={handleSave}
                disabled={isSaveDisabled}
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
      style={[styles.infoRow, styles.rowItem]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.iconBox}>
        <FontAwesome name={icon} size={18} color="#4CAF50" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>

      <FontAwesome name="angle-right" size={20} color="#94a3b8" />
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
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: "#e6f4ea",
  },

  avatarGradient: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  headerInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  userEmail: {
    fontSize: 14,
    color: "#475569",
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
    fontSize: 13,
    fontWeight: "900",
    color: "#16a34a",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  sectionDescription: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
    lineHeight: 20,
  },

  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: "#eef2ff",
    marginBottom: 28,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  rowItem: {
    backgroundColor: "#f8fdf8",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dcfce7",
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
    borderRadius: 18,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 10,
    elevation: 2,
    shadowColor: "#b91c1c",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 8,
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

  avatarWrapper: {
    position: "relative",
    marginRight: 20,
  },

  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  cameraBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});
