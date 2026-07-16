import FundClient from "@/components/client/FundClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Funds",
};

export default function FundsPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.FUND_REQUEST.READ]}>
      <FundClient />;
    </ClientGuard>
  );
}
