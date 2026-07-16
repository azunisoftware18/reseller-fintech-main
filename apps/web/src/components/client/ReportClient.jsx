"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  FileText,
  Download,
  Filter,
  Search,
  ChevronDown,
  PieChart,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  useTransactionsReport,
  useTransactionEarningsReport,
  useRefundsReport,
  useLedgerReport,
} from "@/hooks/useReports";

import TableShell from "../tables/core/TableShell";
import TableHeader from "../tables/core/TableHeader";
import TableBody from "../tables/core/TableBody";
import TablePagination from "../tables/core/TablePagination";

// ========== CONFIGURATION ==========
const REPORTS_CONFIG = [
  {
    id: "transaction",
    label: "Transaction Report",
    description: "All transactions with status, amount, and provider details",
    icon: Activity,
    color: "primary",
  },
  {
    id: "ledger",
    label: "Ledger Report",
    description: "Debit/Credit ledger entries with running balance",
    icon: FileText,
    color: "success",
  },
  {
    id: "commission",
    label: "Commission Report",
    description: "Commission earned per transaction and service",
    icon: TrendingUp,
    color: "chart-3",
  },
  {
    id: "wallet",
    label: "Wallet Report",
    description: "Wallet load, transfer, and balance history",
    icon: Wallet,
    color: "warning",
  },
  {
    id: "refund",
    label: "Refund Report",
    description: "All refunded transactions with reason and timeline",
    icon: ArrowDownLeft,
    color: "error",
  },
  {
    id: "failed",
    label: "Failed Transaction Report",
    description: "Failed transactions with error codes and retry status",
    icon: AlertTriangle,
    color: "destructive",
  },
  {
    id: "retailer",
    label: "Retailer Performance",
    description: "Retailer-wise transaction volume and success rate",
    icon: Users,
    color: "info",
  },
  {
    id: "provider",
    label: "Provider Reconciliation",
    description: "Provider-wise settlement and mismatch report",
    icon: Building2,
    color: "chart-2",
  },
];

const STATUS_FILTERS = [
  { label: "All Status", value: "ALL" },
  { label: "Success", value: "SUCCESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Processing", value: "PROCESSING" },
];

const SERVICE_TYPE_FILTERS = [
  { label: "All Services", value: "ALL" },
  { label: "DMT", value: "DMT" },
  { label: "AEPS", value: "AEPS" },
  { label: "BBPS", value: "BBPS" },
  { label: "Recharge", value: "RECHARGE" },
  { label: "FASTag", value: "FASTAG" },
  { label: "LIC", value: "LIC" },
  { label: "PAN", value: "PAN" },
];

const LEDGER_TYPE_FILTERS = [
  { label: "All Types", value: "ALL" },
  { label: "Credit", value: "CREDIT" },
  { label: "Debit", value: "DEBIT" },
];

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

// ========== SUB-COMPONENTS ==========

const SummaryCard = React.memo(
  ({ label, value, change, positive, icon: Icon }) => (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {change && (
          <span
            className={`text-xs font-medium ${positive ? "text-success" : "text-error"}`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  ),
);

const QuickStatCard = React.memo(
  ({ icon: Icon, iconColor, title, description }) => (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`p-3 bg-${iconColor}/10 rounded-lg`}>
        <Icon className={`w-5 h-5 text-${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  ),
);

// ========== TABLE COLUMN CONFIGURATIONS ==========

const getTransactionColumns = (onView) => [
  {
    key: "id",
    label: "Transaction ID",
    render: (row) => <span className="font-mono text-sm">{row.id}</span>,
  },
  {
    key: "initiatedAt",
    label: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.initiatedAt
          ? new Date(row.initiatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.service?.serviceName || row.serviceType || "-",
  },
  {
    key: "provider",
    label: "Provider",
    render: (row) => row.provider?.name || "-",
  },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.amount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => {
      const statusConfig = {
        SUCCESS: "bg-success/10 text-success border-success/20",
        PENDING: "bg-warning/10 text-warning border-warning/20",
        FAILED: "bg-destructive/10 text-destructive border-destructive/20",
        REFUNDED: "bg-info/10 text-info border-info/20",
        PROCESSED: "bg-success/10 text-success border-success/20",
        PROCESSING: "bg-warning/10 text-warning border-warning/20",
      };
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig[row.status] || "bg-secondary text-secondary-foreground border-border"}`}
        >
          {row.status}
        </span>
      );
    },
  },
  {
    key: "user",
    label: "Customer",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {row.user?.firstName} {row.user?.lastName}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.user?.email || row.user?.phone}
        </span>
      </div>
    ),
  },
  { key: "actions", label: "Actions" },
];

const getLedgerColumns = (onView) => [
  {
    key: "id",
    label: "Entry ID",
    render: (row) => <span className="font-mono text-sm">{row.id}</span>,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (row) => <span className="text-sm">{row.description || "-"}</span>,
  },
  {
    key: "debit",
    label: "Debit",
    render: (row) => (
      <span className="font-mono text-sm text-destructive">
        {row.debit ? `₹${Number(row.debit).toFixed(2)}` : "-"}
      </span>
    ),
  },
  {
    key: "credit",
    label: "Credit",
    render: (row) => (
      <span className="font-mono text-sm text-success">
        {row.credit ? `₹${Number(row.credit).toFixed(2)}` : "-"}
      </span>
    ),
  },
  {
    key: "balance",
    label: "Balance",
    render: (row) => (
      <span className="font-mono text-sm font-medium">
        ₹{Number(row.balance).toFixed(2)}
      </span>
    ),
  },
  {
    key: "reference",
    label: "Reference",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.reference || "-"}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

const getCommissionColumns = (onView) => [
  {
    key: "id",
    label: "Commission ID",
    render: (row) => <span className="font-mono text-sm">{row.id}</span>,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.serviceType || "-",
  },
  {
    key: "txnAmount",
    label: "Txn Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.txnAmount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "commissionRate",
    label: "Rate",
    render: (row) => <span className="text-sm">{row.commissionRate}%</span>,
  },
  {
    key: "commissionAmount",
    label: "Commission",
    render: (row) => (
      <span className="font-mono text-sm text-success">
        ₹{Number(row.commissionAmount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "tds",
    label: "TDS",
    render: (row) => (
      <span className="font-mono text-sm text-destructive">
        ₹{Number(row.tds).toFixed(2)}
      </span>
    ),
  },
  {
    key: "netCommission",
    label: "Net",
    render: (row) => (
      <span className="font-mono text-sm font-medium">
        ₹{Number(row.netCommission).toFixed(2)}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

const getRefundColumns = (onView) => [
  {
    key: "id",
    label: "Refund ID",
    render: (row) => <span className="font-mono text-sm">{row.id}</span>,
  },
  {
    key: "originalTxnId",
    label: "Original Txn",
    render: (row) => (
      <span className="font-mono text-sm">{row.originalTxnId}</span>
    ),
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.serviceType || "-",
  },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.amount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "reason",
    label: "Reason",
    render: (row) => <span className="text-sm">{row.reason || "-"}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "COMPLETED"
            ? "bg-success/10 text-success border-success/20"
            : row.status === "PENDING"
              ? "bg-warning/10 text-warning border-warning/20"
              : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

const getFailedColumns = (onView) => [
  {
    key: "id",
    label: "Fail ID",
    render: (row) => <span className="font-mono text-sm">{row.id}</span>,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.serviceType || "-",
  },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.amount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "errorCode",
    label: "Error Code",
    render: (row) => <span className="font-mono text-sm">{row.errorCode}</span>,
  },
  {
    key: "errorMessage",
    label: "Error Message",
    render: (row) => (
      <span className="text-sm text-muted-foreground">{row.errorMessage}</span>
    ),
  },
  {
    key: "retryCount",
    label: "Retries",
    render: (row) => <span className="text-sm">{row.retryCount}/3</span>,
  },
  { key: "actions", label: "Actions" },
];

const getRetailerColumns = (onView) => [
  {
    key: "retailerName",
    label: "Retailer",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.retailerName}</span>
        <span className="text-xs text-muted-foreground">
          ID: {row.retailerId}
        </span>
      </div>
    ),
  },
  {
    key: "totalTxns",
    label: "Total Txns",
    render: (row) => (
      <span className="font-mono text-sm">
        {row.totalTxns?.toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    key: "successRate",
    label: "Success Rate",
    render: (row) => (
      <span
        className={`text-sm font-medium ${row.successRate > 90 ? "text-success" : row.successRate > 70 ? "text-warning" : "text-destructive"}`}
      >
        {row.successRate}%
      </span>
    ),
  },
  {
    key: "totalAmount",
    label: "Total Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.totalAmount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "commissionEarned",
    label: "Commission",
    render: (row) => (
      <span className="font-mono text-sm text-success">
        ₹{Number(row.commissionEarned).toFixed(2)}
      </span>
    ),
  },
  {
    key: "lastActive",
    label: "Last Active",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.lastActive
          ? new Date(row.lastActive).toLocaleDateString("en-IN")
          : "-"}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

const getProviderColumns = (onView) => [
  {
    key: "provider",
    label: "Provider",
    render: (row) => (
      <span className="text-sm font-medium">{row.provider}</span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.serviceType || "-",
  },
  {
    key: "ourTxnCount",
    label: "Our Count",
    render: (row) => (
      <span className="font-mono text-sm">{row.ourTxnCount}</span>
    ),
  },
  {
    key: "providerTxnCount",
    label: "Provider Count",
    render: (row) => (
      <span className="font-mono text-sm">{row.providerTxnCount}</span>
    ),
  },
  {
    key: "ourAmount",
    label: "Our Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.ourAmount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "providerAmount",
    label: "Provider Amount",
    render: (row) => (
      <span className="font-mono text-sm">
        ₹{Number(row.providerAmount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "difference",
    label: "Difference",
    render: (row) => (
      <span
        className={`font-mono text-sm font-medium ${row.difference > 0 ? "text-destructive" : "text-success"}`}
      >
        ₹{Number(row.difference).toFixed(2)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "MATCHED"
            ? "bg-success/10 text-success border-success/20"
            : row.status === "MISMATCH"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-warning/10 text-warning border-warning/20"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

// ========== COLUMN GETTER ==========
const getColumns = (reportType, onView) => {
  const columnMap = {
    transaction: getTransactionColumns,
    failed: getFailedColumns,
    commission: getCommissionColumns,
    refund: getRefundColumns,
    ledger: getLedgerColumns,
    retailer: getRetailerColumns,
    provider: getProviderColumns,
  };
  return (columnMap[reportType] || getTransactionColumns)(onView);
};

// ========== SUMMARY CARD CONFIGURATIONS ==========
const getSummaryCards = (reportType, stats = {}) => {
  const cardConfigs = {
    transaction: [
      {
        label: "Total Transactions",
        value: stats.totalTransactions?.toLocaleString("en-IN") || "0",
        change: stats.transactionChange,
        positive: true,
        icon: Activity,
      },
      {
        label: "Total Amount",
        value: stats.totalAmount
          ? `₹${(stats.totalAmount / 100000).toFixed(1)}L`
          : "₹0",
        change: stats.amountChange,
        positive: true,
        icon: Wallet,
      },
      {
        label: "Success Rate",
        value: stats.successRate ? `${stats.successRate}%` : "0%",
        change: stats.successRateChange,
        positive: true,
        icon: TrendingUp,
      },
      {
        label: "Failed Count",
        value: stats.failedCount?.toLocaleString("en-IN") || "0",
        change: stats.failedChange,
        positive: false,
        icon: AlertTriangle,
      },
    ],
    ledger: [
      {
        label: "Opening Balance",
        value: stats.openingBalance
          ? `₹${stats.openingBalance.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: Wallet,
      },
      {
        label: "Total Debit",
        value: stats.totalDebit
          ? `₹${stats.totalDebit.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: false,
        icon: ArrowUpRight,
      },
      {
        label: "Total Credit",
        value: stats.totalCredit
          ? `₹${stats.totalCredit.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: ArrowDownLeft,
      },
      {
        label: "Closing Balance",
        value: stats.closingBalance
          ? `₹${stats.closingBalance.toLocaleString("en-IN")}`
          : "₹0",
        change: stats.balanceChange,
        positive: true,
        icon: Wallet,
      },
    ],
    commission: [
      {
        label: "Gross Commission",
        value: stats.grossCommission
          ? `₹${stats.grossCommission.toLocaleString("en-IN")}`
          : "₹0",
        change: stats.commissionChange,
        positive: true,
        icon: TrendingUp,
      },
      {
        label: "TDS Deducted",
        value: stats.tdsDeducted
          ? `₹${stats.tdsDeducted.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: false,
        icon: Receipt,
      },
      {
        label: "Net Commission",
        value: stats.netCommission
          ? `₹${stats.netCommission.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: Wallet,
      },
      {
        label: "Pending Commission",
        value: stats.pendingCommission
          ? `₹${stats.pendingCommission.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: () => (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
    wallet: [
      {
        label: "Current Balance",
        value: stats.currentBalance
          ? `₹${stats.currentBalance.toLocaleString("en-IN")}`
          : "₹0",
        change: stats.balanceChange,
        positive: true,
        icon: Wallet,
      },
      {
        label: "Total Loaded",
        value: stats.totalLoaded
          ? `₹${stats.totalLoaded.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: ArrowDownLeft,
      },
      {
        label: "Total Spent",
        value: stats.totalSpent
          ? `₹${stats.totalSpent.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: false,
        icon: ArrowUpRight,
      },
      {
        label: "Pending Load",
        value: stats.pendingLoad
          ? `₹${stats.pendingLoad.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: () => (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
    refund: [
      {
        label: "Total Refunds",
        value: stats.totalRefunds?.toLocaleString("en-IN") || "0",
        change: stats.refundChange,
        positive: false,
        icon: Receipt,
      },
      {
        label: "Refund Amount",
        value: stats.refundAmount
          ? `₹${stats.refundAmount.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: false,
        icon: Wallet,
      },
      {
        label: "Avg Refund Time",
        value: stats.avgRefundTime || "-",
        change: "",
        positive: true,
        icon: () => (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      {
        label: "Pending Refunds",
        value: stats.pendingRefunds?.toLocaleString("en-IN") || "0",
        change: "",
        positive: true,
        icon: AlertTriangle,
      },
    ],
    failed: [
      {
        label: "Total Failed",
        value: stats.totalFailed?.toLocaleString("en-IN") || "0",
        change: stats.failedChange,
        positive: true,
        icon: AlertTriangle,
      },
      {
        label: "Failed Amount",
        value: stats.failedAmount
          ? `₹${stats.failedAmount.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: true,
        icon: Wallet,
      },
      {
        label: "Auto Retried",
        value: stats.autoRetried?.toLocaleString("en-IN") || "0",
        change: "",
        positive: true,
        icon: Activity,
      },
      {
        label: "Manual Resolved",
        value: stats.manualResolved?.toLocaleString("en-IN") || "0",
        change: "",
        positive: true,
        icon: Users,
      },
    ],
    retailer: [
      {
        label: "Active Retailers",
        value: stats.activeRetailers?.toLocaleString("en-IN") || "0",
        change: stats.retailerChange,
        positive: true,
        icon: Users,
      },
      {
        label: "Total Volume",
        value: stats.totalVolume
          ? `₹${(stats.totalVolume / 10000000).toFixed(1)}Cr`
          : "₹0",
        change: "",
        positive: true,
        icon: TrendingUp,
      },
      {
        label: "Avg Success Rate",
        value: stats.avgSuccessRate ? `${stats.avgSuccessRate}%` : "0%",
        change: "",
        positive: true,
        icon: Activity,
      },
      {
        label: "Top Performer",
        value: stats.topPerformer || "-",
        change: "",
        positive: true,
        icon: () => (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ),
      },
    ],
    provider: [
      {
        label: "Total Providers",
        value: stats.totalProviders?.toLocaleString("en-IN") || "0",
        change: "",
        positive: true,
        icon: Building2,
      },
      {
        label: "Matched",
        value: stats.matchedPercent ? `${stats.matchedPercent}%` : "0%",
        change: "",
        positive: true,
        icon: Activity,
      },
      {
        label: "Mismatch Count",
        value: stats.mismatchCount?.toLocaleString("en-IN") || "0",
        change: "",
        positive: true,
        icon: AlertTriangle,
      },
      {
        label: "Pending Settle",
        value: stats.pendingSettle
          ? `₹${stats.pendingSettle.toLocaleString("en-IN")}`
          : "₹0",
        change: "",
        positive: false,
        icon: () => (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
  };
  return cardConfigs[reportType] || [];
};

// ========== MAIN COMPONENT ==========

export default function ReportsClient() {
  const [activeReport, setActiveReport] = useState("transaction");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("today");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const limit = 20;

  const currentConfig = REPORTS_CONFIG.find((r) => r.id === activeReport);

  // Hooks
  const commonParams = { page, limit, search: searchQuery, fromDate, toDate };

  const transactionsQuery = useTransactionsReport({
    ...commonParams,
    status: statusFilter,
    serviceType: serviceTypeFilter,
    enabled: ["transaction", "failed"].includes(activeReport),
  });

  const earningsQuery = useTransactionEarningsReport({
    ...commonParams,
    status: statusFilter,
    enabled: activeReport === "commission",
  });

  const refundsQuery = useRefundsReport({
    ...commonParams,
    status: statusFilter,
    enabled: activeReport === "refund",
  });

  const ledgerQuery = useLedgerReport({
    ...commonParams,
    type: statusFilter,
    enabled: activeReport === "ledger",
  });

  // Current query
  const currentQuery = useMemo(() => {
    const queryMap = {
      transaction: transactionsQuery,
      failed: transactionsQuery,
      commission: earningsQuery,
      refund: refundsQuery,
      ledger: ledgerQuery,
    };
    return (
      queryMap[activeReport] || { data: null, isLoading: false, isError: false }
    );
  }, [
    activeReport,
    transactionsQuery,
    earningsQuery,
    refundsQuery,
    ledgerQuery,
  ]);

  const { data, isLoading } = currentQuery;

  // Memoized data
  const { tableData, summaryCards, columns, total } = useMemo(() => {
    const dataMap = {
      transaction: "transactions",
      failed: "transactions",
      commission: "earnings",
      refund: "refunds",
      ledger: "entries",
    };

    const dataKey = dataMap[activeReport];
    const extractedData = data?.data?.[dataKey] || [];
    const stats = data?.data?.stats || data?.data || {};

    return {
      tableData: extractedData,
      summaryCards: getSummaryCards(activeReport, stats),
      columns: getColumns(activeReport),
      total: data?.meta?.total || extractedData.length,
    };
  }, [data, activeReport]);

  // Handlers
  const handleExport = useCallback(
    (format) => {
      alert(`Exporting ${currentConfig.label} as ${format.toUpperCase()}...`);
    },
    [currentConfig],
  );

  const handleReportChange = useCallback((reportId) => {
    setActiveReport(reportId);
    setPage(1);
    setSearchQuery("");
    setStatusFilter("ALL");
    setServiceTypeFilter("ALL");
    setFromDate("");
    setToDate("");
  }, []);

  // Filters based on active report
  const filters = useMemo(() => {
    if (activeReport === "ledger") {
      return [
        {
          value: statusFilter,
          onChange: (e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          },
          placeholder: "Type",
          options: LEDGER_TYPE_FILTERS,
        },
      ];
    }
    return [
      {
        value: statusFilter,
        onChange: (e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        },
        placeholder: "Status",
        options: STATUS_FILTERS,
      },
      {
        value: serviceTypeFilter,
        onChange: (e) => {
          setServiceTypeFilter(e.target.value);
          setPage(1);
        },
        placeholder: "Service Type",
        options: SERVICE_TYPE_FILTERS,
      },
    ];
  }, [activeReport, statusFilter, serviceTypeFilter]);

  const handleView = useCallback((row) => {
    console.log("View details:", row);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Reports Center
        </h1>
        <p className="text-muted-foreground">
          View, filter, and export all your financial reports in one place
        </p>
      </header>

      {/* Report Type Grid */}
      <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {REPORTS_CONFIG.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;
          return (
            <button
              key={report.id}
              onClick={() => handleReportChange(report.id)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isActive
                  ? `bg-${report.color}/10 border-${report.color}/20 shadow-md`
                  : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div
                className={`p-2 rounded-lg mb-3 ${isActive ? `bg-${report.color}/10` : "bg-muted"}`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? `text-${report.color}` : "text-muted-foreground"}`}
                />
              </div>
              <h3
                className={`font-semibold text-sm mb-1 ${isActive ? "text-foreground" : "text-card-foreground"}`}
              >
                {report.label}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {report.description}
              </p>
              {isActive && (
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-${report.color}`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Filters Bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
        <div className="p-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${currentConfig.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-card-foreground border border-border hover:bg-muted/80"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Service Type
                </label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => {
                    setServiceTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SERVICE_TYPE_FILTERS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STATUS_FILTERS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card, idx) => (
          <SummaryCard key={idx} {...card} />
        ))}
      </div>

      {/* Modular Table */}
      <TableShell>
        <TableHeader
          title={currentConfig.label}
          subtitle={`${total} records found`}
          search={searchQuery}
          setSearch={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          searchPlaceholder={`Search ${currentConfig.label.toLowerCase()}...`}
          filters={filters}
          icon={currentConfig.icon}
        />
        <TableBody
          columns={columns}
          data={tableData}
          onView={handleView}
          loading={isLoading}
        />
        <TablePagination
          page={page}
          setPage={setPage}
          total={total}
          perPage={limit}
        />
      </TableShell>

      {/* Quick Stats Footer */}
      <footer className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatCard
          icon={PieChart}
          iconColor="primary"
          title="Service Distribution"
          description="DMT: 45% | AEPS: 30% | Others: 25%"
        />
        <QuickStatCard
          icon={TrendingUp}
          iconColor="success"
          title="Growth Trend"
          description="+23% vs last month"
        />
        <QuickStatCard
          icon={AlertTriangle}
          iconColor="warning"
          title="Attention Needed"
          description="23 pending refunds, 45 mismatches"
        />
      </footer>
    </div>
  );
}
