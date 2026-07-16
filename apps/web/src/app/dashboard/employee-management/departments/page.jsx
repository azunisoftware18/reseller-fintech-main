import DepartmentClient from "@/components/client/DepartmentClient";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

function page() {
  return (
    <ClientGuard anyOf={[PERMISSIONS.DEPARTMENT.READ]}>
      <DepartmentClient />
    </ClientGuard>
  );
}

export default page;
