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
} from 'react-native';
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
  storeId?: {
    name: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
  };
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
      action: 'accept' | 'pickup' | 'deliver' | 'fail';
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
    switch (job.status) {
      case 'ACCEPTED':
        return (
          <TouchableOpacity
            style={styles.pickupButton}
            onPress={() =>
              statusMutation.mutate({
                jobId: job._id,
                action: 'pickup',
              })
            }
            disabled={statusMutation.isPending}
          >
            <Text style={styles.buttonText}>Pick Up Order</Text>
          </TouchableOpacity>
        );

      case 'PICKED_UP':
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
              disabled={statusMutation.isPending}
            >
              <Text style={styles.buttonText}>
                Mark as Delivered
              </Text>
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
              disabled={statusMutation.isPending}
            >
              <Text style={styles.buttonText}>
                Mark as Failed
              </Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  /* ================= UI ================= */

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Orders 🛵</Text>

      {isLoading ? (
        <Text style={styles.subtitle}>
          Loading your orders...
        </Text>
      ) : isError ? (
        <Text style={styles.subtitle}>
          Failed to load orders.
        </Text>
      ) : myJobs && myJobs.length > 0 ? (
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
                <View style={{ marginTop: 12 }}>
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
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 20 },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },

  jobCard: {
    backgroundColor: '#E6F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  jobStore: {
    fontSize: 16,
    fontWeight: '700',
  },

  jobAddress: {
    fontSize: 14,
    color: '#666',
    marginVertical: 6,
  },

  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  jobLabel: {
    fontSize: 13,
    color: '#666',
  },

  jobValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  jobStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007bff',
  },

  statusDelivered: {
    color: '#28a745',
  },

  statusFailed: {
    color: '#dc3545',
  },

  pickupButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },

  deliverButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },

  failButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
