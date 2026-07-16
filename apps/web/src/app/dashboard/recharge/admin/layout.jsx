"use client";

import { useRouter } from "next/navigation";
import TabsNav from "@/components/details/TabsNav";
import { Wrench, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import ClientGuard from "@/components/ClientGuard";
import { ADMIN_ROLE } from "@/lib/constants";

export default function RechargeAdminLayout({ children }) {
  const router = useRouter();

  return (
    <ClientGuard roles={[ADMIN_ROLE]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Recharge Control Center</h1>

            <p className="text-sm text-muted-foreground">
              Manage operators, circles, and other settings related to the
              recharge system.
            </p>
          </div>

          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>

        <TabsNav
          tabs={[
            { label: "Operators", value: "operators", icon: Wrench },
            { label: "Circles", value: "circles", icon: Wrench },
          ]}
          basePath="/dashboard/recharge/admin"
        />

        <div>{children}</div>
      </div>
    </ClientGuard>
  );
}
