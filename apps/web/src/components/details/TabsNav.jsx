"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TabsNav({ tabs, basePath }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex bg-muted rounded-lg p-1">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.value}`;
          const active = pathname === href;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              onClick={() => router.push(href)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon && <Icon size={16} />}

              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
