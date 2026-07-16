"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function TablePagination({ page, setPage, total, perPage }) {
  if (total === 0) return null;

  const totalPages = Math.ceil(total / perPage);

  // -----------------------------
  // PAGE NUMBERS LOGIC
  // -----------------------------
  const pages = [];

  if (totalPages <= 7) {
    // show all
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    // first 3
    pages.push(1, 2, 3);

    // dots
    if (page > 4) pages.push("dots-start");

    // middle
    if (page > 3 && page < totalPages - 2) {
      pages.push(page);
    }

    // dots
    if (page < totalPages - 3) pages.push("dots-end");

    // last 2
    pages.push(totalPages - 1, totalPages);
  }

  return (
    <div className="p-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
      {/* INFO */}
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)}{" "}
        of {total}
      </p>

      {/* CONTROLS */}
      <div className="flex items-center gap-2">
        {/* PREV */}
        <Button
          size="icon"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* PAGE NUMBERS */}
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <Button
              key={i}
              size="sm"
              variant={p === page ? "default" : "outline"}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ) : (
            <span key={i} className="px-2 text-sm text-muted-foreground">
              …
            </span>
          )
        )}

        {/* NEXT */}
        <Button
          size="icon"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
