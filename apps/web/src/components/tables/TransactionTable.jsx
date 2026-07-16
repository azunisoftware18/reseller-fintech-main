"use client";

import { Receipt } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const serviceTypeOptions = [
  { label: "All Services", value: "all" },
  { label: "Recharge", value: "RECHARGE" },
  { label: "Payout", value: "PAYOUT" },
  { label: "Bill Payment", value: "BILL_PAYMENT" },
  { label: "DMT", value: "DMT" },
];

const modeOptions = [
  { label: "All Modes", value: "all" },
  { label: "Commission", value: "COMMISSION" },
  { label: "Surcharge", value: "SURCHARGE" },
];

const getColumns = () => [
  {
    key: "txnId",
    label: "Txn ID",
    render: (row) => <span className="font-mono text-sm">{row.txnId}</span>,
  },
  {
    key: "user",
    label: "User",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {row.user?.firstName} {row.user?.lastName}
        </span>
        <span className="text-xs text-muted-foreground">{row.user?.email}</span>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (row) => row.role?.roleCode,
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
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "PENDING"
            ? "bg-warning/10 text-warning border-warning/20"
            : row.status === "SUCCESS"
              ? "bg-success/10 text-success border-success/20"
              : row.status === "FAILED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: "serviceType",
    label: "Service",
    render: (row) => row.service?.serviceName || "-",
  },
  {
    key: "date",
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
  { key: "actions", label: "Actions" },
];

export default function TransactionTable({
  data,
  total,
  page,
  perPage,
  onPageChange,
  onView,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  serviceTypeFilter,
  onServiceTypeFilterChange,
  modeFilter,
  onModeFilterChange,
}) {
  const columns = getColumns();

  // Define all filters as an array
  const filters = [
    {
      value: statusFilter,
      onChange: onStatusFilterChange,
      placeholder: "Status",
      options: statusOptions,
    },
    {
      value: serviceTypeFilter,
      onChange: onServiceTypeFilterChange,
      placeholder: "Service Type",
      options: serviceTypeOptions,
    },
    {
      value: modeFilter,
      onChange: onModeFilterChange,
      placeholder: "Mode",
      options: modeOptions,
    },
  ];

  return (
    <TableShell>
      <TableHeader
        title="Transactions & Earnings"
        subtitle={`${total} records found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by txn ID..."
        filters={filters}
        icon={Receipt}
      />

      <TableBody
        columns={columns}
        data={data}
        onView={onView}
        loading={loading}
      />
      <TablePagination
        page={page}
        setPage={onPageChange}
        total={total}
        perPage={perPage}
      />
    </TableShell>
  );
}
