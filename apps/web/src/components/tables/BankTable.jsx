"use client";

import { Landmark, CheckCircle, XCircle, Star } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

const getColumns = (onSetPrimary, onDelete) => [
  { key: "fullName", label: "Name" },

  { key: "email", label: "Email" },

  { key: "bankName", label: "Bank" },

  {
    key: "branchName",
    label: "Branch",
    render: (row) => <span className="text-sm">{row.branchName || "-"}</span>,
  },

  {
    key: "accountNumber",
    label: "Account No",
    render: (row) => (
      <span className="font-mono text-sm">{row.accountNumber}</span>
    ),
  },

  {
    key: "ifscCode",
    label: "IFSC",
    render: (row) => (
      <span className="font-mono text-xs uppercase">{row.ifscCode}</span>
    ),
  },

  {
    key: "isPrimary",
    label: "Primary",
    render: (row) =>
      row.isPrimary ? (
        <Star className="h-4 w-4 text-warning fill-warning" />
      ) : (
        "-"
      ),
  },

  {
    key: "verificationStatus",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.verificationStatus === "PENDING"
            ? "bg-warning/10 text-warning border-warning/20"
            : row.verificationStatus === "VERIFIED"
              ? "bg-success/10 text-success border-success/20"
              : row.verificationStatus === "REJECTED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.verificationStatus}
      </span>
    ),
  },

  {
    key: "submittedAt",
    label: "Submitted At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.submittedAt || "-"}
      </span>
    ),
  },

  { key: "actions", label: "Actions" },
];

export default function BankTable({
  bankDetails,
  total,
  page,
  perPage,
  onPageChange,
  onApprove,
  onReject,
  onView,
  onEdit,
  onDelete,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
}) {
  const columns = getColumns();

  const extraActions = [];
  if (onApprove) {
    extraActions.push({
      icon: CheckCircle,
      label: "Approve",
      onClick: onApprove,
      variant: "success",
    });
  }
  if (onReject) {
    extraActions.push({
      icon: XCircle,
      label: "Reject",
      onClick: onReject,
      variant: "destructive",
    });
  }

  const filters = [
    {
      value: statusFilter,
      onChange: onStatusFilterChange,
      placeholder: "Status",
      options: statusOptions,
    },
  ];

  return (
    <TableShell>
      <TableHeader
        title="Bank Detail Approvals"
        subtitle={`${total} bank detail requests found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by name, email or bank…"
        filters={filters}
        icon={Landmark}
      />

      <TableBody
        columns={columns}
        data={bankDetails}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onExtraActions={extraActions}
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
