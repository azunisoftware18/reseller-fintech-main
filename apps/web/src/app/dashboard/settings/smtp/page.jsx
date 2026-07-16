import SmtpConfigClient from "@/components/client/SmtpConfigClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default async function Page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.SMTP.READ]}>
      <SmtpConfigClient />
    </ClientGuard>
  );
}
