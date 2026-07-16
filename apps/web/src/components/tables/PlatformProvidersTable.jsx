"use client";

import { Server, Download } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";

/* ---------------- TABLE COLUMNS ---------------- */
const getColumns = () => [
  { key: "id", label: "ID" },
  { key: "platformServiceId", label: "Service ID" },
  { key: "code", label: "Code" },
  { key: "providerName", label: "Provider Name" },
  {
    key: "isActive",
    label: "Active",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.isActive
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {row.isActive ? "Active" : "Inactive"}
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
  {
    key: "updatedAt",
    label: "Updated At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.updatedAt
          ? new Date(row.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "handler",
    label: "Handler",
    render: (row) => (
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground border border-border">
        {row.handler}
      </code>
    ),
  },
  { key: "actions", label: "Actions" },
];

export default function PlatformProvidersTable({
  data = [],
  onAdd,
  onEdit,
  onView,
  onDelete,
  extraActions,
}) {
  const columns = getColumns();

  return (
    <TableShell>
      <TableHeader
        title="Platform Providers"
        subtitle={`${data.length} providers`}
        onAdd={onAdd}
        addLabel="Add Provider"
        addIcon={Server}
        onExport={() => {}}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={data}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onExtraActions={extraActions}
      />
    </TableShell>
  );
}
