import { redirect } from "next/navigation";
import ClientGuard from "@/components/ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default async function Page({ params }) {
  const { id } = await params;

  if (!id) {
    redirect("/dashboard/tenants");
  }

  return (
    <ClientGuard
      anyOf={[PERMISSIONS.TENANT.READ, PERMISSIONS.DOMAIN.READ]}
      redirectMap={[
        {
          path: `/dashboard/tenants/${id}/overview`,
          perm: PERMISSIONS.TENANT.READ,
        },
        {
          path: `/dashboard/tenants/${id}/domain`,
          perm: PERMISSIONS.DOMAIN.READ,
        },
      ]}
    >
      <div />
    </ClientGuard>
  );
}
