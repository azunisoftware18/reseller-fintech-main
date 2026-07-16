import ReportClient from "@/components/client/ReportClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Reports Management",
};

export default function ReportsPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.REPORTS.READ]}>
      <ReportClient />
    </ClientGuard>
  );
}
