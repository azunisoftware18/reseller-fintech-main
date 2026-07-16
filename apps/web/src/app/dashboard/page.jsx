import DashboardClient from "@/components/client/DashboardClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    // <ClientGuard anyOf={[PERMISSIONS.DASHBOARD.READ]}>
      <DashboardClient />
    // </ClientGuard>
  );
}
