"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function AadhaarOtpForm({ onSubmit, providerType, isPending }) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm();

  const [displayValue, setDisplayValue] = useState("");

  // 🔹 Format XXXX-XXXX-XXXX
  const formatAadhaar = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);

    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 12));

    return parts.join("-");
  };

  const handleChange = (e) => {
    const formatted = formatAadhaar(e.target.value);
    setDisplayValue(formatted);

    // 🔥 Store clean digits (without hyphen)
    setValue("aadhaarNumber", formatted.replace(/-/g, ""), {
      shouldValidate: true,
    });
  };

  const submitHandler = (data) => {
    onSubmit(data, setError);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      {/* Root Error */}
      {errors.root && (
        <p className="text-red-500 text-sm">{errors.root.message}</p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Aadhaar Number</label>

        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="XXXX-XXXX-XXXX"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* 🔥 Hidden Registered Field for Validation */}
        <input
          type="hidden"
          {...register("aadhaarNumber", {
            required: "Aadhaar is required",
            pattern: {
              value: /^[0-9]{12}$/,
              message: "Aadhaar must be 12 digits",
            },
          })}
        />

        {errors.aadhaarNumber && (
          <p className="text-sm text-red-500 mt-1">
            {errors.aadhaarNumber.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isPending} className="w-full">
        {providerType === "API" ? "Send OTP" : "Next"}
      </Button>
    </form>
  );
}
