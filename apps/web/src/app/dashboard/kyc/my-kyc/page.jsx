import MyKycClient from "@/components/client/MyKycClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "KYC Management",
};

export default function KycPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.KYC.READ]}>
      <MyKycClient />
    </ClientGuard>
  );
}
