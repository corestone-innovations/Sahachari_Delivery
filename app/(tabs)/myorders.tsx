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

type OrderStatus =
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'FAILED';

interface Order {
  _id: string;
  status: OrderStatus;
  totalAmount: number;
  storeId?: { name: string };
  deliveryAddress?: { street: string; city: string };
}

/* ================= SCREEN ================= */

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  /* ---------- FETCH MY ORDERS ---------- */
  const {
    data: myJobs,
    isLoading,
    isError,
  } = useQuery<Order[]>({
    queryKey: ['myJobs'],
    queryFn: () => apiRequest('/delivery/orders?mine=true'),
    enabled: !!token,
  });

  /* ---------- STATUS MUTATION ---------- */
  const statusMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: string;
      action: 'pickup' | 'deliver' | 'fail';
    }) =>
      apiRequest(`/delivery/orders/${jobId}/${action}`, {
        method: 'POST',
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message || 'Failed to update order',
      );
    },
  });

  /* ---------- ACTION BUTTONS ---------- */
  const renderActions = (job: Order) => {
    if (job.status === 'ACCEPTED') {
      return (
        <TouchableOpacity
          style={styles.pickupButton}
          onPress={() =>
            statusMutation.mutate({
              jobId: job._id,
              action: 'pickup',
            })
          }
        >
          <Text style={styles.buttonText}>Pick Up Order</Text>
        </TouchableOpacity>
      );
    }

    if (job.status === 'PICKED_UP') {
      return (
        <>
          <TouchableOpacity
            style={styles.deliverButton}
            onPress={() =>
              statusMutation.mutate({
                jobId: job._id,
                action: 'deliver',
              })
            }
          >
            <Text style={styles.buttonText}>Mark as Delivered</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.failButton}
            onPress={() =>
              Alert.alert(
                'Confirm',
                'Mark this delivery as FAILED?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Yes',
                    onPress: () =>
                      statusMutation.mutate({
                        jobId: job._id,
                        action: 'fail',
                      }),
                  },
                ],
              )
            }
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
      colors={['#f0fdf4', '#dcfce7', '#f0fdf4']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Orders 🛵</Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#10b981"
            style={{ marginTop: 40 }}
          />
        ) : isError ? (
          <Text style={styles.subtitle}>
            Failed to load orders.
          </Text>
        ) : myJobs?.length ? (
          myJobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <Text style={styles.jobStore}>
                {job.storeId?.name ?? 'Store'}
              </Text>

              <Text style={styles.jobAddress}>
                {job.deliveryAddress?.street},{' '}
                {job.deliveryAddress?.city}
              </Text>

              <View style={styles.jobRow}>
                <Text style={styles.jobLabel}>Amount</Text>
                <Text style={styles.jobValue}>
                  ₹{job.totalAmount}
                </Text>
              </View>

              <View style={styles.jobRow}>
                <Text style={styles.jobLabel}>Status</Text>
                <Text
                  style={[
                    styles.jobStatus,
                    job.status === 'DELIVERED' &&
                      styles.statusDelivered,
                    job.status === 'FAILED' &&
                      styles.statusFailed,
                  ]}
                >
                  {job.status}
                </Text>
              </View>

              {job.status !== 'DELIVERED' &&
                job.status !== 'FAILED' && (
                  <View style={{ marginTop: 16 }}>
                    {renderActions(job)}
                  </View>
                )}
            </View>
          ))
        ) : (
          <Text style={styles.subtitle}>
            You have no active orders.
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

  statusDelivered: {
    color: '#22c55e',
  },

  statusFailed: {
    color: '#ef4444',
  },

  pickupButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  deliverButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  failButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
}); 