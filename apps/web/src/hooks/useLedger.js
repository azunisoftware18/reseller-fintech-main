import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const useLedger = ({
  page = 1,
  limit = 20,
  entryType = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) =>
  useQuery({
    queryKey: [
      "ledger",
      page,
      limit,
      entryType,
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
        entryType,
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/ledger/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
