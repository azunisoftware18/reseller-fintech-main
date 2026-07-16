import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= UPSERT ================= */
export const useUpsertTenantDomain = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/tenant-domain", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

export const useTenantDomainByTenantId = (tenantId) =>
  useQuery({
    queryKey: ["tenant-domain", tenantId],
    queryFn: () => apiClient(`/tenant-domain/${tenantId}`, { method: "GET" }),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
