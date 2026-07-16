import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= LIST ALL ================= */

export const useAllTenantServices = () =>
  useQuery({
    queryKey: ["tenant-services-all"],
    queryFn: async () => {
      const res = await apiClient("/platform-tenants/services/all");
      return res.data;
    },
  });

export const useTenantServices = () =>
  useQuery({
    queryKey: ["tenant-services"],
    queryFn: async () => {
      const res = await apiClient("/platform-tenants/services");
      return res.data;
    },
  });

/* ================= ENABLE ================= */

export const useEnableTenantService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, platformServiceId }) => {
      const res = await apiClient("/platform-tenants/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, platformServiceId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-services-all"],
      });
    },
  });
};

/* ================= DISABLE ================= */

export const useDisableTenantService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, platformServiceId }) => {
      const res = await apiClient(
        `/platform-tenants/${tenantId}/services/${platformServiceId}`,
        { method: "DELETE" },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-services-all"],
      });
    },
  });
};
