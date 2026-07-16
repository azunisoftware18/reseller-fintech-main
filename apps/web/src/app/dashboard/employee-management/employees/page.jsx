import EmployeeClient from "@/components/client/EmployeeClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.EMPLOYEE.READ]}>
      <EmployeeClient />
    </ClientGuard>
  );
}
