"use client";

import { Share2 } from "lucide-react";
import Button from "../ui/Button";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import TenantSocialMediaForm from "../forms/TenantSocialMediaForm";

export default function TenantSocialMediaModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initialData,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card w-full max-w-3xl rounded-lg border shadow-lg overflow-hidden">
        <div className="relative bg-primary px-6 py-6 border-b">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Share2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-primary-foreground">
              Social Media Links
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Manage tenant social profiles
            </p>
          </div>
        </div>

        <div className="p-6">
          <TenantSocialMediaForm
            initialData={initialData}
            isPending={isPending}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
