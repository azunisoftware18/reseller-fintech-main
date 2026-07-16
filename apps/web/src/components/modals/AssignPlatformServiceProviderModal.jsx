"use client";

import { X, Settings } from "lucide-react";
import Button from "../ui/Button";
import AssignPlatformServiceProviderForm from "../forms/AssignPlatformServiceProviderForm";

export default function AssignPlatformServiceProviderModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isPending,
  allProviders = [],
}) {
  if (!open) return null;

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-xl overflow-hidden">
        <div className="bg-primary px-6 py-6 relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X />
          </Button>

          <div className="flex gap-3 text-primary-foreground">
            <Settings />
            <h2 className="text-xl font-bold">
              {isEditMode ? "Update Provider Config" : "Assign Provider"}
            </h2>
          </div>
        </div>

        <div className="p-6">
          <AssignPlatformServiceProviderForm
            initialData={initialData}
            allProviders={allProviders}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        </div>
      </div>
    </div>
  );
}
