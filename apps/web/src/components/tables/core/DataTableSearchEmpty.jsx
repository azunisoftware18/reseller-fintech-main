"use client";

import { Search, Inbox } from "lucide-react";

export default function DataTableSearchEmpty({
  /* search */
  value,
  onChange,
  placeholder = "Search...",

  /* empty state */
  isEmpty = false,
  emptyTitle = "No data found",
  emptyDescription = "Try adjusting your search or filters.",
  emptyAction,
}) {
  return (
    <>
      {/* SEARCH (optional) */}
      {typeof value === "string" && typeof onChange === "function" && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-border
              focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* EMPTY STATE */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            {emptyTitle}
          </h3>

          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {emptyDescription}
          </p>

          {emptyAction && <div className="mt-6">{emptyAction}</div>}
        </div>
      )}
    </>
  );
}
