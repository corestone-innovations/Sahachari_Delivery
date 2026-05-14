import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchUserProfile,
  updateUserProfile,
} from "../services/api";

/* ================= FETCH USER PROFILE ================= */

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ["userProfile", userId],

    queryFn: () => fetchUserProfile(userId),

    // Run only if userId exists
    enabled: !!userId,

    staleTime: 5 * 60 * 1000,

    retry: 1,
  });
}

/* ================= UPDATE USER PROFILE ================= */

export function useUpdateUserProfile(
  userId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await updateUserProfile(
        userId,
        data
      );
    },

    onSuccess: () => {
      // Refresh profile data
      queryClient.invalidateQueries({
        queryKey: ["userProfile", userId],
      });

      // Refresh current logged-in user
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },

    onError: (error: Error) => {
      console.log(
        "Profile update failed:",
        error
      );
    },
  });
}