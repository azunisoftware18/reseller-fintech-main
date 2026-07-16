import BankClient from "@/components/client/BankClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Bank Management",
};

export default function BankPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.BANK.READ]}>
      <BankClient />
    </ClientGuard>
  );
}
