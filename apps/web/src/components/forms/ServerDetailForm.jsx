"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { AlertCircle, Lock, Server } from "lucide-react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";

export default function ServerDetailForm({
  initialData = null,
  isEditing = false,
  onSubmit,
  isPending = false,
}) {
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
      recordType: "CNAME",
      hostname: "@",
      value: "",
      status: "ACTIVE",
      ...initialData,
    },
  });

  const recordType = useWatch({
    control,
    name: "recordType",
  });

  /* ================= EFFECTS ================= */

  // Example: auto placeholder logic
  useEffect(() => {
    if (recordType === "IP") {
      setValue("value", "");
    }
  }, [recordType, setValue]);

  /* ================= SUBMIT ================= */

  const onFormSubmit = (data) => {
    clearErrors();

    if (!data.hostname?.trim()) {
      setError("hostname", { message: "Hostname is required" });
      return;
    }

    if (!data.value?.trim()) {
      setError("value", { message: "Value is required" });
      return;
    }

    onSubmit(data, setError);
  };

  return (
    <>
      {/* GLOBAL ERROR */}
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
        {/* ================= FIELDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RECORD TYPE */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Record Type <span className="text-red-500">*</span>
            </label>

            <Controller
              name="recordType"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "CNAME", label: "CNAME" },
                    { value: "IP", label: "IP Address" },
                    { value: "OTHER", label: "Other" },
                  ]}
                  placeholder="Select record type"
                  error={errors.recordType}
                />
              )}
            />
          </div>

          {/* STATUS */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Status
            </label>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                  placeholder="Select status"
                  error={errors.status}
                />
              )}
            />
          </div>

          {/* HOSTNAME */}
          <InputField
            label="Hostname"
            name="hostname"
            placeholder="api.example.com"
            register={register}
            required
            error={errors.hostname}
          />

          {/* VALUE */}
          <InputField
            label={
              recordType === "IP"
                ? "IP Address"
                : recordType === "CNAME"
                  ? "Target Host"
                  : "Value"
            }
            name="value"
            placeholder={
              recordType === "IP" ? "192.168.1.1" : "target.example.com"
            }
            register={register}
            required
            error={errors.value}
          />
        </div>

        {/* ================= SUBMIT ================= */}
        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isEditing ? "Update Server Record" : "Create Server Record"}
        </Button>

        {/* ================= FOOTER ================= */}
        <div className="pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center text-muted-foreground gap-1">
            <Server className="h-3 w-3" />
            <p className="text-xs">
              DNS & server records are securely stored and audited
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
