"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  AlertCircle,
  Building,
  CreditCard,
  User,
  Banknote,
  RefreshCw,
} from "lucide-react";

import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAllowedMappings } from "@/hooks/useAdminServices";

import { usePerformPayout } from "@/hooks/usePayout";
import { useMe } from "@/hooks/useAuth";
import { useUserBanks } from "@/hooks/useBank";
import { useSelector } from "react-redux";

const payoutModes = [
  { label: "NEFT", value: "NEFT" },
  { label: "RTGS", value: "RTGS" },
  { label: "IMPS", value: "IMPS" },
  { label: "Fund Transfer", value: "FT" },
  { label: "Demand Draft", value: "DD" },
];

export default function PayoutForm({ userId, payout, readOnly, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");

  const { data: meData, isLoading: meLoading } = useMe();
  const authUser = meData?.data?.user;

  const isSelf = !userId || userId === authUser?.id;
  const targetUserId = isSelf ? undefined : userId;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      beneficiaryAccount: payout?.beneficiaryAccount || "",
      beneficiaryIfsc: payout?.beneficiaryIfsc || "",
      beneficiaryName: payout?.beneficiaryName || "",

      beneficiaryBankName: payout?.beneficiaryBankName || "",
      beneficiaryMobile: payout?.beneficiaryMobile || "",

      amount: payout?.amount || "",
      mode: payout?.mode || "IMPS",
      remarks: payout?.remarks || "",
      serviceProviderMappingId: payout?.serviceProviderMappingId || "",
    },
  });

  const { mutate: performPayout } = usePerformPayout();
  const { data: mappingsData } = useAllowedMappings();
  const mappings = mappingsData || [];

  const currentUser = useSelector((s) => s.auth.user);

  const {
    data: myBanksData,
    isLoading: myBanksLoading,
    refetch: refetchMyBanks,
    error: myBanksError,
  } = useUserBanks(currentUser?.user?.id);

  const selectedMode = watch("mode");
  const bankDetails = myBanksData?.data?.bankDetails || [];

  // Filter only verified banks
  const verifiedBanks = bankDetails.filter(
    (bank) => bank.verificationStatus === "VERIFIED",
  );

  // Auto-select primary bank and fill details
  useEffect(() => {
    if (verifiedBanks.length > 0 && !selectedBankId) {
      const primaryBank = myBanksData?.data?.primaryBank;
      if (primaryBank && primaryBank.verificationStatus === "VERIFIED") {
        handleBankSelect(primaryBank);
      } else {
        // If no primary bank, select the first verified bank
        handleBankSelect(verifiedBanks[0]);
      }
    }
  }, [myBanksData]);

  const handleBankSelect = (bank) => {
    if (!bank) return;

    setSelectedBankId(bank.id);

    setValue("beneficiaryAccount", bank.accountNumber);
    setValue("beneficiaryIfsc", bank.ifscCode);
    setValue("beneficiaryName", bank.accountHolderName);

    // NEW
    setValue("beneficiaryBankName", bank.bankName || "");
    setValue("beneficiaryMobile", bank.mobileNumber || "");

    // Clear any existing errors for these fields
    clearErrors([
      "beneficiaryAccount",
      "beneficiaryIfsc",
      "beneficiaryName",
      "beneficiaryBankName",
      "beneficiaryMobile",
    ]);
  };

  const handleBankChange = (e) => {
    const bankId = e.target.value;
    const selectedBank = verifiedBanks.find((bank) => bank.id === bankId);
    handleBankSelect(selectedBank);
  };

  const handleRefreshBanks = () => {
    refetchMyBanks();
  };

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // READ ONLY VIEW
  if (readOnly && payout) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">
              Transaction ID
            </label>
            <p className="font-mono text-xs">{payout.txnId}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <p className="font-medium">{payout.status}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Beneficiary Name
            </label>
            <p className="font-medium">{payout.beneficiaryName}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Account Number
            </label>
            <p className="font-mono font-medium">{payout.beneficiaryAccount}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">IFSC Code</label>
            <p className="font-mono uppercase">{payout.beneficiaryIfsc}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Amount</label>
            <p className="font-medium">₹{payout.amount}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Mode</label>
            <p className="font-medium">{payout.mode}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Provider Ref
            </label>
            <p className="font-mono text-xs">
              {payout.providerReference || "-"}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSuccess}>Close</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    clearErrors();

    if (!data.serviceProviderMappingId) {
      setError("serviceProviderMappingId", {
        type: "manual",
        message: "Service provider mapping is required",
      });
      return;
    }

    setIsSubmitting(true);

    // ADD THIS
    const selectedBank = verifiedBanks.find(
      (bank) => bank.id === selectedBankId,
    );

    const payload = {
      ...(targetUserId && { userId: targetUserId }),

      beneficiaryAccount: data.beneficiaryAccount,
      beneficiaryIfsc: data.beneficiaryIfsc?.toUpperCase(),
      beneficiaryName: data.beneficiaryName,

      beneficiaryBankName: selectedBank?.bankName,

      beneficiaryMobile: data.beneficiaryMobile,

      amount: Number(data.amount),
      mode: data.mode,
      remarks: data.remarks,
      serviceProviderMappingId: data.serviceProviderMappingId,
    };

    performPayout(payload, {
      onSuccess: (res) => {
        toast.success(res?.data?.message || "Payout initiated successfully");
        onSuccess?.();
      },
      onError: (err) => {
        setError("root", {
          type: "manual",
          message: err?.message || "Failed to initiate payout",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors?.root && (
        <div className="rounded-lg border border-error bg-muted p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            <p className="text-sm text-error">{errors.root.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SAVED BANKS DROPDOWN */}
        {verifiedBanks.length > 0 && (
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Select Saved Bank Account
              </label>
              <button
                type="button"
                onClick={handleRefreshBanks}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                disabled={myBanksLoading}
              >
                <RefreshCw
                  className={cn("h-3 w-3", myBanksLoading && "animate-spin")}
                />
                Refresh
              </button>
            </div>
            <Controller
              name="selectedBank"
              control={control}
              render={({ field }) => (
                <SelectField
                  {...field}
                  value={selectedBankId}
                  onChange={(value) => {
                    field.onChange(value);
                    handleBankChange({ target: { value } });
                  }}
                  options={verifiedBanks.map((bank) => ({
                    value: bank.id,
                    label: `${bank.bankName} - ${bank.accountHolderName} (****${bank.accountNumber.slice(-4)})${bank.isPrimary ? " ★ Primary" : ""}`,
                  }))}
                  placeholder="Select a bank account"
                  disabled={myBanksLoading}
                />
              )}
            />
            {myBanksLoading && (
              <p className="text-xs text-muted-foreground">
                Loading bank accounts...
              </p>
            )}
            {myBanksError && (
              <p className="text-xs text-error">
                Failed to load bank accounts. Please try again.
              </p>
            )}
          </div>
        )}

        {/* SERVICE PROVIDER MAPPING */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium">
            Service Provider Mapping <span className="text-error">*</span>
          </label>
          <Controller
            name="serviceProviderMappingId"
            control={control}
            rules={{ required: "Service mapping is required" }}
            render={({ field }) => (
              <SelectField
                {...field}
                options={mappings.map((m) => ({
                  value: m.id,
                  label: `${m.serviceCode || "Service"} - ${m.providerCode || "Provider"}`,
                }))}
                error={errors.serviceProviderMappingId}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            Select the payout service provider mapping
          </p>
        </div>

        {/* BENEFICIARY NAME */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-1">
            Beneficiary Name <span className="text-error">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register("beneficiaryName", {
                required: "Beneficiary name is required",
                minLength: { value: 2, message: "Minimum 2 characters" },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded bg-background ${
                errors.beneficiaryName ? "border-error" : "border-input"
              }`}
              placeholder="Enter beneficiary name"
            />
          </div>
          {errors.beneficiaryName && (
            <p className="text-error text-xs mt-1">
              {errors.beneficiaryName.message}
            </p>
          )}
        </div>

        {/* BENEFICIARY MOBILE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Beneficiary Mobile
          </label>

          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              {...register("beneficiaryMobile", {
                required: "Beneficiary mobile number is required",

                pattern: {
                  value: /^\d{10}$/,
                  message: "Mobile number must be exactly 10 digits",
                },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded bg-background ${
                errors.beneficiaryMobile ? "border-error" : "border-input"
              }`}
              placeholder="Enter mobile number"
            />
          </div>

          {errors.beneficiaryMobile && (
            <p className="text-error text-xs mt-1">
              {errors.beneficiaryMobile.message}
            </p>
          )}
        </div>

        {/* ACCOUNT NUMBER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Account Number <span className="text-error">*</span>
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register("beneficiaryAccount", {
                required: "Account number is required",
                minLength: { value: 9, message: "Minimum 9 digits" },
                maxLength: { value: 18, message: "Maximum 18 digits" },
                pattern: { value: /^[0-9]+$/, message: "Digits only" },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded bg-background font-mono ${
                errors.beneficiaryAccount ? "border-error" : "border-input"
              }`}
              placeholder="Enter account number"
            />
          </div>
          {errors.beneficiaryAccount && (
            <p className="text-error text-xs mt-1">
              {errors.beneficiaryAccount.message}
            </p>
          )}
        </div>

        {/* IFSC */}
        <div>
          <label className="block text-sm font-medium mb-1">
            IFSC Code <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register("beneficiaryIfsc", {
                required: "IFSC code is required",
                pattern: {
                  value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                  message: "Invalid IFSC format",
                },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded bg-background uppercase font-mono ${
                errors.beneficiaryIfsc ? "border-error" : "border-input"
              }`}
              placeholder="e.g. HDFC0000123"
            />
          </div>
          {errors.beneficiaryIfsc && (
            <p className="text-error text-xs mt-1">
              {errors.beneficiaryIfsc.message}
            </p>
          )}
        </div>

        {/* AMOUNT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (₹) <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              {...register("amount", {
                required: "Amount is required",
                min: { value: 1, message: "Minimum ₹1" },
                valueAsNumber: true,
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded bg-background ${
                errors.amount ? "border-error" : "border-input"
              }`}
              placeholder="Enter amount"
            />
          </div>
          {errors.amount && (
            <p className="text-error text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* MODE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Payout Mode <span className="text-error">*</span>
          </label>
          <select
            {...register("mode", { required: "Mode is required" })}
            className={`w-full px-3 py-2 border rounded bg-background ${
              errors.mode ? "border-error" : "border-input"
            }`}
          >
            {payoutModes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.mode && (
            <p className="text-error text-xs mt-1">{errors.mode.message}</p>
          )}
        </div>

        {/* REMARKS */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <input
            {...register("remarks")}
            className="w-full px-3 py-2 border rounded bg-background border-input"
            placeholder="Optional remarks..."
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {payout ? "Update" : "Initiate"} Payout
        </Button>
      </div>
    </form>
  );
}
