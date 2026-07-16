"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";
import CommisionClient from "@/components/client/CommissionClient";

export default function Page() {
  const router = useRouter();
  const perms = useSelector((s) => s.auth.user?.permissions);

  useEffect(() => {
    if (!perms) return;

    const allowed = permissionChecker(
      perms,
      PERMISSIONS.COMMISSION.READ.resource,
      PERMISSIONS.COMMISSION.READ.action,
    );

    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [perms, router]);

  if (!perms) return null;

  return <CommisionClient />;
}
