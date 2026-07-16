"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { AlertCircle, ImageIcon } from "lucide-react";
import Image from "next/image";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import { onlyDigits } from "@/lib/utils";

export default function EmployeeForm({
  initialData = null,
  isPending,
  onSubmit,
  departments = [],
}) {
  /* ================= STATE ================= */
  const isEditMode = Boolean(initialData?.id);

  const [preview, setPreview] = useState(
    initialData?.profilePictureUrl || null
  );

  /* ================= FORM ================= */
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    control,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      departmentId: "",
      employeeStatus: "INACTIVE",
      actionReason: "",
      ...initialData,
    },
  });

  const status = useWatch({
    control,
    name: "employeeStatus",
  });

  /* ================= SUBMIT ================= */
  const onFormSubmit = (data) => {
    clearErrors();

    /* ---------- CREATE ---------- */
    if (!isEditMode) {
      onSubmit(data, setError);
      return;
    }

    /* ---------- UPDATE (FormData) ---------- */
    const formData = new FormData();

    // 🔹 append normal dirty fields
    Object.keys(dirtyFields).forEach((key) => {
      if (key !== "profilePicture") {
        formData.append(key, data[key]);
      }
    });

    // 🔥 ALWAYS handle file separately
    if (data.profilePicture?.[0]) {
      formData.append("profilePicture", data.profilePicture[0]);
    }

    // status validation
    if (
      formData.has("employeeStatus") &&
      data.employeeStatus !== initialData.employeeStatus &&
      !data.actionReason
    ) {
      setError("actionReason", {
        message: "Action reason is required",
      });
      return;
    }

    onSubmit(formData, setError);
  };

  /* ================= RENDER ================= */
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

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ================= PROFILE PICTURE (EDIT ONLY) ================= */}
          {isEditMode && (
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium">
                Profile Picture
              </label>

              <div className="flex items-center gap-4">
                {preview ? (
                  <Image
                    src={preview}
                    alt="Profile Preview"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <InputField
                  type="file"
                  name="profilePicture"
                  accept="image/*"
                  register={register}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                  error={errors.profilePicture}
                />
              </div>
            </div>
          )}

          {/* ================= BASIC FIELDS ================= */}
          <InputField
            label="First Name"
            name="firstName"
            register={register}
            required
            error={errors.firstName}
          />

          <InputField
            label="Last Name"
            name="lastName"
            register={register}
            required
            error={errors.lastName}
          />

          <InputField
            label="Email"
            name="email"
            register={register}
            required
            error={errors.email}
          />

          <InputField
            label="Mobile Number"
            name="mobileNumber"
            maxLength={10}
            register={register}
            required
            onInput={onlyDigits(10)}
            error={errors.mobileNumber}
          />

          {/* ================= DEPARTMENT ================= */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Department <span className="text-destructive">*</span>
            </label>

            <Controller
              name="departmentId"
              control={control}
              rules={{ required: "Department is required" }}
              render={({ field }) => (
                <SelectField
                  options={departments}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.departmentId}
                />
              )}
            />
          </div>

          {/* ================= STATUS ================= */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Status <span className="text-destructive">*</span>
            </label>

            <Controller
              name="employeeStatus"
              control={control}
              render={({ field }) => (
                <SelectField
                  options={[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Inactive", value: "INACTIVE" },
                    { label: "Suspended", value: "SUSPENDED" },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.employeeStatus}
                />
              )}
            />
          </div>

          {/* ================= ACTION REASON ================= */}
          {status !== "ACTIVE" && (
            <InputField
              label="Action Reason"
              name="actionReason"
              register={register}
              error={errors.actionReason}
            />
          )}
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          Save Employee
        </Button>
      </form>
    </>
  );
}
