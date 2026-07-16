"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function FundStatusModal({
  open,
  onClose,
  onSubmit,
  isPending,
  txn,
}) {
  const [reason, setReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  if (!open || !txn) return null;

  const handleApprove = () => {
    onSubmit("SUCCESS");
  };

  const handleRejectClick = () => {
    setIsRejecting(true);
  };

  const handleConfirmReject = () => {
    if (!reason.trim()) {
      alert("Rejection reason is required");
      return;
    }
    onSubmit("REJECTED", reason);
  };

  return (
    <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change Status</h2>

        <p className="text-sm text-muted-foreground">
          Transaction ID: {txn.providerTxnId}
        </p>

        {/* 🔥 Show textarea only when rejecting */}
        {isRejecting && (
          <textarea
            placeholder="Enter rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-md p-2 text-sm"
          />
        )}

        <div className="flex gap-3 pt-4">
          {!isRejecting ? (
            <>
              <Button
                variant="success"
                onClick={handleApprove}
                loading={isPending}
              >
                Approve
              </Button>

              <Button variant="destructive" onClick={handleRejectClick}>
                Reject
              </Button>

              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleConfirmReject}
                loading={isPending}
              >
                Confirm Reject
              </Button>

              <Button variant="outline" onClick={() => setIsRejecting(false)}>
                Back
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
