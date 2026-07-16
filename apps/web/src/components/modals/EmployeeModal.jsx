"use client";

import { User } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import EmployeeForm from "@/components/forms/EmployeeForm";

export default function EmployeeModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initialData,
  departments,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-lg border bg-card shadow-lg overflow-hidden">
        <div className="relative bg-primary px-6 py-6 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            ✕
          </Button>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-primary-foreground">
              {initialData ? "Edit Employee" : "Add Employee"}
            </h2>
          </div>
        </div>

        <div className="p-6">
          <EmployeeForm
            initialData={initialData}
            isPending={isPending}
            onSubmit={onSubmit}
            departments={departments}
          />
        </div>
      </div>
    </div>
  );
}
