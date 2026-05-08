import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

/* ================= TYPES ================= */

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  address?: string;
  mobileNumber?: string;
};

type EditableField = 'address' | 'mobileNumber';

/* ================= SCREEN ================= */

export default function ProfileScreen() {
  const { token, clearAuthToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState('');

  /* ---------- FETCH PROFILE ---------- */
  const { data: user, isLoading, refetch } = useQuery<UserProfile>({
    queryKey: ['myProfile'],
    queryFn: () => apiRequest('/users/me'),
    enabled: !!token,
  });

  /* ---------- UPDATE MUTATION ---------- */
  const updateMutation = useMutation({
    mutationFn: (updateData: { [key: string]: string }) => 
      apiRequest('/users/update-me', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated!');
    },
    onError: (error: any) => {
      Alert.alert('Update Failed', error.message || 'Something went wrong');
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openEdit = (field: EditableField, currentVal: string = '') => {
    setEditingField(field);
    setEditValue(currentVal);
    setEditModalVisible(true);
  };

  return (
    <LinearGradient colors={['#f8fffe', '#ffffff', '#f0fdf9']} style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />}
      >
        
        {/* ---------- SECTION 1: PROFILE OVERVIEW (VIEW ONLY) ---------- */}
        <View style={styles.profileHeaderCard}>
          <LinearGradient colors={['#7ed957', '#4CAF50']} style={styles.avatarGradient}>
            <FontAwesome name="user" size={40} color="#FFFFFF" />
          </LinearGradient>
          
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
            </View>
          </View>
        </View>

        {/* ---------- SECTION 2: EDITABLE DETAILS ---------- */}
        <Text style={styles.sectionLabel}>Contact Information</Text>
        <View style={styles.detailsCard}>
          <EditableRow 
            icon="phone" 
            label="Mobile Number" 
            value={user?.mobileNumber || 'Not set'} 
            onPress={() => openEdit('mobileNumber', user?.mobileNumber)}
          />
          <View style={styles.divider} />
          <EditableRow 
            icon="map-marker" 
            label="Primary Address" 
            value={user?.address || 'Add your address'} 
            onPress={() => openEdit('address', user?.address)}
          />
        </View>

        {/* ---------- LOGOUT ---------- */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => {
                await clearAuthToken();
                router.replace('/signup');
            }}
          ])}
        >
          <FontAwesome name="sign-out" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update {editingField === 'mobileNumber' ? 'Mobile' : 'Address'}</Text>
            
            <TextInput
              style={[styles.modalInput, editingField === 'address' && { minHeight: 100, textAlignVertical: 'top' }]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Type here..."
              multiline={editingField === 'address'}
              keyboardType={editingField === 'mobileNumber' ? 'phone-pad' : 'default'}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => editingField && updateMutation.mutate({ [editingField]: editValue })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ================= COMPONENTS ================= */

function EditableRow({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <FontAwesome name={icon} size={16} color="#4CAF50" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
      <FontAwesome name="angle-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  
  // Header Card (View Only)
  profileHeaderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f0fdf9'
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  headerInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: '#1a472a' },
  userEmail: { fontSize: 14, color: '#64748b', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f8f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8
  },
  roleText: { fontSize: 10, fontWeight: '700', color: '#4CAF50', letterSpacing: 0.5 },

  // Details Card (Editable)
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#4CAF50', marginBottom: 12, marginLeft: 5, textTransform: 'uppercase' },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e8f5e9',
    marginBottom: 30
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f8f4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

  // Buttons
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 10
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a472a', marginBottom: 20 },
  modalInput: { backgroundColor: '#f8fafc', borderRadius: 15, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  saveBtn: { flex: 2, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#4CAF50' },
  saveBtnText: { color: '#fff', fontWeight: '700' }
});