import { Text, View } from "@/components/Themed";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { deliveryTheme } from "../../constants/DeliveryTheme";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";
/* ================= TYPES ================= */

type OrderStatus = "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "FAILED";

interface Order {
  _id: string;
  status: OrderStatus;
  totalAmount: number;
  storeId?: { name: string };
  deliveryAddress?: { street: string; city: string };
}

const { colors } = deliveryTheme;

/* ================= SCREEN ================= */

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<"ALL" | OrderStatus>("ALL");

  /* ---------- FETCH MY ORDERS ---------- */
  const {
    data: myJobs,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["myJobs"],
    queryFn: () => apiRequest("/delivery/orders?mine=true"),
    enabled: !!token,
  });

  /* ---------- STATUS MUTATION ---------- */
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
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
    },

    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to update order");
    },
  });
  /*refresh */
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Sort orders newest first (by _id, assuming MongoDB ObjectId or timestamp)
  const sortedJobs = myJobs
    ? [...myJobs].sort((a, b) => b._id.localeCompare(a._id))
    : [];
  const visibleJobs =
    activeFilter === "ALL"
      ? sortedJobs
      : sortedJobs.filter((job) => job.status === activeFilter);

  const getStatusText = (status: OrderStatus) => {
    if (status === "PICKED_UP") return "PICKED UP";
    return status;
  };

  const getStatusPillStyle = (status: OrderStatus) => {
    if (status === "DELIVERED")
      return [styles.statusPill, styles.statusDelivered];
    if (status === "FAILED") return [styles.statusPill, styles.statusFailed];
    if (status === "PICKED_UP") return [styles.statusPill, styles.statusPicked];
    return [styles.statusPill, styles.statusAccepted];
  };

  const getStatusPillTextStyle = (status: OrderStatus) => {
    if (status === "DELIVERED")
      return [styles.statusPillText, styles.statusDeliveredText];
    if (status === "FAILED")
      return [styles.statusPillText, styles.statusFailedText];
    if (status === "PICKED_UP")
      return [styles.statusPillText, styles.statusPickedText];
    return [styles.statusPillText, styles.statusAcceptedText];
  };

  /* ---------- ACTION BUTTONS ---------- */
  const renderActions = (job: Order) => {
    if (job.status === "ACCEPTED") {
      return (
        <TouchableOpacity
          onPress={() =>
            statusMutation.mutate({
              jobId: job._id,
              action: "pickup",
            })
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#fbbf24", "#f59e0b", "#d97706"]}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Pick Up Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (job.status === "PICKED_UP") {
      return (
        <>
          <TouchableOpacity
            onPress={() =>
              statusMutation.mutate({
                jobId: job._id,
                action: "deliver",
              })
            }
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7ed957", "#4CAF50", "#2e7d32"]}
              style={styles.actionButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.failButton}
            onPress={() =>
              Alert.alert("Confirm", "Mark this delivery as FAILED?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes",
                  onPress: () =>
                    statusMutation.mutate({
                      jobId: job._id,
                      action: "fail",
                    }),
                },
              ])
            }
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Mark as Failed</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  /* ================= UI ================= */

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
      style={styles.bg}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>
              {visibleJobs?.length || 0} shown of {myJobs?.length || 0}
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(
            ["ALL", "ACCEPTED", "PICKED_UP", "DELIVERED", "FAILED"] as const
          ).map((filter) => {
            const isActive = activeFilter === filter;
            const count =
              filter === "ALL"
                ? myJobs?.length || 0
                : myJobs?.filter((job) => job.status === filter).length || 0;

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter === "PICKED_UP" ? "PICKED UP" : filter}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    isActive && styles.filterCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isActive && styles.filterCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Deliveries</Text>
          <Text style={styles.sectionHint}>Pull to refresh</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>Failed to Load</Text>
            <Text style={styles.emptySubtitle}>
              Unable to fetch your orders
            </Text>
          </View>
        ) : visibleJobs?.length ? (
          visibleJobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <View style={styles.cardTop}>
                <View style={styles.storeBubble}>
                  <Text style={styles.storeBubbleText}>S</Text>
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>
                    {job.storeId?.name ?? "Store"}
                  </Text>
                  <Text style={styles.addressLine}>
                    {job.deliveryAddress?.street}, {job.deliveryAddress?.city}
                  </Text>
                </View>

                <View style={getStatusPillStyle(job.status)}>
                  <Text style={getStatusPillTextStyle(job.status)}>
                    {getStatusText(job.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>ORDER ID</Text>
                  <Text style={styles.metaValue}>
                    #{job._id.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={styles.amountLabel}>Amount</Text>
                  <Text style={styles.amountValue}>₹{job.totalAmount}</Text>
                </View>
              </View>

              {job.status !== "DELIVERED" && job.status !== "FAILED" && (
                <View style={styles.actionsContainer}>
                  {renderActions(job)}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptySubtitle}>
              Accept jobs from the Home tab to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accentDark,
    marginRight: 6,
  },
  liveBadgeText: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: "700",
  },
  filterRow: {
    paddingBottom: 8,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChipActive: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accentDark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.slateText,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 5,
  },
  filterCountActive: {
    backgroundColor: colors.whiteTint,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slateText,
  },
  filterCountTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.helperText,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.accent,
    fontWeight: "500",
  },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  storeBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ecfdf3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  storeBubbleText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.accentDark,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 12,
    color: colors.slateText,
    fontWeight: "400",
    lineHeight: 18,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statusAccepted: {
    backgroundColor: "#ecfdf3",
    borderColor: "#bbf7d0",
  },
  statusAcceptedText: {
    color: "#166534",
  },
  statusPicked: {
    backgroundColor: "#fef9c3",
    borderColor: "#fde68a",
  },
  statusPickedText: {
    color: "#92400e",
  },
  statusDelivered: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  statusDeliveredText: {
    color: "#166534",
  },
  statusFailed: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  statusFailedText: {
    color: "#991b1b",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 10,
  },
  metaLabel: {
    fontSize: 10,
    color: colors.helperText,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 3,
  },
  amountWrap: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 11,
    color: colors.helperText,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  failButton: {
    backgroundColor: "#b91c1c",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#b91c1c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 72,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.slateText,
    textAlign: "center",
    lineHeight: 20,
  },
});
