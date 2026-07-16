"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import BankForm from "../forms/BankForm";
import Button from "../ui/Button";
import { Landmark, X } from "lucide-react";

export default function BankModal({
  open,
  onClose,
  userId,
  bankDetail = null,
  readOnly = false,
}) {
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Landmark className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              {readOnly
                ? "Bank Account Details"
                : bankDetail
                  ? "Edit Bank Account"
                  : "Add Bank Account"}
            </h2>

            <p className="text-primary-foreground/90 text-sm">
              {readOnly
                ? "View bank account details"
                : bankDetail
                  ? "Update your bank account information"
                  : "Add a new bank account for withdrawals and settlements"}
            </p>
          </div>
        </div>

        <div className="p-6 bg-card">
          <BankForm
            userId={userId}
            bank={bankDetail}
            readOnly={readOnly}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
