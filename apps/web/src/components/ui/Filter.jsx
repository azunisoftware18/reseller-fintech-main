"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function FilterDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Filter",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeOption = options.find((o) => o.value === value);

  // outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <Button
        variant="outline"
        size="default"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        icon={ChevronDown}
        iconPosition="right"
      >
        {activeOption?.label || placeholder}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-52 rounded-border border border-border bg-card shadow-border">
          {options.map((opt) => {
            const isActive = value === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                  isActive ? "bg-accent text-foreground" : "hover:bg-accent"
                )}
              >
                <span>{opt.label}</span>

                {typeof opt.count === "number" && (
                  <span className="text-xs text-muted-foreground">
                    {opt.count}
                  </span>
                )}

                {isActive && <Check className="h-4 w-4 text-primary ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
