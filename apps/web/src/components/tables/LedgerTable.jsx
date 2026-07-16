"use client";

import { BookOpen } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const entryTypeOptions = [
  { label: "All Types", value: "all" },
  { label: "Credit", value: "CREDIT" },
  { label: "Debit", value: "DEBIT" },
  { label: "Block", value: "BLOCK" },
  { label: "Unblock", value: "UNBLOCK" },
];

const getColumns = () => [
  {
    key: "entryType",
    label: "Type",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.entryType === "CREDIT" || row.entryType === "UNBLOCK"
            ? "bg-success/10 text-success border-success/20"
            : row.entryType === "DEBIT" || row.entryType === "BLOCK"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.entryType}
      </span>
    ),
  },
  { key: "reference", label: "Reference" },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <span
        className={`font-mono text-sm ${
          row.entryType === "CREDIT" || row.entryType === "UNBLOCK"
            ? "text-success"
            : "text-destructive"
        }`}
      >
        {row.entryType === "CREDIT" || row.entryType === "UNBLOCK" ? "+" : "-"}₹
        {(Number(row.amount || 0) / 100).toFixed(2)}
      </span>
    ),
  },
  {
    key: "balanceAfter",
    label: "Balance After",
    render: (row) => (
      <span className="font-mono text-sm text-muted-foreground">
        ₹{(Number(row.balanceAfter || 0) / 100).toFixed(2)}
      </span>
    ),
  },
  {
    key: "transaction",
    label: "Transaction",
    render: (row) =>
      row.transaction?.txnId ? (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.transaction.txnId}</span>
          <span className="text-xs text-muted-foreground">
            {row.transaction.status}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      ),
  },
  {
    key: "date",
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
  { key: "actions", label: "Actions" },
];

export default function LedgerTable({
  data,
  total,
  page,
  perPage,
  onPageChange,
  onView,
  loading,
  search,
  onSearch,
  entryTypeFilter,
  onEntryTypeFilterChange,
}) {
  const columns = getColumns();

  const filters = [
    {
      value: entryTypeFilter,
      onChange: onEntryTypeFilterChange,
      placeholder: "Entry Type",
      options: entryTypeOptions,
    },
  ];

  return (
    <TableShell>
      <TableHeader
        title="Ledger Entries"
        subtitle={`${total} records found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by reference..."
        filters={filters}
        icon={BookOpen}
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
