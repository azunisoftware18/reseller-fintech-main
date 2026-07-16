"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Controller, useForm, useWatch } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";

const MIN_AMOUNT = 100;

export default function FundRequestForm({ onSubmit, isPending }) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: "",
      paymentMode: "",
      providerTxnId: "",
    },
  });

  const [idempotencyKey] = useState(() => uuidv4());

  const paymentMode = useWatch({
    control,
    name: "paymentMode",
  });

  const amount = useWatch({
    control,
    name: "amount",
  });

  const validAmount = Number(amount) >= MIN_AMOUNT;

  const onFormSubmit = (data) => {
    onSubmit(
      {
        ...data,
        amount: Number(data.amount),
        paymentMode: data.paymentMode.toUpperCase(),
        idempotencyKey,
      },
      setError,
    );
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

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* ================= AMOUNT ================= */}
        <InputField
          label="Amount"
          name="amount"
          type="number"
          register={register}
          rules={{
            required: "Amount is required",
            min: {
              value: MIN_AMOUNT,
              message: `Minimum amount ₹${MIN_AMOUNT}`,
            },
          }}
          onWheel={(e) => e.target.blur()}
          error={errors.amount}
        />

        {/* ================= PAYMENT MODE ================= */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Payment Mode <span className="text-destructive">*</span>
          </label>

          <Controller
            name="paymentMode"
            control={control}
            rules={{ required: "Payment mode is required" }}
            render={({ field }) => (
              <SelectField
                options={[
                  { label: "UPI", value: "UPI" },
                  { label: "Bank Transfer", value: "BANK" },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.paymentMode}
              />
            )}
          />
        </div>

        {/* ================= PAYMENT INFO ================= */}
        {paymentMode && (
          <div className="rounded-xl border bg-muted/40 p-5 space-y-5">
            {paymentMode === "UPI" && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">
                    Scan & Pay via UPI
                  </h3>

                  {validAmount && (
                    <div className="space-y-1 text-sm">
                      <p>
                        UPI ID:{" "}
                        <span className="font-semibold">9649730196@kotak</span>
                      </p>
                      <p className="text-muted-foreground">Paying ₹{amount}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {validAmount ? (
                    <div className="bg-white p-4 rounded-xl shadow-md border">
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          `upi://pay?pa=9649730196@kotak&pn=Azzunique&am=${amount}&cu=INR`,
                        )}`}
                        alt="UPI QR"
                        width={180}
                        height={180}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-destructive text-center">
                      Enter minimum ₹{MIN_AMOUNT} to generate QR
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentMode === "BANK" && (
              <>
                <h3 className="font-semibold text-base text-center">
                  Bank Transfer Details
                </h3>
                <div className="border rounded-lg p-4 space-y-2 text-sm shadow-sm">
                  <p>
                    Account Name: <strong>Azzunique Pvt Ltd</strong>
                  </p>
                  <p>
                    Account Number: <strong>1234567890</strong>
                  </p>
                  <p>
                    IFSC Code: <strong>HDFC0001234</strong>
                  </p>
                  <p>
                    Bank: <strong>HDFC Bank</strong>
                  </p>
                </div>

                {validAmount && (
                  <p className="text-xs text-center text-muted-foreground">
                    Transfer ₹{amount} and enter UTR below.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= UTR ================= */}
        <InputField
          label="ProviderTxnId / UTR No."
          name="providerTxnId"
          register={register}
          disabled={!paymentMode}
          rules={{
            required: paymentMode ? "Reference number is required" : false,
            minLength: {
              value: 8,
              message: "Invalid UTR number",
            },
            pattern: {
              value: /^[a-zA-Z0-9]+$/,
              message: "Only alphanumeric characters allowed",
            },
          }}
          error={errors.providerTxnId}
        />

        <Button type="submit" loading={isPending} className="w-full mt-3">
          Submit Fund Request
        </Button>
      </form>
    </>
  );
}
