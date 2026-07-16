"use client";

import { useState } from "react";
import { Link, ChevronDown, ChevronUp } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";

/* ---------------- SLAB DETAILS COMPONENT ---------------- */
const SlabDetails = ({ slabs }) => {
  const [expanded, setExpanded] = useState(false);

  if (!slabs || slabs.length === 0) {
    return <span className="text-muted-foreground text-sm">No slabs</span>;
  }

  return (
    <div className="min-w-50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {slabs.length} slab{slabs.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {!expanded ? (
        <div className="text-xs text-muted-foreground">
          ₹{slabs[0].minAmount?.toLocaleString()} - ₹
          {slabs[0].maxAmount?.toLocaleString()}: ₹
          {slabs[0].providerCost?.toLocaleString()}
          {slabs.length > 1 && ` +${slabs.length - 1} more`}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {slabs.map((slab, index) => (
            <div
              key={slab.id || index}
              className="text-xs border-l-2 border-primary pl-2"
            >
              <div className="font-medium text-foreground">
                Range: ₹{slab.minAmount?.toLocaleString()} - ₹
                {slab.maxAmount?.toLocaleString()}
              </div>
              <div className="text-muted-foreground">
                Cost: ₹{slab.providerCost?.toLocaleString()}
                {!slab.isActive && (
                  <span className="ml-2 text-destructive text-[10px]">
                    (Inactive)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- TABLE COLUMNS ---------------- */
const getColumns = () => [
  { key: "serviceName", label: "Service" },
  { key: "serviceCode", label: "Service Code" },
  { key: "providerName", label: "Provider" },
  { key: "providerCode", label: "Provider Code" },
  {
    key: "mode",
    label: "Mode",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.mode === "COMMISSION"
            ? "bg-success/10 text-success border-success/20"
            : row.mode === "SURCHARGE"
              ? "bg-warning/10 text-warning border-warning/20"
              : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.mode === "COMMISSION" ? "Commission" : "Surcharge"}
      </span>
    ),
  },
  {
    key: "pricingValueType",
    label: "Pricing Type",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.pricingValueType === "PERCENTAGE"
            ? "bg-info/10 text-info border-info/20"
            : row.pricingValueType === "FLAT"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.pricingValueType === "PERCENTAGE" ? "Percentage" : "Flat"}
      </span>
    ),
  },
  {
    key: "providerCost",
    label: "Provider Cost",
    render: (row) => (
      <span className="font-medium text-foreground">
        ₹{row.providerCost?.toLocaleString() ?? "0"}
      </span>
    ),
  },
  {
    key: "commissionStartLevel",
    label: "Commission Level",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.commissionStartLevel === "PLATFORM"
            ? "bg-primary/10 text-primary border-primary/20"
            : row.commissionStartLevel === "PROVIDER"
              ? "bg-info/10 text-info border-info/20"
              : row.commissionStartLevel === "DISTRIBUTOR"
                ? "bg-warning/10 text-warning border-warning/20"
                : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.commissionStartLevel || "Default"}
      </span>
    ),
  },
  {
    key: "applyTDS",
    label: "TDS",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.applyTDS
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {row.applyTDS ? `Yes (${row.tdsPercent ?? 0}%)` : "No"}
      </span>
    ),
  },
  {
    key: "applyGST",
    label: "GST",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.applyGST
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {row.applyGST ? `Yes (${row.gstPercent ?? 0}%)` : "No"}
      </span>
    ),
  },
  {
    key: "supportsSlab",
    label: "Slab Enabled",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.supportsSlab
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {row.supportsSlab ? "Enabled" : "Disabled"}
      </span>
    ),
  },
  {
    key: "slabs",
    label: "Slab Details",
    render: (row) => {
      if (!row.supportsSlab) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return <SlabDetails slabs={row.slabs} />;
    },
  },
  {
    key: "config",
    label: "Config",
    render: (row) => {
      const isEmpty = !row.config || Object.keys(row.config).length === 0;
      if (isEmpty)
        return <span className="text-muted-foreground text-sm">-</span>;
      return (
        <pre className="text-xs max-w-50 truncate text-muted-foreground">
          {JSON.stringify(row.config)}
        </pre>
      );
    },
  },
  {
    key: "isActive",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.isActive
            ? "bg-success/10 text-success border-success/20"
            : "bg-destructive/10 text-destructive border-destructive/20"
        }`}
      >
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created",
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
    label: "Updated",
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

export default function ServiceProviderMappingsTable({
  data,
  loading,
  meta,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onPageChange,
  onLimitChange,
  currentPage,
  currentLimit,
}) {
  const columns = getColumns();
  const mappingsMeta = data?.mappings?.meta ||
    meta || {
      page: currentPage,
      limit: currentLimit,
      total: 0,
      totalPages: 1,
    };

  return (
    <TableShell>
      <TableHeader
        title="Service Provider Mappings"
        subtitle={`${meta?.total || 0} records`}
        onAdd={onAdd}
        addLabel="Add Mapping"
        addIcon={Link}
      />

      <TableBody
        columns={columns}
        data={data}
        loading={loading}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        pagination={{
          currentPage: currentPage || mappingsMeta?.page || 1,
          totalPages: mappingsMeta?.totalPages || 1,
          total: mappingsMeta?.total || 0,
          limit: currentLimit || mappingsMeta?.limit || 20,
          onPageChange,
          onLimitChange,
        }}
      />
    </TableShell>
  );
}