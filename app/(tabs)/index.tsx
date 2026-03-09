import { Text, View } from '@/components/Themed';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import { RefreshControl } from "react-native";
import { useState } from "react";
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
    queryKey: ['availableJobs'],
    queryFn: () =>
      apiRequest('/delivery/orders?status=READY'),
    enabled: !!token,
  });

  /* ---------- ACCEPT JOB ---------- */
  const acceptJobMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiRequest(`/delivery/orders/${jobId}/accept`, {
        method: 'POST',
      }),

    onSuccess: () => {
      Alert.alert('Success', 'Job accepted successfully!');
      queryClient.invalidateQueries({
        queryKey: ['availableJobs'],
      });
      queryClient.invalidateQueries({
        queryKey: ['myJobs'],
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message || 'Failed to accept the job',
      );
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
      colors={['#f8fffe', '#ffffff', '#f0fdf9']}
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
            {jobs.length} {jobs.length === 1 ? 'delivery' : 'deliveries'} ready
          </Text>
        </View>

        {jobsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#4CAF50"
            />
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
                    {job.storeId?.name ?? 'Store'}
                  </Text>
                  <Text style={styles.jobAddress}>
                    {job.deliveryAddress?.street ?? '—'},{' '}
                    {job.deliveryAddress?.city ?? ''}
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
                  colors={acceptJobMutation.isPending 
                    ? ['#a5d6a7', '#81c784'] 
                    : ['#7ed957', '#4CAF50', '#2e7d32']}
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
    padding: 20,
    paddingBottom: 40,
  },

  headerContainer: {
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a472a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  loadingContainer: {
    alignItems: 'center',
    marginTop: 60,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f1f8f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  storeIcon: {
    fontSize: 28,
  },

  storeInfo: {
    flex: 1,
  },

  jobStore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a472a',
    marginBottom: 4,
  },

  jobAddress: {
    fontSize: 14,
    color: '#66bb6a',
    fontWeight: '400',
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
  },

  detailsContainer: {
    marginBottom: 18,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a472a',
  },

  statusBadge: {
    backgroundColor: '#f1f8f4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },

  acceptButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a472a',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 15,
    color: '#66bb6a',
    textAlign: 'center',
    lineHeight: 22,
  },
});