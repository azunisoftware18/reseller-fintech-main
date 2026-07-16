"use client";

import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function Page() {
  return (
    <ClientGuard
      anyOf={[
        PERMISSIONS.KYC.READ,
        PERMISSIONS.KYC.SUBMIT,
        PERMISSIONS.KYC.APPROVE,
      ]}
      redirectMap={[
        {
          path: "/dashboard/kyc/list",
          perm: PERMISSIONS.KYC.APPROVE,
        },
        {
          path: "/dashboard/kyc/my-kyc",
          perm: PERMISSIONS.KYC.READ,
        },
        {
          path: "/dashboard/kyc/request",
          perm: PERMISSIONS.KYC.SUBMIT,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
