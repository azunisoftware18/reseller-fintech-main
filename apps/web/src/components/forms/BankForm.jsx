"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Building, ChevronDown, CheckCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import SearchField from "@/components/ui/SearchField";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { useSubmitBank, useResubmitBank, useBanks } from "@/hooks/useBank";
import { useMe } from "@/hooks/useAuth";
import { useBankVerification } from "@/hooks/useBankVerification";

export default function BankForm({ userId, bank, readOnly, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ✅ Penny Drop verification states
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle | verifying | verified | error
  const [verificationError, setVerificationError] = useState("");

  const dropdownRef = useRef(null);

  const { data: meData, isLoading: meLoading } = useMe();
  const authUser = meData?.data?.user;

  const isSelf = !userId || userId === authUser?.id;
  const targetUserId = isSelf ? undefined : userId;

  const { data: banksData, isLoading: banksLoading } = useBanks({
    search: searchQuery,
  });

  const bankOptions =
    banksData?.data
      ?.filter((bank) =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((bank) => ({
        label: bank.name,
        value: bank.id,
        ifscGlobal: bank.ifscGlobal,
      })) || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      bankId: bank?.bankId || "",
      bankName: bank?.bankName || "",
      accountHolderName: bank?.accountHolderName || "",
      accountNumber: bank?.accountNumber || "",
      ifscCode: bank?.ifscCode || "",
      branchName: bank?.branchName || "",
      isPrimary: bank?.isPrimary || false,
    },
  });

  const selectedBankId = watch("bankId");
  const selectedBankName = watch("bankName");
  const accountNumber = watch("accountNumber");
  const ifscCode = watch("ifscCode");

  const { mutate: submitBank } = useSubmitBank();
  const { mutate: resubmitBank } = useResubmitBank();
  const { mutate: verifyAccount } = useBankVerification();

  // ✅ Reset verification if user changes account number or IFSC
  useEffect(() => {
    if (verificationStatus === "verified" || verificationStatus === "error") {
      setVerificationStatus("idle");
      setVerificationError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber, ifscCode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Select bank
  const handleBankSelect = (bankId, bankName, ifscGlobal) => {
    setValue("bankId", bankId, { shouldValidate: true });
    setValue("bankName", bankName, { shouldValidate: true });
    setValue("ifscCode", ifscGlobal || "", { shouldValidate: true });
    setSearchQuery("");
    setIsDropdownOpen(false);
    setValue("accountHolderName", "");
    setValue("accountNumber", "");
    setValue("branchName", "");
  };

  // Clear selected bank
  const handleClearBank = () => {
    setValue("bankId", "");
    setValue("bankName", "");
    setValue("ifscCode", "");
    setSearchQuery("");
  };

  // ✅ Penny Drop verify handler
  const handleVerify = () => {
    if (!accountNumber || !ifscCode) return;

    setVerificationStatus("verifying");
    setVerificationError("");

    verifyAccount(
      {
        account_number: accountNumber,
        ifsc_code: ifscCode.toUpperCase(),
      },
      {
        onSuccess: (response) => {
          // Extract beneficiary name from various possible response shapes
          const beneficiaryName =
            response?.data?.beneficiaryName ||
            response?.data?.beneficiary_name ||
            response?.data?.data?.beneficiaryName ||
            response?.data?.data?.beneficiary_name ||
            response?.beneficiaryName ||
            response?.beneficiary_name;

          if (beneficiaryName) {
            setValue("accountHolderName", beneficiaryName, {
              shouldValidate: true,
            });
            setVerificationStatus("verified");
          } else {
            setVerificationStatus("error");
            setVerificationError(
              "Could not fetch beneficiary name. Please enter manually.",
            );
          }
        },
        onError: (err) => {
          setVerificationStatus("error");
          setVerificationError(
            err?.message ||
              "Account verification failed. Please check your details.",
          );
        },
      },
    );
  };

  // Derived: show verify button only when both fields are valid & not yet verified
  const ifscValid = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifscCode || "");
  const accountValid = /^[0-9]{9,18}$/.test(accountNumber || "");
  const showVerifyButton =
    accountValid && ifscValid && verificationStatus !== "verified";

  // Submit
  const onSubmit = async (data) => {
    clearErrors();

    if (!data.bankId) {
      setError("bankId", { type: "manual", message: "Please select a bank" });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...(targetUserId && { userId: targetUserId }),

      ...(bank?.verificationStatus === "REJECTED" && {
        bankDetailId: bank.id,
      }),

      bankDetail: {
        bankId: data.bankId,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode?.toUpperCase(),
        branchName: data.branchName,
        isPrimary: data.isPrimary,
      },
    };

    const mutation =
      bank?.verificationStatus === "REJECTED" ? resubmitBank : submitBank;

    mutation(payload, {
      onSuccess: () => {
        toast.success(
          bank?.verificationStatus === "REJECTED"
            ? "Bank detail resubmitted successfully"
            : "Bank detail submitted successfully",
        );
        onSuccess?.();
      },
      onError: (err) => {
        setError("root", {
          type: "manual",
          message: err?.message || "Failed to submit bank detail",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Loading state while auth user is being fetched
  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // READ ONLY VIEW
  if (readOnly && bank) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Bank Name</label>
            <p className="font-medium">{bank.bankName}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Account Holder
            </label>
            <p className="font-medium">{bank.accountHolderName}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Account Number
            </label>
            <p className="font-mono font-medium">{bank.accountNumber}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">IFSC Code</label>
            <p className="font-mono uppercase">{bank.ifscCode}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Branch</label>
            <p className="font-medium">{bank.branchName}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Primary Account
            </label>
            <p>{bank.isPrimary ? "Yes" : "No"}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSuccess}>Close</Button>
        </div>
      </div>
    );
  }

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
        {/* BANK SELECT */}
        <div className="md:col-span-2" ref={dropdownRef}>
          <label className="block text-sm font-medium mb-1">
            Select Bank <span className="text-error">*</span>
          </label>

          {selectedBankId && selectedBankName ? (
            <div className="flex items-center gap-2 p-2 border rounded bg-muted">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">
                {selectedBankName}
              </span>
              <button
                type="button"
                onClick={handleClearBank}
                className="text-xs text-primary hover:underline"
              >
                Change Bank
              </button>
            </div>
          ) : (
            <div className="relative">
              <SearchField
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search bank by name..."
                width="w-full"
                className="pr-10"
              />
              <ChevronDown
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform cursor-pointer",
                  isDropdownOpen && "rotate-180",
                )}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              />
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
                  {banksLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading banks...
                    </div>
                  ) : bankOptions.length > 0 ? (
                    bankOptions.map((bank) => (
                      <button
                        key={bank.value}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
                        onClick={() =>
                          handleBankSelect(
                            bank.value,
                            bank.label,
                            bank.ifscGlobal,
                          )
                        }
                      >
                        <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium">{bank.label}</div>
                          {bank.ifscGlobal && (
                            <div className="text-xs text-muted-foreground">
                              IFSC: {bank.ifscGlobal}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No banks found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            type="hidden"
            {...register("bankId", { required: "Bank is required" })}
          />
          {errors.bankId && (
            <p className="text-error text-xs mt-1">{errors.bankId.message}</p>
          )}
        </div>

        {/* BANK NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Bank Name <span className="text-error">*</span>
          </label>
          <input
            {...register("bankName", { required: "Bank name is required" })}
            readOnly
            className="w-full px-3 py-2 border rounded bg-muted cursor-not-allowed text-sm"
          />
        </div>

        {/* IFSC */}
        <div>
          <label className="block text-sm font-medium mb-1">
            IFSC Code <span className="text-error">*</span>
          </label>
          <input
            {...register("ifscCode", {
              required: "IFSC code is required",
              pattern: {
                value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                message: "Invalid IFSC code format",
              },
            })}
            readOnly
            className="w-full px-3 py-2 border rounded bg-muted cursor-not-allowed uppercase font-mono text-sm"
          />
          {errors.ifscCode && (
            <p className="text-error text-xs mt-1">{errors.ifscCode.message}</p>
          )}
        </div>

        {/* ACCOUNT NUMBER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Account Number <span className="text-error">*</span>
          </label>
          <input
            {...register("accountNumber", {
              required: "Account number is required",
              minLength: { value: 9, message: "Minimum 9 digits required" },
              maxLength: { value: 18, message: "Maximum 18 digits allowed" },
              pattern: {
                value: /^[0-9]+$/,
                message: "Only digits are allowed",
              },
            })}
            className={`w-full px-3 py-2 border rounded bg-background font-mono ${
              errors.accountNumber ? "border-error" : "border-input"
            }`}
            placeholder="Enter account number"
          />
          {errors.accountNumber && (
            <p className="text-error text-xs mt-1">
              {errors.accountNumber.message}
            </p>
          )}
        </div>

        {/* BRANCH */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Branch Name <span className="text-error">*</span>
          </label>
          <input
            {...register("branchName", {
              required: "Branch name is required",
              minLength: {
                value: 2,
                message: "Branch name must be at least 2 characters",
              },
            })}
            className={`w-full px-3 py-2 border rounded bg-background ${
              errors.branchName ? "border-error" : "border-input"
            }`}
            placeholder="Enter branch name"
          />
          {errors.branchName && (
            <p className="text-error text-xs mt-1">
              {errors.branchName.message}
            </p>
          )}
        </div>

        {/* ACCOUNT HOLDER — with Verify integration */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Account Holder Name <span className="text-error">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                {...register("accountHolderName", {
                  required: "Account holder name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
                className={`w-full px-3 py-2 border rounded bg-background ${
                  errors.accountHolderName ? "border-error" : "border-input"
                } ${verificationStatus === "verified" ? "bg-muted/50" : ""}`}
                placeholder={
                  verificationStatus === "verified"
                    ? "Verified via Penny Drop"
                    : "Enter account holder name"
                }
                readOnly={verificationStatus === "verified"}
              />
            </div>

            {/* Verify Button / Verified Badge */}
            {verificationStatus === "verified" ? (
              <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-success/10 text-success rounded-md border border-success/20 shrink-0">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Verified</span>
              </div>
            ) : showVerifyButton ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                loading={verificationStatus === "verifying"}
                disabled={verificationStatus === "verifying"}
                className="shrink-0"
              >
                {verificationStatus === "verifying"
                  ? "Verifying..."
                  : "Verify Account"}
              </Button>
            ) : null}
          </div>

          {/* Verification error */}
          {verificationStatus === "error" && verificationError && (
            <p className="text-error text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {verificationError}
            </p>
          )}

          {/* Form validation error */}
          {errors.accountHolderName && (
            <p className="text-error text-xs mt-1">
              {errors.accountHolderName.message}
            </p>
          )}
        </div>

        {/* PRIMARY */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("isPrimary")}
              className="w-4 h-4 text-primary accent-primary"
            />
            <span className="text-sm">Set as primary bank account</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Primary account will be used for settlements
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {bank?.verificationStatus === "REJECTED" ? "Resubmit" : "Submit"} Bank
        </Button>
      </div>
    </form>
  );
}
