"use client";

import { cn } from "@/lib/utils";

export default function TextareaField({
  label,
  name,
  register,
  error,
  required = false,
  placeholder,
  rows = 2,
  disabled = false,
  className,
  ...rest
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:ring-destructive/40",
          className
        )}
        {...rest}
      />

      {error && (
        <p className="text-xs text-destructive mt-0.5">{error.message}</p>
      )}
    </div>
  );
}
