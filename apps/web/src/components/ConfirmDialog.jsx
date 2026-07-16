"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

const VARIANTS = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-destructive",
    titleClass: "text-destructive",
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-success",
    titleClass: "text-success",
  },
  info: {
    icon: Info,
    iconClass: "text-primary",
    titleClass: "text-primary",
  },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // danger | success | info
  loading = false,
}) {
  useLockBodyScroll(open);
  if (!open) return null;

  const Icon = VARIANTS[variant]?.icon || AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-lg">
        {/* HEADER */}
        <div className="p-6 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
            )}
          >
            <Icon className={cn("h-6 w-6", VARIANTS[variant]?.iconClass)} />
          </div>

          <h3
            className={cn(
              "text-lg font-semibold",
              VARIANTS[variant]?.titleClass
            )}
          >
            {title}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>

          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
