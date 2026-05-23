import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import QRCode from "react-native-qrcode-svg";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

/* ================= TYPES ================= */

type OrderStatus = "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "FAILED";

interface Store {
  name: string;
  address?: string;
}

interface DeliveryAddress {
  street: string;
  city: string;
  zipCode?: string;
  phone?: string;
  notes?: string;
}

interface User {
  name: string;
  email: string;
}

interface Order {
  _id: string;
  checkoutId?: string;
  status: OrderStatus;
  totalAmount: number;

  userId?: User;

  storeId?: Store;

  deliveryAddress?: DeliveryAddress;

  pickupAddress?: string;

  upiId?: string;
}

interface PaymentResponse {
  checkoutId: string;
  paymentRs: number;
  status?: string;
  upiId?: string;
}

/* ================= STATUS ================= */

const STATUS_STEPS = ["ACCEPTED", "PICKED_UP", "DELIVERED"];

const STATUS_CONFIG = {
  ACCEPTED: {
    color: "#f59e0b",
    icon: "check-circle",
    label: "Accepted",
  },

  PICKED_UP: {
    color: "#8b5cf6",
    icon: "motorcycle",
    label: "Picked Up",
  },

  DELIVERED: {
    color: "#16a34a",
    icon: "check-circle",
    label: "Delivered",
  },

  FAILED: {
    color: "#dc2626",
    icon: "times-circle",
    label: "Failed",
  },
};

/* ================= SCREEN ================= */

export default function DeliveryOrdersScreen() {
  const { token } = useAuth();

  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const [showQR, setShowQR] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  const [creatingPayment, setCreatingPayment] = useState(false);

  /* ================= FETCH ORDERS ================= */

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["myJobs"],

    queryFn: () => apiRequest("/delivery/orders?mine=true"),

    enabled: !!token,
  });

  /* ================= REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);

    await refetch();

    setRefreshing(false);
  };

  /* ================= STATUS MUTATION ================= */

  const statusMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: string;
      action: "pickup" | "deliver" | "fail";
    }) =>
      apiRequest(`/delivery/orders/${jobId}/${action}`, {
        method: "POST",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myJobs"],
      });
    },

    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to update order");
    },
  });

  /* ================= PAYMENT ================= */

  const createPayment = async (order: Order) => {
    try {
      setCreatingPayment(true);

      if (!order.checkoutId) {
        Alert.alert("Error", "Checkout ID missing");
        return;
      }

      // STEP 1: FETCH UPI DETAILS FIRST
      const upiRes = (await apiRequest(`/upi-collection/order/${order._id}`, {
        method: "GET",
      })) as {
        upiId?: string;
        name?: string;
        phoneNumber?: string;
      };

      console.log("UPI RESPONSE =>", upiRes);

      // VALIDATE UPI
      if (!upiRes?.upiId || typeof upiRes.upiId !== "string") {
        Alert.alert("Error", "UPI ID not found");
        return;
      }

      // STEP 2: CREATE PAYMENT TRANSACTION WITH UPI ID
      const paymentRes = (await apiRequest("/payment-transactions", {
        method: "POST",

        body: JSON.stringify({
          paymentRs: order.totalAmount,
          checkoutId: order.checkoutId,
          upiId: upiRes.upiId,
        }),
      })) as PaymentResponse;

      console.log("PAYMENT RESPONSE =>", paymentRes);

      // STEP 3: SAVE DATA
      setPayment({
        ...paymentRes,
        upiId: upiRes.upiId,
      });

      setSelectedOrder({
        ...order,
        upiId: upiRes.upiId,
      });

      // STEP 4: OPEN QR
      setShowQR(true);
    } catch (err: any) {
      console.log("PAYMENT ERROR =>", err);

      Alert.alert("Error", err?.message || "Unable to create payment");
    } finally {
      setCreatingPayment(false);
    }
  };

  /* ================= HELPERS ================= */

  const getCurrentStepIndex = (status: string) => {
    if (status === "FAILED") {
      return -1;
    }

    return STATUS_STEPS.indexOf(status);
  };

  /* ================= ACTION BUTTONS ================= */

  const renderActionButtons = (order: Order) => {
    if (order.status === "ACCEPTED") {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.85}
          onPress={() =>
            statusMutation.mutate({
              jobId: order._id,
              action: "pickup",
            })
          }
        >
          <LinearGradient
            colors={["#fbbf24", "#f59e0b"]}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.buttonText}>Pick Up Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (order.status === "PICKED_UP") {
      return (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => !creatingPayment && createPayment(order)}
            disabled={creatingPayment}
          >
            <LinearGradient
              colors={["#22c55e", "#15803d"]}
              style={styles.actionButtonGradient}
            >
              {creatingPayment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Collect Payment</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.failButton}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert("Confirm", "Mark order as FAILED?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },

                {
                  text: "Yes",

                  onPress: () =>
                    statusMutation.mutate({
                      jobId: order._id,
                      action: "fail",
                    }),
                },
              ])
            }
          >
            <Text style={styles.buttonText}>Mark Failed</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  /* ================= RENDER CARD ================= */

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const currentStep = getCurrentStepIndex(order.status);

    const isFailed = currentStep === -1;

    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <View style={styles.orderCard}>
        <LinearGradient
          colors={["#ffffff", "#f8fff8"]}
          style={styles.orderCardGradient}
        >
          <View style={styles.orderHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdLabel}>Order ID</Text>

              <Text style={styles.orderId}>
                {order.checkoutId || order._id}
              </Text>

              <LinearGradient
                colors={[statusConfig.color, statusConfig.color + "DD"]}
                style={styles.statusBadge}
              >
                <FontAwesome
                  name={statusConfig.icon as any}
                  size={13}
                  color="#fff"
                />

                <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <FontAwesome name="user" size={16} color="#16a34a" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Customer</Text>

              <Text style={styles.infoValue}>
                {order.userId?.name || "Customer"}
              </Text>

              <Text style={styles.infoSub}>{order.userId?.email || ""}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <FontAwesome name="shopping-bag" size={16} color="#f59e0b" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Pickup Address</Text>

              <Text style={styles.infoValue}>
                {order.pickupAddress ||
                  order.storeId?.address ||
                  "Store Address"}
              </Text>
            </View>
          </View>

          {(order.status === "PICKED_UP" || order.status === "DELIVERED") && (
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <FontAwesome name="map-marker" size={16} color="#3b82f6" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Delivery Address</Text>

                <Text style={styles.infoValue}>
                  {order.deliveryAddress?.street || "Delivery Address"}
                </Text>

                {order.deliveryAddress?.city ? (
                  <Text style={styles.infoSub}>
                    {order.deliveryAddress.city}
                    {order.deliveryAddress.zipCode
                      ? `, ${order.deliveryAddress.zipCode}`
                      : ""}
                  </Text>
                ) : null}

                {order.deliveryAddress?.phone ? (
                  <Text style={styles.infoSub}>
                    {order.deliveryAddress.phone}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Delivery Amount</Text>

            <Text style={styles.amountValue}>₹{order.totalAmount}</Text>
          </View>

          {order.status !== "DELIVERED" && renderActionButtons(order)}
        </LinearGradient>
      </View>
    );
  };

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />

        <Text style={styles.loadingText}>Loading Orders...</Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" && (
  <StatusBar barStyle="light-content" />
)}

      <LinearGradient colors={["#16a34a", "#166534"]} style={styles.navbar}>
        <View>
          <Text style={styles.navTitle}>My Deliveries</Text>

          <Text style={styles.navSubtitle}>
            {orders?.length || 0} Active Orders
          </Text>
        </View>

        <TouchableOpacity style={styles.navRefreshButton} onPress={onRefresh}>
          <FontAwesome name="refresh" size={16} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={orders || []}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16a34a"]}
          />
        }
      />

      {/* ================= QR MODAL ================= */}

      <Modal
  visible={showQR}
  transparent
  animationType="fade"
  onRequestClose={() => setShowQR(false)}
>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Collect Payment</Text>

            {payment && (
              <>
                <QRCode
                  size={220}
                  value={`upi://pay?pa=${encodeURIComponent(
                    payment?.upiId || "",
                  )}&pn=${encodeURIComponent(
                    "Store Payment",
                  )}&am=${encodeURIComponent(
                    String(payment?.paymentRs || 0),
                  )}&cu=INR&tr=${encodeURIComponent(
                    payment?.checkoutId || "",
                  )}`}
                />

                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#374151",
                  }}
                >
                  UPI ID: {payment?.upiId}
                </Text>

                <Text style={styles.amountText}>₹{payment.paymentRs}</Text>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={async () => {
                    try {
                      await apiRequest(
                        `/payment-transactions/${payment.checkoutId}/status`,
                        {
                          method: "PATCH",

                          body: JSON.stringify({
                            status: "SUCCESS",
                          }),
                        },
                      );

                      await statusMutation.mutateAsync({
                        jobId: selectedOrder!._id,

                        action: "deliver",
                      });

                      setShowQR(false);

                      setPayment(null);

                      setSelectedOrder(null);

                      Alert.alert("Success", "Payment received");
                    } catch (err: any) {
                      Alert.alert("Error", err.message);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Payment Received</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    marginTop: 12,
                  }}
                  onPress={() => {
                    setShowQR(false);

                    setPayment(null);

                    setSelectedOrder(null);
                  }}
                >
                  <Text
                    style={{
                      color: "red",
                      fontWeight: "700",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  navbar: {
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 18,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  navTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  navSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },

  navRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor: "rgba(255,255,255,0.22)",

    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    padding: 14,
    paddingBottom: 80,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },

  orderCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  orderCardGradient: {
    padding: 18,
  },

  orderHeader: {
    marginBottom: 16,
  },

  orderIdLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
    fontWeight: "700",
  },

  orderId: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",

    marginTop: 10,

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 999,
  },

  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "#f3f4f6",

    borderRadius: 14,

    padding: 12,

    marginBottom: 12,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: "#ecfdf5",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  infoTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  infoSub: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 13,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 18,
    paddingBottom: 18,
  },

  amountLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "700",
  },

  amountValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#16a34a",
  },

  actionButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },

  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },

  failButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",

    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    backgroundColor: "#fff",
    width: "86%",
    maxWidth: 420,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 24,
    color: "#0f172a",
  },

  amountText: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: "900",
    color: "#16a34a",
  },

  confirmButton: {
    marginTop: 28,
    backgroundColor: "#16a34a",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    ...(Platform.OS === "web" && {
    cursor: "pointer",
  }),
  },
});
