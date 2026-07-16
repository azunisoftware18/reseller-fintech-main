"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import UserForm from "../forms/UserForm";
import Button from "../ui/Button";
import { User, X } from "lucide-react";

export default function UserModal({
  open,
  onClose,
  onSubmit,
  isEditing = false,
  initialData,
  isPending,
  roles = [],
  tenants = [],
  onTenantSearch = () => {},
  currentUserRole,
}) {
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="relative bg-primary px-6 py-8 border-b border-border">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              {isEditing ? "Update User" : "Create User"}
            </h2>

            <p className="text-primary-foreground/90 text-sm">
              {isEditing
                ? "Manage user account and permissions"
                : "Add a new user to your organization"}
            </p>
          </div>
        </div>

        <div className="p-6">
          <UserForm
            onSubmit={onSubmit}
            isEditing={isEditing}
            initialData={initialData}
            isPending={isPending}
            roles={roles}
            tenants={tenants}
            onTenantSearch={onTenantSearch}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
    </div>
  );
}
