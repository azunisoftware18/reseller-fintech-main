"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SelectField({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  error,
  searchable = false,
  onSearch,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = safeOptions.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (!next) setSearch("");
            return next;
          });
        }}
        icon={ChevronDown}
        iconPosition="right"
        className="w-full justify-between"
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-border border border-border bg-card shadow-lg-border">
          {/* 🔍 SEARCH INPUT */}
          {searchable && (
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                onSearch?.(val); // 🔥 server-side search
              }}
              className="w-full border-b border-border px-3 py-2 text-sm"
            />
          )}

          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <p className="px-4 py-2 text-sm text-muted-foreground">
                Searching...
              </p>
            )}

            {!loading && safeOptions.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">
                No results found
              </p>
            )}

            {!loading &&
              safeOptions.map((opt) => {
                const isActive = opt.value === value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "group relative flex w-full items-center justify-between px-4 py-2 text-sm text-left",
                      isActive
                        ? "bg-theme/10 text-theme font-medium"
                        : "hover:bg-accent",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && <Check className="h-4 w-4 text-theme" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
