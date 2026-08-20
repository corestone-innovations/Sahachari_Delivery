import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useRouter } from "expo-router";

import { useAuth } from "../contexts/AuthContext";

import {
  getCurrentUser,
  loginApi,
  signupApi,
} from "../services/api";

/* ================= LOGIN ================= */

export function useLogin() {
  const { setAuthToken, clearAuthToken } = useAuth();

  const router = useRouter();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: {
      email: string;
      password: string;
    }) => {
      const response = await loginApi(credentials);
      await setAuthToken(response.accessToken);

      try {
        const userData = await getCurrentUser();
        const role = (userData?.role || "").toUpperCase();

        if (role !== "DELIVERY") {
          await clearAuthToken();
          throw new Error(
            "Access denied. Only delivery partners with role DELIVERY can log in."
          );
        }

        return { response, userData };
      } catch (err) {
        await clearAuthToken();
        throw err;
      }
    },

    onSuccess: async (data) => {
      queryClient.setQueryData(
        ["currentUser"],
        data.userData
      );

      // Go to main app
      router.replace("/(tabs)");
    },

    onError: (error: Error) => {
      console.error("Login failed:", error);

      throw error;
    },
  });
}

/* ================= SIGNUP ================= */
/* OPTIONAL - REMOVE THIS IF YOU DON'T NEED SIGNUP */

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: {
      name: string;
      email: string;
      password: string;
      address: string;
      serviceablePincodes: string[];
      role: string;
    }) => {
      return await signupApi(credentials);
    },

    onSuccess: async (data) => {
      console.log("Signup response:", data);

      // Redirect to LOGIN page
      router.replace("/login");
    },

    onError: (error: Error) => {
      console.error("Signup failed:", error);

      throw error;
    },
  });
}

/* ================= LOGOUT ================= */

export function useLogout() {
  const { clearAuthToken } = useAuth();

  const router = useRouter();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Optional logout API call
      // await apiRequest('/auth/logout', { method: 'POST' });
    },

    onSuccess: async () => {
      // Clear token
      await clearAuthToken();

      // Clear cache
      queryClient.clear();

      // Redirect to LOGIN page
      router.replace("/login");
    },
  });
}

/* ================= CURRENT USER ================= */

export function useCurrentUser() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],

    queryFn: getCurrentUser,

    // Only run if token exists
    enabled: !!token,

    staleTime: 10 * 60 * 1000,

    retry: 1,
  });
}