import PayoutClient from "@/components/client/PayoutClient";
import ClientGuard from "@/components/ClientGuard";
import { PAYOUT_ALLOWED_SERVICES_ROLES } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Payout Management",
};

export default function PayoutListPage() {
  return (
    <ClientGuard
      anyOf={[PERMISSIONS.PAYOUT.READ]}
      // roles={PAYOUT_ALLOWED_SERVICES_ROLES}
    >
      <PayoutClient />
    </ClientGuard>
  );
}
