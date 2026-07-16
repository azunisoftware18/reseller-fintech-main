"use client";

import { Building2, Download } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
];

const getColumns = () => [
  { key: "tenantNumber", label: "Tenant No" },
  { key: "tenantName", label: "Tenant Name" },
  { key: "tenantLegalName", label: "Legal Name" },
  { key: "tenantType", label: "Type" },
  { key: "userType", label: "User Type" },
  { key: "tenantEmail", label: "Email" },
  {
    key: "tenantStatus",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.tenantStatus === "ACTIVE"
            ? "bg-success/10 text-success border-success/20"
            : row.tenantStatus === "INACTIVE"
              ? "bg-warning/10 text-warning border-warning/20"
              : row.tenantStatus === "SUSPENDED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
        }`}
      >
        {row.tenantStatus}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

export default function TenantsTable({
  tenants,
  total,
  page,
  perPage,
  onPageChange,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onAddTenant,
  onViewTenant,
  onEditTenant,
  onDeleteTenant,
}) {
  const columns = getColumns();

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
        title="All Tenants"
        subtitle={`${total} tenants found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by tenant name, email or tenant number…"
        filters={filters}
        onAdd={onAddTenant}
        addLabel="Add Tenant"
        addIcon={Building2}
        onExport={() => console.log("Export tenants")}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={tenants}
        onView={onViewTenant}
        onEdit={onEditTenant}
        onDelete={onDeleteTenant}
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
