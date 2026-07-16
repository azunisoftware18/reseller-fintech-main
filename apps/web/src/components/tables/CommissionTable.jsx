"use client";

import { Percent, Layers, Hash } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";
import TablePagination from "./core/TablePagination";

const scopeOptions = [
  { label: "All Rules", value: "ALL" },
  { label: "User Rules", value: "USER" },
  { label: "Role Rules", value: "ROLE" },
];

const getColumns = () => [
  { key: "scope", label: "Scope" },
  { key: "name", label: "User / Role" },
  { key: "service", label: "Service" },
  { key: "mode", label: "Mode" },
  { key: "type", label: "Type" },
  {
    key: "pricingType",
    label: "Pricing Type",
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.supportsSlab ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            <Layers className="h-3 w-3" />
            Slab-based
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground border border-border">
            <Hash className="h-3 w-3" />
            Fixed
          </span>
        )}
        {row.supportsSlab && row.slabs && (
          <span className="text-xs text-muted-foreground">
            ({row.slabs.length} slab{row.slabs.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>
    ),
  },
  {
    key: "commission",
    label: "Commission Value",
    render: (row) => (
      <div className="flex flex-col gap-1">
        {row.supportsSlab && row.slabs && row.slabs.length > 0 ? (
          <div className="space-y-1">
            {row.slabs.slice(0, 2).map((slab, idx) => (
              <div
                key={slab.id || idx}
                className="flex justify-between text-xs gap-2"
              >
                <span className="text-muted-foreground">
                  ₹{slab.minAmount?.toLocaleString()}–₹
                  {slab.maxAmount?.toLocaleString()}
                </span>
                <span className="font-medium text-foreground">
                  {slab.type === "PERCENTAGE"
                    ? `${slab.value}%`
                    : `₹${slab.value?.toLocaleString()}`}
                </span>
              </div>
            ))}
            {row.slabs.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{row.slabs.length - 2} more slabs
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-foreground">
            {row.type === "PERCENTAGE"
              ? `${row.value}%`
              : row.value !== null && row.value !== undefined
                ? `₹${Number(row.value).toLocaleString()}`
                : "-"}
          </div>
        )}
      </div>
    ),
  },
  { key: "tax", label: "Tax" },
  {
    key: "status",
    label: "Status",
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
  { key: "actions", label: "Actions" },
];

const formatRows = (rows = []) =>
  rows.map((r) => {
    return {
      ...r,
      id: r.id,
      scope: r.scope === "USER" ? "User" : "Role",
      name:
        r.scope === "USER"
          ? `${r.targetUserFirstName || r.firstName || ""} ${r.targetUserLastName || r.lastName || ""}`.trim() ||
            "-"
          : r.roleName || r.roleCode || "-",
      service: r.serviceName || r.serviceCode || "-",
      mode: r.mode === "COMMISSION" ? "Commission" : "Surcharge",
      type: r.type === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      value: r.value !== null && r.value !== undefined ? Number(r.value) : null,
      supportsSlab: r.supportsSlab === 1 || r.supportsSlab === true,
      slabs: (r.slabs || []).map((slab) => ({
        ...slab,
        type: slab.type || r.type,
        value:
          slab.value !== null && slab.value !== undefined
            ? Number(slab.value)
            : null,
        minAmount:
          slab.minAmount !== null && slab.minAmount !== undefined
            ? Number(slab.minAmount)
            : 0,
        maxAmount:
          slab.maxAmount !== null && slab.maxAmount !== undefined
            ? Number(slab.maxAmount)
            : 0,
      })),
      tax: (() => {
        if (r.mode === "COMMISSION") {
          if (r.applyTDS) {
            const tdsPercent = r.tdsPercent ? Number(r.tdsPercent) : 0;
            return `TDS ${tdsPercent}%`;
          }
          return "No TDS";
        } else if (r.mode === "SURCHARGE") {
          if (r.applyGST) {
            const gstPercent = r.gstPercent ? Number(r.gstPercent) : 0;
            return `GST ${gstPercent}%`;
          }
          return "No GST";
        }
        return "-";
      })(),
      isActive: r.isActive,
      createdAt: r.createdAt,
    };
  });

export default function CommissionTable({
  commissions = [],
  total = 0,
  page = 1,
  perPage = 10,
  onPageChange,
  search,
  onSearch,
  typeFilter,
  onTypeFilterChange,
  onAdd,
  onEdit,
  onView,
  onDelete,
}) {
  const columns = getColumns();
  const formattedData = formatRows(commissions);

  const filters = [
    {
      value: typeFilter,
      onChange: onTypeFilterChange,
      placeholder: "Scope",
      options: scopeOptions,
    },
  ];

  return (
    <TableShell>
      <TableHeader
        title="Commission Rules"
        subtitle={`${total} rule${total !== 1 ? "s" : ""} found`}
        search={search}
        setSearch={onSearch}
        searchPlaceholder="Search by name, service or mode…"
        filters={filters}
        onAdd={onAdd}
        addLabel="Add Rule"
        addIcon={Percent}
      />

      <TableBody
        columns={columns}
        data={formattedData}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {total > 0 && (
        <TablePagination
          page={page}
          setPage={onPageChange}
          total={total}
          perPage={perPage}
        />
      )}
    </TableShell>
  );
}
