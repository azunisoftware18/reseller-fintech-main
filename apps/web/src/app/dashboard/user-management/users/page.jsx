import UsersClient from "@/components/client/UsersClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export const metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.ROLE.READ]}>
      <UsersClient />
    </ClientGuard>
  );
}
