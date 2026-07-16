export default function StatusOverviewCard({ title, items }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.label} className="flex justify-between">
            <span className="text-sm">{i.label}</span>
            <span className={`font-medium ${i.color}`}>{i.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
