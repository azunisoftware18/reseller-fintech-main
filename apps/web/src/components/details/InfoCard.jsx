export default function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}
