"use client";

import TabsNav from "@/components/details/TabsNav";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { Building2 } from "lucide-react";
import { Users } from "lucide-react";
import { useSelector } from "react-redux";

export default function EmployeeManagementLayout({ children }) {
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canEmployees = can(PERMISSIONS.EMPLOYEE.READ);
  const canDepartments = can(PERMISSIONS.DEPARTMENT.READ);

  const tabs = [
    canEmployees && {
      label: "Employees",
      value: "employees",
      icon: Users,
    },
    canDepartments && {
      label: "Departments",
      value: "departments",
      icon: Building2,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Employees Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage Employees and departments
        </p>
      </div>

      <TabsNav tabs={tabs} basePath="/dashboard/employee-management" />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
