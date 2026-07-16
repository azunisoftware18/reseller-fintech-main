"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { ADMIN_ROLE } from "@/lib/constants";

export default function Page() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);
  const roleCode = currentUser?.role?.roleCode;

  useEffect(() => {
    if (roleCode && roleCode !== ADMIN_ROLE) {
      router.replace("/dashboard/recharge");
    }
  }, [roleCode, router]);

  if (roleCode && roleCode !== ADMIN_ROLE) {
    return null;
  }

  return (
    <ClientGuard
      roles={[ADMIN_ROLE]}
      anyOf={[
        PERMISSIONS.RECHARGE_ADMIN_OPERATORS.READ,
        PERMISSIONS.RECHARGE_ADMIN_CIRCLES.READ,
      ]}
      redirectMap={[
        {
          path: "/dashboard/recharge/admin/operators",
          perm: PERMISSIONS.RECHARGE_ADMIN_OPERATORS.READ,
        },
        {
          path: "/dashboard/recharge/admin/circles",
          perm: PERMISSIONS.RECHARGE_ADMIN_CIRCLES.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
