"use client";

import { cn } from "@/lib/utils";

export default function InputField({
  label,
  type = "text",
  step = "any",
  placeholder,
  register,
  name,
  required = false,
  disabled = false,
  rightIcon,
  onRightIconClick,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  onInput,
  onChange,
  accept,
  error,
}) {
  const isFile = type === "file";

  return (
    <div className="space-y-1.5">
      {/* LABEL */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {/* INPUT */}
      <div className="relative">
        {isFile ? (
          /* FILE INPUT (RHForm compatible) */
          <label
            className={cn(
              `
              flex items-center justify-between
              h-10 px-3 rounded-border border
              bg-background text-sm cursor-pointer
              transition
            `,
              error ? "border-destructive" : "border-input hover:bg-accent/40",
            )}
          >
            <span className="text-muted-foreground">Choose image</span>
            <span className="text-xs text-primary font-medium">Browse</span>

            <input
              type="file"
              accept={accept}
              disabled={disabled}
              className="hidden"
              {...(register ? register(name) : {})}
              onChange={(e) => {
                // ✅ 1. RHF ko file do
                register?.(name)?.onChange(e);

                // ✅ 2. Custom preview logic
                onChange?.(e);
              }}
            />
          </label>
        ) : (
          /* NORMAL INPUT */
          <>
            <input
              {...(register ? register(name) : {})}
              type={type}
              step={"any"}
              inputMode={inputMode}
              pattern={pattern}
              maxLength={maxLength}
              autoComplete={autoComplete}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              onInput={onInput}
              className={cn(
                `
                w-full h-10 px-3 pr-10
                rounded-border border bg-background text-foreground
                transition focus:outline-none focus:ring-2
                placeholder:text-muted-foreground
                disabled:opacity-60 disabled:cursor-not-allowed
              `,
                error
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-input focus:ring-ring",
              )}
            />

            {/* RIGHT ICON */}
            {rightIcon && (
              <button
                type="button"
                onClick={onRightIconClick}
                disabled={disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {rightIcon}
              </button>
            )}
          </>
        )}
      </div>

      {/* FIELD ERROR */}
      {error && (
        <p className="text-xs text-red-500 leading-tight">{error.message}</p>
      )}
    </div>
  );
}
