"use client";

import {
  Landmark,
  Plus,
  Star,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

import Button from "@/components/ui/Button";

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    label: "Pending",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    description: "Your bank detail is under review.",
  },

  VERIFIED: {
    icon: CheckCircle,
    label: "Verified",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    description: "Your bank detail has been verified.",
  },

  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
    description: "Your bank detail was rejected.",
  },
};

export default function BankStatusView({
  bankDetails,
  onAddBank,
  onSetPrimary,
  onDelete,
  onResubmit,
  canAddBank,
  isLoading,
}) {
  const primaryBank = bankDetails?.find((b) => b.isPrimary);

  const otherBanks = bankDetails?.filter((b) => !b.isPrimary) || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Bank Accounts</h2>

          <p className="text-sm text-muted-foreground mt-1">
            {bankDetails?.length || 0} bank accounts added
          </p>
        </div>

        {canAddBank && (
          <Button onClick={onAddBank} icon={Plus}>
            Add Bank
          </Button>
        )}
      </div>

      {/* EMPTY STATE */}
      {(!bankDetails || bankDetails.length === 0) && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

          <h3 className="text-lg font-semibold mb-2">No Bank Accounts Added</h3>

          <p className="text-sm text-muted-foreground mb-4">
            You haven't added any bank accounts yet.
          </p>

          {canAddBank && (
            <Button onClick={onAddBank} icon={Plus}>
              Add Your First Bank Account
            </Button>
          )}
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading bank accounts...
          </p>
        </div>
      )}

      {/* PRIMARY BANK */}
      {primaryBank && (
        <div className="bg-card border-2 border-primary/30 rounded-lg overflow-hidden">
          <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center gap-2">
            <Star className="h-4 w-4 text-warning fill-warning" />

            <span className="text-sm font-semibold text-primary">
              Primary Bank Account
            </span>
          </div>

          <BankCard
            bankDetail={primaryBank}
            isPrimary={true}
            onSetPrimary={onSetPrimary}
            onDelete={onDelete}
            onResubmit={onResubmit}
          />
        </div>
      )}

      {/* OTHER BANKS */}
      {otherBanks.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-muted-foreground">
            Other Bank Accounts
          </h3>

          {otherBanks.map((bank) => (
            <BankCard
              key={bank.id}
              bankDetail={bank}
              isPrimary={false}
              onSetPrimary={onSetPrimary}
              onDelete={onDelete}
              onResubmit={onResubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BankCard({
  bankDetail,
  isPrimary,
  onSetPrimary,
  onDelete,
  onResubmit,
}) {
  const config =
    STATUS_CONFIG[bankDetail.verificationStatus] || STATUS_CONFIG.PENDING;

  const StatusIcon = config.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* BANK INFO */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{bankDetail.bankName}</h3>

            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color}`}
            >
              <StatusIcon className="h-3 w-3" />

              <span>{config.label}</span>
            </div>

            {isPrimary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">
                <Star className="h-3 w-3 fill-warning" />
                Primary
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-muted-foreground text-xs">
                Account Holder
              </label>

              <p className="font-medium">{bankDetail.accountHolderName}</p>
            </div>

            <div>
              <label className="text-muted-foreground text-xs">
                Account Number
              </label>

              <p className="font-mono font-medium">
                {bankDetail.accountNumber}
              </p>
            </div>

            <div>
              <label className="text-muted-foreground text-xs">IFSC Code</label>

              <p className="font-mono uppercase">{bankDetail.ifscCode}</p>
            </div>

            <div>
              <label className="text-muted-foreground text-xs">Branch</label>

              <p>{bankDetail.branchName}</p>
            </div>
          </div>

          {/* REJECTION REASON */}
          {bankDetail.rejectionReason && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              <span className="font-semibold">Rejection Reason:</span>{" "}
              {bankDetail.rejectionReason}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex md:flex-col gap-2 justify-end">
          {/* SET PRIMARY */}
          {!isPrimary &&
            bankDetail.verificationStatus === "VERIFIED" &&
            onSetPrimary && (
              <Button
                variant="outline"
                size="sm"
                icon={Star}
                onClick={() => onSetPrimary(bankDetail)}
              >
                Set Primary
              </Button>
            )}

          {/* RESUBMIT */}
          {bankDetail.verificationStatus === "REJECTED" && onResubmit && (
            <Button
              variant="warning"
              size="sm"
              icon={RefreshCw}
              onClick={() => onResubmit(bankDetail)}
            >
              Resubmit
            </Button>
          )}

          {/* DELETE */}
          {(bankDetail.verificationStatus === "PENDING" ||
            bankDetail.verificationStatus === "REJECTED") &&
            onDelete && (
              <Button
                variant="destructive"
                size="sm"
                icon={Trash2}
                onClick={() => onDelete(bankDetail)}
              >
                Delete
              </Button>
            )}
        </div>
      </div>

      {/* DOCUMENT */}
      {bankDetail.bankProofDocumentUrl && (
        <div className="mt-3 pt-3 border-t">
          <a
            href={bankDetail.bankProofDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm hover:underline flex items-center gap-1"
          >
            <Landmark className="h-4 w-4" />
            View Bank Proof Document
          </a>
        </div>
      )}
    </div>
  );
}
