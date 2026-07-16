"use client";

import { Users, Download, User } from "lucide-react";
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

const getColumns = (onImagePreview) => [
  {
    key: "profilePicture",
    label: "Photo",
    render: (row) =>
      row.profilePictureUrl ? (
        <img
          src={row.profilePictureUrl}
          alt={row.fullName}
          className="h-10 w-10 rounded-full object-cover cursor-pointer border border-border"
          onClick={() => onImagePreview(row.profilePictureUrl)}
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
  },
  { key: "employeeNumber", label: "Emp No" },
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobileNumber", label: "Mobile" },
  {
    key: "employeeStatus",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.employeeStatus === "ACTIVE"
            ? "bg-success/10 text-success border-success/20"
            : row.employeeStatus === "INACTIVE"
              ? "bg-warning/10 text-warning border-warning/20"
              : row.employeeStatus === "SUSPENDED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.employeeStatus}
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

export default function EmployeesTable({
  employees,
  total,
  page,
  perPage,
  onPageChange,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onAddEmployee,
  onEdit,
  onView,
  onDelete,
  extraActions,
  onImagePreview,
}) {
  const columns = getColumns(onImagePreview);

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
        title="All Employees"
        subtitle={`${total} employees found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by name, email, emp no. or mobile…"
        filters={filters}
        onAdd={onAddEmployee}
        addLabel="Add Employee"
        addIcon={Users}
        onExport={() => console.log("Export employees")}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={employees}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        onExtraActions={extraActions}
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
