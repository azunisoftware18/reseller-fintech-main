import FundRequestClient from "@/components/client/FundRequestClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Fund Request",
};

export default function FundRequestPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.FUND_REQUEST.CREATE]}>
      <FundRequestClient />;
    </ClientGuard>
  );
}
