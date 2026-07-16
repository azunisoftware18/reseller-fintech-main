import TenantsClient from "@/components/client/TenantsClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Tenants",
};

export default function Page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.TENANT.READ]}>
      <TenantsClient />
    </ClientGuard>
  );
}
