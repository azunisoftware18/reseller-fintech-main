import ServiceProviderMappingsClient from "@/components/client/ServiceProviderMappingsClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Service Provider Mappings",
};

export default function ServiceProviderMappingsPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.READ]}>
      <ServiceProviderMappingsClient />
    </ClientGuard>
  );
}
