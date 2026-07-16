"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import TenantDomainModal from "@/components/modals/TenantDomainModal";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import PageSkeleton from "@/components/details/PageSkeleton";

import { Globe, Shield, Lock, Calendar, Edit, RefreshCw } from "lucide-react";

import {
  useTenantDomainByTenantId,
  useUpsertTenantDomain,
} from "@/hooks/useTenantDomain";

import { setTenantDomain, clearTenantDomain } from "@/store/tenantDomainSlice";

import { formatDateTime, statusColor } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useMe } from "@/hooks/useAuth";
import { loginSuccess } from "@/store/authSlice";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

const FIELDS = [
  "domainName",
  "tenantId",
  "serverDetailId",
  "status",
  "actionReason",
];

const buildUpsertPayload = (formData) => {
  const payload = {};
  FIELDS.forEach((key) => {
    if (formData[key] !== undefined && formData[key] !== "") {
      payload[key] = formData[key];
    }
  });
  return payload;
};

/* ================= COMPONENT ================= */

export default function TenantDomainClient() {
  const dispatch = useDispatch();

  const tenant = useSelector((state) => state.tenant?.currentTenant ?? null);
  const currentUser = useSelector((state) => state.auth?.user ?? null);
  const tenantDomain = useSelector(
    (state) => state.tenantDomain?.currentDomain ?? null,
  );

  const [openModal, setOpenModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, isLoading } = useTenantDomainByTenantId(
    tenant?.id ?? currentUser?.tenant.id,
  );
  const { mutate: upsertTenantDomain, isPending } = useUpsertTenantDomain();

  const { data: meRes, isLoading: meLoading } = useMe();

  /* ================= PERMISSIONS ================= */
  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreateDomain = can(PERMISSIONS.DOMAIN.CREATE);
  const canEditDomain = can(PERMISSIONS.DOMAIN.UPDATE);
  const canViewDomain = can(PERMISSIONS.DOMAIN.READ);

  useEffect(() => {
    if (meRes?.data) {
      dispatch(loginSuccess(meRes?.data));
    }
  }, [meRes?.data, dispatch]);

  /* ================= SYNC API → REDUX ================= */
  useEffect(() => {
    if (data?.data) {
      dispatch(setTenantDomain(data.data));
    } else {
      dispatch(clearTenantDomain());
    }
  }, [data, dispatch]);

  /* ================= HANDLERS ================= */

  const handleSubmit = (formData, setError) => {
    const payload = buildUpsertPayload(formData);

    upsertTenantDomain(payload, {
      onSuccess: (res) => {
        dispatch(setTenantDomain(res.data));
        setOpenModal(false);
        toast.success("Domain configuration saved");
      },
      onError: (err) => {
        if (err?.type === "FIELD") {
          err.errors.forEach(({ field, message }) =>
            setError(field, { message }),
          );
          return;
        }
        setError("root", { message: err?.message });
      },
    });
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast.success("Domain refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const statusMeta = tenantDomain ? statusColor[tenantDomain.status] : null;

  const isInitialLoading = isLoading || (meLoading && !tenantDomain);
  if (isInitialLoading) return <PageSkeleton />;

  /* ================= RENDER ================= */

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tenant Domain</h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage tenant domain mapping, lifecycle status, and server
            association.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canViewDomain && (
            <Button
              variant="outline"
              icon={RefreshCw}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          )}
          {!tenantDomain && canCreateDomain && (
            <Button icon={Globe} onClick={() => setOpenModal(true)}>
              Add Domain
            </Button>
          )}

          {tenantDomain && canEditDomain && (
            <Button icon={Edit} onClick={() => setOpenModal(true)}>
              Edit Domain
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {tenantDomain ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* DOMAIN INFO */}
            <InfoCard icon={Globe} title="Domain Configuration">
              <div className="flex items-center gap-2 mb-4">
                {statusMeta && (
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <InfoItem
                  label="Domain Name"
                  value={tenantDomain.domainName}
                  icon={Globe}
                  onClick={() => handleCopy(tenantDomain.domainName, "Domain")}
                />

                <InfoItem
                  label="Server Detail ID"
                  value={tenantDomain.serverDetailId}
                  icon={Shield}
                  onClick={() =>
                    handleCopy(tenantDomain.serverDetailId, "Server Detail ID")
                  }
                />

                <InfoItem
                  label="Status"
                  value={tenantDomain.status}
                  icon={Shield}
                />
              </div>
            </InfoCard>

            {/* TECH details */}
            <InfoCard icon={Shield} title="Technical details">
              <div className="space-y-2">
                <InfoItem
                  label="Tenant ID"
                  value={tenantDomain.tenantNumber}
                  icon={Shield}
                />

                <InfoItem
                  label={`Created By ${tenantDomain.createdBy?.type}`}
                  value={
                    tenantDomain.createdBy?.type === "USER"
                      ? tenantDomain.createdBy.userNumber
                      : tenantDomain.createdBy?.type === "EMPLOYEE"
                        ? tenantDomain.createdBy.employeeNumber
                        : "System"
                  }
                  icon={Lock}
                />

                <InfoItem
                  label="Domain ID"
                  value={tenantDomain.id}
                  icon={Shield}
                  onClick={() => handleCopy(tenantDomain.id, "Domain ID")}
                />
              </div>
            </InfoCard>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* TIMELINE */}
            <InfoCard icon={Calendar} title="Timeline">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {formatDateTime(tenantDomain.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {formatDateTime(tenantDomain.updatedAt)}
                  </span>
                </div>

                {tenantDomain.actionedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actioned At</span>
                    <span className="font-medium">
                      {formatDateTime(tenantDomain.actionedAt)}
                    </span>
                  </div>
                )}
              </div>
            </InfoCard>
            {tenantDomain.actionReason && (
              <InfoCard icon={Lock} title="Action details">
                <div className="space-y-2 text-sm">
                  <InfoItem
                    label="Action Reason"
                    value={tenantDomain.actionReason}
                    icon={Lock}
                  />
                </div>
              </InfoCard>
            )}
          </div>
        </div>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="No domain configured"
          emptyDescription="Add a domain to map it with server configuration."
          // emptyAction={
          //   canCreateDomain && (
          //     <Button icon={Globe} onClick={() => setOpenModal(true)}>
          //       Add Domain
          //     </Button>
          //   )
          // }
        />
      )}

      {/* MODAL */}
      {openModal && (
        <TenantDomainModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isEditing={Boolean(tenantDomain)}
          isPending={isPending}
          initialData={tenantDomain}
        />
      )}
    </>
  );
}
