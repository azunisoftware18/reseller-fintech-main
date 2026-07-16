"use client";

import { useForm, Controller } from "react-hook-form";
import { AlertCircle, Mail, Lock, Server } from "lucide-react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";

export default function SmtpConfigForm({
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
    formState: { errors },
  } = useForm({
    defaultValues: {
      smtpHost: "",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
      encryptionType: "TLS",
      fromName: "",
      fromEmail: "",
      ...initialData,
    },
  });

  /* ================= SUBMIT ================= */

  const onFormSubmit = (data) => {
    clearErrors();

    if (!data.smtpHost?.trim()) {
      setError("smtpHost", { message: "SMTP host is required" });
      return;
    }

    if (!data.smtpPort) {
      setError("smtpPort", { message: "SMTP port is required" });
      return;
    }

    if (!data.smtpUsername?.trim()) {
      setError("smtpUsername", { message: "Username is required" });
      return;
    }

    if (!isEditing && !data.smtpPassword?.trim()) {
      setError("smtpPassword", { message: "Password is required" });
      return;
    }

    if (!data.fromEmail?.trim()) {
      setError("fromEmail", { message: "From email is required" });
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
          <InputField
            label="SMTP Host"
            name="smtpHost"
            placeholder="smtp.gmail.com"
            register={register}
            required
            error={errors.smtpHost}
          />

          <InputField
            label="SMTP Port"
            name="smtpPort"
            type="number"
            placeholder="587"
            register={register}
            required
            error={errors.smtpPort}
          />

          <InputField
            label="SMTP Username"
            name="smtpUsername"
            placeholder="user@example.com"
            register={register}
            required
            error={errors.smtpUsername}
          />

          <InputField
            label="SMTP Password"
            name="smtpPassword"
            type="password"
            placeholder={isEditing ? "••••••••" : "Enter password"}
            register={register}
            required={!isEditing}
            error={errors.smtpPassword}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Encryption Type
            </label>

            <Controller
              name="encryptionType"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  label="Encryption"
                  options={[
                    { value: "TLS", label: "TLS (Recommended)" },
                    { value: "SSL", label: "SSL" },
                    { value: "STARTTLS", label: "STARTTLS" },
                  ]}
                  error={errors.encryptionType}
                />
              )}
            />
          </div>

          <InputField
            label="From Name"
            name="fromName"
            placeholder="My App"
            register={register}
            error={errors.fromName}
          />

          <InputField
            label="From Email"
            name="fromEmail"
            placeholder="noreply@myapp.com"
            register={register}
            required
            error={errors.fromEmail}
          />
        </div>

        {/* ================= SUBMIT ================= */}
        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isEditing
            ? "Update SMTP Configuration"
            : "Create SMTP Configuration"}
        </Button>

        {/* ================= FOOTER ================= */}
        <div className="pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center text-muted-foreground gap-1">
            <Mail className="h-3 w-3" />
            <p className="text-xs">
              SMTP credentials are encrypted and securely stored
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
