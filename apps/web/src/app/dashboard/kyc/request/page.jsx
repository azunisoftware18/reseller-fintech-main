import KycReqClient from "@/components/client/KycReqClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "KYC Submit",
};

export default function KycPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.KYC.SUBMIT]}>
      <KycReqClient />
    </ClientGuard>
  );
}
