"use client";

import { X, Shield } from "lucide-react";
import Button from "../ui/Button";
import PermissionForm from "../forms/PermissionForm";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export default function RolePermissionModal({
  open,
  onClose,
  role,
  onSubmit,
  isPending,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-lg w-full max-w-3xl overflow-hidden">
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
              <h2 className="text-xl font-bold">Role Permissions</h2>
              <p className="text-sm opacity-90">{role.roleName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <PermissionForm
            mode="role"
            onSubmit={onSubmit}
            isPending={isPending}
            permissions={role?.permissions || []}
          />
        </div>
      </div>
    </div>
  );
}
