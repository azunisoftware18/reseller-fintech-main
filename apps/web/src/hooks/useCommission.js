import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// CREATE COMMISSION
export const useCreateCommission = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/commission", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission-list"] });
    },
  });
};

// UPDATE COMMISSION
export const useUpdateCommission = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient(`/commission/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["commission-list"] });
      qc.invalidateQueries({ queryKey: ["commission-detail", variables.id] });
    },
  });
};

export const useCommissionList = (params = {}) => {
  const { page = 1, limit = 10, scope, isActive } = params;

  const searchParams = new URLSearchParams();

  searchParams.append("page", page);
  searchParams.append("limit", limit);

  if (scope) {
    searchParams.append("scope", scope);
  }

  if (isActive !== undefined) {
    searchParams.append("isActive", String(isActive));
  }

  return useQuery({
    queryKey: ["commission-list", page, limit, scope, isActive],

    queryFn: async () => {
      return apiClient(`/commission?${searchParams.toString()}`);
    },

    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
  });
};
