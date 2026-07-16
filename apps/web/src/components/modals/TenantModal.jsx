"use client";

import { Building2 } from "lucide-react";
import TenantForm from "../forms/TenantForm";
import Button from "../ui/Button";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export default function TenantModal({
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
          {/* Close button */}
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-primary-foreground">
              {isEditing ? "Update Tenant" : "Create Tenant"}
            </h2>

            {/* Tagline */}
            <p className="mt-1 text-sm text-primary-foreground/80">
              Manage tenant identity and status
            </p>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6">
          <TenantForm
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
