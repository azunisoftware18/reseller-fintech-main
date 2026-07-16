"use client";

import { Controller, useForm } from "react-hook-form";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import SelectField from "../ui/SelectField";
import { AlertCircle } from "lucide-react";

// 👈 Direction options
const DIRECTION_OPTIONS = [
  { label: "Plan Fetch (Mplan)", value: "PLAN_FETCH" },
  { label: "Recharge Execute", value: "RECHARGE_EXECUTE" },
];

export default function CircleMapForm({
  initialData,
  onSubmit,
  isPending,
  serviceProviderMappings = [],
}) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      serviceProviderMappingId: initialData?.serviceProviderMappingId || "",
      internalCircleCode: initialData?.internalCircleCode || "",
      providerCircleCode: initialData?.providerCircleCode || "",
      direction: initialData?.direction || "", // 👈 Add direction
    },
  });

  // Create options from service-provider mappings
  const mappingOptions =
    serviceProviderMappings.data?.map((mapping) => {
      const serviceName = mapping.serviceName || mapping.ServiceId;
      const providerName = mapping.providerName || mapping.ProviderId;
      return {
        label: `${serviceName} → ${providerName} (${mapping.mode || "default"})`,
        value: mapping.id,
      };
    }) || [];

  return (
    <>
      {errors?.root && (
        <div className="mb-4 text-destructive text-sm flex gap-2">
          <AlertCircle size={16} />
          {errors.root.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => onSubmit(data, setError))}
        className="space-y-6"
      >
        {/* Service-Provider Mapping Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Service & Provider Combination
          </label>

          <p className="text-xs text-muted-foreground mb-2">
            Choose the service-provider pair that this circle belongs to. Circle
            mappings are specific to each service-provider combination.
          </p>

          <Controller
            name="serviceProviderMappingId"
            control={control}
            rules={{ required: "Service-Provider mapping is required" }}
            render={({ field }) => (
              <SelectField
                value={field.value}
                onChange={field.onChange}
                options={mappingOptions}
                placeholder="Select Service-Provider Mapping"
              />
            )}
          />

          {errors.serviceProviderMappingId && (
            <p className="text-sm text-destructive mt-1">
              {errors.serviceProviderMappingId.message}
            </p>
          )}
        </div>

        {/* 👈 Direction Selection - NEW */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Direction / Purpose
          </label>

          <p className="text-xs text-muted-foreground mb-2">
            Select what this mapping is used for. Plan Fetch is for fetching
            plans from Mplan, Recharge Execute is for doing actual recharges.
          </p>

          <Controller
            name="direction"
            control={control}
            rules={{ required: "Direction is required" }}
            render={({ field }) => (
              <SelectField
                value={field.value}
                onChange={field.onChange}
                options={DIRECTION_OPTIONS}
                placeholder="Select Direction"
              />
            )}
          />

          {errors.direction && (
            <p className="text-sm text-destructive mt-1">
              {errors.direction.message}
            </p>
          )}
        </div>

        {/* Internal Circle Code */}
        <div>
          <InputField
            label="Internal Circle Code"
            name="internalCircleCode"
            register={register}
            required
          />

          <p className="text-xs text-muted-foreground mt-1">
            This is your system's circle identifier (e.g., RJ, DL, MH). It is
            used internally inside your platform.
          </p>
        </div>

        {/* Provider Circle Code */}
        <div>
          <InputField
            label="Provider Circle Code"
            name="providerCircleCode"
            register={register}
            required
          />

          <p className="text-xs text-muted-foreground mt-1">
            This is the circle code expected by the selected provider's API.
            This value will be sent in the actual recharge request.
          </p>
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          Save Mapping
        </Button>
      </form>
    </>
  );
}
