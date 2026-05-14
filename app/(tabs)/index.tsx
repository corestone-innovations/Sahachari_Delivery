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
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";
/* ================= TYPES ================= */

type Job = {
  _id: string;
  status: string;
  totalAmount: number;
  storeId?: {
    name?: string;
  };
  deliveryAddress?: {
    street?: string;
    city?: string;
  };
};

/* ================= SCREEN ================= */

export default function TabOneScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  /* ---------- FETCH AVAILABLE JOBS ---------- */
  const {
    data: jobs = [], // ✅ default empty array
    isLoading: jobsLoading,
    refetch,
  } = useQuery<Job[]>({
    queryKey: ["availableJobs"],
    queryFn: () => apiRequest("/delivery/orders?status=READY"),
    enabled: !!token,
  });

  /* ---------- ACCEPT JOB ---------- */
  const acceptJobMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiRequest(`/delivery/orders/${jobId}/accept`, {
        method: "POST",
      }),

    onSuccess: () => {
      Alert.alert("Success", "Job accepted successfully!");
      queryClient.invalidateQueries({
        queryKey: ["availableJobs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["myJobs"],
      });
    },

    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to accept the job");
    },
  });
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
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Available Jobs</Text>
          <Text style={styles.subtitle}>
            {jobs.length} {jobs.length === 1 ? "delivery" : "deliveries"} ready
          </Text>
        </View>

        {jobsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View style={styles.storeIconContainer}>
                  <Text style={styles.storeIcon}>🏪</Text>
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.jobStore}>
                    {job.storeId?.name ?? "Store"}
                  </Text>
                  <Text style={styles.jobAddress}>
                    {job.deliveryAddress?.street ?? "—"},{" "}
                    {job.deliveryAddress?.city ?? ""}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Amount</Text>
                  <Text style={styles.detailValue}>₹{job.totalAmount}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{job.status}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => acceptJobMutation.mutate(job._id)}
                disabled={acceptJobMutation.isPending}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    acceptJobMutation.isPending
                      ? ["#a5d6a7", "#81c784"]
                      : ["#7ed957", "#4CAF50", "#2e7d32"]
                  }
                  style={styles.acceptButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {acceptJobMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.acceptButtonText}>Accept Job</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for new deliveries
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  headerContainer: {
    marginBottom: 28,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  loadingContainer: {
    alignItems: "center",
    marginTop: 60,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },

  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f4f8",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  storeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  storeIcon: {
    fontSize: 32,
  },

  storeInfo: {
    flex: 1,
  },

  jobStore: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.3,
  },

  jobAddress: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f4f8",
    marginBottom: 18,
  },

  detailsContainer: {
    marginBottom: 20,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  detailValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  statusBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#a7f3d0",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.4,
  },

  acceptButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  emptySubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
});
