"use client";

import { X, Settings } from "lucide-react";
import PlatformServiceProviderForm from "../forms/PlatformServiceProviderForm";
import Button from "../ui/Button";

export default function PlatformServiceProviderModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isPending,
}) {
  if (!open) return null;

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-xl overflow-hidden">
        {/* HEADER */}
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
              {isEditMode ? "Update Provider" : "Create Provider"}
            </h2>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6">
          <PlatformServiceProviderForm
            initialData={initialData}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        </div>
      </div>
    </div>
  );
}
