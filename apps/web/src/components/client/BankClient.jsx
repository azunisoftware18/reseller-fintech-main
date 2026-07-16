"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Landmark, Clock, XCircle, CheckCircle } from "lucide-react";

import BankTable from "@/components/tables/BankTable";
import BankModal from "@/components/modals/BankModal";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";

import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import {
  useBanksForApprover,
  useApproveBank,
  useRejectBank,
} from "@/hooks/useBank";

export default function BankClient() {
  const [page, setPage] = useState(1);
  const [selectedBank, setSelectedBank] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const perPage = 10;

  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canApproveBank = can(PERMISSIONS.BANK.APPROVE);
  const canRejectBank = can(PERMISSIONS.BANK.REJECT);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
    error: pendingError,
  } = useBanksForApprover({ page: 1, limit: 20, status: "ALL" });

  const { mutate: approveBank, isPending: approving } = useApproveBank();
  const { mutate: rejectBank, isPending: rejecting } = useRejectBank();

  useEffect(() => {
    if (pendingError)
      toast.error(
        pendingError?.message || "Failed to load pending bank details",
      );
  }, [pendingError]);

  const banks =
    pendingData?.data?.map((item) => ({
      id: item.id,
      userId: item.userId,
      bankName: item.bankName,
      accountHolderName: item.accountHolderName,
      accountNumber: item.accountNumber,
      ifscCode: item.ifscCode,
      branchName: item.branchName,
      isPrimary: item.isPrimary,
      verificationStatus: item.verificationStatus,
      submittedAt: formatDateTime(item.submittedAt),
      approvedAt: formatDateTime(item.approvedAt),
      rejectedAt: formatDateTime(item.rejectedAt),
      rejectionReason: item.rejectionReason,
      approvalNotes: item.approvalNotes,
      fullName: item.user ? `${item.user.firstName} ${item.user.lastName}` : "",
      email: item.user?.email,
      mobileNumber: item.user?.mobileNumber,
      roleName: item.role?.roleName,
      roleCode: item.role?.roleCode,
      bankProofDocumentUrl: item.bankProofDocumentUrl,
    })) || [];

  const meta = pendingData?.meta || {};

  const filteredBanks =
    statusFilter === "all"
      ? banks
      : banks.filter((b) => b.verificationStatus === statusFilter);

  const stats = [
    {
      title: "Pending Approvals",
      value: banks.filter((b) => b.verificationStatus === "PENDING").length,
      icon: Clock,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Verified Banks",
      value: banks.filter((b) => b.verificationStatus === "VERIFIED").length,
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Rejected Banks",
      value: banks.filter((b) => b.verificationStatus === "REJECTED").length,
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total Submissions",
      value: meta.total ?? 0,
      icon: Landmark,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const handleRefresh = () => {
    refetchPending();
  };

  const handleApprove = (bank) => {
    if (!canApproveBank) {
      toast.error("No permission to approve bank details");
      return;
    }

    approveBank(
      { bankDetailId: bank.id, approvalNotes: "" },
      {
        onSuccess: () => {
          toast.success("Bank detail approved successfully");
          refetchPending();
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to approve bank detail");
        },
      },
    );
  };

  const handleRejectClick = (bank) => {
    if (!canRejectBank) {
      toast.error("No permission to reject bank details");
      return;
    }
    setSelectedBank(bank);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (trimmedReason.length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    rejectBank(
      {
        bankDetailId: selectedBank.id,
        rejectionReason: trimmedReason,
      },
      {
        onSuccess: () => {
          toast.success("Bank detail rejected successfully");
          setRejectModalOpen(false);
          setRejectionReason("");
          setSelectedBank(null);
          refetchPending();
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to reject bank detail");
        },
      },
    );
  };

  return (
    <>
      {/* Header with Refresh Button */}
      <div className="mb-6 flex justify-end">
        {canApproveBank && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            icon={RefreshCw}
            loading={pendingLoading}
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Pending Approvals Content */}
      {canApproveBank && (
        <>
          <QuickStats stats={stats} />
          <BankTable
            bankDetails={filteredBanks}
            total={meta.total ?? 0}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onApprove={canApproveBank ? handleApprove : undefined}
            onReject={canRejectBank ? handleRejectClick : undefined}
            loading={pendingLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Bank</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this bank detail.
            </p>
            <textarea
              className="w-full min-h-25 p-3 rounded-md border border-input bg-background"
              placeholder="Enter rejection reason (min 10 characters)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <p
              className={`text-xs mt-1 ${
                rejectionReason.trim().length > 0 &&
                rejectionReason.trim().length < 10
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {rejectionReason.trim().length}/10 characters minimum
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason("");
                  setSelectedBank(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                loading={rejecting}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
