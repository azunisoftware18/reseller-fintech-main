// hooks/useReports.js
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// Report for Transactions
export const useTransactionsReport = ({
  page = 1,
  limit = 20,
  status = "ALL",
  serviceType = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "initiatedAt",
  sortOrder = "desc",
  enabled = true,
}) =>
  useQuery({
    queryKey: [
      "reports",
      "transactions",
      page,
      limit,
      status,
      serviceType,
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
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/report/transactions/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });

// Report for Transaction Earnings
export const useTransactionEarningsReport = ({
  page = 1,
  limit = 20,
  mode = "ALL",
  status = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortOrder = "desc",
  enabled = true,
}) =>
  useQuery({
    queryKey: [
      "reports",
      "earnings",
      page,
      limit,
      mode,
      status,
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
        mode,
        status,
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(
        `/report/transactions/earnings/list?${params.toString()}`,
      );
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });

// Report for Refunds
export const useRefundsReport = ({
  page = 1,
  limit = 20,
  status = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortOrder = "desc",
  enabled = true,
}) =>
  useQuery({
    queryKey: [
      "reports",
      "refunds",
      page,
      limit,
      status,
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
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/report/refunds/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });

// Report for Ledger (Own Ledger Entries)
export const useLedgerReport = ({
  page = 1,
  limit = 20,
  type = "ALL",
  search = "",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortOrder = "desc",
  enabled = true,
}) =>
  useQuery({
    queryKey: [
      "reports",
      "ledger",
      page,
      limit,
      type,
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
        type,
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      return apiClient(`/report/ledger/list?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });

// Combined Report (All in One)
export const useCombinedReport = ({
  // Transaction filters
  transactionPage = 1,
  transactionLimit = 20,
  transactionStatus = "ALL",
  transactionServiceType = "ALL",
  transactionSearch = "",

  // Earnings filters
  earningsPage = 1,
  earningsLimit = 20,
  earningsMode = "ALL",
  earningsStatus = "ALL",
  earningsSearch = "",

  // Refund filters
  refundPage = 1,
  refundLimit = 20,
  refundStatus = "ALL",
  refundSearch = "",

  // Common filters
  fromDate = "",
  toDate = "",
  enabled = true,
}) =>
  useQuery({
    queryKey: [
      "reports",
      "combined",
      transactionPage,
      transactionLimit,
      transactionStatus,
      transactionServiceType,
      transactionSearch,
      earningsPage,
      earningsLimit,
      earningsMode,
      earningsStatus,
      earningsSearch,
      refundPage,
      refundLimit,
      refundStatus,
      refundSearch,
      fromDate,
      toDate,
    ],
    queryFn: async () => {
      const [transactions, earnings, refunds] = await Promise.all([
        apiClient(
          `/report/transactions/list?${new URLSearchParams({
            page: String(transactionPage),
            limit: String(transactionLimit),
            status: transactionStatus,
            serviceType: transactionServiceType,
            ...(transactionSearch && { search: transactionSearch }),
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            sortBy: "initiatedAt",
            sortOrder: "desc",
          })}`,
        ),

        apiClient(
          `/report/transactions/earnings/list?${new URLSearchParams({
            page: String(earningsPage),
            limit: String(earningsLimit),
            mode: earningsMode,
            status: earningsStatus,
            ...(earningsSearch && { search: earningsSearch }),
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            sortBy: "createdAt",
            sortOrder: "desc",
          })}`,
        ),

        apiClient(
          `/report/refunds/list?${new URLSearchParams({
            page: String(refundPage),
            limit: String(refundLimit),
            status: refundStatus,
            ...(refundSearch && { search: refundSearch }),
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            sortBy: "createdAt",
            sortOrder: "desc",
          })}`,
        ),
      ]);

      return {
        transactions: transactions.data,
        earnings: earnings.data,
        refunds: refunds.data,
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });
