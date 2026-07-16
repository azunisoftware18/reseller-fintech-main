"use client";

import { X, Link } from "lucide-react";
import Button from "../ui/Button";
import ServiceProviderMappingForm from "../forms/ServiceProviderMappingForm";

export default function ServiceProviderMappingModal({
  open,
  onClose,
  onSubmit,
  isPending,
  editingMapping = null,
  servicesList = [],
  providersList = [],
}) {
  if (!open) return null;

  const isEditing = !!editingMapping;
  const title = isEditing ? "Edit Mapping" : "Add New Mapping";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Link />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
        </div>

        <div className="p-6">
          <ServiceProviderMappingForm
            onSubmit={onSubmit}
            isPending={isPending}
            editingMapping={editingMapping}
            servicesList={servicesList}
            providersList={providersList}
          />
        </div>
      </div>
    </div>
  );
}
