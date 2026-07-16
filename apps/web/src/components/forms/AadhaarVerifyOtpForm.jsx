"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";

export default function AadhaarVerifyOtpForm({
  transactionId,
  onSubmit,
  isPending,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...data, transactionId }))}
      className="space-y-4"
    >
      <div>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter OTP"
          {...register("otp", {
            required: "OTP is required",
            pattern: {
              value: /^[0-9]{4,6}$/,
              message: "Invalid OTP",
            },
          })}
          className="w-full border rounded-md px-3 py-2"
        />

        {errors.otp && (
          <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
        )}
      </div>

      <Button type="submit" loading={isPending} className="w-full">
        Verify OTP
      </Button>
    </form>
  );
}
