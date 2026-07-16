"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CollapsibleSection({
  title,
  description,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border p-6">
          {children}
        </div>
      )}
    </div>
  );
}
