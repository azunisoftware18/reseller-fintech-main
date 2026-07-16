"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import KycForm from "../forms/KycForm";
import Button from "../ui/Button";
import { FileCheck, X } from "lucide-react";

export default function KycSubmitModal({
  open,
  onClose,
  onSubmit,
  isPending,
  userId,
  isResubmit = false,
  kycId = null,
  initialData = null,
}) {
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-linear-to-r from-primary to-primary/80 px-6 py-8 border-b border-border">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full ring-2 ring-primary-foreground/30">
                <FileCheck className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              {isResubmit ? "Resubmit KYC" : "Submit KYC"}
            </h2>

            <p className="text-primary-foreground/90 text-sm">
              {isResubmit
                ? "Update your KYC documents and resubmit for approval"
                : "Submit your KYC documents for verification"}
            </p>
          </div>
        </div>

        <div className="p-6 bg-card">
          <KycForm
            userId={userId}
            onSubmit={onSubmit}
            isPending={isPending}
            isResubmit={isResubmit}
            kycId={kycId}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
}
