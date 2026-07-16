import { CheckCircle, XCircle, Info } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: "bg-card border-success/30 text-primary-foreground",
  error: "bg-card border-destructive/30 text-primary-foreground",
  info: "bg-card border-primary/30 text-primary-foreground",
};

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-3 ">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];

        return (
          <div
            key={toast.id}
            className={`
                
              flex items-center gap-3
              rounded-lg-border
              border px-4 py-3
              shadow-md-border
              bg-primary
              ${STYLES[toast.type]}
            `}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium ">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
