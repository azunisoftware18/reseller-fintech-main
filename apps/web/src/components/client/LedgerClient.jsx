"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
} from "lucide-react";

import LedgerTable from "@/components/tables/LedgerTable";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";

import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import { useLedger } from "@/hooks/useLedger";

export default function LedgerClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState("ALL");

  const perPage = 20;
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);
  const canViewLedger = can(PERMISSIONS.LEDGER.READ);

  const {
    data: responseData,
    isLoading,
    refetch,
    error,
  } = useLedger({
    page,
    limit: perPage,
    entryType: entryTypeFilter,
    search,
  });

  useEffect(() => {
    if (error) toast.error(error?.message || "Failed to load ledger");
  }, [error]);

  const items = responseData?.data || [];
  const meta = responseData?.meta || {};
  const summary = meta.summary || {};

  const stats = [
    {
      title: "Wallet Balance",
      value: `₹${((meta.walletBalance || 0) / 100).toFixed(2)}`,
      icon: Wallet,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Credits",
      value: `₹${((summary.totalCredits || 0) / 100).toFixed(2)}`,
      icon: ArrowDownLeft,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Debits",
      value: `₹${((summary.totalDebits || 0) / 100).toFixed(2)}`,
      icon: ArrowUpRight,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Blocked Amount",
      value: `₹${((meta.walletBlocked || 0) / 100).toFixed(2)}`,
      icon: Lock,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const handleRefresh = () => refetch();

  const handleView = (item) => {
    if (!canViewLedger) {
      toast.error("No permission to view");
      return;
    }
    console.log("View ledger entry:", item);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Ledger</h1>
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

      <LedgerTable
        data={items}
        total={meta.total ?? 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onView={canViewLedger ? handleView : undefined}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        entryTypeFilter={entryTypeFilter}
        onEntryTypeFilterChange={setEntryTypeFilter}
      />
    </>
  );
}
