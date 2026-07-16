import { PERMISSIONS } from "@/lib/permissionKeys";
import RoleClient from "@/components/client/RoleClient";
import ClientGuard from "@/components/ClientGuard";

export const metadata = {
  title: "Role",
};

export default function Page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.ROLE.READ]}>
      <RoleClient />
    </ClientGuard>
  );
}
