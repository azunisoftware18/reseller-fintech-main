import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient("/auth/me"),
    staleTime: 0, // ✅ Immediately stale — hamesha fresh check
    retry: false,
    refetchOnWindowFocus: true, // ✅ Tab pe wapas aane pe refetch
    refetchOnReconnect: true, // ✅ Internet aane pe refetch
    refetchOnMount: true, // ✅ Component mount pe hamesha refetch
  });

export const useLogout = () =>
  useMutation({
    mutationFn: async () =>
      apiClient("/auth/logout", {
        method: "POST",
        credentials: "include",
      }),
  });
