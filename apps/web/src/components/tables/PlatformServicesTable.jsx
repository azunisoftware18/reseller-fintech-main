"use client";

import { Layers, Download } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";

/* ---------------- TABLE COLUMNS ---------------- */
const getColumns = () => [
  { key: "id", label: "ID" },
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
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
  { key: "actions", label: "Actions" },
];

export default function PlatformServicesTable({
  data = [],
  loading = false,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onExport,
  extraActions,
}) {
  const columns = getColumns();

  return (
    <TableShell>
      <TableHeader
        title="Platform Services"
        subtitle={`${data.length} services`}
        onAdd={onAdd}
        addLabel="Add Service"
        addIcon={Layers}
        onExport={onExport}
        exportIcon={Download}
      />

      <TableBody
        columns={columns}
        data={data}
        loading={loading}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onExtraActions={extraActions}
      />
    </TableShell>
  );
}
