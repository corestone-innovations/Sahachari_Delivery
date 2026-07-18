import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { registerForPushNotificationsAsync, sendLocalNotificationAsync } from "../services/notifications";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/api";

interface NotificationContextType {
  pushToken: string | null;
  registerNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef<boolean>(true);

  const registerNotifications = async () => {
    try {
      const registeredToken = await registerForPushNotificationsAsync();
      setPushToken(registeredToken);
      
      if (registeredToken && token) {
        console.log("Expo Push Token obtained for user session:", registeredToken);
        
        // Try updating the user's profile with the token, catching any API exceptions
        try {
          const user = await apiRequest<{ id: string }>("/auth/me");
          if (user?.id) {
            await apiRequest(`/users/${user.id}`, {
              method: "PUT",
              body: JSON.stringify({ pushToken: registeredToken }),
            });
            console.log("Push token successfully synced with user profile in backend");
          }
        } catch (profileError) {
          console.warn("Optional push token sync with profile failed (expected if backend does not support it):", profileError);
        }
      }
    } catch (error) {
      console.error("Failed to register notifications on startup:", error);
    }
  };

  // Register for notifications when token is available
  useEffect(() => {
    if (token) {
      registerNotifications();
    } else {
      setPushToken(null);
      knownOrderIds.current.clear();
      isFirstFetch.current = true;
    }
  }, [token]);

  // Foreground Poller: Runs every 15 seconds to look for new orders
  useEffect(() => {
    if (!token) return;

    const checkNewOrders = async () => {
      try {
        const orders = await apiRequest<any[]>("/delivery/orders?status=READY");
        if (!orders || !Array.isArray(orders)) return;

        const currentIds = new Set(orders.map((o) => o._id));

        if (isFirstFetch.current) {
          // Initialize known orders on first fetch so we don't spam notifications on startup
          knownOrderIds.current = currentIds;
          isFirstFetch.current = false;
          console.log("Notifications polling: Initialized with", currentIds.size, "available orders");
          return;
        }

        // Detect new orders that were not present in previous checks
        const newOrders = orders.filter((o) => !knownOrderIds.current.has(o._id));

        if (newOrders.length > 0) {
          console.log(`Notifications polling: Found ${newOrders.length} new order(s)`);
          
          for (const order of newOrders) {
            const storeName = order.storeId?.name ?? "Store";
            const amount = order.totalAmount ?? 0;
            const place = order.deliveryAddress?.place ?? order.deliveryAddress?.city ?? "Nearby Area";

            // Push notification to the Android system notification bar
            await sendLocalNotificationAsync(
              "New Delivery Job Available! 🔔",
              `🏪 ${storeName} • ₹${amount} • 📍 ${place}`,
              { orderId: order._id }
            );

            // Add the order to the list of known order IDs
            knownOrderIds.current.add(order._id);
          }
        }
      } catch (error) {
        console.error("Notification polling failed to fetch orders:", error);
      }
    };

    checkNewOrders();

    const intervalId = setInterval(checkNewOrders, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  return (
    <NotificationContext.Provider value={{ pushToken, registerNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
