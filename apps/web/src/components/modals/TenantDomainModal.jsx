"use client";

import { Globe } from "lucide-react";

import Button from "@/components/ui/Button";
import TenantDomainForm from "@/components/forms/TenantDomainForm";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export default function TenantDomainModal({
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
          {/* Close */}
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-primary-foreground">
              {isEditing ? "Update Tenant Domain" : "Add Tenant Domain"}
            </h2>

            {/* Tagline */}
            <p className="mt-1 text-sm text-primary-foreground/80">
              Manage domain mapping and lifecycle status
            </p>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6">
          <TenantDomainForm
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
