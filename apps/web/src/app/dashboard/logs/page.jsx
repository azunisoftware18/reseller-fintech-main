import LogsClient from "@/components/client/LogsClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Logs Management",
};

export default function LogsPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.LOGS.READ]}>
      <LogsClient />
    </ClientGuard>
  );
}
