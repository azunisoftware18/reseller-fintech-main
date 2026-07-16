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
    key: "profilePictureUrl",
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

  { key: "userNumber", label: "User No" },

  {
    key: "password",
    label: "Password",
    render: (row) => (
      <span className="font-mono text-sm">{row.password || "-"}</span>
    ),
  },

  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },

  { key: "tenantNumber", label: "Tenant Number" },
  { key: "tenantName", label: "Tenant Name" },
  { key: "mobileNumber", label: "Mobile" },

  // ✅ NEW: Parent column
  {
    key: "parent",
    label: "Parent",
    render: (row) => {
      const parent = row.parent;
      if (!parent) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{parent.fullName}</span>
          <span className="text-xs text-muted-foreground">
            {parent.roleName || parent.roleCode}
          </span>
        </div>
      );
    },
  },

  {
    key: "userStatus",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.userStatus === "ACTIVE"
            ? "bg-success/10 text-success border-success/20"
            : row.userStatus === "INACTIVE"
              ? "bg-warning/10 text-warning border-warning/20"
              : row.userStatus === "SUSPENDED"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.userStatus}
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

export default function UsersTable({
  users,
  total,
  page,
  perPage,
  onPageChange,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onAddUser,
  onEdit,
  onView,
  onDelete,
  onImagePreview,
  extraActions,
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
        title="All Users"
        subtitle={`${total} users found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by name, email, user no. or mobile…"
        filters={filters}
        onAdd={onAddUser}
        addLabel="Add User"
        addIcon={Users}
        onExport={() => console.log("Export users")}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={users}
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
