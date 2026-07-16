"use client";

import { Plus } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";

/* ---------------- TABLE COLUMNS ---------------- */
const getColumns = () => [
  { key: "txnId", label: "Transaction ID" },
  { key: "mobileNumber", label: "Mobile" },
  { key: "operator", label: "Operator" },
  { key: "providerName", label: "Provider" },
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
    key: "netAmount",
    label: "Net Amount",
    render: (row) => (
      <span className="font-medium text-foreground">
        ₹{row.netAmount?.toLocaleString()}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => {
      const status = row.status?.toLowerCase() || "unknown";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${
            status === "success"
              ? "bg-success/10 text-success border-success/20"
              : status === "pending"
                ? "bg-warning/10 text-warning border-warning/20"
                : status === "failed"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-secondary text-secondary-foreground border-border"
          }`}
        >
          {row.status}
        </span>
      );
    },
  },
  {
    key: "initiatedAt",
    label: "Created At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.initiatedAt
          ? new Date(row.initiatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  {
    key: "completedAt",
    label: "Completed At",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.completedAt
          ? new Date(row.completedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>
    ),
  },
  { key: "actions", label: "Actions" },
];

export default function RechargeTransactionTable({
  onAdd,
  data = [],
  onView,
  onEdit,
  onDelete,
  onExtraActions,
}) {
  const columns = getColumns();

  return (
    <TableShell>
      <TableHeader
        title="Recharge Transactions"
        subtitle={`${data.length} transactions`}
        onAdd={onAdd}
        addLabel="New Recharge"
        addIcon={Plus}
      />

      <TableBody
        columns={columns}
        data={data}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onExtraActions={onExtraActions}
      />
    </TableShell>
  );
}
