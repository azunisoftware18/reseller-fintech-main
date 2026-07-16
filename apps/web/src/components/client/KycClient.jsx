"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  FileCheck,
  Clock,
  XCircle,
  CheckCircle,
} from "lucide-react";

import KycTable from "@/components/tables/KycTable";
import KycModal from "@/components/modals/KycModal";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";

import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import {
  useApproveKyc,
  useRejectKyc,
  useKycsForApprover,
} from "@/hooks/useKyc";

export default function KycClient() {
  const [page, setPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const perPage = 10;

  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canApproveKyc = can(PERMISSIONS.KYC.APPROVE);
  const canRejectKyc = can(PERMISSIONS.KYC.REJECT);
  const canViewKyc = can(PERMISSIONS.KYC.READ);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
    error: pendingError,
  } = useKycsForApprover({ page: 1, limit: 20, status: "ALL" });

  useEffect(() => {
    if (pendingError)
      toast.error(pendingError?.message || "Failed to load pending KYCs");
  }, [pendingError]);

  const { mutate: approveKyc, isPending: approving } = useApproveKyc();
  const { mutate: rejectKyc, isPending: rejecting } = useRejectKyc();

  const kycs =
    pendingData?.data?.map((item) => ({
      id: item.id,
      userId: item.userId,
      status: item.status,
      verificationMode: item.verificationMode,
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
      documents: item.documents || [],
    })) || [];

  const meta = pendingData?.meta || {};

  const filteredKycs =
    statusFilter === "all"
      ? kycs
      : kycs.filter((k) => k.status === statusFilter);

  const stats = [
    {
      title: "Pending KYCs",
      value: kycs.filter((k) => k.status === "PENDING").length,
      icon: Clock,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Verified KYCs",
      value: kycs.filter((k) => k.status === "VERIFIED").length,
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Rejected KYCs",
      value: kycs.filter((k) => k.status === "REJECTED").length,
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total",
      value: meta.total ?? 0,
      icon: FileCheck,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const handleRefresh = () => {
    refetchPending();
  };

  const handleApprove = (kyc) => {
    if (!canApproveKyc) {
      toast.error("No permission to approve KYC");
      return;
    }

    approveKyc(
      { kycId: kyc.id, approvalNotes: "" },
      {
        onSuccess: () => {
          toast.success("KYC approved successfully");
          refetchPending();
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to approve KYC");
        },
      },
    );
  };

  const handleRejectClick = (kyc) => {
    if (!canRejectKyc) {
      toast.error("No permission to reject KYC");
      return;
    }
    setSelectedKyc(kyc);
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

    rejectKyc(
      { kycId: selectedKyc.id, rejectionReason: trimmedReason },
      {
        onSuccess: () => {
          toast.success("KYC rejected successfully");
          setRejectModalOpen(false);
          setRejectionReason("");
          setSelectedKyc(null);
          refetchPending();
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to reject KYC");
        },
      },
    );
  };

  const handleView = (kyc) => {
    if (!canViewKyc) {
      toast.error("No permission to view KYC");
      return;
    }
    setSelectedKyc(kyc);
    setViewModalOpen(true);
  };

  return (
    <>
      {/* Header with Refresh Button */}
      <div className="mb-6 flex justify-end">
        {canApproveKyc && (
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
      {canApproveKyc && (
        <>
          <QuickStats stats={stats} />
          <KycTable
            kycs={filteredKycs}
            total={meta.total ?? 0}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onApprove={canApproveKyc ? handleApprove : undefined}
            onReject={canRejectKyc ? handleRejectClick : undefined}
            onView={canViewKyc ? handleView : undefined}
            loading={pendingLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      )}

      {/* View KYC Modal */}
      {viewModalOpen && (
        <KycModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedKyc(null);
          }}
          kyc={selectedKyc}
        />
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reject KYC</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this KYC.
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
                  setSelectedKyc(null);
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
