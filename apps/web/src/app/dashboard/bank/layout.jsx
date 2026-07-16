"use client";

import TabsNav from "@/components/details/TabsNav";
import { Landmark, Clock3 } from "lucide-react";
import { useSelector } from "react-redux";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

export default function BankLayout({ children }) {
  const perms = useSelector((s) => s.auth.user?.permissions);

  const tabs = [
    {
      label: "Pending Approvals",
      value: "list",
      icon: Clock3,
      perm: PERMISSIONS.BANK.APPROVE,
    },
    {
      label: "My Banks",
      value: "add",
      icon: Landmark,
      perm: PERMISSIONS.BANK.READ,
    },
  ];

  const filteredTabs = tabs.filter((tab) =>
    permissionChecker(perms, tab.perm.resource, tab.perm.action),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Bank Management</h1>

        <p className="text-sm text-muted-foreground">
          Manage bank accounts, approvals, and bank-related operations.
        </p>
      </div>

      <TabsNav tabs={filteredTabs} basePath="/dashboard/bank" />

      <div>{children}</div>
    </div>
  );
}
