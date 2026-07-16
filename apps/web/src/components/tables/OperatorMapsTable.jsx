"use client";

import { Wrench } from "lucide-react";
import TableShell from "./core/TableShell";
import TableHeader from "./core/TableHeader";
import TableBody from "./core/TableBody";

const getColumns = () => [
  { key: "id", label: "Mapping ID" },
  { key: "internalOperatorCode", label: "Internal Code" },
  { key: "providerOperatorCode", label: "Provider Code" },
  {
    key: "direction",
    label: "Direction",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          row.direction === "Plan Fetch"
            ? "bg-info/10 text-info border-info/20"
            : row.direction === "Recharge Execute"
              ? "bg-success/10 text-success border-success/20"
              : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        {row.direction}
      </span>
    ),
  },
  { key: "serviceName", label: "Service" },
  { key: "providerName", label: "Provider" },
  { key: "actions", label: "Actions" },
];

const formatDirection = (direction) => {
  if (direction === "PLAN_FETCH") return "Plan Fetch";
  if (direction === "RECHARGE_EXECUTE") return "Recharge Execute";
  return direction;
};

const formatRows = (data = []) =>
  data.map((item) => ({
    ...item,
    serviceName: item.serviceName || item.ServiceId,
    providerName: item.providerName || item.ProviderId,
    direction: formatDirection(item.direction),
  }));

export default function OperatorMapsTable({
  data = [],
  onAdd,
  onEdit,
  onView,
  onDelete,
}) {
  const columns = getColumns();
  const formattedData = formatRows(data);

  return (
    <TableShell>
      <TableHeader
        title="Operator Maps"
        subtitle={`${formattedData.length} mappings`}
        onAdd={onAdd}
        addLabel="Add Mapping"
        addIcon={Wrench}
      />

      <TableBody
        columns={columns}
        data={formattedData}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </TableShell>
  );
}
