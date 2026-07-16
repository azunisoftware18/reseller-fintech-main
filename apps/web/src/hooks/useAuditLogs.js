import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const useAuditLogs = ({
  page = 1,
  limit = 20,
  entityType = "ALL",
  action = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) =>
  useQuery({
    queryKey: [
      "audit-logs",
      page,
      limit,
      entityType,
      action,
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
        entityType,
        action,
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/audit-logs/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
