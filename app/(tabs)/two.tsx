import React from 'react';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

/* ================= TYPES ================= */

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

/* ================= SCREEN ================= */

export default function TabTwoScreen() {
  const { token, clearAuthToken } = useAuth();
  const router = useRouter();

  /* ---------- FETCH PROFILE ---------- */
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ['myProfile'],
    queryFn: () => apiRequest('/users/me'),
    enabled: !!token,
  });

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

  /* ================= UI ================= */

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5', '#ecfdf5']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <FontAwesome name="user-circle" size={90} color="#10b981" />
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* ---------- CONTENT ---------- */}
        {isLoading ? (
          <Text style={styles.subtitle}>Loading profile...</Text>
        ) : isError || !user ? (
          <Text style={styles.subtitle}>Failed to load profile</Text>
        ) : (
          <View style={styles.card}>
            <InfoRow
              icon="user"
              label="Name"
              value={user.name || 'User'}
            />
            <Divider />

            <InfoRow
              icon="envelope"
              label="Email"
              value={user.email || 'N/A'}
            />
            <Divider />

            <InfoRow
              icon="id-badge"
              label="User ID"
              value={user._id ? String(user._id) : 'N/A'}
            />
            <Divider />

            <InfoRow
              icon="shield"
              label="Role"
              value={user.role || 'N/A'}
            />
          </View>
        )}

        {/* ---------- ACTIONS ---------- */}
        <View style={styles.actions}>
          <ActionButton icon="edit" text="Edit Profile" />
          <ActionButton icon="cog" text="Settings" />
          <ActionButton icon="question-circle" text="Help & Support" />
        </View>

        {/* ---------- LOGOUT ---------- */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

/* ================= COMPONENTS ================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <FontAwesome
        name={icon}
        size={20}
        color="#10b981"
        style={{ width: 26 }}
      />
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ActionButton({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  text: string;
}) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <FontAwesome name={icon} size={18} color="#10b981" />
      <Text style={styles.actionText}>{text}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginVertical: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#065f46',
    marginTop: 12,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#047857',
    marginTop: 30,
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },

  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },

  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },

  actions: {
    marginTop: 28,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },

  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 10,
  },

  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
