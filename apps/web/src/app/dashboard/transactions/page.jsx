import TransactionClient from "@/components/client/TransactionClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Transactions & Earnings",
};

export default function TransactionPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.TRANSACTION.READ]}>
      <TransactionClient />
    </ClientGuard>
  );
}
