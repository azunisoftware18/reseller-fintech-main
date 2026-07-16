import Button from "@/components/ui/Button";

export default function QuickActionsCard({ title, actions }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            className="w-full justify-start cursor-pointer"
            icon={a.icon}
            loading={a.loading}
            disabled={a.disabled}
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
