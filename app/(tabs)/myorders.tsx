import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { LinearGradient } from 'expo-linear-gradient';

import React, { useState } from 'react';

import QRCode from 'react-native-qrcode-svg';

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
} from 'react-native';

import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ================= TYPES ================= */

type OrderStatus =
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'FAILED';

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
}

interface PaymentResponse {
  checkoutId: string;
  paymentRs: number;
  status?: string;
  upiId?: string;
}

/* ================= STATUS ================= */

const STATUS_STEPS = [
  'ACCEPTED',
  'PICKED_UP',
  'DELIVERED',
];

const STATUS_CONFIG = {
  ACCEPTED: {
    color: '#f59e0b',
    icon: 'check-circle',
    label: 'Accepted',
  },

  PICKED_UP: {
    color: '#8b5cf6',
    icon: 'motorcycle',
    label: 'Picked Up',
  },

  DELIVERED: {
    color: '#16a34a',
    icon: 'check-circle',
    label: 'Delivered',
  },

  FAILED: {
    color: '#dc2626',
    icon: 'times-circle',
    label: 'Failed',
  },
};

/* ================= SCREEN ================= */

export default function DeliveryOrdersScreen() {
  const { token } = useAuth();

  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] =
    useState(false);

  const [showQR, setShowQR] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [payment, setPayment] =
    useState<PaymentResponse | null>(null);

  /* ================= FETCH ORDERS ================= */

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ['myJobs'],

    queryFn: () =>
      apiRequest('/delivery/orders?mine=true'),

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
      action: 'pickup' | 'deliver' | 'fail';
    }) =>
      apiRequest(
        `/delivery/orders/${jobId}/${action}`,
        {
          method: 'POST',
        }
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['myJobs'],
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message ||
          'Failed to update order'
      );
    },
  });

  /* ================= PAYMENT ================= */

  const createPayment = async (
    order: Order
  ) => {
    try {
      if (!order.checkoutId) {
        return Alert.alert(
          'Error',
          'Checkout ID missing'
        );
      }

      const res = (await apiRequest(
        '/payment-transactions',
        {
          method: 'POST',

          body: JSON.stringify({
            paymentRs: order.totalAmount,

            upiId:
              'vinayaksukhalal-1@okhdfcbank',

            checkoutId: order.checkoutId,
          }),
        }
      )) as PaymentResponse;

      setPayment(res);

      setSelectedOrder(order);

      setShowQR(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  /* ================= HELPERS ================= */

  const getCurrentStepIndex = (
    status: string
  ) => {
    if (status === 'FAILED') {
      return -1;
    }

    return STATUS_STEPS.indexOf(status);
  };

  /* ================= ACTION BUTTONS ================= */

  const renderActionButtons = (
    order: Order
  ) => {
    if (order.status === 'ACCEPTED') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.85}
          onPress={() =>
            statusMutation.mutate({
              jobId: order._id,
              action: 'pickup',
            })
          }
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            style={
              styles.actionButtonGradient
            }
          >
            <Text style={styles.buttonText}>
              Pick Up Order
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (order.status === 'PICKED_UP') {
      return (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() =>
              createPayment(order)
            }
          >
            <LinearGradient
              colors={[
                '#22c55e',
                '#15803d',
              ]}
              style={
                styles.actionButtonGradient
              }
            >
              <Text style={styles.buttonText}>
                Collect Payment
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.failButton}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                'Confirm',
                'Mark order as FAILED?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                  {
                    text: 'Yes',

                    onPress: () =>
                      statusMutation.mutate({
                        jobId: order._id,
                        action: 'fail',
                      }),
                  },
                ]
              )
            }
          >
            <Text style={styles.buttonText}>
              Mark Failed
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  /* ================= RENDER CARD ================= */

  const renderOrderItem = ({
    item: order,
  }: {
    item: Order;
  }) => {
    const currentStep =
      getCurrentStepIndex(order.status);

    const isFailed =
      currentStep === -1;

    const statusConfig =
      STATUS_CONFIG[order.status];

    return (
      <View style={styles.orderCard}>
        <LinearGradient
          colors={['#ffffff', '#f8fff8']}
          style={styles.orderCardGradient}
        >
          {/* HEADER */}

          <View style={styles.orderHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdLabel}>
                Order ID
              </Text>

              <Text style={styles.orderId}>
                {order.checkoutId ||
                  order._id}
              </Text>

              {/* STATUS BELOW ORDER ID */}

              <LinearGradient
                colors={[
                  statusConfig.color,
                  statusConfig.color + 'DD',
                ]}
                style={styles.statusBadge}
              >
                <FontAwesome
                  name={
                    statusConfig.icon as any
                  }
                  size={13}
                  color="#fff"
                />

                <Text
                  style={
                    styles.statusBadgeText
                  }
                >
                  {statusConfig.label}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* CUSTOMER */}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <FontAwesome
                name="user"
                size={16}
                color="#16a34a"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>
                Customer
              </Text>

              <Text style={styles.infoValue}>
                {order.userId?.name ||
                  'Customer'}
              </Text>

              <Text style={styles.infoSub}>
                {order.userId?.email || ''}
              </Text>
            </View>
          </View>

          {/* PICKUP ADDRESS */}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <FontAwesome
                name="shopping-bag"
                size={16}
                color="#f59e0b"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>
                Pickup Address
              </Text>

              <Text style={styles.infoValue}>
                {order.pickupAddress ||
                  order.storeId?.address ||
                  'Store Address'}
              </Text>
            </View>
          </View>

          {/* DELIVERY ADDRESS AFTER PICKUP */}

          {(order.status ===
            'PICKED_UP' ||
            order.status ===
              'DELIVERED') && (
            <View style={styles.deliveryBox}>
              <View
                style={styles.deliveryHeader}
              >
                <FontAwesome
                  name="map-marker"
                  size={18}
                  color="#16a34a"
                />

                <Text
                  style={
                    styles.deliveryTitle
                  }
                >
                  Delivery Address
                </Text>
              </View>

              <Text
                style={styles.deliveryText}
              >
                {
                  order.deliveryAddress
                    ?.street
                }
                ,{' '}
                {
                  order.deliveryAddress
                    ?.city
                }
              </Text>

              <Text
                style={styles.deliverySubText}
              >
                ZIP:{' '}
                {
                  order.deliveryAddress
                    ?.zipCode
                }
              </Text>

              <Text
                style={styles.deliverySubText}
              >
                Phone:{' '}
                {
                  order.deliveryAddress
                    ?.phone
                }
              </Text>

              {!!order.deliveryAddress
                ?.notes && (
                <Text
                  style={
                    styles.deliveryNotes
                  }
                >
                  Notes:{' '}
                  {
                    order
                      .deliveryAddress
                      ?.notes
                  }
                </Text>
              )}
            </View>
          )}

          {/* PROGRESS */}

          {!isFailed ? (
            <View
              style={styles.progressSection}
            >
              <Text
                style={styles.sectionTitle}
              >
                Delivery Progress
              </Text>

              <View
                style={styles.progressSteps}
              >
                {STATUS_STEPS.map(
                  (step, index) => {
                    const isCompleted =
                      index <= currentStep;

                    const isCurrent =
                      index === currentStep;

                    const stepConfig =
                      STATUS_CONFIG[
                        step as keyof typeof STATUS_CONFIG
                      ];

                    return (
                      <View
                        key={step}
                        style={
                          styles.stepContainer
                        }
                      >
                        <LinearGradient
                          colors={
                            isCompleted
                              ? [
                                  stepConfig.color,
                                  stepConfig.color +
                                    'DD',
                                ]
                              : [
                                  '#E5E7EB',
                                  '#F3F4F6',
                                ]
                          }
                          style={[
                            styles.stepIcon,

                            isCurrent &&
                              styles.stepIconCurrent,
                          ]}
                        >
                          <FontAwesome
                            name={
                              stepConfig.icon as any
                            }
                            size={18}
                            color={
                              isCompleted
                                ? '#fff'
                                : '#9ca3af'
                            }
                          />
                        </LinearGradient>

                        <Text
                          style={[
                            styles.stepLabel,

                            isCompleted &&
                              styles.stepLabelCompleted,
                          ]}
                        >
                          {stepConfig.label}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            </View>
          ) : (
            <View
              style={styles.failedContainer}
            >
              <FontAwesome
                name="times-circle"
                size={22}
                color="#dc2626"
              />

              <Text
                style={styles.failedText}
              >
                Delivery Failed
              </Text>
            </View>
          )}

          {/* AMOUNT */}

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              Delivery Amount
            </Text>

            <Text style={styles.amountValue}>
              ₹{order.totalAmount}
            </Text>
          </View>

          {/* ACTIONS */}

          {order.status !==
            'DELIVERED' &&
            renderActionButtons(order)}
        </LinearGradient>
      </View>
    );
  };

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#16a34a"
        />

        <Text style={styles.loadingText}>
          Loading Orders...
        </Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* NAVBAR */}

      <LinearGradient
        colors={['#16a34a', '#166534']}
        style={styles.navbar}
      >
        <View>
          <Text style={styles.navTitle}>
            My Deliveries
          </Text>

          <Text style={styles.navSubtitle}>
            {orders?.length || 0} Active Orders
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navRefreshButton}
          onPress={onRefresh}
        >
          <FontAwesome
            name="refresh"
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* ORDERS */}

      <FlatList
        data={orders || []}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome
              name="shopping-bag"
              size={60}
              color="#d1d5db"
            />

            <Text style={styles.emptyTitle}>
              No Orders
            </Text>

            <Text
              style={styles.emptySubtitle}
            >
              Orders will appear here
            </Text>
          </View>
        )}
      />

      {/* QR MODAL */}

      <Modal
        visible={showQR}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Collect Payment
            </Text>

            {payment && (
              <>
                <QRCode
                  size={220}
                  value={`upi://pay?pa=${payment.upiId}&pn=Delivery&am=${payment.paymentRs}&cu=INR&tr=${payment.checkoutId}`}
                />

                <Text
                  style={styles.amountText}
                >
                  ₹{payment.paymentRs}
                </Text>

                <TouchableOpacity
                  style={
                    styles.confirmButton
                  }
                  onPress={async () => {
                    try {
                      await apiRequest(
                        `/payment-transactions/${payment.checkoutId}/status`,
                        {
                          method:
                            'PATCH',

                          body: JSON.stringify(
                            {
                              status:
                                'SUCCESS',
                            }
                          ),
                        }
                      );

                      await statusMutation.mutateAsync(
                        {
                          jobId:
                            selectedOrder!._id,

                          action:
                            'deliver',
                        }
                      );

                      setShowQR(false);

                      setPayment(null);

                      setSelectedOrder(
                        null
                      );

                      Alert.alert(
                        'Success',
                        'Payment received'
                      );
                    } catch (err: any) {
                      Alert.alert(
                        'Error',
                        err.message
                      );
                    }
                  }}
                >
                  <Text
                    style={styles.buttonText}
                  >
                    Payment Received
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    marginTop: 12,
                  }}
                  onPress={() => {
                    setShowQR(false);

                    setPayment(null);

                    setSelectedOrder(
                      null
                    );
                  }}
                >
                  <Text
                    style={{
                      color: 'red',
                      fontWeight: '700',
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
    backgroundColor: '#f3f4f6',
  },

  navbar: {
    paddingTop: 42,
    paddingBottom: 16,
    paddingHorizontal: 18,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,

    elevation: 6,
  },

  navTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  navSubtitle: {
    color: '#dcfce7',
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },

  navRefreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor:
      'rgba(255,255,255,0.18)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },

  orderCard: {
    marginBottom: 18,
    borderRadius: 24,
    overflow: 'hidden',

    backgroundColor: '#fff',

    elevation: 4,
  },

  orderCardGradient: {
    padding: 20,
  },

  orderHeader: {
    marginBottom: 20,
  },

  orderIdLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 5,
  },

  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',

    marginTop: 12,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 999,
  },

  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: '#f9fafb',

    borderRadius: 18,

    padding: 14,

    marginBottom: 14,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: '#ecfdf5',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  infoSub: {
    marginTop: 3,
    color: '#6b7280',
    fontSize: 13,
  },

  deliveryBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  deliveryTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },

  deliveryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  deliverySubText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },

  deliveryNotes: {
    marginTop: 8,
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
  },

  progressSection: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },

  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,

    justifyContent: 'center',
    alignItems: 'center',
  },

  stepIconCurrent: {
    transform: [{ scale: 1.08 }],
  },

  stepLabel: {
    marginTop: 10,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },

  stepLabelCompleted: {
    color: '#111827',
    fontWeight: '800',
  },

  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 20,
  },

  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },

  amountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16a34a',
  },

  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },

  actionButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  failButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  failedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,
  },

  failedText: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 120,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    color: '#111827',
  },

  emptySubtitle: {
    marginTop: 8,
    color: '#9ca3af',
  },

  modalContainer: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    backgroundColor: '#fff',
    width: '86%',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#111827',
  },

  amountText: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },

  confirmButton: {
    marginTop: 24,
    backgroundColor: '#16a34a',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
});