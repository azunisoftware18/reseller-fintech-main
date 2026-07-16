"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Key,
  LayoutDashboard,
  Globe,
  Activity,
  Settings,
} from "lucide-react";

import { useTenantById } from "@/hooks/useTenant";
import Button from "@/components/ui/Button";
import ProfileHeader from "@/components/details/ProfileHeader";
import TabsNav from "@/components/details/TabsNav";
import PageSkeleton from "@/components/details/PageSkeleton";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { clearTenant, setTenant } from "@/store/tenantSlice";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";

export default function TenantLayout({ children }) {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useDispatch();

  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canOverview = can(PERMISSIONS.TENANT.READ);
  const canDomain = can(PERMISSIONS.DOMAIN.READ);

  const { data, isLoading } = useTenantById(id);
  const tenant = data?.data;

  useEffect(() => {
    dispatch(setTenant(tenant));

    return () => {
      dispatch(clearTenant());
    };
  }, [tenant, dispatch]);

  if (!id || isLoading || !tenant) {
    return <PageSkeleton />;
  }

  if (!id || isLoading || !tenant) {
    return <PageSkeleton />;
  }

  const tabs = [
    canOverview && {
      label: "Overview",
      value: "overview",
      icon: LayoutDashboard,
    },
    canDomain && {
      label: "Domain",
      value: "domain",
      icon: Globe,
    },
  ].filter(Boolean);

  return (
    <div className="bg-background space-y-6">
      <Button
        variant="ghost"
        icon={ArrowLeft}
        onClick={() => router.push("/dashboard/tenants")}
      >
        Back to Tenants
      </Button>

      <ProfileHeader
        icon={Building2}
        title={tenant.tenantName}
        subtitle={tenant.tenantLegalName}
        meta={[
          { icon: Key, value: tenant.tenantNumber },
          { icon: Users, value: tenant.userType },
        ]}
      />

      <TabsNav tabs={tabs} basePath={`/dashboard/tenants/${id}`} />
      {children}
    </div>
  );
}
