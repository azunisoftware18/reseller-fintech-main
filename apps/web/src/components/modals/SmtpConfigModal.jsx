"use client";

import { Mail } from "lucide-react";
import Button from "../ui/Button";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import SmtpConfigForm from "../forms/SmtpConfigForm";

export default function SmtpConfigModal({
  open,
  onClose,
  onSubmit,
  isEditing = false,
  isPending = false,
  initialData,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card w-full max-w-3xl rounded-lg border border-border shadow-lg overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="relative bg-primary px-6 py-6 border-b border-border">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>

            <h2 className="text-xl font-semibold text-primary-foreground">
              {isEditing
                ? "Update SMTP Configuration"
                : "Create SMTP Configuration"}
            </h2>

            <p className="mt-1 text-sm text-primary-foreground/80">
              Configure outgoing email server credentials
            </p>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6">
          <SmtpConfigForm
            onSubmit={onSubmit}
            isPending={isPending}
            initialData={initialData}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
}
