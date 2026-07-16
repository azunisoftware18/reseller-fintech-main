import DataTableSearchEmpty from "./DataTableSearchEmpty";
import TableRow from "./TableRow";

export default function TableBody({
  columns = [],
  data = [],
  onExtraActions,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-sm text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10">
                <DataTableSearchEmpty
                  isEmpty
                  emptyTitle="No results found"
                  emptyDescription="Try changing search or filters."
                />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={index}
                row={row}
                columns={columns}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onExtraActions={onExtraActions}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
