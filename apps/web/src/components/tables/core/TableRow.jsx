import RowActions from "./RowActions";

export default function TableRow({
  columns,
  row,
  onView,
  onEdit,
  onDelete,
  onExtraActions = [],
}) {
  const resolvedExtraActions = onExtraActions.map((action) => ({
    ...action,
    onClick: () => action.onClick(row),
  }));

  return (
    <tr className="border-b border-border hover:cursor-pointer hover:bg-accent/50 transition-colors">
      {columns.map((col) => (
        <td key={col.key} className="px-6 py-4 text-sm">
          {col.key === "actions" ? (
            <RowActions
              onView={onView ? () => onView(row) : undefined}
              onEdit={onEdit ? () => onEdit(row) : undefined}
              onDelete={onDelete ? () => onDelete(row) : undefined}
              extraActions={resolvedExtraActions}
            />
          ) : col.render ? (
            col.render(row)
          ) : (
            row[col.key]
          )}
        </td>
      ))}
    </tr>
  );
}
