import { Text, View } from '@/components/Themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  storeId?: {
    name: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
  };
}

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // 🔹 Fetch MY jobs (accepted / picked / etc.)
  const {
    data: myJobs,
    isLoading,
    isError,
  } = useQuery<Order[]>({
    queryKey: ['myJobs'],
    queryFn: () => apiRequest('/delivery/orders?mine=true'),
    enabled: !!token,
  });

  // 🔹 Mark job as delivered
  const deliverMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiRequest(`/delivery/orders/${jobId}/deliver`, {
        method: 'POST',
      }),

    onSuccess: () => {
      Alert.alert('Success', 'Order marked as delivered!');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.message || 'Failed to update order status',
      );
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Orders 🛵</Text>

      {isLoading ? (
        <Text style={styles.subtitle}>Loading your orders...</Text>
      ) : isError ? (
        <Text style={styles.subtitle}>
          Failed to load orders. Try again.
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
              <Text style={styles.jobValue}>₹{job.totalAmount}</Text>
            </View>

            <View style={styles.jobRow}>
              <Text style={styles.jobLabel}>Status</Text>
              <Text style={styles.jobStatus}>{job.status}</Text>
            </View>

            {job.status !== 'DELIVERED' && (
              <TouchableOpacity
                style={styles.deliverButton}
                onPress={() => deliverMutation.mutate(job._id)}
                disabled={deliverMutation.isPending}
              >
                <Text style={styles.deliverButtonText}>
                  {deliverMutation.isPending
                    ? 'Updating...'
                    : 'Mark as Delivered'}
                </Text>
              </TouchableOpacity>
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

  jobStore: { fontSize: 16, fontWeight: '700' },
  jobAddress: { fontSize: 14, color: '#666', marginVertical: 6 },

  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  jobLabel: { fontSize: 13, color: '#666' },
  jobValue: { fontSize: 14, fontWeight: '600' },

  jobStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },

  deliverButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },

  deliverButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
