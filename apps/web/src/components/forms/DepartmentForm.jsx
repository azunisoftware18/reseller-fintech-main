"use client";

import { useForm } from "react-hook-form";
import { AlertCircle, Building2 } from "lucide-react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";

export default function DepartmentForm({
  initialData = null,
  isPending,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      departmentDescription: "",
      ...initialData,
    },
  });

  const onFormSubmit = (data) => {
    clearErrors();

    if (!data.departmentCode?.trim()) {
      setError("departmentCode", {
        message: "Department code is required",
      });
      return;
    }

    if (!data.departmentName?.trim()) {
      setError("departmentName", {
        message: "Department name is required",
      });
      return;
    }

    onSubmit(
      {
        ...data,
        departmentCode: data.departmentCode.toUpperCase(),
      },
      setError
    );
  };

  return (
    <>
      {/* ROOT ERROR */}
      {errors?.root && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <InputField
          label="Department Code"
          name="departmentCode"
          placeholder="HR, TECH, SALES"
          register={(name) =>
            register(name, {
              setValueAs: (v) => v?.toUpperCase(),
            })
          }
          required
          error={errors.departmentCode}
        />

        <InputField
          label="Department Name"
          name="departmentName"
          placeholder="Human Resources"
          register={register}
          required
          error={errors.departmentName}
        />

        <TextareaField
          label="Description"
          name="departmentDescription"
          placeholder="Brief department description"
          register={register}
          error={errors.departmentDescription}
        />

        <Button type="submit" loading={isPending} className="w-full">
          Save Department
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex justify-center gap-1 text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <p className="text-xs">
              Departments help organize roles & permissions
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
