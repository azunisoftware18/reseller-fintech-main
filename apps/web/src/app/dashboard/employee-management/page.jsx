"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[PERMISSIONS.EMPLOYEE.READ, PERMISSIONS.DEPARTMENT.READ]}
      redirectMap={[
        {
          path: "/dashboard/employee-management/employees",
          perm: PERMISSIONS.EMPLOYEE.READ,
        },
        {
          path: "/dashboard/employee-management/departments",
          perm: PERMISSIONS.DEPARTMENT.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
