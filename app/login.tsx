import { useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './contexts/AuthContext';
import { getCurrentUser, loginApi } from './services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const loginResponse = await loginApi(credentials);
      return loginResponse;
    },
    onSuccess: async (data) => {
      console.log('Login response:', data);
      
      await setAuthToken(data.accessToken);
      
      try {
        const userData = await getCurrentUser();
        queryClient.setQueryData(['currentUser'], userData);
      } catch (error) {
        console.log('Could not fetch user data:', error);
      }
      
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    loginMutation.mutate({ email, password });
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue delivering</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formCardInner}>
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
                  editable={!loginMutation.isPending}
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
                  editable={!loginMutation.isPending}
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loginMutation.isPending 
                    ? ['#9ca3af', '#6b7280'] 
                    : ['#10b981', '#059669']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loginMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign In</Text>
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

              {/* Sign Up Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/signup')}
                  disabled={loginMutation.isPending}
                >
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Fast Deliveries</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Earn More</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>Easy to Use</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 38,
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
    padding: 32,
  },
  inputWrapper: {
    marginBottom: 20,
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
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  inputIcon: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
    marginVertical: 28,
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
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});