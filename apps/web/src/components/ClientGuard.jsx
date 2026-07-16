"use client";

import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { permissionChecker } from "@/lib/permissionCheker";

export default function ClientGuard({
  anyOf = [],
  roles = [],
  redirectMap,
  children,
}) {
  const user = useSelector((s) => s.auth.user);
  const perms = user?.permissions;
  const roleCode = user?.role?.roleCode;

  const router = useRouter();
  const pathname = usePathname();

  /* ================= ROLE CHECK ================= */

  const roleAllowed = roles.length === 0 || roles.includes(roleCode);

  /* ================= PERMISSION CHECK ================= */

  const permissionAllowed =
    anyOf.length === 0 ||
    anyOf.some((p) => permissionChecker(perms, p.resource, p.action));

  const allowed = roleAllowed && permissionAllowed;

  useEffect(() => {
    if (!user) return;

    if (!allowed) {
      if (pathname !== "/unauthorized") {
        router.replace("/unauthorized");
      }
      return;
    }

    // child auto-redirect
    if (redirectMap) {
      const found = redirectMap.find((r) =>
        permissionChecker(perms, r.perm.resource, r.perm.action),
      );

      if (found && pathname !== found.path) {
        router.replace(found.path);
      }
    }
  }, [allowed, user, pathname, redirectMap, perms, router]);

  if (!user) return null;

  if (!allowed) {
    return null; // ya loader dikha sakta hai
  }

  return children;
}
