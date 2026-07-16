"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import Button from "../ui/Button";
import {
  FileCheck,
  X,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Image,
} from "lucide-react";

export default function KycModal({ open, onClose, kyc }) {
  useLockBodyScroll(open);

  if (!open || !kyc) return null;

  const statusIcon = {
    PENDING: Clock,
    VERIFIED: CheckCircle,
    REJECTED: XCircle,
  };

  const StatusIcon = statusIcon[kyc.status] || Clock;

  // 🔥 NEW: Document type display names
  const documentTypeLabels = {
    PAN: "PAN Card",
    AADHAAR_FRONT: "Aadhaar (Front)",
    AADHAAR_BACK: "Aadhaar (Back)",
    ADDRESS_PROOF: "Address Proof",
    USER_PHOTO: "User Photo",
  };

  // 🔥 NEW: Get document icon based on type
  const getDocumentIcon = (type) => {
    if (type === "USER_PHOTO") return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-primary px-6 py-8 border-b border-border">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full">
                <FileCheck className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              KYC Details
            </h2>
            <p className="text-primary-foreground/90 text-sm">
              View KYC information and documents
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                kyc.status === "PENDING"
                  ? "bg-warning/10 text-warning"
                  : kyc.status === "VERIFIED"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
              }`}
            >
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium">{kyc.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Full Name</label>
              <p className="font-medium">
                {kyc.user?.firstName && kyc.user?.lastName
                  ? `${kyc.user.firstName} ${kyc.user.lastName}`
                  : kyc.fullName || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">
                {kyc.user?.email || kyc.email || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Mobile</label>
              <p className="font-medium">
                {kyc.user?.mobileNumber || kyc.mobileNumber || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Role</label>
              <p className="font-medium">
                {kyc.role?.roleName || kyc.roleName || "N/A"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">KYC Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Submitted At
                </label>
                <p className="font-medium">{kyc.submittedAt || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Verification Mode
                </label>
                <p className="font-medium">
                  {kyc.verificationMode || "MANUAL"}
                </p>
              </div>
              {kyc.approvedAt && (
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Approved At
                  </label>
                  <p className="font-medium">{kyc.approvedAt}</p>
                </div>
              )}
              {kyc.rejectedAt && (
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Rejected At
                  </label>
                  <p className="font-medium">{kyc.rejectedAt}</p>
                </div>
              )}
            </div>
          </div>

          {/* 🔥 NEW: Documents Section */}
          {kyc.documents && kyc.documents.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Documents</h3>
              <div className="space-y-3">
                {kyc.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Document Thumbnail */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted border">
                        <img
                          src={doc.documentUrl}
                          alt={
                            documentTypeLabels[doc.documentType] ||
                            doc.documentType
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="w-full h-full items-center justify-center hidden bg-muted">
                          {getDocumentIcon(doc.documentType)}
                        </div>
                      </div>
                      {/* Verification Status Badge */}
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
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(doc.documentType)}
                        <p className="font-medium text-sm truncate">
                          {documentTypeLabels[doc.documentType] ||
                            doc.documentType}
                        </p>
                      </div>
                      {doc.documentNumber &&
                        doc.documentNumber !== doc.documentType && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.documentNumber}
                          </p>
                        )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
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
                    </div>

                    {/* View Button */}
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
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

          {kyc.rejectionReason && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-destructive">
                Rejection Reason
              </h3>
              <p className="text-sm bg-destructive/10 p-3 rounded-md">
                {kyc.rejectionReason}
              </p>
            </div>
          )}

          {kyc.approvalNotes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-success">
                Approval Notes
              </h3>
              <p className="text-sm bg-success/10 p-3 rounded-md">
                {kyc.approvalNotes}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
