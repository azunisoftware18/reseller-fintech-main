"use client";

import { X, Wrench } from "lucide-react";
import Button from "../ui/Button";
import OperatorMapForm from "../forms/OperatorMapForm";

export default function OperatorMapModal({
  open,
  onClose,
  initialData,
  onSubmit,
  isPending,
  serviceProviderMappings,
}) {
  if (!open) return null;

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-lg overflow-hidden">
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
            <Wrench />
            <h2 className="text-xl font-bold">
              {isEditMode ? "Update Mapping" : "Create Mapping"}
            </h2>
          </div>
        </div>

        <div className="p-6">
          <OperatorMapForm
            initialData={initialData}
            onSubmit={onSubmit}
            isPending={isPending}
            serviceProviderMappings={serviceProviderMappings}
          />
        </div>
      </div>
    </div>
  );
}
