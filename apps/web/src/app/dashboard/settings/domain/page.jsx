import TenantDomainClient from "@/components/client/TenantDomainClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Setting Domain",
};

export default function Page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.DOMAIN.READ]}>
      <TenantDomainClient />
    </ClientGuard>
  );
}
