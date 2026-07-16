"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[
        PERMISSIONS.API_INTEGRATION_SERVICES.READ,
        PERMISSIONS.API_INTEGRATION_SERVICE_PROVIDERS.READ,
        PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.READ,
      ]}
      redirectMap={[
        {
          path: "/dashboard/api-integration/services",
          perm: PERMISSIONS.API_INTEGRATION_SERVICES.READ,
        },
        {
          path: "/dashboard/api-integration/providers",
          perm: PERMISSIONS.API_INTEGRATION_SERVICE_PROVIDERS.READ,
        },
        {
          path: "/dashboard/api-integration/mapping",
          perm: PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
