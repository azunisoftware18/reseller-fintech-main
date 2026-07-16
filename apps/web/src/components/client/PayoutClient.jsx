"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Landmark,
  Clock,
  XCircle,
  CheckCircle,
  Plus,
  Loader2,
} from "lucide-react";

import PayoutTable from "@/components/tables/PayoutTable";
import PayoutModal from "@/components/modals/PayoutModal";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";

import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import { usePayoutsForApprover } from "@/hooks/usePayout";

export default function PayoutClient({ onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [initiateModalOpen, setInitiateModalOpen] = useState(false);

  const perPage = 10;

  const perms = useSelector((s) => s.auth.user?.permissions);
  const currentUser = useSelector((s) => s.auth.user);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);
  const canViewPayout = can(PERMISSIONS.PAYOUT.READ);
  const canCreatePayout = can(PERMISSIONS.PAYOUT.CREATE);

  const {
    data: payoutData,
    isLoading: payoutLoading,
    refetch: refetchPayouts,
    error: payoutError,
  } = usePayoutsForApprover({
    page,
    limit: perPage,
    status: statusFilter === "all" ? "ALL" : statusFilter,
  });

  useEffect(() => {
    if (payoutError) {
      toast.error(payoutError?.message || "Failed to load payouts");
    }
  }, [payoutError]);

  // Use data directly without mapping
  const payouts = payoutData?.data || [];
  const meta = payoutData?.meta || {};
  const statsData = meta.stats || {};

  const stats = [
    {
      title: "Pending",
      value: statsData.PENDING?.count || 0,
      amount: statsData.PENDING?.amount || 0,
      icon: Clock,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Processing",
      value: statsData.PROCESSING?.count || 0,
      amount: statsData.PROCESSING?.amount || 0,
      icon: Loader2,
      iconColor: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Successful",
      value: statsData.SUCCESS?.count || 0,
      amount: statsData.SUCCESS?.amount || 0,
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Failed",
      value: statsData.FAILED?.count || 0,
      amount: statsData.FAILED?.amount || 0,
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Refunded",
      value: statsData.REFUNDED?.count || 0,
      amount: statsData.REFUNDED?.amount || 0,
      icon: RefreshCw,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Total Payouts",
      value: meta.total ?? 0,
      amount: Object.values(statsData).reduce(
        (sum, stat) => sum + (stat.amount || 0),
        0,
      ),
      icon: Landmark,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const handleRefresh = () => {
    refetchPayouts();
    if (onRefresh) onRefresh();
  };

  const handleInitiate = () => {
    if (!canCreatePayout) {
      toast.error("No permission to initiate payout");
      return;
    }
    setSelectedPayout(null);
    setInitiateModalOpen(true);
  };

  const handleView = (payout) => {
    if (!canViewPayout) {
      toast.error("No permission to view payout details");
      return;
    }
    setSelectedPayout(payout);
    setViewModalOpen(true);
  };

  const handleModalClose = () => {
    setInitiateModalOpen(false);
    setSelectedPayout(null);
    refetchPayouts();
    if (onRefresh) onRefresh();
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedPayout(null);
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">
            Manage payouts, track transfer status, and monitor bank transfers.
          </p>
        </div>

        <div className="flex gap-2">
          {canViewPayout && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              icon={RefreshCw}
              loading={payoutLoading}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {canViewPayout && (
        <>
          <QuickStats stats={stats} showAmounts={true} />
          <PayoutTable
            payouts={payouts}
            total={meta.total ?? 0}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onView={canViewPayout ? handleView : undefined}
            onAdd={canCreatePayout ? handleInitiate : undefined}
            loading={payoutLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      )}

      {/* INITIATE MODAL */}
      {initiateModalOpen && (
        <PayoutModal
          open={initiateModalOpen}
          onClose={handleModalClose}
          userId={currentUser?.user?.id}
        />
      )}

      {/* VIEW MODAL */}
      {viewModalOpen && (
        <PayoutModal
          open={viewModalOpen}
          onClose={handleViewModalClose}
          payout={selectedPayout}
          readOnly={true}
        />
      )}
    </>
  );
}
