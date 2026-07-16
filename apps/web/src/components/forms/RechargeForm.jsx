"use client";

import { Controller, useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import { AlertCircle } from "lucide-react";
import SelectField from "../ui/SelectField";
import PlansAndOffersList from "../PlansAndOffersList";
import { useOperatorMaps } from "@/hooks/useRecharge";

export default function RechargeForm({
  onSubmit,
  isPending,
  plans = [],
  planOperatorMaps = [],
  circleMaps = [],
  onFieldChange,
  fetchPlans, // MUST be mutateAsync
  plansLoading,
}) {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // ✅ Dono mappings store karo
  const [mappings, setMappings] = useState({
    planFetch: null,
    rechargeExecute: null,
  });

  const { data: RechargeOperatorMaps = [] } = useOperatorMaps({
    direction: "RECHARGE_EXECUTE",
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      mobileNumber: "",
      operatorCode: "",
      circleCode: "",
      amount: "",
    },
  });

  // Watch fields for onFieldChange callback
  const mobileNumber = watch("mobileNumber");
  const operatorCode = watch("operatorCode");
  const circleCode = watch("circleCode");

  // useEffect mein move kiya - side effects render ke baad run honge
  useEffect(() => {
    if (onFieldChange) {
      onFieldChange({
        mobileNumber,
        operatorCode,
        circleCode,
      });
    }
  }, [mobileNumber, operatorCode, circleCode, onFieldChange]);

  /* ================= OPTIONS ================= */

  const planOperatorOptions = planOperatorMaps.map((o) => ({
    label: o.internalOperatorCode,
    value: o.internalOperatorCode,
  }));

  const circleOptions = circleMaps.map((c) => ({
    label: c.internalCircleCode,
    value: c.internalCircleCode,
  }));

  /* ================= HANDLE CONTINUE ================= */

  const handleContinue = async () => {
    const valid = await trigger(["mobileNumber", "operatorCode", "circleCode"]);
    if (!valid) return;

    const values = getValues();
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(values.mobileNumber)) {
      setError("mobileNumber", {
        message: "Enter valid 10 digit mobile number starting with 6-9",
      });
      return;
    }

    // ✅ PLAN_FETCH mapping find karo
    const selectedPlanOperator = planOperatorMaps.find(
      (o) => o.internalOperatorCode === values.operatorCode,
    );

    if (!selectedPlanOperator) {
      setError("root", { message: "Operator mapping not found (PLAN_FETCH)" });
      return;
    }

    // ✅ RECHARGE_EXECUTE bhi abhi hi find kar lo baad ke liye
    const selectedExecOperator = RechargeOperatorMaps.find(
      (o) => o.internalOperatorCode === values.operatorCode,
    );

    if (!selectedExecOperator) {
      setError("root", {
        message: "Operator mapping not found (RECHARGE_EXECUTE)",
      });
      return;
    }

    // ✅ Dono mappings state mein save kar lo
    setMappings({
      planFetch: selectedPlanOperator,
      rechargeExecute: selectedExecOperator,
    });

    try {
      await fetchPlans({
        mobileNumber: values.mobileNumber,
        internalOperatorCode: values.operatorCode,
        internalCircleCode: values.circleCode,
        serviceProviderMappingId: selectedPlanOperator.serviceProviderMappingId, // ✅ PLAN_FETCH
      });

      setStep(2);
    } catch (err) {
      const errorMessage =
        err?.message || err?.response?.data?.message || "Failed to fetch plans";
      setError("root", { message: errorMessage });
    }
  };

  const submitHandler = (data) => {
    if (!data.amount) {
      setError("amount", { message: "Please select a plan" });
      return;
    }

    if (!mappings.rechargeExecute) {
      setError("root", { message: "Recharge mapping not available" });
      return;
    }

    // ✅ Ab directly stored mapping use karo - find nahi karna padta
    onSubmit(
      {
        mobileNumber: data.mobileNumber,
        internalOperatorCode: data.operatorCode,
        amount: Number(data.amount),
        serviceProviderMappingId:
          mappings.rechargeExecute.serviceProviderMappingId, // ✅ RECHARGE_EXECUTE
      },
      setError,
    );
  };

  /* ================= UI ================= */

  return (
    <>
      {/* ROOT ERROR DISPLAY */}
      {errors?.root && (
        <div className="mb-4 bg-destructive/10 text-red-500 border border-destructive/20 p-3 rounded">
          <div className="flex gap-2 items-center text-sm">
            <AlertCircle size={16} />
            <span>{errors.root.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
        {step === 1 && (
          <>
            <InputField
              label="Mobile Number"
              name="mobileNumber"
              register={register}
              required
              error={errors.mobileNumber}
              placeholder="Enter 10 digit mobile number"
              maxLength={10}
            />

            <Controller
              name="operatorCode"
              control={control}
              rules={{ required: "Operator required" }}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={planOperatorOptions}
                  placeholder="Select Operator"
                  label="Operator"
                />
              )}
            />

            <Controller
              name="circleCode"
              control={control}
              rules={{ required: "Circle required" }}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={circleOptions}
                  placeholder="Select Circle"
                  label="Circle"
                />
              )}
            />

            <Button
              type="button"
              onClick={handleContinue}
              className="w-full"
              loading={plansLoading}
              disabled={plansLoading}
            >
              {plansLoading ? "Loading Plans..." : "View Plans"}
            </Button>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col h-[70vh]">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedPlan(null);
                setValue("amount", "");
              }}
              className="text-sm text-primary hover:underline mb-2"
            >
              ← Change Details
            </button>

            <div className="flex-1 overflow-y-auto pr-1">
              {plans.length === 0 && !plansLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  No plans available for this selection
                </div>
              ) : (
                <PlansAndOffersList
                  plans={plans}
                  selectedPlan={selectedPlan}
                  onSelect={(plan) => {
                    setSelectedPlan(plan);
                    setValue("amount", plan.rs);
                  }}
                />
              )}
            </div>

            <div className="pt-3 border-t bg-background sticky bottom-0">
              {selectedPlan && (
                <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded text-sm">
                  <div className="font-medium">
                    Selected Plan: ₹{selectedPlan.rs}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPlan.desc}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={isPending}
                className="w-full"
                disabled={!selectedPlan || isPending}
              >
                {isPending
                  ? "Processing..."
                  : `Recharge ₹${selectedPlan?.rs || ""}`}
              </Button>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
