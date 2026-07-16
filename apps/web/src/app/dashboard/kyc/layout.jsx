"use client";

import TabsNav from "@/components/details/TabsNav";
import { FileCheck2, Clock3 } from "lucide-react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

export default function KycLayout({ children }) {
  const perms = useSelector((s) => s.auth.user?.permissions);
  const pathname = usePathname();

  const tabs = [
    {
      label: "Pending Approvals",
      value: "list",
      icon: Clock3,
      perm: PERMISSIONS.KYC.APPROVE,
    },
    {
      label: "My KYC",
      value: "my-kyc",
      icon: FileCheck2,
      perm: PERMISSIONS.KYC.READ,
    },
  ];

  const filteredTabs = tabs.filter((tab) =>
    permissionChecker(perms, tab.perm.resource, tab.perm.action),
  );

  // Hide TabsNav on request page
  const hideTabs = pathname === "/dashboard/kyc/request";

  return (
    <div className="space-y-6">
      {!hideTabs && (
        <div>
          <h1 className="text-xl font-semibold">KYC Management</h1>

          <p className="text-sm text-muted-foreground">
            Manage KYC requests, approvals, and verification workflows.
          </p>
        </div>
      )}

      {!hideTabs && <TabsNav tabs={filteredTabs} basePath="/dashboard/kyc" />}

      <div>{children}</div>
    </div>
  );
}
