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
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  zone?: string;
  location?: string;
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

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const [showQR, setShowQR] = useState(false);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  const [creatingPayment, setCreatingPayment] = useState(false);

  const [processingCash, setProcessingCash] = useState(false);

  const [confirmingPayment, setConfirmingPayment] = useState(false);

  /* ================= FETCH ORDERS ================= */

  const {
    data: orders = [],
    isLoading,
    refetch,
    error,
  } = useQuery<Order[]>({
    queryKey: ["myJobs"],

    queryFn: async () => {
      try {
        const res = await apiRequest<Order[]>("/delivery/orders?mine=true");
        return res || [];
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        return [];
      }
    },

    enabled: !!token,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
      showAlert("Error", error?.message || "Failed to update order");
    },
  });

  /* ================= PAYMENT ================= */

  const createPayment = async (order: Order) => {
    try {
      setShowPaymentOptions(false);

      if (payment?.checkoutId === order.checkoutId) {
        setSelectedOrder(order);
        setShowQR(true);
        return;
      }

      setCreatingPayment(true);
      setPayment(null);

      if (!order.checkoutId) {
        showAlert("Error", "Checkout ID missing");
        setCreatingPayment(false);
        return;
      }

      let upiId: string | undefined;

      // STEP 1: TRY TO FETCH UPI DETAILS - Try multiple endpoints
      try {
        // Try /upi-collection/checkout first (by checkoutId)
        try {
          const upiResCheckout = (await apiRequest(
            `/upi-collection/checkout/${order.checkoutId}`,
            { method: "GET" },
          )) as { upiId?: string };

          console.log("UPI RESPONSE (by checkout):", upiResCheckout);
          if (upiResCheckout?.upiId) {
            upiId = upiResCheckout.upiId;
          }
        } catch (e1: any) {
          console.log("Checkout endpoint failed, trying order endpoint");

          // Fallback to /upi-collection/order
          const upiResOrder = (await apiRequest(
            `/upi-collection/order/${order._id}`,
            { method: "GET" },
          )) as { upiId?: string };

          console.log("UPI RESPONSE (by order):", upiResOrder);
          if (upiResOrder?.upiId) {
            upiId = upiResOrder.upiId;
          }
        }
      } catch (err: any) {
        console.warn("UPI fetch failed:", err?.message);
        // Continue - payment might work without separate UPI fetch
      }

      if (!upiId) {
        showAlert("Error", "UPI ID not found. Cannot generate QR code.");
        return;
      }

      // STEP 2: CREATE PAYMENT TRANSACTION WITH UPI ID
      let paymentRes: PaymentResponse | null = null;
      let paymentErrorMessage: string | null = null;

      try {
        paymentRes = (await apiRequest("/payment-transactions", {
          method: "POST",
          body: JSON.stringify({
            paymentRs: order.totalAmount,
            checkoutId: order.checkoutId,
            upiId: upiId,
          }),
        })) as PaymentResponse;

        console.log("PAYMENT RESPONSE =>", paymentRes);
      } catch (err: any) {
        paymentErrorMessage =
          err?.message || "Unable to create payment transaction.";
        console.warn(
          "Payment creation failed, using UPI ID QR:",
          paymentErrorMessage,
        );
      }

      const finalPayment: PaymentResponse = paymentRes
        ? { ...paymentRes, upiId: upiId }
        : {
            checkoutId: order.checkoutId,
            paymentRs: order.totalAmount,
            upiId,
          };

      setPayment(finalPayment);
      setSelectedOrder({
        ...order,
        upiId: upiId,
      });
      setShowQR(true);

      if (paymentErrorMessage) {
        showAlert(
          "Notice",
          "QR code generated from UPI ID. Payment transaction creation failed, but the QR is still usable.",
        );
      }
    } catch (err: any) {
      console.log("PAYMENT ERROR =>", err);
      showAlert("Error", err?.message || "Unable to create payment");
    } finally {
      setCreatingPayment(false);
    }
  };

  /* ================= HELPERS ================= */

  const collectCashPayment = async (order: Order) => {
    if (Platform.OS === "web") {
      const confirmCash = window.confirm("Confirm cash payment received and mark order delivered?");
      if (confirmCash) {
        try {
          setProcessingCash(true);

          await statusMutation.mutateAsync({
            jobId: order._id,
            action: "deliver",
          });

          setShowPaymentOptions(false);
          setSelectedOrder(null);

          showAlert("Success", "Cash payment collected and order completed");
        } catch (err: any) {
          showAlert("Error", err?.message || "Failed to update order status");
        } finally {
          setProcessingCash(false);
        }
      }
    } else {
      Alert.alert(
        "Confirm",
        "Confirm cash payment received and mark order delivered?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: async () => {
              try {
                setProcessingCash(true);

                await statusMutation.mutateAsync({
                  jobId: order._id,
                  action: "deliver",
                });

                setShowPaymentOptions(false);
                setSelectedOrder(null);

                Alert.alert(
                  "Success",
                  "Cash payment collected and order completed",
                );
              } catch (err: any) {
                Alert.alert(
                  "Error",
                  err?.message || "Failed to update order status",
                );
              } finally {
                setProcessingCash(false);
              }
            },
          },
        ],
      );
    }
  };

  const getCurrentStepIndex = (status: string) => {
    if (status === "FAILED") {
      return -1;
    }

    return STATUS_STEPS.indexOf(status);
  };

  /* ================= ACTION BUTTONS ================= */

  const renderActionButtons = (order: Order) => {
    if (order.status === "ACCEPTED") {
      const isPickingUp = statusMutation.isPending && statusMutation.variables?.jobId === order._id && statusMutation.variables?.action === "pickup";

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
          disabled={statusMutation.isPending}
        >
          <LinearGradient
            colors={["#fbbf24", "#f59e0b"]}
            style={styles.actionButtonGradient}
          >
            {isPickingUp ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pick Up Order</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (order.status === "PICKED_UP") {
      const isDelivering = statusMutation.isPending && statusMutation.variables?.jobId === order._id && statusMutation.variables?.action === "deliver";
      const isFailing = statusMutation.isPending && statusMutation.variables?.jobId === order._id && statusMutation.variables?.action === "fail";

      return (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedOrder(order);
              if (payment?.checkoutId !== order.checkoutId) {
                setPayment(null);
              }
              setShowPaymentOptions(true);
            }}
            disabled={creatingPayment || processingCash || statusMutation.isPending}
          >
            <LinearGradient
              colors={["#22c55e", "#15803d"]}
              style={styles.actionButtonGradient}
            >
              {creatingPayment || processingCash || isDelivering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Collect Payment</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.failButton, (isFailing || statusMutation.isPending) && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={() => {
              if (Platform.OS === "web") {
                const confirmFail = window.confirm("Mark order as FAILED?");
                if (confirmFail) {
                  statusMutation.mutate({
                    jobId: order._id,
                    action: "fail",
                  });
                }
              } else {
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
                ]);
              }
            }}
            disabled={statusMutation.isPending}
          >
            {isFailing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark Failed</Text>
            )}
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

                {order.deliveryAddress?.location ? (
                  <Text style={styles.infoSub}>
                    Location: {order.deliveryAddress.location}
                  </Text>
                ) : null}

                {order.deliveryAddress?.zone ? (
                  <Text style={styles.infoSub}>
                    Zone: {order.deliveryAddress.zone}
                  </Text>
                ) : null}

                {order.deliveryAddress?.notes ? (
                  <Text style={styles.infoSub}>
                    Notes: {order.deliveryAddress.notes}
                  </Text>
                ) : null}

                {order.deliveryAddress?.phone ? (
                  <Text style={styles.infoSub}>
                    Phone: {order.deliveryAddress.phone}
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
      <StatusBar barStyle="light-content" />

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16a34a"]}
          />
        }
      />

      {/* ================= PAYMENT OPTIONS MODAL ================= */}

      <Modal visible={showPaymentOptions} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Collect Payment</Text>

            <TouchableOpacity
              style={styles.paymentOptionButton}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedOrder) {
                  createPayment(selectedOrder);
                }
              }}
              disabled={creatingPayment || processingCash}
            >
              <Text style={styles.paymentOptionText}>Generate QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOptionButton}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedOrder) {
                  collectCashPayment(selectedOrder);
                }
              }}
              disabled={creatingPayment || processingCash}
            >
              <Text style={styles.paymentOptionText}>Collect Cash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 6 }}
              onPress={() => {
                setShowPaymentOptions(false);
                setSelectedOrder(null);
              }}
            >
              <Text style={{ color: "red", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= QR MODAL ================= */}

      <Modal visible={showQR} transparent animationType="slide">
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
                  style={[styles.confirmButton, (confirmingPayment || statusMutation.isPending) && { opacity: 0.7 }]}
                  disabled={confirmingPayment || statusMutation.isPending}
                  onPress={() => {
                    const handleConfirmReceived = async () => {
                      try {
                        setConfirmingPayment(true);

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

                        showAlert("Success", "Payment received");
                      } catch (err: any) {
                        showAlert("Error", err.message);
                      } finally {
                        setConfirmingPayment(false);
                      }
                    };

                    if (Platform.OS === "web") {
                      if (window.confirm("Confirm payment received and mark order delivered?")) {
                        handleConfirmReceived();
                      }
                    } else {
                      Alert.alert(
                        "Confirm",
                        "Confirm payment received and mark order delivered?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Yes",
                            onPress: handleConfirmReceived,
                          },
                        ],
                      );
                    }
                  }}
                >
                  {confirmingPayment || (statusMutation.isPending && statusMutation.variables?.jobId === selectedOrder?._id) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Payment Received</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    marginTop: 12,
                  }}
                  onPress={() => {
                    setShowQR(false);
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

  paymentOptionButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#ecfdf5",
  },

  paymentOptionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
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
  },
});
