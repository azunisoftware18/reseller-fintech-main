import ServerDetailClient from "@/components/client/ServerDetailClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.SERVER.READ]}>
      <ServerDetailClient />
    </ClientGuard>
  );
}
