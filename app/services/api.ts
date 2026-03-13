import { getToken } from "./auth";

// Get API URL from environment or use default
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...restOptions } = options;
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  let token: string | null = null;
  if (requiresAuth) {
    token = await getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("API Request:", {
    url,
    method: restOptions.method || "GET",
    requiresAuth,
    hasToken: requiresAuth ? !!(await getToken()) : "N/A",
  });

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  // Handle error responses
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Use default error message
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API calls
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  mobileNumber?: string;
  password: string;
  address: string;
  serviceablePincodes: string[];
  role: string;
  // NOTE: category field removed - not required by API
}

// Login response - only contains accessToken
export interface LoginResponse {
  accessToken: string;
}

// Signup response
export interface SignupResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  message: string;
}

// User data structure returned by GET /users/me (full DB document)
export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: string;
  mobileNumber?: string;
  image?: string;
  address?: string;
  serviceablePincodes?: string[];
  status?: string;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  mobileNumber?: string;
  image?: string;
}

export interface PresignedUploadResponse {
  url: string;
  key: string;
}

function shouldRetryProfileUpdate(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return /(404|405|not found|method not allowed|cannot put|cannot patch)/i.test(
    message,
  );
}

export async function loginApi(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    requiresAuth: false, // No token needed
  });
}

export async function signupApi(
  credentials: SignupCredentials,
): Promise<SignupResponse> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
    requiresAuth: false, // No token needed
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest("/auth/me", {
    method: "GET",
    requiresAuth: true, // Token required
  });
}

// Example: Other API calls that require authentication
export async function fetchUserProfile(userId: string): Promise<User> {
  return apiRequest(`/users/${userId}`, {
    method: "GET",
    requiresAuth: true, // Token required
  });
}

export async function updateUserProfile(
  userId: string,
  data: Partial<User>,
): Promise<User> {
  return apiRequest(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    requiresAuth: true, // Token required
  });
}

export async function updateCurrentUserProfile(
  data: UserProfileUpdate,
): Promise<User> {
  // Backend exposes PATCH /users/update-me
  return apiRequest("/users/update-me", {
    method: "PATCH",
    body: JSON.stringify(data),
    requiresAuth: true,
  });
}

// Example: Fetch items (requires token)
export async function fetchItems(): Promise<any[]> {
  return apiRequest("/items", {
    method: "GET",
    requiresAuth: true, // Token required
  });
}

// Example: Create item (requires token)
export async function createItem(data: any): Promise<any> {
  return apiRequest("/items", {
    method: "POST",
    body: JSON.stringify(data),
    requiresAuth: true, // Token required
  });
}

// Example: Upload file to presigned URL
export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder = "users",
): Promise<PresignedUploadResponse> {
  return apiRequest("/s3/presigned-url", {
    method: "POST",
    body: JSON.stringify({ fileName, fileType, folder }),
    requiresAuth: true,
  });
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  fileType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": fileType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error("Image upload to storage failed");
  }
}
