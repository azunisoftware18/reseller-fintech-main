"use client";

import TabsNav from "@/components/details/TabsNav";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { Building2 } from "lucide-react";
import { Users } from "lucide-react";
import { useSelector } from "react-redux";

export default function UserManagementLayout({ children }) {
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canUsers = can(PERMISSIONS.USER.READ);
  const canRoles = can(PERMISSIONS.ROLE.READ);

  const tabs = [
    canUsers && {
      label: "Users",
      value: "users",
      icon: Users,
    },
    canRoles && {
      label: "Roles",
      value: "roles",
      icon: Building2,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage users and roles</p>
      </div>

      <TabsNav tabs={tabs} basePath="/dashboard/user-management" />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
