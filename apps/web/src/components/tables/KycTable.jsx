"use client";

import { FileCheck, CheckCircle, XCircle } from "lucide-react";
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

const getColumns = () => [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobileNumber", label: "Mobile" },
  { key: "roleName", label: "Role" },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.status === "PENDING"
            ? "bg-warning/10 text-warning border-warning/20"
            : row.status === "VERIFIED"
              ? "bg-success/10 text-success border-success/20"
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
    key: "submittedAt",
    label: "Submitted At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.submittedAt
          ? new Date(row.submittedAt).toLocaleDateString("en-IN", {
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

export default function KycTable({
  kycs,
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
        title="KYC Approvals"
        subtitle={`${total} KYC requests found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by name, email or mobile…"
        filters={filters}
        icon={FileCheck}
      />

      <TableBody
        columns={columns}
        data={kycs}
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
