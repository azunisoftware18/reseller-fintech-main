"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  width = "md:w-105",
  className,
}) {
  return (
    <div className={cn("relative w-full", width)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-4 py-2 border border-input bg-background rounded-border focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
      />
    </div>
  );
}
