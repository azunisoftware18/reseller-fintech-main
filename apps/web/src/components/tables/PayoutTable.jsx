"use client";

import {
  Landmark,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  RefreshCcw,
} from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const getColumns = () => [
  {
    key: "txnId",
    label: "Transaction ID",
    render: (row) => <span className="font-mono text-xs">{row.txnId}</span>,
  },
  {
    key: "beneficiaryName",
    label: "Beneficiary",
    render: (row) => (
      <div className="text-sm">
        <div className="font-medium">{row.beneficiaryName || "-"}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.beneficiaryAccount || ""}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.beneficiaryIfsc || ""}
        </div>
      </div>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <div>
        <span className="font-medium text-sm">₹{row.amount}</span>
        {row.netAmount !== row.amount && (
          <div className="text-xs text-muted-foreground">
            Net: ₹{row.netAmount}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "mode",
    label: "Mode",
    render: (row) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-secondary text-secondary-foreground border-border">
        {row.mode}
      </span>
    ),
  },
  {
    key: "providerName",
    label: "Provider",
    render: (row) => (
      <span className="text-sm capitalize">{row.providerName || "-"}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "PENDING"
            ? "bg-warning/10 text-warning border-warning/20"
            : row.status === "PROCESSING"
              ? "bg-info/10 text-info border-info/20"
              : row.status === "SUCCESS"
                ? "bg-success/10 text-success border-success/20"
                : row.status === "FAILED"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : row.status === "REFUNDED"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: "initiatedAt",
    label: "Initiated At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.initiatedAt ? new Date(row.initiatedAt).toLocaleString() : "-"}
      </span>
    ),
  },
  {
    key: "completedAt",
    label: "Completed At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.completedAt ? new Date(row.completedAt).toLocaleString() : "-"}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

export default function PayoutTable({
  payouts,
  total,
  page,
  perPage,
  onPageChange,
  onView,
  onAdd,
  onCheckStatus,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  isUserView = false,
}) {
  const columns = getColumns();

  const extraActions = [];
  if (onCheckStatus) {
    extraActions.push({
      icon: RefreshCcw,
      label: "Check Status",
      onClick: onCheckStatus,
      variant: "outline",
      showIf: (row) => row.status === "PENDING" || row.status === "PROCESSING",
    });
  }

  const filters = onStatusFilterChange
    ? [
        {
          value: statusFilter,
          onChange: onStatusFilterChange,
          placeholder: "Status",
          options: statusOptions,
        },
      ]
    : [];

  return (
    <TableShell>
      <TableHeader
        title={isUserView ? "My Payouts" : "Payout Transactions"}
        subtitle={`${total} payout transaction${total !== 1 ? "s" : ""} found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by txn ID, beneficiary or account…"
        filters={filters}
        icon={Landmark}
        onAdd={onAdd}
        addLabel="Initiate Payout"
      />

      <TableBody
        columns={columns}
        data={payouts}
        onView={onView}
        onExtraActions={extraActions}
        loading={loading}
      />

      {!isUserView && (
        <TablePagination
          page={page}
          setPage={onPageChange}
          total={total}
          perPage={perPage}
        />
      )}
    </TableShell>
  );
}
