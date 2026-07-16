import PlatformServicesClient from "@/components/client/PlatformServicesClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Platform Services",
};

export default function PlatformServicesPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.API_INTEGRATION_SERVICES.READ]}>
      <PlatformServicesClient />
    </ClientGuard>
  );
}
