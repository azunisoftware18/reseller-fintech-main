"use client";

import { Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import RoleForm from "@/components/forms/RoleForm";

export default function RoleModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initialData,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card w-full max-w-2xl rounded-lg border shadow-lg">
        {/* HEADER */}
        <div className="relative bg-primary px-6 py-6 border-b">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-primary-foreground">
              {isEdit ? "Edit Role" : "Create Role"}
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Define system hierarchy & access level
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6">
          <RoleForm
            initialData={initialData}
            isPending={isPending}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
