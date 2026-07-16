"use client";

import {
  ArrowUpRight,
  TrendingUp as GrowthIcon,
  CreditCard,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Send Money",
    icon: ArrowUpRight,
    color: "bg-primary/10 text-primary",
    href: "/dashboard/send",
  },
  {
    label: "Request Payment",
    icon: ArrowDownRight,
    color: "bg-success/10 text-success",
    href: "/dashboard/request",
  },
  {
    label: "Pay Bills",
    icon: CreditCard,
    color: "bg-warning/10 text-warning",
    href: "/dashboard/bills",
  },
  {
    label: "Invest",
    icon: GrowthIcon,
    color: "bg-info/10 text-info",
    href: "/dashboard/invest",
  },
];

export function QuickActions() {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <Link
          href="/dashboard/transactions"
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="bg-card border border-border rounded-lg-border p-4 hover:shadow-border transition-all duration-200"
          >
            <div
              className={`h-10 w-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-foreground">{action.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click to proceed
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
