import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= Bank VERIFICATION ================= */
export const useBankVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return apiClient("/bank-verification/penny-drop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      // Invalidate any related queries if needed
      queryClient.invalidateQueries({
        queryKey: ["bank-verification"],
      });
    },
  });
};
