import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, BackHandler } from "react-native";
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
  const { token, clearAuthToken, isLoading } = useAuth(); // Added isLoading from context
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  /* ---------- PROTECT ROUTES & PREVENT BACK-EXIT LOGOUT ---------- */
  useEffect(() => {
    // 1. Wait until the AuthContext has finished checking AsyncStorage
    if (isLoading) return;

    // 2. Only redirect to signup if we are officially 'logged out' (token is null)
    if (!token) {
      router.replace("/signup");
    }
  }, [token, isLoading]);

  /* ---------- ANDROID BACK BUTTON HANDLING ---------- */
  useEffect(() => {
    const onBackPress = () => {
      // 1. Cast the last segment as a generic string to bypass strict routing types
      const currentRoute = segments[segments.length - 1] as string;
      
      // 2. Check for "index" (Home) or if we are at the top level
      const isHome = currentRoute === "index" || segments.length <= 1;

      if (isHome) {
        Alert.alert("Exit App", "Do you want to exit the application?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true; 
      }
      return false; 
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [segments]);

  /* ---------- LOGOUT ---------- */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearAuthToken();
          router.replace("/signup");
        },
      },
    ]);
  };

  // Prevent flickering while checking for the token
  if (isLoading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),

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

        /* 🌿 PREMIUM HEADER THEME */
        headerStyle: {
          backgroundColor: "#f8fffe",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#e8f5e9",
        },
        headerTitleStyle: {
          fontWeight: "800",
          color: "#1a472a",
          fontSize: 20,
          letterSpacing: -0.3,
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
                  style={{ opacity: pressed ? 0.5 : 1 }}
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