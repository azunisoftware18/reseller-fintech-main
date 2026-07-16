import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= FETCH PLANS ================= */

export const useRechargePlans = () =>
  useMutation({
    mutationFn: async ({
      mobileNumber,
      internalOperatorCode,
      internalCircleCode,
      serviceProviderMappingId,
    }) => {
      const res = await apiClient("/recharge/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          internalOperatorCode,
          internalCircleCode,
          serviceProviderMappingId,
        }),
      });

      return res.data.plans;
    },
  });

/* ================= INITIATE RECHARGE ================= */

export const useInitiateRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recharge-history"],
      });
    },
  });
};

/* ================= HISTORY ================= */

export const useRechargeHistory = () =>
  useQuery({
    queryKey: ["recharge-history"],
    queryFn: async () => {
      const res = await apiClient("/recharge/history");

      return res.data;
    },
  });

/* ================= CHECK STATUS ================= */

export const useCheckStatus = () =>
  useMutation({
    mutationFn: async (transactionId) => {
      const res = await apiClient(`/recharge/status/${transactionId}`, {
        method: "GET",
      });
      return res.data;
    },
  });

/* ================= OPERATOR MAP ================= */

export const useOperatorMaps = (filters = {}) =>
  useQuery({
    queryKey: ["operator-maps", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.direction) params.append("direction", filters.direction);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.providerId) params.append("providerId", filters.providerId);

      const queryString = params.toString();
      const url = `/admin/recharge/operator-map${queryString ? `?${queryString}` : ""}`;

      const res = await apiClient(url);
      return res.data;
    },
  });

export const useUpsertOperatorMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/recharge/operator-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["operator-maps"],
        predicate: (query) => {
          return query.queryKey[0] === "operator-maps";
        },
      });
    },
  });
};

/* ================= CIRCLE MAP ================= */

export const useCircleMaps = (filters = {}) =>
  useQuery({
    queryKey: ["circle-maps", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.direction) params.append("direction", filters.direction);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.providerId) params.append("providerId", filters.providerId);

      const queryString = params.toString();
      const url = `/admin/recharge/circle-map${queryString ? `?${queryString}` : ""}`;

      const res = await apiClient(url);
      return res.data;
    },
  });

export const useUpsertCircleMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/recharge/circle-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["circle-maps"],
        predicate: (query) => {
          return query.queryKey[0] === "circle-maps";
        },
      });
    },
  });
};
