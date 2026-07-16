"use client";

import { Download } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

/* ---------------- FILTER OPTIONS ---------------- */
const options = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Rejected", value: "REJECTED" },
];

/* ---------------- TABLE COLUMNS ---------------- */
const getColumns = () => [
  { key: "referenceId", label: "Reference No" },
  { key: "tenantNumber", label: "Tenant No" },
  { key: "tenantName", label: "Tenant Name" },
  { key: "providerTxnId", label: "Txn ID" },
  { key: "providerCode", label: "Provider" },
  { key: "paymentMode", label: "Payment Mode" },
  {
    key: "amount",
    label: "Amount",
    render: (row) => (
      <span className="font-medium text-foreground">
        ₹{row.amount?.toLocaleString()}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "SUCCESS"
            ? "bg-success/10 text-success border-success/20"
            : row.status === "PENDING"
              ? "bg-warning/10 text-warning border-warning/20"
              : row.status === "FAILED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : row.status === "REJECTED"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created At",
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
  { key: "actions", label: "Actions" },
];

export default function FundRequestTable({
  requestFundData,
  total,
  page,
  perPage,
  onPageChange,
  search,
  onSearch,
  onEdit,
  onView,
  onDelete,
  statusFilter,
  onStatusFilterChange,
  loading,
}) {
  const columns = getColumns();

  return (
    <TableShell>
      <TableHeader
        title="Fund Requests"
        subtitle={`${total} fund request(s) found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by txn id, tenant name, provider…"
        filterValue={statusFilter}
        onFilterChange={onStatusFilterChange}
        filterPlaceholder="Status"
        filterOptions={options}
        onExport={() => console.log("Export fund requests")}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={requestFundData}
        loading={loading}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
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
