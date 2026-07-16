"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export default function QuickStats({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.isPositive !== false;

        return (
          <div
            key={index}
            className="bg-card border border-border rounded-lg-border px-6 py-2"
          >
            {/* TOP */}
            <div className="flex justify-between items-start mb-2">
              {/* ICON */}
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  stat.bgColor || "bg-primary/10"
                }`}
              >
                {Icon && <Icon className={`h-6 w-6 ${stat.iconColor || ""}`} />}
              </div>

              {/* CHANGE */}
              {stat.change && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isPositive
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>

            {/* TITLE */}
            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>

            {/* VALUE */}
            <p className="text-2xl font-bold text-foreground mb-2">
              {stat.value}
            </p>

            {/* FOOTER */}
            {stat.footer && (
              <div
                className={`flex items-center text-sm ${
                  isPositive ? "text-success" : "text-destructive"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>{stat.footer}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
