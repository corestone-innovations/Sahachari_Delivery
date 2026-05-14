import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Alert, BackHandler, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
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
  const colorScheme = useColorScheme();

  const { token, clearAuthToken, isLoading } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const headerShown = useClientOnlyValue(false, true);

  /* ---------- PROTECT ROUTES ---------- */

  useEffect(() => {
    if (isLoading) return;

    // If user is not logged in go to LOGIN page
    if (!token) {
      router.replace("/login");
    }
  }, [token, isLoading]);

  /* ---------- ANDROID BACK BUTTON ---------- */

  useEffect(() => {
    const onBackPress = () => {
      const currentRoute = segments[segments.length - 1] as string;

      const isHome = currentRoute === "index" || segments.length <= 1;

      if (isHome) {
        Alert.alert("Exit App", "Do you want to exit the application?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Exit",
            onPress: () => BackHandler.exitApp(),
          },
        ]);

        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [segments]);

  /* ---------- LOGOUT ---------- */

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },

      {
        text: "Logout",
        style: "destructive",

        onPress: async () => {
          await clearAuthToken();

          // Redirect to LOGIN page
          router.replace("/login");
        },
      },
    ]);
  };

  // Prevent flicker while checking token
  if (isLoading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown,

        /* TAB BAR */

        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#f0f4f8",
          elevation: 8,

          height: 72 + insets.bottom,

          paddingBottom: 12 + insets.bottom,
          paddingTop: 12,

          shadowColor: "#000",

          shadowOffset: {
            width: 0,
            height: -4,
          },

          shadowOpacity: 0.08,
          shadowRadius: 12,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.2,
          marginTop: -4,
        },

        /* HEADER */

        headerStyle: {
          backgroundColor: "#FFFFFF",

          elevation: 2,
          shadowOpacity: 0.05,
          shadowRadius: 8,

          borderBottomWidth: 1,
          borderBottomColor: "#f0f4f8",
        },

        headerTitleStyle: {
          fontWeight: "900",
          color: "#0f172a",
          fontSize: 22,
          letterSpacing: -0.4,
        },
      }}
    >
      {/* ================= HOME ================= */}

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,

          headerRight: () => (
            <Pressable onPress={handleLogout} style={{ marginRight: 16 }}>
              {({ pressed }) => (
                <FontAwesome
                  name="sign-out"
                  size={20}
                  color="#1a472a"
                  style={{
                    opacity: pressed ? 0.5 : 1,
                  }}
                />
              )}
            </Pressable>
          ),
        }}
      />

      {/* ================= MY ORDERS ================= */}

      <Tabs.Screen
        name="myorders"
        options={{
          title: "My Orders",

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
