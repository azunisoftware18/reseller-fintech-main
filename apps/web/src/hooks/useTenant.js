import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= CREATE ================= */
export const useCreateTenant = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/tenants", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateTenant = () =>
  useMutation({
    mutationFn: async ({ id, payload }) =>
      apiClient(`/tenants/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });

/* ================= GET BY ID ================= */
export const useTenantById = (tenantId) =>
  useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => apiClient(`/tenants/${tenantId}`),
    enabled: !!tenantId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= LIST ================= */
export const useTenants = ({
  page = 1,
  limit = 50,
  search = "",
  status = "",
}) =>
  useQuery({
    queryKey: ["tenants", page, limit, search, status],
    queryFn: () =>
      apiClient(
        `/tenants?page=${page}&limit=${limit}&search=${search}&status=${status}`,
      ),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
