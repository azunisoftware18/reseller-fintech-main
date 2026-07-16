import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET USER PAYOUTS ================= */
export const useUserPayouts = (userId) =>
  useQuery({
    queryKey: ["payout", "user", userId],
    queryFn: () => apiClient(`/payout/history?limit=50`),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET PAYOUTS FOR ADMIN/APPROVER ================= */
export const usePayoutsForApprover = ({ page, limit, status = "ALL" }) =>
  useQuery({
    queryKey: ["payout", "list", page, limit, status],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit, status });
      return apiClient(`/payout/history?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET SINGLE PAYOUT DETAIL ================= */
export const usePayoutById = (payoutId) =>
  useQuery({
    queryKey: ["payout", payoutId],
    queryFn: () => apiClient(`/payout/history/${payoutId}`),
    enabled: !!payoutId,
    retry: false,
  });

/* ================= PERFORM PAYOUT ================= */
export const usePerformPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return apiClient("/payout", {
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
          queryKey: ["payout", "user", userId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["payout", "list"] });
    },
  });
};

/* ================= CHECK PAYOUT STATUS ================= */
export const useCheckPayoutStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId) => {
      return apiClient(`/payout/status/${transactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout"] });
    },
  });
};
