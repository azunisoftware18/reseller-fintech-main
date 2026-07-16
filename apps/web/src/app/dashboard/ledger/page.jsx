import LedgerClient from "@/components/client/LedgerClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Ledger",
};

export default function LedgerPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.LEDGER.READ]}>
      <LedgerClient />
    </ClientGuard>
  );
}
