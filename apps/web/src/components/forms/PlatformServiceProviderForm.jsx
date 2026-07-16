"use client";

import { useForm, Controller } from "react-hook-form";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";
import { AlertCircle } from "lucide-react";

export default function PlatformServiceProviderForm({
  initialData,
  onSubmit,
  isPending,
}) {
  const isEditMode = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: initialData?.code || "",
      providerName: initialData?.providerName || "",
      handler: initialData?.handler || "",
      isActive:
        initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  const submitHandler = (data) => {
    return onSubmit(data, setError);
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

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        {/* CODE */}
        <InputField
          label="Provider Code"
          name="code"
          register={register}
          required
          error={errors.code}
        />

        {/* NAME */}
        <InputField
          label="Provider Name"
          name="providerName"
          register={register}
          required
          error={errors.providerName}
        />

        {/* HANDLER */}
        <InputField
          label="Handler Class"
          name="handler"
          register={register}
          required
          error={errors.handler}
        />

        {/* STATUS */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Status</label>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <SelectField
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: "Active", value: true },
                  { label: "Inactive", value: false },
                ]}
              />
            )}
          />
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          {isEditMode ? "Update Provider" : "Create Provider"}
        </Button>
      </form>
    </>
  );
}
