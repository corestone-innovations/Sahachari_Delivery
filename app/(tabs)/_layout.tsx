import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../contexts/AuthContext";

/* ================= ICON ================= */

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} {...props} />;
}

/* ================= LAYOUT ================= */

export default function TabLayout() {
  const { token, clearAuthToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* ---------- PROTECT ROUTES ---------- */
  useEffect(() => {
    if (!token) {
      router.replace("/signup");
    }
  }, [router, token]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        /* 🌿 PREMIUM TAB BAR THEME */
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 12,
          height: 70 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
          shadowColor: "#4CAF50",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      {/* ================= MY ORDERS ================= */}
      <Tabs.Screen
        name="myorders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="list-alt" color={color} />
          ),
        }}
      />
      {/* ================= PROFILE ================= */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
