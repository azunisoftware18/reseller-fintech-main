import { ExternalLink, Info } from "lucide-react";

export default function InfoItem({ label, value, icon: Icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        onClick ? "cursor-pointer hover:bg-muted/50" : ""
      }`}
    >
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        {Icon ? (
          <Icon className="h-4 w-4 text-primary" />
        ) : (
          <Info className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">
          {value || "Not provided"}
        </div>
      </div>
      {onClick && (
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );
}
