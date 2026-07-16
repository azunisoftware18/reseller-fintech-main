import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const useTransactions = ({
  page = 1,
  limit = 10,
  status = "ALL",
  serviceType = "ALL",
  mode = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "initiatedAt",
  sortOrder = "desc",
}) =>
  useQuery({
    queryKey: [
      "transactions",
      page,
      limit,
      status,
      serviceType,
      mode,
      search,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status,
        serviceType,
        mode,
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/transactions/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
