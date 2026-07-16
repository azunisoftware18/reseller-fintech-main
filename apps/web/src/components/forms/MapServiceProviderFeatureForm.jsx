"use client";

import { useForm, Controller } from "react-hook-form";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";
import { AlertCircle } from "lucide-react";

export default function MapServiceProviderFeatureForm({
  providerId,
  features = [],
  mappedFeatures = [],
  onSubmit,
  isPending,
}) {
  const featureOptions = features.map((f) => ({
    label: f.name,
    value: f.id,
    disabled: mappedFeatures.some((mf) => mf.platformServiceFeatureId === f.id),
  }));

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      serviceProviderId: providerId,
      platformServiceFeatureId: "",
    },
  });

  const submitHandler = (data) => {
    onSubmit(
      {
        serviceProviderId: data.serviceProviderId,
        platformServiceFeatureId: data.platformServiceFeatureId,
      },
      setError,
    );
  };

  return (
    <>
      {errors?.root && (
        <div className="mb-4 rounded border border-destructive/20 bg-destructive/10 p-3">
          <div className="flex gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
            {errors.root.message}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        <Controller
          name="platformServiceFeatureId"
          control={control}
          rules={{ required: "Feature required" }}
          render={({ field }) => (
            <SelectField
              value={field.value}
              onChange={field.onChange}
              options={featureOptions}
              placeholder="Select Feature"
              searchable
              error={errors.platformServiceFeatureId}
            />
          )}
        />

        <Button type="submit" loading={isPending} className="w-full">
          Map Feature
        </Button>
      </form>
    </>
  );
}
