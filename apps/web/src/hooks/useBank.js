import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET USER BANK DETAILS ================= */
export const useUserBanks = (userId) =>
  useQuery({
    queryKey: ["bank", "user", userId],
    queryFn: () => apiClient(`/bank/user/${userId}`),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BANK DETAILS FOR APPROVER ================= */
export const useBanksForApprover = ({
  page,
  limit,
  tenantId,
  status = "ALL",
}) =>
  useQuery({
    queryKey: ["bank", "list", page, limit, tenantId, status],
    queryFn: () => {
      const params = new URLSearchParams({
        page,
        limit,
        status,
      });
      if (tenantId) params.append("tenantId", tenantId);
      return apiClient(`/bank/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET SINGLE BANK DETAIL ================= */
export const useBankById = (bankId) =>
  useQuery({
    queryKey: ["bank", bankId],
    queryFn: () => apiClient(`/bank/${bankId}`),
    enabled: !!bankId,
    retry: false,
  });

/* ================= SUBMIT BANK DETAIL ================= */
export const useSubmitBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return apiClient("/bank/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });
    },

    onSuccess: (data, payload) => {
      const userId = payload?.userId;

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["bank", "user", userId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["bank", "list"],
      });
    },
  });
};

/* ================= RESUBMIT BANK DETAIL ================= */
export const useResubmitBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return apiClient("/bank/resubmit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });
    },

    onSuccess: (data, payload) => {
      const userId = payload?.userId;

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["bank", "user", userId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["bank", "list"],
      });
    },
  });
};

/* ================= APPROVE BANK DETAIL ================= */
export const useApproveBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiClient("/bank/approve", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "list"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "user"] });
    },
  });
};

/* ================= REJECT BANK DETAIL ================= */
export const useRejectBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiClient("/bank/reject", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "list"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "user"] });
    },
  });
};

/* ================= SET PRIMARY BANK ================= */
export const useSetPrimaryBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bankId }) =>
      apiClient(`/bank/${bankId}/primary`, {
        method: "PUT",
      }),
    onSuccess: (data, { bankId }) => {
      queryClient.invalidateQueries({ queryKey: ["bank", "user"] });
      queryClient.invalidateQueries({ queryKey: ["bank", bankId] });
      queryClient.invalidateQueries({ queryKey: ["bank", "list"] });
    },
  });
};

/* ================= DELETE BANK DETAIL ================= */
export const useDeleteBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bankId }) =>
      apiClient(`/bank/${bankId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, { bankId }) => {
      queryClient.invalidateQueries({ queryKey: ["bank", "user"] });
      queryClient.invalidateQueries({ queryKey: ["bank", bankId] });
      queryClient.invalidateQueries({ queryKey: ["bank", "list"] });
    },
  });
};

/* ================= GET ALL BANKS (generic) ================= */
export const useBanks = () =>
  useQuery({
    queryKey: ["banks"],
    queryFn: () => apiClient("/bank"), // Adjust if you have a generic /bank endpoint
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
