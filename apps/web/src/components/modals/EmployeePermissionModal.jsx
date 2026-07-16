"use client";

import { X, Shield } from "lucide-react";
import Button from "../ui/Button";
import PermissionForm from "../forms/PermissionForm";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export default function EmployeePermissionModal({
  open,
  onClose,
  employee,
  onSubmit,
  isPending,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-lg w-full max-w-3xl">
        <div className="relative bg-primary px-6 py-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X size={18} />
          </Button>

          <div className="flex items-center gap-3 text-primary-foreground">
            <Shield />
            <div>
              <h2 className="text-xl font-bold">Assign Permissions</h2>
              <p className="text-sm opacity-90">{employee?.fullName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <PermissionForm
            mode="employee"
            onSubmit={onSubmit}
            isPending={isPending}
            permissions={employee?.employeePermissions || []}
          />
        </div>
      </div>
    </div>
  );
}
