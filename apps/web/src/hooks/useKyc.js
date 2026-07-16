import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET KYC STATUS ================= */
export const useKycStatus = (userId) =>
  useQuery({
    queryKey: ["kyc", "status", userId],
    queryFn: () => apiClient(`/kyc/status/${userId}`),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET KYCs (for approver) ================= */
export const useKycsForApprover = ({ page, limit, tenantId, status = "ALL" }) =>
  useQuery({
    queryKey: ["kyc", "list", page, limit, tenantId, status],
    queryFn: () => {
      const params = new URLSearchParams({
        page,
        limit,
        status,
      });
      if (tenantId) params.append("tenantId", tenantId);
      return apiClient(`/kyc/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= SUBMIT KYC ================= */
export const useSubmitKyc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      // Always FormData — no JSON fallback
      return apiClient("/kyc/submit", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data, formData) => {
      const userId = formData.get("userId");
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["kyc", "status", userId] });
      }
    },
  });
};

/* ================= APPROVE KYC ================= */
export const useApproveKyc = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/kyc/approve", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= REJECT KYC ================= */
export const useRejectKyc = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/kyc/reject", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= RESUBMIT KYC ================= */
export const useResubmitKyc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      // Always FormData — no JSON fallback
      return apiClient("/kyc/resubmit", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data, formData) => {
      const userId = formData.get("userId");
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["kyc", "status", userId] });
      }
    },
  });
};
