"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[PERMISSIONS.USER.READ, PERMISSIONS.ROLE.READ]}
      redirectMap={[
        {
          path: "/dashboard/user-management/users",
          perm: PERMISSIONS.USER.READ,
        },
        {
          path: "/dashboard/user-management/roles",
          perm: PERMISSIONS.ROLE.READ,
        },
      ]}
    ></ClientGuard>
  );
}
