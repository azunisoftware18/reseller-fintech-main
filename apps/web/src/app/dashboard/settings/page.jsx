"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[
        PERMISSIONS.WEBSITE.READ,
        PERMISSIONS.SERVER.READ,
        PERMISSIONS.DOMAIN.READ,
        PERMISSIONS.SMTP.READ,
      ]}
      redirectMap={[
        {
          path: "/dashboard/settings/general",
          perm: PERMISSIONS.WEBSITE.READ,
        },
        {
          path: "/dashboard/settings/server",
          perm: PERMISSIONS.SERVER.READ,
        },
        {
          path: "/dashboard/settings/domain",
          perm: PERMISSIONS.DOMAIN.READ,
        },
        {
          path: "/dashboard/settings/smtp",
          perm: PERMISSIONS.SMTP.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
