"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function RowActions({
  onView,
  onEdit,
  onDelete,
  extraActions = [],
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = () => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    setOpenUp(spaceBelow < 180);
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <Button
        size="icon"
        variant="ghost"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </Button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 min-w-42 rounded-border border border-border bg-card shadow-border",
            openUp ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {onView && <MenuItem icon={Eye} label="View" onClick={onView} />}

          {onEdit && <MenuItem icon={Edit} label="Edit" onClick={onEdit} />}

          {extraActions.map((a, i) => (
            <MenuItem
              key={i}
              icon={a.icon}
              label={a.label}
              onClick={a.onClick}
            />
          ))}

          {onDelete && (
            <>
              <div className="my-1 h-px bg-border border-t " />
              <MenuItem
                icon={Trash2}
                label="Delete"
                danger
                onClick={onDelete}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- MENU ITEM ---------------- */

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      <span className="flex-1 text-left">{label}</span>
    </Button>
  );
}
