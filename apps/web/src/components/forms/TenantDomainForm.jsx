"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import { AlertCircle, Lock } from "lucide-react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import { useServerDetails } from "@/hooks/useServerDetail";
import { useParams } from "next/navigation";

/* ================= CONSTANTS ================= */

const CRITICAL_STATUSES = ["INACTIVE", "SUSPENDED", "DELETED"];

export default function TenantDomainForm({
  initialData = null,
  isEditing = false,
  onSubmit,
  isPending = false,
}) {
  const tenantId = useParams().id;

  const { data } = useServerDetails();
  const serverData = data?.data;
  const serverOptions =
    serverData?.map((s) => ({
      value: s.id,
      label: `${s.hostname} → ${s.value}`,
    })) || [];

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      domainName: "",
      serverDetailId: "",
      status: "ACTIVE",
      actionReason: "",
      ...initialData,
    },
  });

  const status = useWatch({ control, name: "status" });
  const actionReasonRequired = CRITICAL_STATUSES.includes(status);

  useEffect(() => {
    if (status === "ACTIVE") {
      setValue("actionReason", "");
    }
  }, [status, setValue]);

  const onFormSubmit = (data) => {
    clearErrors();

    if (actionReasonRequired && !data.actionReason?.trim()) {
      setError("actionReason", {
        message: "Action reason is required for this status",
      });
      return;
    }

    onSubmit(
      {
        ...data,
        tenantId,
      },
      setError,
    );
  };

  /* ================= UI ================= */
  return (
    <>
      {errors?.root && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DOMAIN */}
          <InputField
            label="Domain Name"
            name="domainName"
            placeholder="example.com"
            register={register}
            required
            error={errors.domainName}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              status Type <span className="text-red-500">*</span>
            </label>
            {/* STATUS */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  label="Status"
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "SUSPENDED", label: "Suspended" },
                    { value: "DELETED", label: "Deleted" },
                  ]}
                  error={errors.status}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Server Detail Type <span className="text-red-500">*</span>
            </label>

            {/* SERVER DETAIL */}
            <Controller
              name="serverDetailId"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  label="Server Configuration"
                  options={serverOptions}
                  placeholder="Select server configuration"
                  error={errors.serverDetailId}
                />
              )}
            />
          </div>
        </div>

        {/* ACTION REASON */}
        {actionReasonRequired && (
          <InputField
            label="Action Reason"
            name="actionReason"
            register={register}
            required
            error={errors.actionReason}
          />
        )}

        <Button type="submit" loading={isPending} className="w-full">
          {isEditing ? "Update Domain" : "Create Domain"}
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center text-muted-foreground gap-1">
            <Lock className="h-3 w-3" />
            <p className="text-xs">
              Domain configuration is securely stored and audited
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
