import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../contexts/AuthContext';

/* ================= ICON ================= */

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} {...props} />;
}

/* ================= LAYOUT ================= */

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { token, clearAuthToken } = useAuth();
  const router = useRouter();

  /* ---------- PROTECT ROUTES ---------- */
  useEffect(() => {
    if (!token) {
      router.replace('/signup');
    }
  }, [token]);

  /* ---------- LOGOUT ---------- */
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuthToken();
          router.replace('/signup');
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),

        /* 🌿 TAB BAR THEME */
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },

        /* 🌿 HEADER THEME */
        headerStyle: {
          backgroundColor: '#ecfdf5',
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#065f46',
          fontSize: 20,
        },
      }}
    >
      {/* ================= HOME ================= */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
          headerRight: () => (
            <Pressable onPress={handleLogout} style={{ marginRight: 16 }}>
              {({ pressed }) => (
                <FontAwesome
                  name="sign-out"
                  size={22}
                  color="#065f46"
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
          title: 'My Orders',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="list-alt" color={color} />
          ),
        }}
      />

      {/* ================= PROFILE ================= */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
