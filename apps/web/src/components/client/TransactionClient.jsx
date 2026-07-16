"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Receipt,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import TransactionTable from "@/components/tables/TransactionTable";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";
import TransactionViewModal from "@/components/modals/TransactionViewModal";

import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import { useTransactions } from "@/hooks/useTransaction";

export default function TransactionClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const perPage = 10;
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);
  const canViewTransaction = can(PERMISSIONS.TRANSACTION.READ);

  const {
    data: responseData,
    isLoading,
    refetch,
    error,
  } = useTransactions({
    page,
    limit: perPage,
    status: statusFilter,
    serviceType: serviceTypeFilter,
    mode: modeFilter,
    search,
  });

  useEffect(() => {
    if (error) toast.error(error?.message || "Failed to load transactions");
  }, [error]);

  const transactions = responseData?.data?.transactions || [];
  const meta = responseData?.meta || {};

  const totalTransactionAmount = transactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0,
  );

  const totalCommission = transactions.reduce((sum, t) => {
    try {
      const pricing = JSON.parse(t.pricing || "{}");
      return sum + (Number(pricing.commission) || 0);
    } catch {
      return sum;
    }
  }, 0);

  const totalSurcharge = transactions.reduce((sum, t) => {
    try {
      const pricing = JSON.parse(t.pricing || "{}");
      return sum + (Number(pricing.tds) || 0) + (Number(pricing.gst) || 0);
    } catch {
      return sum;
    }
  }, 0);

  const stats = [
    {
      title: "Total Transactions",
      value: transactions.length,
      icon: Receipt,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Amount",
      value: `₹${totalTransactionAmount.toFixed(2)}`,
      icon: Wallet,
      iconColor: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Commission Earned",
      value: `₹${totalCommission.toFixed(2)}`,
      icon: TrendingUp,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Surcharge Paid",
      value: `₹${totalSurcharge.toFixed(2)}`,
      icon: TrendingDown,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const handleRefresh = () => refetch();

  const handleView = (transaction) => {
    if (!canViewTransaction) {
      toast.error("No permission to view transaction details");
      return;
    }
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Transactions & Earnings</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          icon={RefreshCw}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      <QuickStats stats={stats} />

      <TransactionTable
        data={transactions}
        total={meta.total || transactions.length}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onView={canViewTransaction ? handleView : undefined}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        serviceTypeFilter={serviceTypeFilter}
        onServiceTypeFilterChange={setServiceTypeFilter}
        modeFilter={modeFilter}
        onModeFilterChange={setModeFilter}
      />

      <TransactionViewModal
        open={viewModalOpen}
        onClose={handleViewModalClose}
        transaction={selectedTransaction}
      />
    </>
  );
}
