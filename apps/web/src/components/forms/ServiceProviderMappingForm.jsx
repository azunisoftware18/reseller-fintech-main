"use client";

import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import React from "react";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";

export default function ServiceProviderMappingForm({
  onSubmit,
  isPending,
  editingMapping = null,
  servicesList = [],
  providersList = [],
}) {
  const isEditing = !!editingMapping;

  // Prepare default slabs from editing mapping
  const defaultSlabs = editingMapping?.slabs || [];

  const {
    handleSubmit,
    setError,
    control,
    formState: { errors },
    setValue,
    clearErrors,
    getValues,
    trigger,
  } = useForm({
    defaultValues: editingMapping || {
      ServiceId: "",
      ProviderId: "",
      mode: "COMMISSION",
      pricingValueType: "FLAT",
      providerCost: "",
      commissionStartLevel: "NONE",
      applyTDS: false,
      tdsPercent: "",
      applyGST: false,
      gstPercent: "",
      supportsSlab: false,
      config: {},
      configEntries: [],
      isActive: true,
      slabs: [], // Add slabs array
    },
  });

  // Watch values for conditional rendering
  const commissionStartLevel = useWatch({
    control,
    name: "commissionStartLevel",
  });
  const mode = useWatch({ control, name: "mode" });
  const supportsSlab = useWatch({ control, name: "supportsSlab" });
  const applyTDS = useWatch({ control, name: "applyTDS" });
  const applyGST = useWatch({ control, name: "applyGST" });

  // Setup config fields array
  const {
    fields: configFields,
    append: appendConfig,
    remove: removeConfig,
  } = useFieldArray({
    control,
    name: "configEntries",
  });

  // Setup slabs array
  const {
    fields: slabFields,
    append: appendSlab,
    remove: removeSlab,
  } = useFieldArray({
    control,
    name: "slabs",
  });

  // Initialize configEntries from existing config
  React.useEffect(() => {
    if (
      editingMapping?.config &&
      Object.keys(editingMapping.config).length > 0
    ) {
      const entries = Object.entries(editingMapping.config).map(
        ([key, value]) => ({
          key,
          value: String(value),
        }),
      );
      setValue("configEntries", entries);
    }
    // If no existing config or not editing, ensure at least one empty entry
    else {
      const currentEntries = getValues("configEntries");
      if (!currentEntries || currentEntries.length === 0) {
        setValue("configEntries", [{ key: "", value: "" }]);
      }
    }
  }, [editingMapping, setValue, getValues]);

  // Initialize slabs when editing
  React.useEffect(() => {
    if (editingMapping?.slabs && editingMapping.slabs.length > 0) {
      setValue("slabs", editingMapping.slabs);
    }
  }, [editingMapping, setValue]);

  // Conditional flags
  const showCommissionFields = commissionStartLevel !== "NONE";
  const isCommissionMode = mode === "COMMISSION";
  const isSurchargeMode = mode === "SURCHARGE";
  const shouldHideCostAndPrice = supportsSlab === true;
  // Config section hamesha show hoga
  const showConfigSection = true;
  // Slab section sirf tab show hoga jab commissionStartLevel NONE na ho
  const showSlabSection =
    (isCommissionMode || isSurchargeMode) &&
    supportsSlab &&
    showCommissionFields;

  // Format options
  const serviceOptions = servicesList.map((s) => ({
    label: `${s.name} (${s.code})`,
    value: s.id,
  }));

  const providerOptions = providersList.map((p) => ({
    label: `${p.providerName} (${p.code})`,
    value: p.id,
  }));

  const modeOptions = [
    { label: "Commission", value: "COMMISSION" },
    { label: "Surcharge", value: "SURCHARGE" },
  ];

  const pricingTypeOptions = [
    { label: "Flat", value: "FLAT" },
    { label: "Percentage", value: "PERCENTAGE" },
  ];

  const statusTypeOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  const commissionStartLevelOptions = [
    { label: "None", value: "NONE" },
    { label: "Hierarchy", value: "HIERARCHY" },
  ];

  const handleFormSubmit = async (data) => {
    clearErrors();

    // Build config object from configEntries
    let configObject = {};

    // Process config entries (only validate minimum if commissionStartLevel is not NONE)
    if (data.configEntries && Array.isArray(data.configEntries)) {
      let hasEmptyFields = false;
      let validPairsCount = 0;

      // First, validate all entries
      data.configEntries.forEach((entry, index) => {
        const keyTrimmed = entry.key ? entry.key.trim() : "";
        const valueTrimmed = entry.value ? entry.value.trim() : "";

        // If both key and value are filled, it's valid
        if (keyTrimmed !== "" && valueTrimmed !== "") {
          configObject[keyTrimmed] = valueTrimmed;
          validPairsCount++;
        }
        // If one is filled but not the other, it's an error
        else if (keyTrimmed !== "" || valueTrimmed !== "") {
          hasEmptyFields = true;
          if (keyTrimmed !== "" && valueTrimmed === "") {
            setError(`configEntries.${index}.value`, {
              message: "Value is required when key is provided",
            });
          } else if (valueTrimmed !== "" && keyTrimmed === "") {
            setError(`configEntries.${index}.key`, {
              message: "Key is required when value is provided",
            });
          }
        }
      });

      if (hasEmptyFields) {
        return;
      }

      // Check minimum 1 valid key-value pair ONLY if commissionStartLevel is not NONE
      if (commissionStartLevel !== "NONE" && validPairsCount < 1) {
        setError("config", {
          message: "At least 1 key-value pair is required",
        });
        return;
      }
    }

    // Check if Commission Start Level is "none"
    const isCommissionStartLevelNone = data.commissionStartLevel === "NONE";

    if (isCommissionStartLevelNone) {
      // Only validate Service, Provider, and Status Type
      const validationErrors = {};

      if (!data.ServiceId) {
        validationErrors.ServiceId = "Service is required";
      }
      if (!data.ProviderId) {
        validationErrors.ProviderId = "Provider is required";
      }
      if (data.isActive === undefined || data.isActive === null) {
        validationErrors.isActive = "Status Type is required";
      }

      if (Object.keys(validationErrors).length > 0) {
        Object.keys(validationErrors).forEach((key) => {
          setError(key, { message: validationErrors[key] });
        });
        return;
      }

      // Create submission data with only required fields
      const submissionData = {
        ServiceId: data.ServiceId,
        ProviderId: data.ProviderId,
        commissionStartLevel: data.commissionStartLevel,
        isActive: data.isActive,
        config: configObject, // Include config even for NONE
      };

      onSubmit(submissionData, setError);
      return;
    }

    // If Commission Start Level is selected (not "none"), apply full validation
    // Create a copy of the data to clean
    const cleanedData = {
      ServiceId: data.ServiceId,
      ProviderId: data.ProviderId,
      mode: data.mode,
      pricingValueType: data.pricingValueType,
      commissionStartLevel: data.commissionStartLevel,
      applyTDS: data.applyTDS,
      applyGST: data.applyGST,
      supportsSlab: data.supportsSlab,
      isActive: data.isActive,
    };

    cleanedData.config = configObject;

    // Helper function to clean number fields
    const cleanNumberField = (value) => {
      if (value === "" || value === undefined || value === null) {
        return undefined;
      }
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    if (data.providerCost !== undefined) {
      cleanedData.providerCost = cleanNumberField(data.providerCost);
    }

    if (applyTDS) {
      cleanedData.tdsPercent = cleanNumberField(data.tdsPercent);
    }

    if (applyGST) {
      cleanedData.gstPercent = cleanNumberField(data.gstPercent);
    }

    // Full validation for all fields
    // Validate Service
    if (!cleanedData.ServiceId) {
      setError("ServiceId", { message: "Service is required" });
      return;
    }

    // Validate Provider
    if (!cleanedData.ProviderId) {
      setError("ProviderId", { message: "Provider is required" });
      return;
    }

    // Validate Status Type
    if (cleanedData.isActive === undefined || cleanedData.isActive === null) {
      setError("isActive", { message: "Status Type is required" });
      return;
    }

    // Validate Mode
    if (!cleanedData.mode) {
      setError("mode", { message: "Mode is required" });
      return;
    }

    // Validate Pricing Value Type
    if (!cleanedData.pricingValueType) {
      setError("pricingValueType", { message: "Pricing type is required" });
      return;
    }

    // Clean providerCost
    if (shouldHideCostAndPrice) {
      // If slab is enabled, providerCost is not required
      delete cleanedData.providerCost;
    } else {
      // If slab is disabled, clean providerCost
      const cleanedProviderCost = cleanNumberField(cleanedData.providerCost);
      if (cleanedProviderCost !== undefined) {
        cleanedData.providerCost = cleanedProviderCost;
      } else if (!isEditing) {
        // For new mappings, providerCost is required when slab is disabled
        setError("providerCost", {
          message: "Provider cost is required",
        });
        return;
      }
    }

    // Clean TDS percent
    if (!applyTDS) {
      delete cleanedData.tdsPercent;
    } else {
      const cleanedTdsPercent = cleanNumberField(cleanedData.tdsPercent);
      if (cleanedTdsPercent !== undefined) {
        cleanedData.tdsPercent = cleanedTdsPercent;
      } else {
        setError("tdsPercent", {
          message: "TDS percentage is required",
        });
        return;
      }
    }

    // Clean GST percent
    if (!applyGST) {
      delete cleanedData.gstPercent;
    } else {
      const cleanedGstPercent = cleanNumberField(cleanedData.gstPercent);
      if (cleanedGstPercent !== undefined) {
        cleanedData.gstPercent = cleanedGstPercent;
      } else {
        setError("gstPercent", {
          message: "GST percentage is required",
        });
        return;
      }
    }

    // Validate and clean slabs
    if (cleanedData.supportsSlab && data.slabs && data.slabs.length > 0) {
      const validatedSlabs = [];
      const sortedSlabs = [...data.slabs].sort(
        (a, b) => a.minAmount - b.minAmount,
      );

      // Check for overlapping slabs
      for (let i = 0; i < sortedSlabs.length - 1; i++) {
        if (sortedSlabs[i].maxAmount >= sortedSlabs[i + 1].minAmount) {
          setError("slabs", {
            message:
              "Slabs cannot overlap. Each slab's maxAmount must be less than the next slab's minAmount",
          });
          return;
        }
      }

      // Validate each slab
      for (let i = 0; i < data.slabs.length; i++) {
        const slab = data.slabs[i];
        const minAmount = cleanNumberField(slab.minAmount);
        const maxAmount = cleanNumberField(slab.maxAmount);
        const providerCost = cleanNumberField(slab.providerCost);

        if (minAmount === undefined) {
          setError(`slabs.${i}.minAmount`, {
            message: "Min amount is required",
          });
          return;
        }
        if (maxAmount === undefined) {
          setError(`slabs.${i}.maxAmount`, {
            message: "Max amount is required",
          });
          return;
        }
        if (providerCost === undefined) {
          setError(`slabs.${i}.providerCost`, {
            message: "Provider cost is required",
          });
          return;
        }

        if (minAmount < 0) {
          setError(`slabs.${i}.minAmount`, {
            message: "Min amount must be positive",
          });
          return;
        }
        if (maxAmount <= minAmount) {
          setError(`slabs.${i}.maxAmount`, {
            message: "Max amount must be greater than min amount",
          });
          return;
        }
        if (providerCost < 0) {
          setError(`slabs.${i}.providerCost`, {
            message: "Provider cost must be positive",
          });
          return;
        }

        validatedSlabs.push({
          minAmount,
          maxAmount,
          providerCost,
          isActive: slab.isActive !== undefined ? slab.isActive : true,
        });
      }

      cleanedData.slabs = validatedSlabs;
    } else if (cleanedData.supportsSlab) {
      // If supportsSlab is true but no slabs provided
      setError("slabs", {
        message: "At least one slab is required when slab pricing is enabled",
      });
      return;
    }

    // Add config object to cleaned data
    cleanedData.config = configObject;

    // Remove configEntries as it's not needed in final submission
    delete cleanedData.configEntries;

    // Remove any remaining undefined values
    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    // Submit the cleaned data with all fields
    onSubmit(cleanedData, setError);
  };

  // Add a function to clear config error when entries are added
  const handleAddConfigEntry = () => {
    clearErrors("config");
    appendConfig({ key: "", value: "" });
  };

  // Add a function to add new slab
  const handleAddSlab = () => {
    clearErrors("slabs");
    appendSlab({
      minAmount: "",
      maxAmount: "",
      providerCost: "",
      isActive: true,
    });
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

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Service <span className="text-destructive">*</span>
            </label>
            <Controller
              name="ServiceId"
              control={control}
              rules={{ required: "Service is required" }}
              render={({ field }) => (
                <SelectField
                  options={serviceOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a service"
                  disabled={isEditing}
                  error={errors.ServiceId}
                />
              )}
            />
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Provider <span className="text-destructive">*</span>
            </label>
            <Controller
              name="ProviderId"
              control={control}
              rules={{ required: "Provider is required" }}
              render={({ field }) => (
                <SelectField
                  options={providerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a provider"
                  disabled={isEditing}
                  error={errors.ProviderId}
                />
              )}
            />
          </div>

          {/* Commission Start Level */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Commission Start Level
              {commissionStartLevel !== "NONE" && (
                <span className="text-destructive">*</span>
              )}
            </label>
            <Controller
              name="commissionStartLevel"
              control={control}
              render={({ field }) => (
                <SelectField
                  options={commissionStartLevelOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select commission start level"
                  error={errors.commissionStartLevel}
                />
              )}
            />
          </div>

          {/* Status Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Status Type <span className="text-destructive">*</span>
            </label>
            <Controller
              name="isActive"
              control={control}
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <SelectField
                  options={statusTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select status"
                  error={errors.isActive}
                />
              )}
            />
          </div>
        </div>

        {/* Conditional Fields - Only show when Commission Start Level is not "none" */}
        {showCommissionFields && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Mode */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Mode <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="mode"
                  control={control}
                  rules={{ required: "Mode is required" }}
                  render={({ field }) => (
                    <SelectField
                      options={modeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select mode"
                      error={errors.mode}
                    />
                  )}
                />
              </div>

              {/* Pricing Value Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Pricing Type <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="pricingValueType"
                  control={control}
                  rules={{ required: "Pricing type is required" }}
                  render={({ field }) => (
                    <SelectField
                      options={pricingTypeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select pricing type"
                      error={errors.pricingValueType}
                    />
                  )}
                />
              </div>

              {/* Provider Cost - Hide when Slab is selected */}
              {!shouldHideCostAndPrice && (
                <InputField
                  label="Provider Cost (₹)"
                  name="providerCost"
                  type="number"
                  step="any"
                  required
                  register={(name, options) => ({
                    onChange: (e) => {
                      const value = e.target.value;
                      setValue(name, value === "" ? "" : value);
                    },
                  })}
                  error={errors.providerCost}
                  rules={{
                    required: "Provider cost is required",
                    min: {
                      value: 0,
                      message: "Provider cost must be positive",
                    },
                  }}
                />
              )}
            </div>
          </>
        )}

        {/* Config Fields Section - ALWAYS SHOW regardless of commissionStartLevel */}
        {showConfigSection && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium">
                Configuration
                {commissionStartLevel !== "NONE" && (
                  <span className="text-destructive"> *</span>
                )}
                <span className="text-xs text-gray-500 ml-2">
                  {commissionStartLevel !== "NONE"
                    ? "(Minimum 1 key-value pair)"
                    : "(Optional)"}
                </span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddConfigEntry}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {errors.config && (
              <p className="text-red-500 text-sm mt-1 mb-3">
                {errors.config.message}
              </p>
            )}

            <div className="space-y-3">
              {configFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Controller
                      name={`configEntries.${index}.key`}
                      control={control}
                      render={({ field: keyField }) => (
                        <div>
                          {index === 0 && (
                            <label className="block text-sm font-medium mb-1">
                              Key
                            </label>
                          )}
                          <input
                            type="text"
                            placeholder="Enter key"
                            value={keyField.value || ""}
                            onChange={(e) => {
                              keyField.onChange(e);
                              // Clear config error when user starts typing
                              if (errors.config) {
                                clearErrors("config");
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {errors.configEntries?.[index]?.key && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.configEntries[index].key.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <Controller
                      name={`configEntries.${index}.value`}
                      control={control}
                      render={({ field: valueField }) => (
                        <div>
                          {index === 0 && (
                            <label className="block text-sm font-medium mb-1">
                              Value
                            </label>
                          )}
                          <input
                            type="text"
                            placeholder="Enter value"
                            value={valueField.value || ""}
                            onChange={(e) => {
                              valueField.onChange(e);
                              // Clear config error when user starts typing
                              if (errors.config) {
                                clearErrors("config");
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {errors.configEntries?.[index]?.value && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.configEntries[index].value.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  {configFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => removeConfig(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {commissionStartLevel !== "NONE" && (
              <p className="text-xs text-gray-500 mt-2 mb-3">
                * At least 1 key-value pair is required
              </p>
            )}

            {/* Checkboxes Section - ONLY show when commissionStartLevel is NOT "NONE" */}
            {showCommissionFields && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-4 border-t border-gray-200">
                  {/* Supports Slab - Show for both modes */}
                  {(isCommissionMode || isSurchargeMode) && (
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="supportsSlab"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            id="supportsSlab"
                            checked={field.value || false}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              // Reset providerCost when slab is enabled
                              if (e.target.checked) {
                                setValue("providerCost", "");
                              } else {
                                // Clear slabs when slab is disabled
                                setValue("slabs", []);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        )}
                      />
                      <label
                        htmlFor="supportsSlab"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Supports Slab Pricing
                      </label>
                    </div>
                  )}

                  {/* Apply TDS - Only show when Mode is Commission */}
                  {isCommissionMode && (
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="applyTDS"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            id="applyTDS"
                            checked={field.value || false}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              // Reset tdsPercent when TDS is unchecked
                              if (!e.target.checked) {
                                setValue("tdsPercent", "");
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        )}
                      />
                      <label
                        htmlFor="applyTDS"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Apply TDS
                      </label>
                    </div>
                  )}

                  {/* Apply GST - Only show when Mode is Surcharge */}
                  {isSurchargeMode && (
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="applyGST"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            id="applyGST"
                            checked={field.value || false}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              // Reset gstPercent when GST is unchecked
                              if (!e.target.checked) {
                                setValue("gstPercent", "");
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        )}
                      />
                      <label
                        htmlFor="applyGST"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Apply GST
                      </label>
                    </div>
                  )}
                </div>

                {/* TDS Percentage Field */}
                {isCommissionMode && applyTDS && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="TDS Percentage"
                      name="tdsPercent"
                      type="number"
                      step="any"
                      required
                      register={(name, options) => ({
                        onChange: (e) => {
                          const value = e.target.value;
                          setValue(name, value === "" ? "" : value);
                        },
                      })}
                      error={errors.tdsPercent}
                      rules={{
                        required: "TDS percentage is required",
                        min: {
                          value: 0,
                          message: "TDS must be between 0 and 100",
                        },
                        max: {
                          value: 100,
                          message: "TDS must be between 0 and 100",
                        },
                      }}
                    />
                  </div>
                )}

                {/* GST Percentage Field */}
                {isSurchargeMode && applyGST && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="GST Percentage"
                      name="gstPercent"
                      type="number"
                      step="any"
                      required
                      register={(name, options) => ({
                        onChange: (e) => {
                          const value = e.target.value;
                          setValue(name, value === "" ? "" : value);
                        },
                      })}
                      error={errors.gstPercent}
                      rules={{
                        required: "GST percentage is required",
                        min: {
                          value: 0,
                          message: "GST must be between 0 and 100",
                        },
                        max: {
                          value: 100,
                          message: "GST must be between 0 and 100",
                        },
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Slabs Section */}
            {showSlabSection && (
              <div className="pt-8 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium">
                    Pricing Slabs <span className="text-destructive">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (At least 1 slab required)
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSlab}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Slab
                  </Button>
                </div>

                {errors.slabs && (
                  <p className="text-red-500 text-sm mt-1 mb-3">
                    {errors.slabs.message}
                  </p>
                )}

                <div className="space-y-4">
                  {slabFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm">
                          Slab {index + 1}
                        </h4>
                        {slabFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSlab(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InputField
                          label={`Min Amount (₹)`}
                          name={`slabs.${index}.minAmount`}
                          type="number"
                          step="any"
                          required
                          register={(name, options) => ({
                            onChange: (e) => {
                              const value = e.target.value;
                              setValue(name, value === "" ? "" : value);
                            },
                          })}
                          error={errors.slabs?.[index]?.minAmount}
                          rules={{
                            required: "Min amount is required",
                            min: {
                              value: 0,
                              message: "Min amount must be positive",
                            },
                          }}
                        />

                        <InputField
                          label={`Max Amount (₹)`}
                          name={`slabs.${index}.maxAmount`}
                          type="number"
                          step="any"
                          required
                          register={(name, options) => ({
                            onChange: (e) => {
                              const value = e.target.value;
                              setValue(name, value === "" ? "" : value);
                            },
                          })}
                          error={errors.slabs?.[index]?.maxAmount}
                          rules={{
                            required: "Max amount is required",
                            validate: (value, formValues) => {
                              const minAmount =
                                formValues.slabs?.[index]?.minAmount;
                              if (minAmount && value <= minAmount) {
                                return "Max amount must be greater than min amount";
                              }
                              return true;
                            },
                          }}
                        />

                        <InputField
                          label={`Provider Cost (₹)`}
                          name={`slabs.${index}.providerCost`}
                          type="number"
                          step="any"
                          required
                          register={(name, options) => ({
                            onChange: (e) => {
                              const value = e.target.value;
                              setValue(name, value === "" ? "" : value);
                            },
                          })}
                          error={errors.slabs?.[index]?.providerCost}
                          rules={{
                            required: "Provider cost is required",
                            min: {
                              value: 0,
                              message: "Provider cost must be positive",
                            },
                          }}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name={`slabs.${index}.isActive`}
                          control={control}
                          render={({ field: activeField }) => (
                            <input
                              type="checkbox"
                              id={`slab-active-${index}`}
                              checked={activeField.value !== false}
                              onChange={(e) =>
                                activeField.onChange(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          )}
                        />
                        <label
                          htmlFor={`slab-active-${index}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Active
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full">
          {isEditing ? "Update Mapping" : "Create Mapping"}
        </Button>
      </form>
    </>
  );
}
