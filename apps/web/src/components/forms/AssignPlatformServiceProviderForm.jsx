"use client";

import { useForm, Controller } from "react-hook-form";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";
import { AlertCircle } from "lucide-react";

export default function AssignPlatformServiceProviderForm({
  initialData,
  allProviders = [],
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
      providerId: initialData?.id || "",
      config: initialData?.config
        ? JSON.stringify(initialData.config, null, 2)
        : "",
    },
  });

  const submitHandler = (data) => {
    let parsedConfig = {};

    if (data.config?.trim()) {
      try {
        parsedConfig = JSON.parse(data.config);
      } catch {
        return setError("config", {
          type: "manual",
          message: "Invalid JSON format",
        });
      }
    }

    return onSubmit(
      {
        providerId: data.providerId,
        config: parsedConfig,
      },
      setError,
    );
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

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        {/* PROVIDER SELECT (ONLY IN CREATE MODE) */}
        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium">Select Provider</label>

            <Controller
              name="providerId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={allProviders.map((p) => ({
                    label: `${p.providerName} (${p.code})`,
                    value: p.id,
                  }))}
                />
              )}
            />

            {errors.providerId && (
              <p className="text-sm text-destructive mt-1">
                Provider is required
              </p>
            )}
          </div>
        )}

        {/* CONFIG */}
        <div>
          <label className="block text-sm font-medium">Config (JSON)</label>
          <textarea
            rows={5}
            className="mt-1 w-full border rounded-md p-3 text-sm font-mono"
            placeholder='{"apiKey":"xxx","secret":"yyy"}'
            {...register("config")}
          />
          {errors.config && (
            <p className="text-sm text-destructive mt-1">
              {errors.config.message}
            </p>
          )}
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          {isEditMode ? "Update Config" : "Assign Provider"}
        </Button>
      </form>
    </>
  );
}
