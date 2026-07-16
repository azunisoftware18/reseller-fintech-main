"use client";

import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import { useUsers } from "@/hooks/useUser";
import { useAllowedMappings } from "@/hooks/useAdminServices";
import { useRoles } from "@/hooks/useRole";
import { useSelector } from "react-redux";
import { Receipt } from "lucide-react";
import { Percent } from "lucide-react";
import { Calculator } from "lucide-react";

const ADMIN_ROLE = "AZZUNIQUE";

export default function CommissionForm({
  initialData = null,
  isEditing = false,
  onSubmit,
  isPending = false,
}) {
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role?.roleCode === ADMIN_ROLE;

  const [selectedMapping, setSelectedMapping] = useState(null);
  const [selectedMappingSlabs, setSelectedMappingSlabs] = useState([]);
  const [isMappingSlabBased, setIsMappingSlabBased] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      scope: "USER",
      mode: "COMMISSION",
      type: "PERCENTAGE",
      value: "",
      applyGST: false,
      gstPercent: 18,
      applyTDS: false,
      tdsPercent: 0,
      supportsSlab: false,
      slabs: [
        {
          minAmount: "",
          maxAmount: "",
          value: "",
        },
      ],
      isActive: true,
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slabs",
  });

  const scope = useWatch({ control, name: "scope" });
  const mode = useWatch({ control, name: "mode" });
  const applyGST = useWatch({ control, name: "applyGST" });
  const applyTDS = useWatch({ control, name: "applyTDS" });
  const supportsSlab = useWatch({ control, name: "supportsSlab" });
  const type = useWatch({ control, name: "type" });
  const serviceProviderMappingId = useWatch({
    control,
    name: "serviceProviderMappingId",
  });

  const { data: mappingsData } = useAllowedMappings();

  /* ================= AUTO RESET TAX ================= */
  useEffect(() => {
    if (mode === "SURCHARGE") {
      setValue("applyTDS", false);
      setValue("tdsPercent", 0);
    } else if (mode === "COMMISSION") {
      setValue("applyGST", false);
      setValue("gstPercent", 0);
    }
  }, [mode, setValue]);

  // Reset slabs when supportsSlab is turned off
  useEffect(() => {
    if (!supportsSlab) {
      setValue("slabs", [{ minAmount: "", maxAmount: "", value: "" }]);
      setValue("value", "");
    } else if (
      supportsSlab &&
      (!getValues("slabs") || getValues("slabs").length === 0)
    ) {
      setValue("slabs", [{ minAmount: "", maxAmount: "", value: "" }]);
      setValue("value", "");
    }
  }, [supportsSlab, setValue, getValues]);

  // Update selected mapping when serviceProviderMappingId changes
  useEffect(() => {
    if (serviceProviderMappingId && mappingsData) {
      const mapping = mappingsData.find(
        (m) => m.value === serviceProviderMappingId,
      );
      setSelectedMapping(mapping);

      // Check if mapping supports slabs
      const hasSlabs = mapping?.supportsSlab === true;
      setIsMappingSlabBased(hasSlabs);

      // Store the slabs from the selected mapping
      if (hasSlabs && mapping?.slabs && mapping.slabs.length > 0) {
        setSelectedMappingSlabs(mapping.slabs);

        // Automatically enable slab-based pricing if mapping supports slabs
        if (!isEditing) {
          setValue("supportsSlab", true);

          // Initialize slabs based on mapping slabs if needed
          if (
            getValues("slabs").length === 1 &&
            getValues("slabs")[0].minAmount === ""
          ) {
            const initialSlabs = mapping.slabs.map((slab) => ({
              minAmount: slab.minAmount,
              maxAmount: slab.maxAmount,
              value: "",
            }));
            setValue("slabs", initialSlabs);
          }
        }
      } else {
        setSelectedMappingSlabs([]);
        // If mapping doesn't support slabs, disable slab-based pricing
        if (!isEditing && !hasSlabs) {
          setValue("supportsSlab", false);
        }
      }
    } else {
      setSelectedMapping(null);
      setSelectedMappingSlabs([]);
      setIsMappingSlabBased(false);
    }
  }, [serviceProviderMappingId, mappingsData, setValue, getValues, isEditing]);

  /* ================= FETCH DATA ================= */
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const { data: rolesData } = useRoles();

  const users =
    usersData?.data?.flatMap((tenantBlock) =>
      tenantBlock.users.map((user) => ({
        ...user,
        tenantName: tenantBlock.tenant?.tenantName,
      })),
    ) || [];

  const roles = rolesData?.data || [];
  const mappings = mappingsData || [];

  const onFormSubmit = (data) => {
    clearErrors();

    const payload = {
      ...data,
      value:
        !data.supportsSlab && data.value !== "" && data.value !== null
          ? Number(data.value)
          : null,
      gstPercent: data.applyGST ? Number(data.gstPercent) : null,
      tdsPercent: data.applyTDS ? Number(data.tdsPercent) : null,
      targetUserId: data.scope === "USER" ? data.targetUserId : null,
      roleId: data.scope === "ROLE" ? data.roleId : null,
      slabs:
        data.supportsSlab && data.slabs
          ? data.slabs.map((slab) => ({
              minAmount: Number(slab.minAmount),
              maxAmount: Number(slab.maxAmount),
              value:
                slab.value !== "" && slab.value !== null
                  ? Number(slab.value)
                  : null,
            }))
          : [],
    };

    // Clean up undefined values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    // Call onSubmit with payload and setError function
    onSubmit(payload, setError);
  };

  const addSlab = () => {
    append({ minAmount: "", maxAmount: "", value: "" });
  };

  const removeSlab = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Check if there are any slab-related errors
  const hasSlabErrors = () => {
    if (!errors.slabs) return false;
    if (Array.isArray(errors.slabs)) {
      return errors.slabs.some(
        (slab) => slab && (slab.minAmount || slab.maxAmount || slab.value),
      );
    }
    return Object.keys(errors.slabs).length > 0;
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    return `${value}%`;
  };

  // Get provider cost display value based on mode and type (for non-slab)
  const getProviderCostDisplay = () => {
    if (!selectedMapping) return null;

    const providerCost = selectedMapping.providerCost;
    const pricingValueType = selectedMapping.pricingValueType;

    if (providerCost === null || providerCost === undefined) return null;

    if (pricingValueType === "FLAT") {
      return formatCurrency(providerCost);
    } else if (pricingValueType === "PERCENTAGE") {
      return formatPercentage(providerCost);
    }

    return providerCost;
  };

  // Get provider cost for a specific slab range
  const getProviderCostForSlab = (minAmount, maxAmount) => {
    if (!selectedMappingSlabs || selectedMappingSlabs.length === 0) return null;

    const slab = selectedMappingSlabs.find(
      (s) => s.minAmount === minAmount && s.maxAmount === maxAmount,
    );

    if (!slab) return null;

    const pricingValueType = selectedMapping.pricingValueType;
    const providerCost = slab.providerCost;

    if (providerCost === null || providerCost === undefined) return null;

    if (pricingValueType === "FLAT") {
      return formatCurrency(providerCost);
    } else if (pricingValueType === "PERCENTAGE") {
      return formatPercentage(providerCost);
    }

    return providerCost;
  };

  return (
    <>
      {/* Root Error - Improved styling */}
      {errors?.root && (
        <div className="rounded-lg border p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-500">
                {errors.root.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SCOPE */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Scope <span className="text-red-500">*</span>
            </label>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  disabled={isEditing}
                  options={[
                    { value: "USER", label: "User" },
                    { value: "ROLE", label: "Role" },
                  ]}
                  error={errors.scope}
                />
              )}
            />
          </div>

          {/* USER SELECT */}
          {!isEditing && scope === "USER" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Select User <span className="text-red-500">*</span>
              </label>
              <Controller
                name="targetUserId"
                control={control}
                rules={{ required: "User is required" }}
                render={({ field }) => (
                  <SelectField
                    {...field}
                    options={users.map((u) => ({
                      value: u.id,
                      label: `${u.firstName} ${u.lastName} (${u.tenantName})`,
                    }))}
                    error={errors.targetUserId}
                  />
                )}
              />
            </div>
          )}

          {/* ROLE SELECT */}
          {!isEditing && scope === "ROLE" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Select Role <span className="text-red-500">*</span>
              </label>
              <Controller
                name="roleId"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <SelectField
                    {...field}
                    options={roles.map((r) => ({
                      value: r.id,
                      label: `${r.roleName} (${r.roleCode})`,
                    }))}
                    error={errors.roleId}
                  />
                )}
              />
            </div>
          )}

          {/* MAPPING */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Service Mapping <span className="text-red-500">*</span>
            </label>
            <Controller
              name="serviceProviderMappingId"
              control={control}
              rules={{ required: "Service mapping is required" }}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={(mappings || []).map((m) => ({
                    value: m.id, // ✅ ab yeh available hai kyunki select me set kiya hai
                    label: `${m.serviceCode || "Service"} - ${m.providerCode || "Provider"}${m.supportsSlab ? " (Slab-based)" : ""}`,
                  }))}
                  error={errors.serviceProviderMappingId}
                />
              )}
            />
          </div>

          {/* MODE */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Mode <span className="text-red-500">*</span>
            </label>
            <Controller
              name="mode"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "COMMISSION", label: "Commission" },
                    { value: "SURCHARGE", label: "Surcharge" },
                  ]}
                  error={errors.mode}
                />
              )}
            />
          </div>

          {/* TYPE */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Calculation Type <span className="text-red-500">*</span>
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  options={[
                    { value: "PERCENTAGE", label: "Percentage" },
                    { value: "FLAT", label: "Flat" },
                  ]}
                  error={errors.type}
                />
              )}
            />
          </div>

          {/* VALUE - Only show if not using slabs */}
          {!supportsSlab && !isMappingSlabBased && (
            <>
              <InputField
                label="Value"
                name="value"
                type="number"
                step="any"
                register={register}
                required
                error={errors.value}
                helperText={
                  type === "PERCENTAGE"
                    ? "Enter percentage value"
                    : "Enter flat amount"
                }
              />

              {/* Provider Cost Display with Tax Info - Only for ADMIN_ROLE = AZZUNIQUE (Non-slab case) */}
              {isAdmin && selectedMapping && getProviderCostDisplay() && (
                <div className="col-span-1 md:col-span-2 -mt-2">
                  <div className="border rounded-lg p-4 ">
                    {/* Provider Cost */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 " />
                        <div>
                          <p className="text-sm font-medium ">Provider Cost</p>
                          <p className="text-2xl font-bold ">
                            {getProviderCostDisplay()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs ">Base cost from provider</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t  my-3"></div>

                    {/* Tax Information from Selected Mapping */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-medium ">
                          Mapping Tax Configuration
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Mode Badge */}
                        <div className="flex items-center gap-2 p-2 rounded-lg ">
                          <div className="p-1 rounded bg-purple-100">
                            <AlertCircle className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="text-xs">
                            <span className="">Mode:</span>
                            <span
                              className={`ml-1 font-medium ${
                                selectedMapping.mode === "COMMISSION"
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {selectedMapping.mode === "COMMISSION"
                                ? "Commission"
                                : "Surcharge"}
                            </span>
                          </div>
                        </div>

                        {/* Pricing Type */}
                        <div className="flex items-center gap-2 p-2 rounded-lg ">
                          <div className="p-1 rounded bg-gray-100">
                            <Lock className="h-3 w-3 text-gray-600" />
                          </div>
                          <div className="text-xs">
                            <span className="">Pricing Type:</span>
                            <span className="ml-1 font-medium ">
                              {selectedMapping.pricingValueType === "FLAT"
                                ? "Flat"
                                : "Percentage"}
                            </span>
                          </div>
                        </div>

                        {/* TDS - Only for Commission Mode */}
                        {selectedMapping.mode === "COMMISSION" && (
                          <div className="flex items-center gap-2 p-2 rounded-lg ">
                            <div className="p-1 rounded bg-orange-100">
                              <Percent className="h-3 w-3 text-orange-600" />
                            </div>
                            <div className="text-xs">
                              <span className="">TDS:</span>
                              {selectedMapping.applyTDS ? (
                                <span className="ml-1 font-bold text-orange-600">
                                  {selectedMapping.tdsPercent}%
                                  <span className=" font-normal ml-1">
                                    (Deducted from Commission)
                                  </span>
                                </span>
                              ) : (
                                <span className="ml-1  italic">
                                  Not applied
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* GST - Only for Surcharge Mode */}
                        {selectedMapping.mode === "SURCHARGE" && (
                          <div className="flex items-center gap-2 p-2 rounded-lg ">
                            <div className="p-1 rounded bg-green-100">
                              <Calculator className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="text-xs">
                              <span className="">GST:</span>
                              {selectedMapping.applyGST ? (
                                <span className="ml-1 font-bold text-green-600">
                                  {selectedMapping.gstPercent}%
                                  <span className=" font-normal ml-1">
                                    (Added to Surcharge)
                                  </span>
                                </span>
                              ) : (
                                <span className="ml-1  italic">
                                  Not applied
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tax Impact Preview */}
                      {(selectedMapping.applyTDS ||
                        selectedMapping.applyGST) && (
                        <div className="mt-2 p-2  rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 shrink-0" />
                            <div className="text-xs text-yellow-800">
                              <p className="font-medium mb-1">
                                Tax Impact Preview:
                              </p>
                              {selectedMapping.mode === "COMMISSION" &&
                                selectedMapping.applyTDS && (
                                  <p>
                                    • TDS of {selectedMapping.tdsPercent}% will
                                    be deducted from commission amount
                                  </p>
                                )}
                              {selectedMapping.mode === "SURCHARGE" &&
                                selectedMapping.applyGST && (
                                  <p>
                                    • GST of {selectedMapping.gstPercent}% will
                                    be added to surcharge amount
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ================= SLAB SUPPORT TOGGLE ================= */}
        {/* Only show toggle if mapping doesn't force slab-based pricing */}
        {!isMappingSlabBased && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Controller
                name="supportsSlab"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={field.value}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                )}
              />
              <label className="text-sm font-medium">
                Enable Slab-based Pricing
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Enable this to set different values based on transaction amount
              ranges
            </p>
          </div>
        )}

        {/* Show info message when mapping is slab-based */}
        {isMappingSlabBased && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 " />
              <label className="text-sm font-medium ">
                Slab-based Pricing (Required by Service Mapping)
              </label>
            </div>
            <p className="text-xs  ml-7">
              This service mapping requires slab-based pricing. Please configure
              the slabs below.
            </p>
          </div>
        )}

        {/* ================= SLABS SECTION ================= */}
        {(supportsSlab || isMappingSlabBased) && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Price Slabs</label>
                {hasSlabErrors() && (
                  <p className="text-xs text-red-500 mt-1">
                    Please fix the errors below
                  </p>
                )}
              </div>
              {!isMappingSlabBased && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSlab}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Slab
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                // Get current slab values
                const currentMinAmount = getValues(`slabs.${index}.minAmount`);
                const currentMaxAmount = getValues(`slabs.${index}.maxAmount`);

                // Get provider cost for this slab if it matches an existing slab from mapping
                const providerCostForSlab =
                  isAdmin &&
                  selectedMappingSlabs.length > 0 &&
                  currentMinAmount &&
                  currentMaxAmount
                    ? getProviderCostForSlab(
                        Number(currentMinAmount),
                        Number(currentMaxAmount),
                      )
                    : null;

                // Check if this slab range exists in the mapping (for read-only hint)
                const slabExistsInMapping = selectedMappingSlabs.some(
                  (s) =>
                    s.minAmount === Number(currentMinAmount) &&
                    s.maxAmount === Number(currentMaxAmount),
                );

                // Collect all errors for this slab
                const slabErrors = errors.slabs?.[index];
                const hasMinError = slabErrors?.minAmount?.message;
                const hasMaxError = slabErrors?.maxAmount?.message;
                const hasValueError = slabErrors?.value?.message;
                const hasAnyError = hasMinError || hasMaxError || hasValueError;

                return (
                  <div
                    key={field.id}
                    className={`relative border rounded-lg p-4 transition-all ${
                      hasAnyError
                        ? "border-red-300 "
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {fields.length > 1 && !isMappingSlabBased && (
                      <button
                        type="button"
                        onClick={() => removeSlab(index)}
                        className="absolute -top-2 -right-2 p-1 rounded-full border border-gray-200 text-destructive hover:text-destructive/80 hover:bg-red-50 transition-colors shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      {/* Min Amount */}
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Min Amount{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="number"
                          {...register(`slabs.${index}.minAmount`, {
                            required: "Min amount is required",
                            valueAsNumber: true,
                            onChange: (e) => {
                              // Trigger re-render to update provider cost display
                              setValue(
                                `slabs.${index}.minAmount`,
                                e.target.value,
                              );
                            },
                          })}
                          placeholder="e.g., 1"
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            hasMinError
                              ? "border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:ring-primary/20 focus:border-primary"
                          }`}
                          readOnly={isMappingSlabBased}
                        />
                        {hasMinError && (
                          <p className="text-xs text-red-500 mt-1 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{slabErrors.minAmount.message}</span>
                          </p>
                        )}
                        {index === 0 && !hasMinError && (
                          <p className="text-xs  mt-1">Must start from 1</p>
                        )}
                      </div>

                      {/* Max Amount */}
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Max Amount{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="number"
                          {...register(`slabs.${index}.maxAmount`, {
                            required: "Max amount is required",
                            valueAsNumber: true,
                            onChange: (e) => {
                              // Trigger re-render to update provider cost display
                              setValue(
                                `slabs.${index}.maxAmount`,
                                e.target.value,
                              );
                            },
                          })}
                          placeholder="e.g., 100"
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            hasMaxError
                              ? "border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:ring-primary/20 focus:border-primary"
                          }`}
                          readOnly={isMappingSlabBased}
                        />
                        {hasMaxError && (
                          <p className="text-xs text-red-500 mt-1 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{slabErrors.maxAmount.message}</span>
                          </p>
                        )}
                        {index === fields.length - 1 && !hasMaxError && (
                          <p className="text-xs  mt-1">
                            No unlimited slabs allowed
                          </p>
                        )}
                      </div>

                      {/* Value */}
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Value{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="any"
                          {...register(`slabs.${index}.value`, {
                            required: "Value is required",
                            valueAsNumber: true,
                          })}
                          placeholder={
                            type === "PERCENTAGE"
                              ? "Percentage %"
                              : "Flat Amount"
                          }
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            hasValueError
                              ? "border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:ring-primary/20 focus:border-primary"
                          }`}
                        />
                        {hasValueError && (
                          <p className="text-xs text-red-500 mt-1 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{slabErrors.value.message}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Provider Cost Display for each slab - Only for ADMIN_ROLE = AZZUNIQUE */}
                    {isAdmin && providerCostForSlab && (
                      <div className="mt-3 pt-3 border-t">
                        <div className=" border rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 " />
                            <p className="text-sm ">
                              <span className="font-medium">
                                Provider Cost for this range:
                              </span>{" "}
                              {providerCostForSlab}
                              <span className="text-xs  ml-2">
                                (This is the cost from the provider for this
                                slab)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hint when slab doesn't match mapping slabs */}
                    {isAdmin &&
                      isMappingSlabBased &&
                      !slabExistsInMapping &&
                      currentMinAmount &&
                      currentMaxAmount && (
                        <div className="mt-3 pt-3 border-t border-yellow-200">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <p className="text-sm text-yellow-700">
                                <span className="font-medium">Note:</span> This
                                slab range doesn't match any provider slab. The
                                provider cost may not be available for this
                                range.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* Info alert for slab rules */}
            <div className="mt-4 p-3 rounded-md ">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4  mt-0.5 shrink-0" />
                <div className="text-xs ">
                  <p className="font-medium mb-1">Slab Rules:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Slabs must be continuous without any gaps</li>
                    <li>First slab must start at minAmount = 1</li>
                    <li>MaxAmount cannot be 0 (no unlimited slabs allowed)</li>
                    <li>
                      Each slab's minAmount should be exactly (previous slab's
                      maxAmount + 1)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAX SECTION ================= */}
        {mode === "SURCHARGE" && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Controller
                name="applyGST"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={field.value}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                )}
              />
              <label className="text-sm font-medium">
                Apply GST on Surcharge
              </label>
            </div>

            {applyGST && (
              <InputField
                label="GST Percent (%)"
                name="gstPercent"
                type="number"
                register={register}
                required
                error={errors.gstPercent}
                helperText="GST percentage must be between 0 and 100"
              />
            )}
          </div>
        )}

        {mode === "COMMISSION" && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Controller
                name="applyTDS"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={field.value}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                )}
              />
              <label className="text-sm font-medium">
                Apply TDS on Commission
              </label>
            </div>

            {applyTDS && (
              <InputField
                label="TDS Percent (%)"
                name="tdsPercent"
                type="number"
                register={register}
                required
                error={errors.tdsPercent}
                helperText="TDS percentage must be between 0 and 100"
              />
            )}
          </div>
        )}

        {/* ================= ACTIVE STATUS ================= */}
        {isEditing && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={field.value}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                )}
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Inactive rules won't be applied to transactions
            </p>
          </div>
        )}

        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isEditing ? "Update Rule" : "Create Rule"}
        </Button>

        <div className="pt-4 border-t text-center">
          <div className="flex items-center justify-center text-muted-foreground gap-1">
            <Lock className="h-3 w-3" />
            <p className="text-xs">
              Financial rule — impacts live transactions
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
