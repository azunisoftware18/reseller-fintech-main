"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  BadgeIndianRupee,
  CheckCircle,
  ClipboardClock,
  Landmark,
} from "lucide-react";

import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";
import FundRequestTable from "../tables/FundRequestTable";

import { toast } from "@/lib/toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useFundTransactions,
  useUpdateFundRequestStatus,
} from "@/hooks/useFundRequest";
import { formatDateTime } from "@/lib/utils";
import FundStatusModal from "../modals/FundStatusModal";

export default function FundClient() {
  /* ================= UI STATE ================= */
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const perPage = 10;
  const debouncedSearch = useDebounce(search, 400);

  /* ================= API ================= */
  const { data, isLoading, refetch, error } = useFundTransactions({
    page,
    limit: perPage,
    search: debouncedSearch,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  useEffect(() => {
    if (error) toast.error(error?.message || "Something went wrong");
  }, [error]);

  const { mutate: updateStatus, isPending: updating } =
    useUpdateFundRequestStatus();

  const handleChangeStatus = (txn) => {
    setSelectedTxn(txn);
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = (newStatus, failureReason = null) => {
    updateStatus(
      {
        id: selectedTxn?.id,
        payload: {
          status: newStatus,
          failureReason,
        },
      },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setStatusModalOpen(false);
          setSelectedTxn(null);
          refetch();
        },
        onError: (err) => {
          toast.error(err?.message || "Update failed");
        },
      },
    );
  };

  /* ================= NORMALIZE ================= */
  const transactions =
    data?.data?.map((e) => ({
      ...e,
      createdAt: formatDateTime(e.createdAt),
    })) || [];

  const meta = data?.meta || {};

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Transactions",
      value: meta.total ?? 0,
      icon: BadgeIndianRupee,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Success",
      value: meta.stats?.SUCCESS ?? 0,
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending",
      value: meta.stats?.PENDING ?? 0,
      icon: ClipboardClock,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Rejected / Failed",
      value: (meta.stats?.FAILED ?? 0) + (meta.stats?.REJECTED ?? 0),
      icon: Landmark,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  /* ================= RENDER ================= */
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Funds Management</h1>
          <p className="text-muted-foreground">
            Centralized control for Managing, Funds
          </p>
        </div>

        <Button
          onClick={refetch}
          loading={isLoading}
          variant="outline"
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      <QuickStats stats={stats} />

      <FundRequestTable
        requestFundData={transactions}
        total={meta.total ?? 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onEdit={handleChangeStatus}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        loading={isLoading}
      />
      <FundStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isPending={updating}
        txn={selectedTxn}
      />
    </>
  );
}
