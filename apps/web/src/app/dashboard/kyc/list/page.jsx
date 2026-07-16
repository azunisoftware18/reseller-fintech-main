import KycClient from "@/components/client/KycClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "KYC Management",
};

export default function KycPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.KYC.READ]}>
      <KycClient />
    </ClientGuard>
  );
}
