import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ================= */
export const useTenantSocialMedia = () =>
  useQuery({
    queryKey: ["social-media"],
    queryFn: () => apiClient("/social-media", { method: "GET" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= UPSERT ================= */
export const useUpsertTenantSocialMedia = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/social-media", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
