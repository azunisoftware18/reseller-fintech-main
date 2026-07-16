"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { BarChart3, LineChart as LineChartIcon, Download } from "lucide-react";

const data = [
  { month: "Jan", revenue: 12000, expenses: 8000 },
  { month: "Feb", revenue: 19000, expenses: 11000 },
  { month: "Mar", revenue: 15000, expenses: 9500 },
  { month: "Apr", revenue: 25000, expenses: 15000 },
  { month: "May", revenue: 22000, expenses: 13000 },
  { month: "Jun", revenue: 30000, expenses: 18000 },
  { month: "Jul", revenue: 28000, expenses: 16000 },
];

export function RevenueChart() {
  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-lg-border p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Revenue Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Revenue vs Expenses (Last 7 months)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded-border transition-colors">
            <BarChart3 className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-accent rounded-border transition-colors">
            <LineChartIcon className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-accent rounded-border transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

            <XAxis
              dataKey="month"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />

            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            <Tooltip
              formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                color: "var(--popover-foreground)",
              }}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--success)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="expenses"
              stroke="var(--destructive)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
