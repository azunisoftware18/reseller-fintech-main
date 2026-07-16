"use client";

import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    label: "Pending",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    description: "Your KYC is under review. Please wait for approval.",
  },
  VERIFIED: {
    icon: CheckCircle,
    label: "Verified",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    description: "Your KYC has been verified successfully.",
  },
  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
    description:
      "Your KYC was rejected. Please resubmit with correct documents.",
  },
  NOT_SUBMITTED: {
    icon: FileCheck,
    label: "Not Submitted",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    description: "You haven't submitted KYC yet. Please submit your documents.",
  },
};

export default function KycStatusView({ kycData, isLoading, onRefresh }) {
  const status = kycData?.status || "NOT_SUBMITTED";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_SUBMITTED;
  const StatusIcon = config.icon;

  const personalInfo = kycData?.personalInfo;
  const address = kycData?.address;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KYC Status</h2>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={isLoading}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      <div
        className={`p-6 rounded-lg border ${config.borderColor} ${config.bgColor}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-background ${config.color}`}>
            <StatusIcon className="h-8 w-8" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {/* KYC Details */}
      {status !== "NOT_SUBMITTED" && kycData && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">KYC Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Submitted At
              </label>
              <p className="font-medium">
                {formatDateTime(kycData.submittedAt)}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Verification Mode
              </label>
              <p className="font-medium">
                {kycData.verificationMode || "MANUAL"}
              </p>
            </div>

            {kycData.approvedAt && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Approved At
                </label>
                <p className="font-medium text-success">
                  {formatDateTime(kycData.approvedAt)}
                </p>
              </div>
            )}

            {kycData.rejectedAt && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Rejected At
                </label>
                <p className="font-medium text-destructive">
                  {formatDateTime(kycData.rejectedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {kycData.rejectionReason && (
            <div className="pt-4 border-t">
              <label className="text-sm text-destructive font-medium">
                Rejection Reason
              </label>
              <p className="mt-1 text-sm bg-destructive/10 p-3 rounded-md">
                {kycData.rejectionReason}
              </p>
            </div>
          )}

          {/* Approval Notes */}
          {kycData.approvalNotes && (
            <div className="pt-4 border-t">
              <label className="text-sm text-success font-medium">
                Approval Notes
              </label>
              <p className="mt-1 text-sm bg-success/10 p-3 rounded-md">
                {kycData.approvalNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Personal Information (KRA) */}
      {personalInfo && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Full Name</label>
              <p className="font-medium">
                {personalInfo.firstName} {personalInfo.lastName}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Father's Name
              </label>
              <p className="font-medium">{personalInfo.fatherName}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Date of Birth
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {personalInfo.dob
                    ? new Date(personalInfo.dob).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Gender</label>
              <p className="font-medium capitalize">
                {personalInfo.gender?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address Information (KRA) */}
      {address && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Address Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-muted-foreground">Address</label>
              <p className="font-medium">{address.address}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">PIN Code</label>
              <p className="font-medium">{address.pinCode}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">State ID</label>
              <p className="font-medium">{address.stateId}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">City ID</label>
              <p className="font-medium">{address.cityId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {kycData?.documents && kycData.documents.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Submitted Documents</h3>

          <div className="space-y-3">
            {kycData.documents.map((doc, index) => (
              <div
                key={doc.id || index}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail Image */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted border">
                    <img
                      src={doc.documentUrl}
                      alt={doc.documentType}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div className="w-full h-full items-center justify-center hidden bg-muted">
                      <FileCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Status dot */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      doc.verificationStatus === "VERIFIED"
                        ? "bg-success"
                        : doc.verificationStatus === "REJECTED"
                          ? "bg-destructive"
                          : "bg-warning"
                    }`}
                  />
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{doc.documentType}</p>
                  {doc.documentNumber &&
                    doc.documentNumber !== doc.documentType && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doc.documentNumber}
                      </p>
                    )}
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.verificationStatus === "VERIFIED"
                        ? "bg-success/10 text-success"
                        : doc.verificationStatus === "REJECTED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {doc.verificationStatus}
                  </span>
                </div>

                {/* View Button */}
                <a
                  href={doc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
