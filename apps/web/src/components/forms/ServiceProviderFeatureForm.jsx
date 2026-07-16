"use client";

import { useForm, Controller } from "react-hook-form";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";

export default function ServiceProviderFeatureForm({
  providerId,
  features = [],
  onSubmit,
  isPending,
}) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const options = features.map((f) => ({
    label: `${f.code} - ${f.name}`,
    value: f.id,
  }));

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          providerId,
          payload: {
            serviceProviderId: providerId,
            platformServiceFeatureId: data.featureId,
          },
        }),
      )}
      className="space-y-4"
    >
      <Controller
        name="featureId"
        control={control}
        rules={{ required: "Feature is required" }}
        render={({ field }) => (
          <SelectField
            value={field.value}
            onChange={field.onChange}
            options={options}
            placeholder="Select Feature"
            error={errors.featureId}
          />
        )}
      />

      <Button type="submit" loading={isPending} className="w-full">
        Map Feature
      </Button>
    </form>
  );
}
