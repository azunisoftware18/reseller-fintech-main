"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import PageSkeleton from "@/components/details/PageSkeleton";
import SmtpConfigModal from "@/components/modals/SmtpConfigModal";

import {
  Mail,
  Lock,
  Shield,
  Calendar,
  Edit,
  RefreshCw,
  Copy,
  Server,
} from "lucide-react";

import {
  useSmtpConfigById,
  useCreateSmtpConfig,
  useUpdateSmtpConfig,
} from "@/hooks/useSmtpConfig";

import { setSmtpConfig, clearSmtpConfig } from "@/store/smtpConfigSlice";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

/* ================= COMPONENT ================= */

export default function SmtpConfigClient({ smtpConfigId }) {
  const dispatch = useDispatch();

  const smtpConfig = useSelector((state) => state.smtpConfig.currentSmtpConfig);

  const [openModal, setOpenModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= PERMISSIONS ================= */
  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreateSmtp = can(PERMISSIONS.SMTP.CREATE);
  const canUpdateSmtp = can(PERMISSIONS.SMTP.UPDATE);

  /* ================= API ================= */

  const { data, isLoading, refetch } = useSmtpConfigById(smtpConfigId);
  const { mutate: createSmtp, isPending: creating } = useCreateSmtpConfig();
  const { mutate: updateSmtp, isPending: updating } = useUpdateSmtpConfig(
    smtpConfig?.id,
  );

  const isPending = creating || updating;

  /* ================= SYNC API → REDUX ================= */

  useEffect(() => {
    if (data?.data) {
      dispatch(setSmtpConfig(data.data));
    } else {
      dispatch(clearSmtpConfig());
    }
  }, [data, dispatch]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast.success("SMTP configuration refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleSubmit = (formData, setError) => {
    const action = smtpConfig ? updateSmtp : createSmtp;

    action(formData, {
      onSuccess: (res) => {
        dispatch(setSmtpConfig(res.data));
        setOpenModal(false);
        toast.success("SMTP configuration saved");
        refetch();
      },
      onError: (err) =>
        setError("root", {
          message: err.message || "Failed to save SMTP configuration",
        }),
    });
  };

  if (isLoading && !smtpConfig) {
    return <PageSkeleton />;
  }

  /* ================= RENDER ================= */

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">SMTP Configuration</h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage outgoing email server credentials and delivery settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {
            <Button
              variant="outline"
              icon={RefreshCw}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          }

          {((!smtpConfig && canCreateSmtp) ||
            (smtpConfig && canUpdateSmtp)) && (
            <Button
              icon={smtpConfig ? Edit : Mail}
              onClick={() => setOpenModal(true)}
            >
              {smtpConfig ? "Edit Configuration" : "Create Configuration"}
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {smtpConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* MAIN INFO */}
            <InfoCard icon={Mail} title="SMTP details">
              <div className="space-y-2">
                <InfoItem
                  label="SMTP Host"
                  value={smtpConfig.smtpHost}
                  icon={Server}
                />

                <InfoItem
                  label="SMTP Port"
                  value={smtpConfig.smtpPort}
                  icon={Server}
                />

                <InfoItem
                  label="Username"
                  value={smtpConfig.smtpUsername}
                  icon={Lock}
                  onClick={() =>
                    handleCopy(smtpConfig.smtpUsername, "SMTP Username")
                  }
                />

                <InfoItem
                  label="Encryption"
                  value={smtpConfig.encryptionType}
                  icon={Shield}
                />

                <InfoItem
                  label="From Name"
                  value={smtpConfig.fromName}
                  icon={Mail}
                />

                <InfoItem
                  label="From Email"
                  value={smtpConfig.fromEmail}
                  icon={Mail}
                  onClick={() => handleCopy(smtpConfig.fromEmail, "From Email")}
                />
              </div>
            </InfoCard>

            {/* TECH details */}
            <InfoCard icon={Shield} title="Technical details">
              <div className="space-y-2">
                <InfoItem
                  label="Tenant ID"
                  value={smtpConfig.tenantId}
                  icon={Shield}
                />

                <InfoItem
                  label="Configuration ID"
                  value={smtpConfig.id}
                  icon={Shield}
                  onClick={() => handleCopy(smtpConfig.id, "Configuration ID")}
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
                    {formatDateTime(smtpConfig.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {formatDateTime(smtpConfig.updatedAt)}
                  </span>
                </div>
              </div>
            </InfoCard>

            {/* QUICK ACTIONS */}
            <InfoCard icon={Mail} title="Quick Actions">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={Copy}
                  onClick={() =>
                    handleCopy(smtpConfig.smtpUsername, "SMTP Username")
                  }
                >
                  Copy Username
                </Button>

                {canUpdateSmtp && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={Edit}
                    onClick={() => setOpenModal(true)}
                  >
                    Edit Configuration
                  </Button>
                )}
              </div>
            </InfoCard>
          </div>
        </div>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="No SMTP configuration found"
          emptyDescription="Create SMTP credentials to enable email sending."
          emptyAction={
            canCreateSmtp && (
              <Button icon={Mail} onClick={() => setOpenModal(true)}>
                Create SMTP Configuration
              </Button>
            )
          }
        />
      )}

      {/* MODAL */}
      {openModal && (
        <SmtpConfigModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isEditing={Boolean(smtpConfig)}
          isPending={isPending}
          initialData={smtpConfig}
        />
      )}
    </>
  );
}
