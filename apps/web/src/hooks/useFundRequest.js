import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ALL ================= */
export const useFundTransactions = ({
  page,
  limit,
  search = "",
  status = "all",
}) =>
  useQuery({
    queryKey: ["fund-request", page, limit, search, status],
    queryFn: () =>
      apiClient(
        `/fund-request?page=${page}&limit=${limit}&search=${search}&status=${status}`,
      ),
    keepPreviousData: true,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BY ID ================= */
export const useFundTransactionById = (id) =>
  useQuery({
    queryKey: ["fund-request", id],
    queryFn: () => apiClient(`/fund-request/${id}`),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= CREATE (Fund Request) ================= */
export const useCreateFundRequest = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/fund-request", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE STATUS ================= */
export const useUpdateFundRequestStatus = () =>
  useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient(`/fund-request/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  });

/* ================= DELETE ================= */
export const useDeleteFundRequest = () =>
  useMutation({
    mutationFn: (id) =>
      apiClient(`/v1/fund-request/${id}`, {
        method: "DELETE",
      }),
  });
