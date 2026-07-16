"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[
        PERMISSIONS.BANK.READ,
        PERMISSIONS.BANK.SUBMIT,
        PERMISSIONS.BANK.APPROVE,
      ]}
      redirectMap={[
        {
          path: "/dashboard/bank/list",
          perm: PERMISSIONS.BANK.APPROVE,
        },
        {
          path: "/dashboard/bank/add",
          perm: PERMISSIONS.BANK.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
