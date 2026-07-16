"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { useMemo, useEffect } from "react";
import { AlertCircle, Lock } from "lucide-react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import { onlyDigits } from "@/lib/utils";
import { useSelector } from "react-redux";

const CRITICAL_STATUSES = ["INACTIVE", "SUSPENDED", "DELETED"];

export default function TenantForm({
  initialData = null,
  isEditing = false,
  onSubmit,
  isPending = false,
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tenantName: "",
      tenantLegalName: "",
      tenantEmail: "",
      tenantWhatsapp: "",
      tenantMobileNumber: "",
      tenantStatus: "ACTIVE",
      tenantType: "",
      userType: "",
      actionReason: "",
      ...initialData,
    },
  });

  const tenantStatus = useWatch({
    control,
    name: "tenantStatus",
  });

  const actionReasonRequired = CRITICAL_STATUSES.includes(tenantStatus);

  const currentUser = useSelector((state) => state.auth?.user.role);

  const roleCodeOptions = useMemo(() => {
    if (currentUser?.roleCode === "AZZUNIQUE") {
      return [{ value: "RESELLER", label: "Reseller" }];
    }

    if (currentUser?.roleCode === "RESELLER") {
      return [{ value: "WHITELABEL", label: "White Label" }];
    }

    return [];
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.roleCode === "AZZUNIQUE") {
      setValue("userType", "RESELLER");
    }

    if (currentUser?.roleCode === "RESELLER") {
      setValue("userType", "WHITELABEL");
    }
  }, [currentUser, setValue]);

  const onFormSubmit = (data) => {
    clearErrors();

    if (actionReasonRequired && !data.actionReason?.trim()) {
      setError("actionReason", {
        message: "Action reason is required for this status",
      });
      return;
    }

    onSubmit(data, setError);
  };

  return (
    <>
      {errors?.root && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-destructive">
                Submission failed
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {errors.root.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Tenant Name"
            name="tenantName"
            register={register}
            required
            error={errors.tenantName}
          />

          <InputField
            label="Tenant Legal Name"
            name="tenantLegalName"
            register={register}
            required
            error={errors.tenantLegalName}
          />

          <InputField
            label="Tenant Email"
            name="tenantEmail"
            type="email"
            register={register}
            required
            error={errors.tenantEmail}
          />

          <InputField
            label="WhatsApp Number"
            name="tenantWhatsapp"
            type="text"
            inputMode="numeric"
            maxLength={10}
            register={register}
            required
            onInput={onlyDigits(10)}
            error={errors.tenantWhatsapp}
          />

          <InputField
            label="Mobile Number"
            name="tenantMobileNumber"
            type="text"
            inputMode="numeric"
            maxLength={10}
            register={register}
            required
            onInput={onlyDigits(10)}
            error={errors.tenantMobileNumber}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tenant Status <span className="text-red-500">*</span>
            </label>

            <Controller
              name="tenantStatus"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "SUSPENDED", label: "Suspended" },
                    { value: "DELETED", label: "Deleted" },
                  ]}
                  placeholder="Select status"
                  error={errors.tenantStatus}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tenant Type <span className="text-red-500">*</span>
            </label>

            <Controller
              name="tenantType"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "PROPRIETORSHIP", label: "Proprietorship" },
                    { value: "PARTNERSHIP", label: "Partnership" },
                    { value: "PRIVATE_LIMITED", label: "Private Limited" },
                  ]}
                  placeholder="Select tenant type"
                  error={errors.tenantType}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              User Type <span className="text-red-500">*</span>
            </label>

            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={roleCodeOptions}
                  placeholder="Select user type"
                  error={errors.userType}
                  disabled={roleCodeOptions.length === 0}
                />
              )}
            />
          </div>
        </div>

        {actionReasonRequired && (
          <InputField
            label="Action Reason"
            name="actionReason"
            register={register}
            required
            error={errors.actionReason}
          />
        )}

        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isEditing ? "Update Tenant" : "Create Tenant"}
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center text-muted-foreground gap-1">
            <Lock className="h-3 w-3" />
            <p className="text-xs">
              Tenant data is securely stored and audited
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
