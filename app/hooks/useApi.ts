import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserProfile, updateUserProfile } from "../services/api";

// Example: Fetch user profile
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId, // Only run if userId exists
  });
}

// Example: Update user profile
export function useUpdateUserProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => updateUserProfile(userId, data),
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
