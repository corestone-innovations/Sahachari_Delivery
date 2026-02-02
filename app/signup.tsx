import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from './services/api';

interface SignupData {
  name: string;
  email: string;
  password: string;
  address: string;
  serviceablePincodes: string[];
  role: string;
}

interface SignupResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  message: string;
}

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [serviceablePincodes, setServiceablePincodes] = useState('');

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return apiRequest<SignupResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth: false,
      });
    },
    onSuccess: () => {
      Alert.alert(
        'Account Created',
        'Registration successful! Please log in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ],
        { cancelable: false }
      );
    },
    onError: (error: any) => {
      Alert.alert('Signup Failed', error?.message || 'Please try again');
    },
  });

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }

    const parsedPincodes = serviceablePincodes
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length === 6);

    signupMutation.mutate({
      name,
      email,
      password,
      address,
      serviceablePincodes: parsedPincodes,
      role: 'DELIVERY',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#f0fdf4']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoIcon}>🚴</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our delivery team today</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formCardInner}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!signupMutation.isPending}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>✉️</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!signupMutation.isPending}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!signupMutation.isPending}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>🔐</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!signupMutation.isPending}
                />
              </View>

              {/* Address Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>📍</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Your Address"
                  placeholderTextColor="#9ca3af"
                  value={address}
                  onChangeText={setAddress}
                  editable={!signupMutation.isPending}
                />
              </View>

              {/* Pincodes Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>📮</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Serviceable Pincodes"
                  placeholderTextColor="#9ca3af"
                  value={serviceablePincodes}
                  onChangeText={setServiceablePincodes}
                  keyboardType="numeric"
                  editable={!signupMutation.isPending}
                />
              </View>

              <View style={styles.helperContainer}>
                <Text style={styles.helperIcon}>💡</Text>
                <Text style={styles.helperText}>
                  Enter comma-separated pincodes (e.g., 688524, 688539)
                </Text>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignup}
                disabled={signupMutation.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={signupMutation.isPending 
                    ? ['#9ca3af', '#6b7280'] 
                    : ['#10b981', '#059669']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {signupMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <Text style={styles.buttonIcon}>→</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  disabled={signupMutation.isPending}
                >
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  formCardInner: {
    padding: 28,
  },
  inputWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  helperIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },
  linkText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
});