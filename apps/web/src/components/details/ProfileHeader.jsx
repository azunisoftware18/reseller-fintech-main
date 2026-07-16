import { Edit } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ProfileHeader({
  icon: Icon,
  title,
  subtitle,
  meta = [],
  onEdit,
}) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <Icon className="h-8 w-8 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mb-1">{subtitle}</p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {meta.map((m) => (
              <div
                key={`${m.value}`}   // ✅ FIX HERE
                className="flex items-center gap-1"
              >
                <m.icon className="h-3.5 w-3.5" />
                <span>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onEdit && (
        <Button variant="outline" icon={Edit} onClick={onEdit}>
          Edit
        </Button>
      )}
    </div>
  );
}
