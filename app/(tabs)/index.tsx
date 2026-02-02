import { Text, View } from '@/components/Themed';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

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

  /* ================= UI ================= */

  return (
    <LinearGradient
      colors={['#f0fdf4', '#dcfce7', '#f0fdf4']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Available Jobs 🚴‍♂️
        </Text>

        {jobsLoading ? (
          <ActivityIndicator
            size="large"
            color="#10b981"
            style={{ marginTop: 40 }}
          />
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <Text style={styles.jobStore}>
                {job.storeId?.name ?? 'Store'}
              </Text>

              <Text style={styles.jobAddress}>
                {job.deliveryAddress?.street ?? '—'},{' '}
                {job.deliveryAddress?.city ?? ''}
              </Text>

              <View style={styles.jobRow}>
                <Text style={styles.jobLabel}>
                  Amount
                </Text>
                <Text style={styles.jobValue}>
                  ₹{job.totalAmount}
                </Text>
              </View>

              <View style={styles.jobRow}>
                <Text style={styles.jobLabel}>
                  Status
                </Text>
                <Text style={styles.jobStatus}>
                  {job.status}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  acceptJobMutation.isPending &&
                    styles.disabledButton,
                ]}
                onPress={() =>
                  acceptJobMutation.mutate(job._id)
                }
                disabled={acceptJobMutation.isPending}
                activeOpacity={0.85}
              >
                {acceptJobMutation.isPending ? (
                  <ActivityIndicator
                    color="#ffffff"
                    size="small"
                  />
                ) : (
                  <Text style={styles.acceptButtonText}>
                    Accept Job
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.subtitle}>
            No jobs available right now
          </Text>
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

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 20,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },

  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },

  jobStore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },

  jobAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginVertical: 6,
  },

  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  jobLabel: {
    fontSize: 13,
    color: '#6b7280',
  },

  jobValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  jobStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },

  acceptButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#9ca3af',
  },

  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
