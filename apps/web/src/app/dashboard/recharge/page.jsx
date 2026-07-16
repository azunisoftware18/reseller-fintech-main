import RechargeClient from "@/components/client/RechargeClient";
import ClientGuard from "@/components/ClientGuard";
import { ALLOWED_SERVICES_ROLES } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Recharge",
};

export default function RechargePage() {
  return (
    <ClientGuard
      roles={ALLOWED_SERVICES_ROLES}
      anyOf={[PERMISSIONS.RECHARGE.CREATE]}
    >
      <RechargeClient />
    </ClientGuard>
  );
}
