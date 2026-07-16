import { Copy } from "lucide-react";

export default function CopyableInfoItem({ label, value, icon: Icon, onCopy }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="flex items-center gap-2">
          <span className="truncate">{value}</span>
          <button onClick={onCopy}>
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
