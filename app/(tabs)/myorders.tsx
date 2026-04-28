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
import QRCode from 'react-native-qrcode-svg';
import { Modal } from 'react-native';
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
 checkoutId?: string;// 
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
     refetch,
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
  /*refresh */
  const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};
interface PaymentResponse {
  checkoutId: string;   // ✅ MUST be here
  paymentRs: number;
  status?: string;
  upiId?: string;
}
/*payment part*/
const [showQR, setShowQR] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
const [payment, setPayment] = useState<PaymentResponse | null>(null);

const createPayment = async (order: Order) => {
  try {
    // ✅ IMPORTANT: validate before API call
    if (!order.checkoutId) {
      return Alert.alert('Error', 'Checkout ID missing in order');
    }

    const res = await apiRequest('/payment-transactions', {
      method: 'POST',
      body: JSON.stringify({
        paymentRs: order.totalAmount,
        upiId: 'vinayaksukhalal-1@okhdfcbank',
        checkoutId: order.checkoutId, // ✅ safe now
      }),
    }) as PaymentResponse;

    // ✅ extra safety
    if (!res?.checkoutId) {
      return Alert.alert('Error', 'Payment init failed');
    }

    setPayment(res);
    setSelectedOrder(order);
    setShowQR(true);

  } catch (err: any) {
    Alert.alert('Error', err.message);
  }
};
/* ---------- ACTION BUTTONS ---------- */
  const renderActions = (job: Order) => {
    if (job.status === 'ACCEPTED') {
      return (
        <TouchableOpacity
          onPress={() =>
            statusMutation.mutate({
              jobId: job._id,
              action: 'pickup',
            })
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b', '#d97706']}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Pick Up Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (job.status === 'PICKED_UP') {
      return (
        <>
          <TouchableOpacity
            onPress={() => createPayment(job)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7ed957', '#4CAF50', '#2e7d32']}
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
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            {myJobs?.length || 0} active {myJobs?.length === 1 ? 'order' : 'orders'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
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
        ) : myJobs?.length ? (
          myJobs.map((job) => (
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
                    {job.deliveryAddress?.street},{' '}
                    {job.deliveryAddress?.city}
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
                  <Text style={styles.detailLabel}>Order Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      job.status === 'DELIVERED' && styles.statusDeliveredBadge,
                      job.status === 'FAILED' && styles.statusFailedBadge,
                      job.status === 'PICKED_UP' && styles.statusPickedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        job.status === 'DELIVERED' && styles.statusDeliveredText,
                        job.status === 'FAILED' && styles.statusFailedText,
                        job.status === 'PICKED_UP' && styles.statusPickedText,
                      ]}
                    >
                      {job.status}
                    </Text>
                  </View>
                </View>
              </View>

              {job.status !== 'DELIVERED' &&
                job.status !== 'FAILED' && (
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
      <Modal visible={showQR} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Collect Payment</Text>

      {payment && (
        <>
          <QRCode
  value={`upi://pay?pa=${payment.upiId}&pn=Vinayak&am=${payment.paymentRs}&cu=INR&tr=${payment.checkoutId}`}
          />

          <Text style={styles.amountText}>
            ₹{payment.paymentRs}
          </Text>

          <Text style={{ marginTop: 10, fontSize: 12 }}>
            Ask customer to scan & pay
          </Text>

          {/* TEMP CONFIRM BUTTON */}
          <TouchableOpacity
  style={styles.confirmButton}
  onPress={async () => {
    try {
      if (!selectedOrder || !payment?.checkoutId) {
        return Alert.alert('Error', 'Invalid payment');
      }

      await apiRequest(
        `/payment-transactions/${payment.checkoutId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'SUCCESS' }),
        }
      );

      statusMutation.mutate({
        jobId: selectedOrder._id,
        action: 'deliver',
      });

      setShowQR(false);
      setPayment(null);
      setSelectedOrder(null);

      Alert.alert('Success', 'Payment received & order delivered');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }}
>
  <Text style={styles.buttonText}>Payment Received</Text>
</TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>
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
    marginBottom: 6,
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

  statusDeliveredBadge: {
    backgroundColor: '#f1f8f4',
    borderColor: '#a5d6a7',
  },

  statusDeliveredText: {
    color: '#2e7d32',
  },

  statusFailedBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },

  statusFailedText: {
    color: '#dc2626',
  },

  statusPickedBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },

  statusPickedText: {
    color: '#d97706',
  },

  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },

  actionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  failButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

modalCard: {
  backgroundColor: '#fff',
  padding: 24,
  borderRadius: 16,
  alignItems: 'center',
  width: '80%',
},

modalTitle: {
  fontSize: 18,
  fontWeight: '700',
  marginBottom: 16,
},

amountText: {
  marginTop: 12,
  fontSize: 20,
  fontWeight: '700',
},

confirmButton: {
  marginTop: 20,
  backgroundColor: '#4CAF50',
  padding: 14,
  borderRadius: 10,
  width: '100%',
  alignItems: 'center',
},
});