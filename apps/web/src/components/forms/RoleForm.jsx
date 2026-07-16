"use client";

import { useForm, Controller } from "react-hook-form";
import { AlertCircle, Shield } from "lucide-react";
import { useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";
import SelectField from "@/components/ui/SelectField";
import { ROLE_FLOW } from "../client/RoleClient";

export default function RoleForm({ initialData = null, isPending, onSubmit }) {
  const actorRoleCode = useSelector((s) => s.auth.user?.role?.roleCode);
  const allowedRoles = ROLE_FLOW[actorRoleCode] || [];

  const roleOptions = [
    ...new Map(
      [initialData?.roleCode, ...allowedRoles]
        .filter(Boolean)
        .map((r) => [r, { label: r.replaceAll("_", " "), value: r }]),
    ).values(),
  ];

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      roleCode: "",
      roleName: "",
      roleDescription: "",
      ...initialData,
    },
  });

  const onFormSubmit = (data) => {
    clearErrors();

    if (!data.roleCode) {
      setError("roleCode", { message: "Role code is required" });
      return;
    }

    if (!data.roleName?.trim()) {
      setError("roleName", { message: "Role name is required" });
      return;
    }

    onSubmit(data, setError);
  };

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
        {/* ROLE CODE SELECT */}
        <div>
          <label className="block text-sm font-medium mb-1">Role Code</label>

          <Controller
            name="roleCode"
            control={control}
            render={({ field }) => (
              <SelectField
                value={field.value}
                onChange={field.onChange}
                options={roleOptions}
                placeholder="Select Role"
                error={errors.roleCode}
                disabled={!!initialData}
              />
            )}
          />
        </div>

        {/* ROLE NAME */}
        <InputField
          label="Role Name"
          name="roleName"
          placeholder="Reseller"
          register={register}
          required
          error={errors.roleName}
        />

        {/* DESCRIPTION */}
        <TextareaField
          label="Description"
          name="roleDescription"
          placeholder="Brief role description"
          register={register}
          error={errors.roleDescription}
        />

        <Button type="submit" loading={isPending} className="w-full">
          Save Role
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex justify-center gap-1 text-muted-foreground">
            <Shield className="h-3 w-3" />
            <p className="text-xs">
              Roles define system hierarchy & permissions
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
